# Lyric Board - Collaborative Lyric Management Platform

A modern web application that allows users to search for song lyrics, pin them to customizable boards, and organize their musical inspiration in an intuitive drag-and-drop interface.

![Example Board with Lyrics](public/example%20board.jpg)

## Overview

Lyric Board transforms how you collect and organize song lyrics. Whether you're a songwriter, musician, or just love music, this platform provides a visual workspace to curate your favorite lyrics and create inspiration boards.

### Key Features

- **Smart Lyrics Search**: Search any song using the lyrics.ovh API with intelligent fallback handling
- **Pin & Organize**: Drag and drop lyrics onto customizable boards
- **Real-time Editing**: Edit lyrics and notes with live font size controls
- **Visual Workspace**: Corkboard-style interface for natural organization
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Secure Authentication**: Google OAuth integration for user accounts

## Screenshots

### Main Board Interface

![Example Board Selection](public/example%20board%20select.jpg)
_The main board interface showing pinned lyrics with drag-and-drop functionality_

### Blank Board State

![Blank Board](public/example%20blank%20board.jpg)
_Empty board state with helpful guidance for new users_

### Database Schema

![Database Schema](public/Sql%20schema.jpg)
_Complex relational database structure supporting users, boards, and lyrics_

## How It Works

### 1. Lyrics Search & Discovery

The app connects to the lyrics.ovh API to search for any song lyrics. Simply type a song title or artist name, and the autocomplete search will find matching songs. The system includes robust fallback handling when APIs are temporarily unavailable.

### 2. Board Management

Users can create multiple boards to organize different projects or themes. Each board acts as a visual workspace where you can:

- Pin full song lyrics or selected portions
- Create custom notes and annotations
- Arrange content with drag-and-drop precision
- Adjust font sizes for better readability

### 3. Interactive Lyrics Pinning

When you find lyrics you want to save:

- **Pin Full Lyrics**: Add entire songs to your board
- **Pin Selected Text**: Highlight specific verses or lines
- **Custom Notes**: Add your own thoughts and annotations
- **Real-time Editing**: Modify content directly on the board

### 4. Visual Organization

The corkboard-style interface provides a natural way to organize your musical inspiration:

- Drag lyrics around to create visual groupings
- Resize notes to fit your content
- Use different font sizes for hierarchy
- Create multiple boards for different projects

## Technical Architecture

### Database Schema

The application uses a sophisticated relational database structure:

- **Users**: Google OAuth authentication with profile management
- **Boards**: User-owned workspaces with customizable names and descriptions
- **Lyrics**: Individual lyric entries with metadata (song title, artist, content)
- **Notes**: Custom annotations linked to lyrics or boards
- **Font Sizes**: Per-lyric font size preferences for optimal readability

### API Integration

- **lyrics.ovh**: Primary lyrics search and retrieval
- **Fallback Systems**: Graceful degradation when APIs are unavailable
- **Spotify Integration**: Enhanced search capabilities
- **Custom Lyrics**: Manual entry for songs not in databases

### Frontend Features

- **React RND**: Advanced drag-and-drop functionality
- **Real-time Updates**: Live editing with optimistic UI updates
- **Responsive Design**: Mobile-first approach with touch support
- **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with complex relational schema
- **Authentication**: NextAuth.js with Google OAuth
- **UI Components**: React RND for drag-and-drop
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database
- Google OAuth credentials

### Environment Setup

Create a `.env.local` file with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lyric_board"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lyric-board.git
cd lyric-board

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using the application.

## Usage Guide

### Creating Your First Board

1. Sign in with your Google account
2. Create a new board from the dashboard
3. Give your board a name and description
4. Start searching for lyrics or add custom notes

### Searching for Lyrics

1. Use the search bar to find songs by title or artist
2. Select a song from the autocomplete results
3. Choose to pin the full lyrics or select specific portions
4. Your lyrics will appear on the board ready for organization

### Organizing Your Content

- **Drag and Drop**: Move lyrics around the board
- **Resize**: Adjust note sizes to fit your content
- **Edit**: Double-click to edit lyrics or notes
- **Font Size**: Use the slider to adjust text size
- **Delete**: Remove unwanted content with the X button

### Advanced Features

- **Multiple Boards**: Create separate boards for different projects
- **Custom Notes**: Add your own thoughts and annotations
- **Font Controls**: Adjust readability with real-time font sizing
- **Mobile Support**: Use the app on any device

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management

- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Create new migrations
- `npx prisma db push` - Push schema changes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions about the API integration, check the [API Status](API_STATUS.md) document for current service status and fallback information.
