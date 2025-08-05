import { FormEvent } from 'react';

interface SearchFormProps {
  artist: string;
  title: string;
  isLoading: boolean;
  onArtistChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function SearchForm({
  artist,
  title,
  isLoading,
  onArtistChange,
  onTitleChange,
  onSubmit,
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="mb-5">
      <div>
        <label htmlFor="artist" className="mr-2">Artist:</label>
        <input
          type="text"
          id="artist"
          value={artist}
          onChange={(e) => onArtistChange(e.target.value)}
          required
          className="px-2 py-1 mr-2 border border-gray-300 rounded"
        />
      </div>
      <div className="mt-2">
        <label htmlFor="title" className="mr-2">Title:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          className="px-2 py-1 mr-2 border border-gray-300 rounded"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer disabled:opacity-50"
      >
        {isLoading ? 'Searching...' : 'Search Lyrics'}
      </button>
    </form>
  );
} 