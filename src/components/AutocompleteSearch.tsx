"use client";

import { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";

interface AutocompleteSearchProps {
  onSelect: (title: string, artist: string) => void;
  isLoading?: boolean;
}

export default function AutocompleteSearch({
  onSelect,
  isLoading = false,
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ title: string; artist: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchSongs = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (error) {
        setResults([]);
        setIsOpen(false);
      }
    };
    const debounceTimer = setTimeout(searchSongs, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      handleSelect(selected.title, selected.artist);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (title: string, artist: string) => {
    onSelect(title, artist);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a song..."
          className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow"
          disabled={isLoading}
        />
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 text-xl" />
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.title}-${result.artist}`}
              className={`w-full px-4 py-2 text-left hover:bg-blue-50 focus:outline-none ${index === selectedIndex ? "bg-blue-100" : ""}`}
              onClick={() => handleSelect(result.title, result.artist)}
            >
              <div className="font-medium text-base">{result.title}</div>
              <div className="text-sm text-gray-600">{result.artist}</div>
            </button>
          ))}
        </div>
      )}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}
      {isOpen && !isLoading && results.length === 0 && query.trim() && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-gray-500 text-center">
          No results found.
        </div>
      )}
    </div>
  );
} 