// app/api/lyrics/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface LyricsOVHResponse {
  lyrics: string;
}

interface ApiError {
  error: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artist = searchParams.get('artist');
  const title = searchParams.get('title');

  if (!artist || !title) {
    return NextResponse.json({ error: 'Artist and title are required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ApiError).error || `Failed to fetch lyrics. Status: ${response.status}`);
    }

    return NextResponse.json({ 
      lyrics: (data as LyricsOVHResponse).lyrics,
      songInfo: {
        title,
        artist,
        // lyrics.ovh doesn't provide these, but we can keep the structure
        albumArt: null,
        releaseDate: null,
        url: `https://lyrics.ovh/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      }
    });
  } catch (error) {
    console.error('Lyrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lyrics' },
      { status: 500 }
    );
  }
}