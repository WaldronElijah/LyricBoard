"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useRouter } from 'next/navigation';

interface Lyric {
  id: string;
  content: string;
  songTitle: string;
  artist: string;
  position: number;
  notes: Note[];
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface Board {
  id: string;
  name: string;
  description: string | null;
  lyrics: Lyric[];
}

export default function BoardPage({ params }: { params: { boardId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [selectedLyric, setSelectedLyric] = useState<Lyric | null>(null);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (session) {
      fetchBoard();
    }
  }, [session, params.boardId]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${params.boardId}`);
      if (!response.ok) throw new Error('Failed to fetch board');
      const data = await response.json();
      setBoard(data);
    } catch (error) {
      console.error('Error fetching board:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(board?.lyrics || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setBoard(prev => prev ? { ...prev, lyrics: updatedItems } : null);

    // Update positions in the database
    try {
      await fetch(`/api/boards/${params.boardId}/lyrics/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics: updatedItems }),
      });
    } catch (error) {
      console.error('Error updating positions:', error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedLyric || !noteContent.trim()) return;

    try {
      const response = await fetch(`/api/lyrics/${selectedLyric.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      const newNote = await response.json();
      setSelectedLyric(prev => prev ? {
        ...prev,
        notes: [...prev.notes, newNote],
      } : null);
      setNoteContent('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  if (!board) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{board.name}</h1>
      {board.description && (
        <p className="text-gray-600 mb-6">{board.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Lyrics Board</h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lyrics">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {board.lyrics.map((lyric, index) => (
                    <Draggable
                      key={lyric.id}
                      draggableId={lyric.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-4 bg-white rounded-lg shadow cursor-move"
                          onClick={() => setSelectedLyric(lyric)}
                        >
                          <p className="text-lg mb-2">"{lyric.content}"</p>
                          <p className="text-sm text-gray-600">
                            - {lyric.artist}, {lyric.songTitle}
                          </p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {selectedLyric && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <div className="mb-4">
              <p className="text-lg mb-2">"{selectedLyric.content}"</p>
              <p className="text-sm text-gray-600 mb-4">
                - {selectedLyric.artist}, {selectedLyric.songTitle}
              </p>
            </div>

            <div className="space-y-4">
              {selectedLyric.notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded">
                  <p>{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                className="w-full p-2 border rounded"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 