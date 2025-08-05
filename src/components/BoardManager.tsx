"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiEdit, FiX } from "react-icons/fi";

interface Board {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function BoardManager() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchBoards();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards");
      if (!response.ok) throw new Error("Failed to fetch boards");
      const data = await response.json();
      setBoards(data);
    } catch (error) {
      setError("Failed to load boards");
      console.error("Error fetching boards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newBoardName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create board");
      }

      const newBoard = await response.json();
      setBoards((prev) => [newBoard, ...prev]);
      setNewBoardName("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create board");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameBoard = async (boardId: string) => {
    if (!editingBoardName.trim()) return;

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingBoardName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename board");
      }

      const updatedBoard = await response.json();
      setBoards((prev) =>
        prev.map((board) =>
          board.id === boardId ? updatedBoard : board
        )
      );
      setEditingBoardId(null);
      setEditingBoardName("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to rename board");
      }
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm("Are you sure you want to delete this board?")) return;

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete board");
      }

      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete board");
      }
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Boards</h1>

        {/* Create Board Form */}
        <form onSubmit={handleCreateBoard} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Enter board name"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newBoardName.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Board"}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Boards List - Vertical Stack */}
        <div className="space-y-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
            >
              {editingBoardId === board.id ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingBoardName}
                    onChange={(e) => setEditingBoardName(e.target.value)}
                    className="flex-1 px-3 py-1 border rounded"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRenameBoard(board.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingBoardId(null);
                      setEditingBoardName("");
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/boards/${board.id}`)}
                  >
                    <h2 className="text-xl font-semibold mb-2">{board.name}</h2>
                    {board.description && (
                      <p className="text-gray-600">{board.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Created: {new Date(board.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingBoardId(board.id);
                        setEditingBoardName(board.name);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-800"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBoard(board.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {boards.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              You haven't created any boards yet. Create your first board to get
              started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 