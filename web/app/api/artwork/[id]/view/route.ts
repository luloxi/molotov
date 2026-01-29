import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import crypto from 'crypto';

// POST /api/artwork/[id]/view - Record a view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;
    
    // Get user ID from body if authenticated
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || null;
    
    // Hash the IP for anonymous rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip + tokenId).digest('hex').substring(0, 16);

    // Check if this IP has viewed recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = await prisma.artworkView.findFirst({
      where: {
        tokenId,
        ipHash,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentView) {
      // Already viewed recently, return current stats
      const stats = await prisma.artworkStats.findUnique({
        where: { id: tokenId },
      });
      return NextResponse.json({
        tokenId,
        views: stats?.views || 0,
        likes: stats?.likes || 0,
        alreadyViewed: true,
      });
    }

    // Record the view and increment counter
    await prisma.$transaction(async (tx) => {
      // Ensure stats record exists
      await tx.artworkStats.upsert({
        where: { id: tokenId },
        create: { id: tokenId, views: 1, likes: 0 },
        update: { views: { increment: 1 } },
      });

      // Record the view
      await tx.artworkView.create({
        data: {
          tokenId,
          userId,
          ipHash,
        },
      });
    });

    const stats = await prisma.artworkStats.findUnique({
      where: { id: tokenId },
    });

    return NextResponse.json({
      tokenId,
      views: stats?.views || 0,
      likes: stats?.likes || 0,
      alreadyViewed: false,
    });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
