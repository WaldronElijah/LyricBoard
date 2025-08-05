# Lyric Board

A web application for creating and managing lyric boards. Users can search for songs, pin lyrics, and organize them on customizable boards.

## Features

- Google authentication
- Search for songs using the Deezer API
- Create and manage multiple boards
- Pin lyrics and notes to boards
- Drag and resize lyrics/notes
- Edit and delete lyrics/notes
- Responsive design

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- NextAuth.js
- Prisma
- PostgreSQL
- React RND for drag and resize functionality

## Prerequisites

- Node.js 18 or later
- PostgreSQL database
- Google OAuth credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lyric_board"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/lyric-board.git
   cd lyric-board
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT License.
