import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/boards - Get all boards for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const boards = await prisma.board.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("Failed to fetch boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}

// POST /api/boards - Create a new board
export async function POST(request: Request) {
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

    // Check if user already has a board with this name
    const existingBoard = await prisma.board.findFirst({
      where: {
        userId: session.user.id,
        name: name,
      },
    });

    if (existingBoard) {
      return NextResponse.json(
        { error: "You already have a board with this name" },
        { status: 409 }
      );
    }

    const board = await prisma.board.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Failed to create board:", error);
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
} 