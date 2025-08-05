import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    boardId: string;
    lyricId: string;
  };
}

// DELETE /api/boards/[boardId]/lyrics/[lyricId] - Delete a lyric
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams 
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, lyricId } = params;
  console.log(`[API] DELETE request for lyric ${lyricId} in board ${boardId}`);

  try {
    const lyric = await prisma.lyric.findFirst({
      where: { 
        id: lyricId, 
        boardId: boardId, 
        board: { userId: session.user.id } 
      },
    });

    if (!lyric) {
      console.log(`[API] Lyric ${lyricId} not found or access denied`);
      return NextResponse.json({ error: "Lyric not found or access denied" }, { status: 404 });
    }

    await prisma.lyric.delete({
      where: { id: lyricId },
    });

    console.log(`[API] Successfully deleted lyric ${lyricId}`);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`[API] Failed to delete lyric ${lyricId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Lyric not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete lyric" }, { status: 500 });
  }
}

// PATCH /api/boards/[boardId]/lyrics/[lyricId] - Update a lyric
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("[API] Unauthorized PATCH attempt for lyric");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, lyricId } = params;
  console.log(`[API] PATCH request for lyric ${lyricId} in board ${boardId}`);

  try {
    // First verify the lyric exists and user has access
    const lyricToUpdate = await prisma.lyric.findFirst({
      where: { 
        id: lyricId, 
        boardId: boardId, 
        board: { userId: session.user.id } 
      },
    });

    if (!lyricToUpdate) {
      console.log(`[API] Lyric ${lyricId} not found or access denied`);
      return NextResponse.json({ error: "Lyric not found or access denied" }, { status: 404 });
    }

    const body = await request.json();
    console.log(`[API] Received update data for lyric ${lyricId}:`, body);

    const { content, songTitle, artist, x, y, width, height, fontSize, spotifyId } = body;

    // Build update object only with provided fields
    const dataToUpdate: any = {};
    if (content !== undefined) dataToUpdate.content = content;
    if (songTitle !== undefined) dataToUpdate.songTitle = songTitle;
    if (artist !== undefined) dataToUpdate.artist = artist;
    if (x !== undefined) dataToUpdate.x = Number(x);
    if (y !== undefined) dataToUpdate.y = Number(y);
    if (width !== undefined) dataToUpdate.width = Number(width);
    if (height !== undefined) dataToUpdate.height = Number(height);
    if (fontSize !== undefined) dataToUpdate.fontSize = Number(fontSize);
    if (spotifyId !== undefined) dataToUpdate.spotifyId = spotifyId;

    if (Object.keys(dataToUpdate).length === 0) {
      console.log(`[API] No fields provided to update for lyric ${lyricId}`);
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    console.log(`[API] Updating lyric ${lyricId} with data:`, dataToUpdate);

    const updatedLyric = await prisma.lyric.update({
      where: { id: lyricId },
      data: dataToUpdate,
    });

    console.log(`[API] Successfully updated lyric ${lyricId}:`, updatedLyric);
    return NextResponse.json(updatedLyric);
  } catch (error: any) {
    console.error(`[API] Failed to update lyric ${lyricId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Lyric to update not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update lyric" }, { status: 500 });
  }
}

// GET /api/boards/[boardId]/lyrics/[lyricId] - Get a specific lyric
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, lyricId } = params;
  console.log(`[API] GET request for lyric ${lyricId} in board ${boardId}`);

  try {
    const lyric = await prisma.lyric.findFirst({
      where: { 
        id: lyricId, 
        boardId: boardId, 
        board: { userId: session.user.id } 
      },
    });

    if (!lyric) {
      console.log(`[API] Lyric ${lyricId} not found or access denied`);
      return NextResponse.json({ error: "Lyric not found or access denied" }, { status: 404 });
    }

    console.log(`[API] Successfully retrieved lyric ${lyricId}`);
    return NextResponse.json(lyric);
  } catch (error) {
    console.error(`[API] Failed to get lyric ${lyricId}:`, error);
    return NextResponse.json({ error: "Failed to get lyric" }, { status: 500 });
  }
}