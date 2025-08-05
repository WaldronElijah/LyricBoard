// app/boards/[boardId]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Rnd } from "react-rnd";
import { FiX, FiEdit, FiPlus } from "react-icons/fi";
import AutocompleteSearch from "@/components/AutocompleteSearch";

// Interfaces
interface Lyric {
  id: string;
  content: string;
  songTitle: string;
  artist: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number | null;
  spotifyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Board {
  id: string;
  name: string;
  description?: string | null;
  lyrics: Lyric[];
}

interface LyricsModalState {
  open: boolean;
  lyrics: string;
  artist: string;
  song: string;
}

interface CustomLyricsModalState {
  open: boolean;
  songTitle: string;
  artistName: string;
  lyricsContent: string;
}

const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE = 5;
const MAX_FONT_SIZE = 28;

export default function BoardPage({ params }: { params: { boardId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [lyricsModal, setLyricsModal] = useState<LyricsModalState | null>(null);
  const [customLyricsModal, setCustomLyricsModal] = useState<CustomLyricsModalState>({
    open: false,
    songTitle: "",
    artistName: "",
    lyricsContent: ""
  });
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsSearchError, setLyricsSearchError] = useState("");

  const [editingLyricId, setEditingLyricId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingLyricId, setDeletingLyricId] = useState<string | null>(null);
  const [hoveredLyricId, setHoveredLyricId] = useState<string | null>(null);

  const boardPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && params.boardId) {
      fetchBoardData();
    }
  }, [status, router, params.boardId]);

  const fetchBoardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/boards/${params.boardId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch board data (unparseable error)" }));
        throw new Error(errorData.error || `Failed to fetch board data (status: ${response.status})`);
      }
      const data: Board = await response.json();
      const lyricsWithFontSize = data.lyrics.map(lyric => ({
        ...lyric,
        fontSize: lyric.fontSize || DEFAULT_FONT_SIZE,
      }));
      setBoard({ ...data, lyrics: lyricsWithFontSize });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred loading the board.");
      console.error("Error fetching board data:", err);
      setBoard(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongSelect = async (title: string, artist: string) => {
    setLyricsSearchError("");
    setLoadingLyrics(true);
    setLyricsModal(null);
    
    try {
      // Try lyrics.ovh first
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }
      );
      
      if (!res.ok) {
        if (res.status === 404) throw new Error ("Lyrics not found from lyrics.ovh.");
        throw new Error(`lyrics.ovh API responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.lyrics) {
        setLyricsModal({ open: true, lyrics: data.lyrics, artist, song: title });
      } else {
        setLyricsSearchError("Lyrics not found in API response.");
      }
    } catch(err) {
      console.error("lyrics.ovh failed, trying fallback:", err);
      
      // Try fallback: Genius API (requires API key)
      try {
        const GENIUS_ACCESS_TOKEN = process.env.NEXT_PUBLIC_GENIUS_ACCESS_TOKEN;
        if (GENIUS_ACCESS_TOKEN) {
          // Search for the song on Genius
          const searchRes = await fetch(
            `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`,
            {
              headers: {
                'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`,
              },
              signal: AbortSignal.timeout(10000),
            }
          );
          
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.response.hits.length > 0) {
              const songId = searchData.response.hits[0].result.id;
              
              // Get lyrics from Genius (this would require additional API calls)
              // For now, we'll show a message about the fallback
              setLyricsSearchError("lyrics.ovh is unavailable. Genius API fallback requires additional implementation.");
              return;
            }
          }
        }
      } catch (geniusErr) {
        console.error("Genius fallback also failed:", geniusErr);
      }
      
      // If all APIs fail, show a helpful message
      setLyricsSearchError("Lyrics service is currently unavailable. You can still add custom lyrics manually.");
    } finally {
      setLoadingLyrics(false);
    }
  };

  const commonCreateLyricAPI = async (lyricData: Omit<Partial<Lyric>, "id" | "createdAt" | "updatedAt">) => {
    if (!board) return null;
    setError(null);
    try {
      const response = await fetch(`/api/boards/${board.id}/lyrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fontSize: DEFAULT_FONT_SIZE,
          ...lyricData,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create item and parse error" }));
        throw new Error(errorData.error || `Failed to create item (status: ${response.status})`);
      }
      const newLyric: Lyric = await response.json();
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lyrics: [...(prevBoard.lyrics || []), { ...newLyric, fontSize: newLyric.fontSize || DEFAULT_FONT_SIZE }],
        }
      });
      return newLyric;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item.");
      console.error("Error creating lyric item:", err);
      return null;
    }
  };

  const handleAddGeneralNote = async () => {
    if (!newNoteContent.trim() || !board) return;
    const newLyric = await commonCreateLyricAPI({
      content: newNoteContent.trim(),
      songTitle: "Note",
      artist: session?.user?.name || "User",
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      width: 220,
      height: 100,
    });
    if (newLyric) {
      setNewNoteContent("");
    }
  };
  
  const handlePinFullLyrics = async () => {
    if (!lyricsModal || !lyricsModal.open || !board) return;
    await commonCreateLyricAPI({
      content: lyricsModal.lyrics,
      songTitle: lyricsModal.song,
      artist: lyricsModal.artist,
      x: 120 + Math.random() * 100,
      y: 120 + Math.random() * 100,
      width: 320,
      height: 180,
    });
    setLyricsModal(null);
  };

  const handlePinSelectedLyrics = async () => {
    if (!lyricsModal || !lyricsModal.open || !board) return;
    const selection = window.getSelection();
    if (!selection) return;
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      alert("Please select (highlight) some lyrics first to pin a selection.");
      return;
    }
    await commonCreateLyricAPI({
      content: selectedText,
      songTitle: lyricsModal.song,
      artist: lyricsModal.artist,
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      width: 280,
      height: 150,
    });
    selection.removeAllRanges();
  };

  const handleBoardAreaDoubleClick = async (e?: React.MouseEvent<HTMLDivElement>, defaultPosition?: {x: number, y: number}) => {
    if (e && ((e.target as HTMLElement).closest(".lyric-note-draggable") || e.target !== boardPageRef.current)) {
      return;
    }
    if (!board || !boardPageRef.current) return;
    setError(null);

    let x, y;
    if (defaultPosition) {
        x = defaultPosition.x;
        y = defaultPosition.y;
    } else if (e) {
        const rect = boardPageRef.current.getBoundingClientRect();
        x = e.clientX - rect.left + boardPageRef.current.scrollLeft;
        y = e.clientY - rect.top + boardPageRef.current.scrollTop;
    } else { // Fallback for programmatic call like "Add First Note" button
        x = 50 + Math.random() * Math.min(200, boardPageRef.current.clientWidth - 270); // Try to place it somewhat visible
        y = 50 + Math.random() * Math.min(200, boardPageRef.current.clientHeight - 150);
    }

    const newLyric = await commonCreateLyricAPI({
      content: "",
      songTitle: "New Note",
      artist: session?.user?.name || "User",
      x, y, width: 220, height: 100,
    });

    if (newLyric) {
      setEditingLyricId(newLyric.id);
      setEditingContent("");
    }
  };

  const handleFontSizeChange = (lyricId: string, newSize: number) => {
    const newFontSize = Math.max(MIN_FONT_SIZE, Math.min(newSize, MAX_FONT_SIZE));
    
    // Capture original font size before optimistic update
    const currentLyric = board?.lyrics.find(l => l.id === lyricId);
    const originalFontSize = currentLyric?.fontSize || DEFAULT_FONT_SIZE;
    
    console.log(`[CLIENT] Updating font size for lyric ${lyricId}:`, {
      currentSize: originalFontSize,
      newSize: newFontSize,
      minSize: MIN_FONT_SIZE,
      maxSize: MAX_FONT_SIZE
    });

    // Optimistic UI Update
    setBoard(prevBoard => {
      if (!prevBoard) return null;
      return {
        ...prevBoard,
        lyrics: prevBoard.lyrics.map(lyric => 
          lyric.id === lyricId ? { ...lyric, fontSize: newFontSize } : lyric
        )
      };
    });

    // Persist to backend with proper error handling
    handleLyricUpdateAPI(lyricId, { fontSize: newFontSize })
      .then(updatedLyric => {
        console.log(`[CLIENT] Successfully saved font size for lyric ${lyricId}:`, {
          requestedSize: newFontSize,
          savedSize: updatedLyric?.fontSize
        });
      })
      .catch(err => {
        console.error(`[CLIENT] Failed to save font size for lyric ${lyricId}:`, err);
        setError(`Failed to save font size. ${err.message}`);
        // Rollback the font size specific optimistic update
        setBoard(prevBoard => {
          if (!prevBoard) return null;
          return {
            ...prevBoard,
            lyrics: prevBoard.lyrics.map(lyric => 
              lyric.id === lyricId ? { ...lyric, fontSize: originalFontSize } : lyric
            )
          };
        });
      });
  };

  const handleLyricUpdateAPI = async (lyricId: string, dataToUpdate: Partial<Omit<Lyric, "id" | "createdAt" | "updatedAt">>) => {
    if (!board) return null;
    setError(null);

    // Find the original state of the lyric for rollback BEFORE any optimistic updates
    const currentLyrics = board.lyrics;
    const originalLyric = currentLyrics.find(l => l.id === lyricId);
    
    if (!originalLyric) {
      console.warn(`[CLIENT] Lyric ${lyricId} not found in current board state before attempting update.`);
      return null;
    }
    
    // Create a copy of the original lyrics array for a clean rollback
    const originalLyricsCopy = currentLyrics.map(l => ({...l}));

    try {
      console.log(`[CLIENT] Attempting to PATCH lyric ${lyricId} with:`, dataToUpdate);
      const response = await fetch(
        `/api/boards/${board.id}/lyrics/${lyricId}`,
        {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          },
          body: JSON.stringify(dataToUpdate),
        }
      );

      if (!response.ok) {
        console.log(`[CLIENT] PATCH failed for lyric ${lyricId}. Status: ${response.status}. Rolling back.`);
        setBoard(prev => ({ ...prev!, lyrics: originalLyricsCopy }));
        const errorData = await response.json().catch(() => ({ error: "Failed to update item and parse error response" }));
        throw new Error(errorData.error || `Failed to update item (status: ${response.status})`);
      }

      const updatedLyricFromServer: Lyric = await response.json();
      console.log(`[CLIENT] PATCH success for lyric ${lyricId}. Server response:`, updatedLyricFromServer);
      
      // Ensure frontend state matches server state
      setBoard(prevBoard => {
        if (!prevBoard) return null;
        return {
          ...prevBoard,
          lyrics: prevBoard.lyrics.map(lyric =>
            lyric.id === lyricId ? { 
              ...lyric,
              ...updatedLyricFromServer,
              // Ensure font size is properly handled
              fontSize: updatedLyricFromServer.fontSize !== undefined 
                ? updatedLyricFromServer.fontSize 
                : (dataToUpdate.fontSize !== undefined ? dataToUpdate.fontSize : lyric.fontSize || DEFAULT_FONT_SIZE)
            } : lyric
          )
        };
      });

      return updatedLyricFromServer;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item.");
      console.error("[CLIENT] Error in handleLyricUpdateAPI for lyric " + lyricId + ":", err);
      console.log(`[CLIENT] Rolling back lyric ${lyricId} due to error.`);
      setBoard(prev => ({ ...prev!, lyrics: originalLyricsCopy }));
      throw err;
    }
  };

  const handleLyricDragResize = (
    lyricId: string,
    newPosition: { x: number; y: number },
    newSize: { width: number; height: number }
  ) => {
    handleLyricUpdateAPI(lyricId, { ...newPosition, ...newSize });
  };

  const handleSaveEdit = async () => {
    if (!editingLyricId || !board) {
        setEditingLyricId(null); setEditingContent(""); return;
    }
    const lyricExistsInState = board.lyrics.find(l => l.id === editingLyricId);
    if (!lyricExistsInState) {
        setEditingLyricId(null); setEditingContent(""); return;
    }
    if (!editingContent.trim() && lyricExistsInState.songTitle === "New Note") {
      handleDeleteLyric(editingLyricId);
      setEditingLyricId(null); setEditingContent(""); return;
    }
    await handleLyricUpdateAPI(editingLyricId, { content: editingContent });
    setEditingLyricId(null); setEditingContent("");
  };
  
  const handleDeleteLyric = async (lyricId: string) => {
    if (!board || deletingLyricId === lyricId) return;
    setError(null);
    setDeletingLyricId(lyricId);
    const originalLyrics = board.lyrics.map(l => ({...l}));
    const lyricToDelete = originalLyrics.find(l => l.id === lyricId);


    if (editingLyricId === lyricId) {
      setEditingLyricId(null);
      setEditingContent("");
    }

    setBoard((prevBoard) => {
        if (!prevBoard) return null;
        return {
            ...prevBoard,
            lyrics: prevBoard.lyrics.filter((lyric) => lyric.id !== lyricId),
        }
    });
    
    try {
      const response = await fetch(
        `/api/boards/${board.id}/lyrics/${lyricId}`,
        { method: "DELETE" }
      );
      if (response.status === 204) { // Successfully deleted
        console.log(`[CLIENT] Lyric ${lyricId} deleted successfully from backend.`);
        return; 
      }
      // If not 204, it's an error or unexpected response
      let errorMsg = `Failed to delete lyric (status: ${response.status})`;
      if (!response.ok) {
        try { 
          const errorData = await response.json(); 
          errorMsg = errorData.error || errorMsg; 
        } catch (jsonError) { 
          errorMsg = response.statusText || errorMsg; 
          console.warn("[CLIENT] Delete error response not JSON:", jsonError);
        }
      } else {
         // Response was ok but not 204 (e.g. 200 with a body)
         console.warn(`[CLIENT] Unexpected successful status for DELETE: ${response.status}`);
         // If there's a body, try to log it, but don't assume it's an error object
         // const responseBody = await response.text();
         // console.log("Response body:", responseBody);
      }
      throw new Error(errorMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lyric.");
      console.error("Error deleting lyric:", err);
      setBoard(prev => ({ ...prev!, lyrics: originalLyrics })); // Rollback
    } finally {
      setDeletingLyricId(null);
    }
  };

  const handleStartEdit = (lyric: Lyric) => {
    setEditingLyricId(lyric.id);
    setEditingContent(lyric.content);
  };

  const handleCustomLyricsSubmit = () => {
    if (!customLyricsModal.songTitle.trim() || !customLyricsModal.artistName.trim() || !customLyricsModal.lyricsContent.trim()) {
      setError("Please fill in song title, artist name, and lyrics content.");
      return;
    }

    // Open the main lyrics modal with the custom content
    setLyricsModal({
      open: true,
      lyrics: customLyricsModal.lyricsContent,
      artist: customLyricsModal.artistName,
      song: customLyricsModal.songTitle,
    });

    // Reset and close the custom lyrics modal
    setCustomLyricsModal({
      open: false,
      songTitle: "",
      artistName: "",
      lyricsContent: ""
    });
  };

  // UI Rendering
  if (status === "loading" || (status === "authenticated" && isLoading && !board && !error )) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (status === "authenticated" && !isLoading && !board && error) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Board</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  if (status === "authenticated" && !isLoading && !board && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Board Not Found</h2>
          <p className="text-gray-600 mb-4">The board you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans"> {/* Standard font for whole page */}
      <main className="flex-1 flex flex-col p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm fixed top-5 right-5 z-[200] shadow-lg">
            Error: {error}
            <button onClick={() => setError(null)} className="ml-4 font-semibold hover:text-red-900">Dismiss</button>
          </div>
        )}

        <div className="mb-6 p-4 bg-white shadow rounded-lg">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{board?.name || "Board"}</h1>
          {board?.description && <p className="text-sm text-gray-600 mb-4">{board.description}</p>}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Quick add a new note text..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddGeneralNote}
              disabled={!newNoteContent.trim()}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-60"
            >
              Add Note
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 max-w-md">
              <AutocompleteSearch onSelect={handleSongSelect} isLoading={loadingLyrics} />
            </div>
            <button
              onClick={() => setCustomLyricsModal(prev => ({ ...prev, open: true }))}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm whitespace-nowrap"
            >
              Add Custom Lyrics
            </button>
          </div>
          {lyricsSearchError && <p className="text-red-500 text-xs mt-1">{lyricsSearchError}</p>}
        </div>

        <div
          ref={boardPageRef}
          className="flex-1 relative bg-slate-100 border border-slate-300 rounded-lg shadow-inner overflow-auto p-2"
          style={{ minHeight: '65vh', backgroundImage: 'url("/corkboard-pattern.webp")', backgroundSize: '300px 300px', backgroundRepeat: 'repeat' }}
          onDoubleClick={(e) => handleBoardAreaDoubleClick(e)}
        >
          {board?.lyrics && board.lyrics.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-6 bg-white/90 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Empty Board</h3>
                <p className="text-gray-600 mb-4">Double-click on the board to add a new note.</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Stop event from bubbling to board's onDoubleClick
                    handleBoardAreaDoubleClick(undefined, { x: 50, y: 50 }); // Call with default position
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 pointer-events-auto" // Make button clickable
                >
                  Add First Note
                </button>
              </div>
            </div>
          )}
          {board?.lyrics.map((lyric) => (
            <Rnd
              key={lyric.id}
              className="lyric-note-draggable" // Class for event targeting checks
              style={{ zIndex: editingLyricId === lyric.id ? 100 : (hoveredLyricId === lyric.id ? 20 : 10) }}
              size={{ width: lyric.width, height: lyric.height }}
              position={{ x: lyric.x, y: lyric.y }}
              minWidth={120} minHeight={80}
              bounds="parent"
              onDragStop={(e, d) => handleLyricDragResize(lyric.id, { x: d.x, y: d.y }, { width: lyric.width, height: lyric.height })}
              onResizeStop={(e, direction, ref, delta, position) => handleLyricDragResize(lyric.id, { x: position.x, y: position.y }, { width: parseInt(ref.style.width), height: parseInt(ref.style.height) })}
              onMouseEnter={() => setHoveredLyricId(lyric.id)}
              onMouseLeave={() => setHoveredLyricId(null)}
              cancel=".no-drag-slider, .no-drag-actions" // Prevent dragging when interacting with slider or action buttons
            >
              <div
                className="w-full h-full bg-yellow-100 border-yellow-400 border-2 rounded-md shadow-lg p-3 flex flex-col overflow-hidden relative"
                style={{ fontFamily: 'inherit' }} // Use inherited standard font (from main div)
              >
                {editingLyricId === lyric.id ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                      if (e.key === 'Escape') { setEditingLyricId(null); setEditingContent(""); }
                    }}
                    className="w-full h-full flex-grow resize-none focus:outline-none bg-transparent text-sm p-1"
                    style={{ fontSize: `${lyric.fontSize || DEFAULT_FONT_SIZE}px`, lineHeight: 1.4 }}
                    autoFocus
                  />
                ) : (
                  <>
                    {(lyric.songTitle !== "Note" || lyric.artist !== (session?.user?.name || "User")) && (
                      <div className="text-[10px] text-gray-600 mb-1 truncate font-semibold absolute top-1 left-2 right-8 z-0">
                        {lyric.songTitle} - {lyric.artist}
                      </div>
                    )}
                    <div
                      className="whitespace-pre-wrap text-gray-900 flex-grow overflow-hidden pt-4" // Added pt-4 to make space for title
                      style={{
                        fontSize: `${lyric.fontSize || DEFAULT_FONT_SIZE}px`,
                        lineHeight: 1.45,
                      }}
                    >
                      {lyric.content}
                    </div>
                  </>
                )}
                {/* Action Buttons Area - Kept on top right but clear of slider */}
                <div 
                  className={`absolute top-1 right-1 flex items-center gap-1 transition-opacity duration-200 ease-in-out no-drag-actions
                              ${(hoveredLyricId === lyric.id || editingLyricId === lyric.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  onMouseEnter={() => setHoveredLyricId(lyric.id)}
                >
                  {editingLyricId !== lyric.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(lyric); }}
                      className="p-1.5 bg-white/70 hover:bg-gray-200 rounded-full text-gray-700 hover:text-blue-600 shadow-md" title="Edit note"
                    ><FiEdit size={12} /></button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteLyric(lyric.id); }}
                    disabled={deletingLyricId === lyric.id}
                    className="p-1.5 bg-white/70 hover:bg-gray-200 rounded-full text-gray-700 hover:text-red-600 disabled:opacity-50 shadow-md" title="Delete note"
                  ><FiX size={12} /></button>
                </div>

                {/* Font Size Slider - Now at bottom of note */}
                {editingLyricId !== lyric.id && (
                  <div 
                    className={`absolute bottom-1 left-2 right-2 flex items-center gap-2 transition-opacity duration-200 ease-in-out no-drag-slider
                                ${(hoveredLyricId === lyric.id) ? 'opacity-100' : 'opacity-0'}`}
                    onMouseEnter={() => setHoveredLyricId(lyric.id)}
                    onMouseLeave={() => setHoveredLyricId(null)}
                  >
                    <span className="text-[10px] text-gray-700 font-medium whitespace-nowrap">Size:</span>
                    <input
                      type="range"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      step="1"
                      value={lyric.fontSize || DEFAULT_FONT_SIZE}
                      onChange={(e) => handleFontSizeChange(lyric.id, parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-1 accent-blue-600 cursor-pointer"
                      title={`Font Size: ${lyric.fontSize || DEFAULT_FONT_SIZE}px`}
                    />
                    <span className="text-[10px] text-gray-700 font-medium whitespace-nowrap">{lyric.fontSize || DEFAULT_FONT_SIZE}px</span>
                  </div>
                )}
              </div>
            </Rnd>
          ))}
        </div>
        {/* Custom Lyrics Modal */}
        {customLyricsModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Add Your Own Lyrics</h2>
                <button
                  onClick={() => setCustomLyricsModal(prev => ({ ...prev, open: false }))}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Close custom lyrics modal"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="space-y-4 mb-4 overflow-y-auto">
                <div>
                  <label htmlFor="customSongTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Song Title
                  </label>
                  <input
                    type="text"
                    id="customSongTitle"
                    value={customLyricsModal.songTitle}
                    onChange={(e) => setCustomLyricsModal(prev => ({ ...prev, songTitle: e.target.value }))}
                    placeholder="Enter song title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="customArtistName" className="block text-sm font-medium text-gray-700 mb-1">
                    Artist Name
                  </label>
                  <input
                    type="text"
                    id="customArtistName"
                    value={customLyricsModal.artistName}
                    onChange={(e) => setCustomLyricsModal(prev => ({ ...prev, artistName: e.target.value }))}
                    placeholder="Enter artist name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="customLyricsContent" className="block text-sm font-medium text-gray-700 mb-1">
                    Lyrics
                  </label>
                  <textarea
                    id="customLyricsContent"
                    value={customLyricsModal.lyricsContent}
                    onChange={(e) => setCustomLyricsModal(prev => ({ ...prev, lyricsContent: e.target.value }))}
                    placeholder="Paste or type lyrics here..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm whitespace-pre-wrap"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => setCustomLyricsModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomLyricsSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Process Lyrics
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Lyrics Modal */}
        {lyricsModal && lyricsModal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">{lyricsModal.song}</h3>
                    <p className="text-sm text-gray-600">{lyricsModal.artist}</p>
                </div>
                <button
                  onClick={() => setLyricsModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Close modal"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans">{lyricsModal.lyrics}</pre>
              </div>
              <div className="p-4 border-t flex flex-wrap justify-end gap-2">
                 <button
                  onClick={handlePinSelectedLyrics}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  <FiPlus className="inline mr-1" /> Pin Highlighted
                </button>
                <button
                  onClick={handlePinFullLyrics}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  <FiPlus className="inline mr-1" /> Pin Full Lyrics
                </button>
                <button
                  onClick={() => setLyricsModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}