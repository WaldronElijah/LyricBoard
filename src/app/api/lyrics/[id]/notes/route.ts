import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content } = await request.json();

    // Verify lyric ownership through board
    const lyric = await prisma.lyric.findFirst({
      where: {
        id: params.id,
        board: {
          userId: session.user.id,
        },
      },
    });

    if (!lyric) {
      return NextResponse.json({ error: 'Lyric not found' }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        content,
        lyricId: params.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const noteId = request.nextUrl.searchParams.get('noteId');
    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Verify note ownership
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: session.user.id,
        lyricId: params.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
} 