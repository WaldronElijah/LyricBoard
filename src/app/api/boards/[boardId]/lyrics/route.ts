import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/boards/[boardId]/lyrics - Get all lyrics for a board
export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[API] GET request for lyrics in board ${params.boardId}`);

  try {
    const board = await prisma.board.findFirst({
      where: {
        id: params.boardId,
        userId: session.user.id,
      },
    });

    if (!board) {
      console.log(`[API] Board ${params.boardId} not found or access denied`);
      return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
    }

    const lyrics = await prisma.lyric.findMany({
      where: {
        boardId: params.boardId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`[API] Successfully retrieved ${lyrics.length} lyrics for board ${params.boardId}`);
    return NextResponse.json(lyrics);
  } catch (error) {
    console.error("[API] Failed to fetch lyrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch lyrics" },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/lyrics - Create a new lyric
export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    console.log("[API] Unauthorized POST attempt for lyric");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[API] POST request for new lyric in board ${params.boardId}`);

  try {
    const board = await prisma.board.findFirst({
      where: { 
        id: params.boardId, 
        userId: session.user.id 
      },
    });

    if (!board) {
      console.log(`[API] Board ${params.boardId} not found or access denied`);
      return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 });
    }

    const body = await request.json();
    console.log("[API] Received lyric creation data:", body);

    const { 
      content, 
      songTitle, 
      artist, 
      x, 
      y, 
      width, 
      height,
      fontSize,
      spotifyId 
    } = body;

    // Validate required fields
    if (typeof content !== 'string' || !songTitle || !artist) {
      console.log("[API] Missing required fields for lyric creation");
      return NextResponse.json(
        { error: "Content, song title, and artist are required." }, 
        { status: 400 }
      );
    }

    // Validate position and dimensions
    if (x === undefined || y === undefined || width === undefined || height === undefined) {
      console.log("[API] Missing position or dimension data for lyric creation");
      return NextResponse.json(
        { error: "Position and dimensions are required." }, 
        { status: 400 }
      );
    }

    // Create the lyric with all provided fields
    const newLyric = await prisma.lyric.create({
      data: {
        boardId: params.boardId,
        content,
        songTitle,
        artist,
        x: Number(x),
        y: Number(y),
        width: Number(width),
        height: Number(height),
        fontSize: fontSize !== undefined ? Number(fontSize) : null,
        spotifyId: spotifyId || null,
      },
    });

    console.log("[API] Successfully created new lyric:", newLyric);
    return NextResponse.json(newLyric, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create lyric:", error);
    return NextResponse.json({ error: "Failed to create lyric" }, { status: 500 });
  }
}