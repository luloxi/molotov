import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// POST /api/artwork/[id]/like - Toggle like on artwork
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required to like artwork' },
        { status: 400 }
      );
    }

    // Check if user already liked
    const existingLike = await prisma.artworkLike.findUnique({
      where: {
        tokenId_userId: { tokenId, userId },
      },
    });

    if (existingLike) {
      // Unlike - remove the like
      await prisma.$transaction(async (tx) => {
        await tx.artworkLike.delete({
          where: { id: existingLike.id },
        });

        await tx.artworkStats.update({
          where: { id: tokenId },
          data: { likes: { decrement: 1 } },
        });
      });

      const stats = await prisma.artworkStats.findUnique({
        where: { id: tokenId },
      });

      return NextResponse.json({
        tokenId,
        likes: stats?.likes || 0,
        liked: false,
      });
    } else {
      // Like - add the like
      await prisma.$transaction(async (tx) => {
        // Ensure stats record exists
        await tx.artworkStats.upsert({
          where: { id: tokenId },
          create: { id: tokenId, views: 0, likes: 1 },
          update: { likes: { increment: 1 } },
        });

        await tx.artworkLike.create({
          data: { tokenId, userId },
        });
      });

      const stats = await prisma.artworkStats.findUnique({
        where: { id: tokenId },
      });

      return NextResponse.json({
        tokenId,
        likes: stats?.likes || 0,
        liked: true,
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

// GET /api/artwork/[id]/like?userId=xxx - Check if user liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ liked: false });
    }

    const existingLike = await prisma.artworkLike.findUnique({
      where: {
        tokenId_userId: { tokenId, userId },
      },
    });

    return NextResponse.json({
      tokenId,
      liked: !!existingLike,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}
