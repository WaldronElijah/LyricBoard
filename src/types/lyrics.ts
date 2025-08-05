export interface LyricsData {
  lyrics: string;
  songInfo: {
    title: string;
    artist: string;
    albumArt: string | null;
    releaseDate: string | null;
    url: string;
  };
}

export interface ApiError {
  error: string;
}

export interface LyricsOVHResponse {
  lyrics: string;
} 