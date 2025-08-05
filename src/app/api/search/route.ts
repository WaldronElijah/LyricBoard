import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  artist: string;
}

interface LyricsOVHSearchResponse {
  data: Array<{
    title: string;
    artist: {
      name: string;
    };
  }>;
}

// Fallback search using Genius API (requires API key)
async function searchGenius(query: string): Promise<SearchResult[]> {
  try {
    // Note: You'll need to get a Genius API key from https://genius.com/api-clients
    const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
    if (!GENIUS_ACCESS_TOKEN) {
      console.log('Genius API key not configured');
      return [];
    }

    const response = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.log('Genius API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.response.hits.slice(0, 10).map((hit: any) => ({
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
    }));
  } catch (error) {
    console.error('Genius API error:', error);
    return [];
  }
}

// Mock search results for testing when APIs are down
function getMockSearchResults(query: string): SearchResult[] {
  const mockResults = [
    { title: "Hello", artist: "Adele" },
    { title: "Hello", artist: "Lionel Richie" },
    { title: "Hello Goodbye", artist: "The Beatles" },
    { title: "Hello World", artist: "Lady Antebellum" },
    { title: "Hello", artist: "Martin Solveig" },
  ];
  
  return mockResults.filter(result => 
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.artist.toLowerCase().includes(query.toLowerCase())
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    console.log('Making request to lyrics.ovh API with query:', query);
    const response = await fetch(
      `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`,
      {
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    console.log('lyrics.ovh API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('lyrics.ovh API error response:', errorText);
      throw new Error(`lyrics.ovh API error: ${response.status} - ${errorText}`);
    }

    const data: LyricsOVHSearchResponse = await response.json();
    console.log('lyrics.ovh API response data:', data);

    const results: SearchResult[] = data.data.map((hit) => ({
      title: hit.title,
      artist: hit.artist.name,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    
    // Try fallback APIs
    console.log('Trying fallback APIs...');
    
    // Try Genius API first
    let results = await searchGenius(query);
    
    // If Genius fails, use mock results for testing
    if (results.length === 0) {
      console.log('Using mock search results');
      results = getMockSearchResults(query);
    }
    
    if (results.length > 0) {
      return NextResponse.json({ 
        results,
        note: 'Using fallback search results due to lyrics.ovh being unavailable'
      });
    }
    
    return NextResponse.json(
      { error: 'All search APIs are currently unavailable. Please try again later.' },
      { status: 503 }
    );
  }
} 