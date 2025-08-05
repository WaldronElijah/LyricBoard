# API Status & Fallback Solutions

## Current Issue

The `lyrics.ovh` API that this application depends on is currently experiencing **504 Gateway Timeout** errors, making the lyric search functionality unavailable.

## Immediate Solutions Implemented

### 1. Fallback Search API

- Added timeout handling (10 seconds) to prevent hanging requests
- Implemented mock search results for testing when APIs are down
- Added Genius API fallback (requires API key)

### 2. Better Error Handling

- More informative error messages
- Graceful degradation when services are unavailable
- Users can still add custom lyrics manually

## Alternative APIs to Consider

### 1. Genius API

- **Pros**: Reliable, comprehensive database
- **Cons**: Requires API key, rate limited
- **Setup**: Get API key from https://genius.com/api-clients

### 2. Musixmatch API

- **Pros**: Official lyrics provider
- **Cons**: Requires paid subscription
- **Setup**: Sign up at https://developer.musixmatch.com/

### 3. Spotify API (for search only)

- **Pros**: Free tier available, reliable
- **Cons**: No lyrics, search only
- **Setup**: Create app at https://developer.spotify.com/

## Environment Variables Needed

Add to your `.env.local`:

```
# Genius API (optional fallback)
GENIUS_ACCESS_TOKEN=your_genius_api_key_here
NEXT_PUBLIC_GENIUS_ACCESS_TOKEN=your_genius_api_key_here
```

## Testing the Fix

1. The search should now work with mock results when lyrics.ovh is down
2. Users will see helpful error messages
3. Custom lyrics feature remains fully functional

## Long-term Recommendations

1. **Monitor lyrics.ovh status**: Check if it comes back online
2. **Implement multiple fallbacks**: Add more API options
3. **Consider self-hosted solution**: Scrape lyrics from multiple sources
4. **Add caching**: Store successful API responses locally
