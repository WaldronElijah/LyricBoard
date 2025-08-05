import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/boards/[boardId] - Get a specific board
export async function GET(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const board = await prisma.board.findUnique({
      where: {
        id: params.boardId,
        userId: session.user.id,
      },
      include: {
        lyrics: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("Failed to fetch board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId] - Delete a board
export async function DELETE(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.board.delete({
      where: {
        id: params.boardId,
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete board:", error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}

// PATCH /api/boards/[boardId] - Update a board
export async function PATCH(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400 }
      );
    }

    // Check if user already has another board with this name
    const existingBoard = await prisma.board.findFirst({
      where: {
        userId: session.user.id,
        name: name,
        id: {
          not: params.boardId,
        },
      },
    });

    if (existingBoard) {
      return NextResponse.json(
        { error: "You already have a board with this name" },
        { status: 409 }
      );
    }

    const board = await prisma.board.update({
      where: {
        id: params.boardId,
        userId: session.user.id,
      },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error("Failed to update board:", error);
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 }
    );
  }
} 