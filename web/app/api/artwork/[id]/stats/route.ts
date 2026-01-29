import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/artwork/[id]/stats - Get artwork stats (views, likes)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;

    // Get or create stats for this artwork
    let stats = await prisma.artworkStats.findUnique({
      where: { id: tokenId },
    });

    if (!stats) {
      stats = await prisma.artworkStats.create({
        data: { id: tokenId, views: 0, likes: 0 },
      });
    }

    return NextResponse.json({
      tokenId,
      views: stats.views,
      likes: stats.likes,
    });
  } catch (error) {
    console.error('Error fetching artwork stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
