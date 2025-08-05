"use client";
import { useState } from "react";
import BoardManager from "@/components/BoardManager";

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 overflow-y-auto relative`}>
        {sidebarOpen && (
          <>
            <button
              className="absolute top-2 right-2 z-10 p-1 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => setSidebarOpen(false)}
              aria-label="Collapse sidebar"
            >
              {'<'}
            </button>
            <BoardManager />
          </>
        )}
      </div>
      {/* Sidebar show button (always visible when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-2 z-50 p-2 bg-gray-200 rounded-full shadow hover:bg-gray-300"
          onClick={() => setSidebarOpen(true)}
          aria-label="Expand sidebar"
        >
          {'>'}
        </button>
      )}
      {/* Main Board Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
} 