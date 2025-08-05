interface SongInfo {
  title: string;
  artist: string;
  albumArt: string | null;
  releaseDate: string | null;
  url: string;
}

interface LyricsDisplayProps {
  lyrics: string | null;
  error: string | null;
  songInfo?: SongInfo;
}

export default function LyricsDisplay({ lyrics, error, songInfo }: LyricsDisplayProps) {
  if (error) {
    return (
      <div className="mt-5 p-3 text-red-600 border border-red-500 rounded">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!lyrics) {
    return null;
  }

  // Check if lyrics are empty or just whitespace
  if (!lyrics.trim()) {
    return (
      <div className="mt-5 p-4 border border-gray-200 rounded bg-white">
        {songInfo && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{songInfo.title}</h2>
            <p className="text-gray-600">{songInfo.artist}</p>
          </div>
        )}
        <p className="text-gray-600">Lyrics not available for this song.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 p-4 border border-gray-200 rounded bg-white">
      {songInfo && (
        <div className="mb-4 flex items-start gap-4">
          {songInfo.albumArt && (
            <img 
              src={songInfo.albumArt} 
              alt={`${songInfo.title} album art`}
              className="w-24 h-24 object-cover rounded shadow-md"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{songInfo.title}</h2>
            <p className="text-gray-600">{songInfo.artist}</p>
            {songInfo.releaseDate && (
              <p className="text-sm text-gray-500">Released: {songInfo.releaseDate}</p>
            )}
            <a 
              href={songInfo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-1 inline-block"
            >
              View on lyrics.ovh
            </a>
          </div>
        </div>
      )}
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2 text-gray-900">Lyrics</h3>
        <pre className="whitespace-pre-wrap break-words font-inherit text-base text-gray-900 leading-relaxed">
          {lyrics}
        </pre>
      </div>
    </div>
  );
} 