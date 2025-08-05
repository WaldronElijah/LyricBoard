// app/search-lyrics/page.tsx
"use client"; // Marks this as a Client Component

import { useState } from 'react';
import AutocompleteSearch from '@/components/AutocompleteSearch';
import LyricsDisplay from '@/components/LyricsDisplay';
import type { LyricsData } from '@/types/lyrics';

interface SongInfo {
  title: string;
  artist: string;
  albumArt: string | null;
  releaseDate: string | null;
  url: string;
}

export default function SearchLyricsPage() {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (title: string, artist: string) => {
    setIsLoading(true);
    setLyrics(null);
    setSongInfo(null);
    setError(null);

    try {
      const response = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
      const data = await response.json();

      if (!response.ok) {
        // Handle 404 specifically for when lyrics aren't found
        if (response.status === 404) {
          setLyrics(''); // Empty string will trigger the "Lyrics not available" message
          setSongInfo({
            title,
            artist,
            albumArt: null,
            releaseDate: null,
            url: `https://lyrics.ovh/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
          });
          return;
        }
        // For other errors, show a user-friendly message
        throw new Error('Unable to fetch lyrics at this time. Please try again later.');
      }

      setLyrics((data as LyricsData).lyrics);
      setSongInfo((data as LyricsData).songInfo);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Search for Song Lyrics</h1>
      <div className="mb-5">
        <AutocompleteSearch
          onSelect={handleSearch}
          isLoading={isLoading}
        />
      </div>
      <LyricsDisplay 
        lyrics={lyrics} 
        error={error} 
        songInfo={songInfo || undefined}
      />
    </div>
  );
}