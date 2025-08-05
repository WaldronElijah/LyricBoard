"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { FiMusic, FiLogOut } from "react-icons/fi";

export default function Navigation() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="flex items-center px-2 py-2 text-gray-900 hover:text-blue-600"
            >
              <FiMusic className="h-6 w-6 mr-2" />
              <span className="font-semibold text-lg">Lyric Board</span>
            </Link>
          </div>

          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center text-gray-700 hover:text-red-600"
                >
                  <FiLogOut className="h-5 w-5 mr-1" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 