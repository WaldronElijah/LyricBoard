import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/prisma';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { lyrics } = await request.json();

    // Verify board ownership
    const board = await prisma.board.findUnique({
      where: {
        id: params.boardId,
        userId: session.user.id,
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Update positions in a transaction
    await prisma.$transaction(
      lyrics.map((lyric: { id: string; position: number }) =>
        prisma.lyric.update({
          where: { id: lyric.id },
          data: { position: lyric.position },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to reorder lyrics' },
      { status: 500 }
    );
  }
} 