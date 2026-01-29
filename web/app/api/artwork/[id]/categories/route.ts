import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/artwork/[id]/categories - Get categories for an artwork
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;

    const artworkCategories = await prisma.artworkCategory.findMany({
      where: { tokenId },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      artworkCategories.map((ac) => ac.category)
    );
  } catch (error) {
    console.error('Error fetching artwork categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artwork categories' },
      { status: 500 }
    );
  }
}

// POST /api/artwork/[id]/categories - Add categories to an artwork
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;
    const body = await request.json();
    const { categoryIds } = body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Category IDs are required' },
        { status: 400 }
      );
    }

    // Ensure artwork stats record exists
    await prisma.artworkStats.upsert({
      where: { id: tokenId },
      create: { id: tokenId, views: 0, likes: 0 },
      update: {},
    });

    // Verify all categories exist
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: 'One or more categories not found' },
        { status: 404 }
      );
    }

    // Add categories (skip duplicates)
    const results = await Promise.all(
      categoryIds.map(async (categoryId: string) => {
        try {
          return await prisma.artworkCategory.upsert({
            where: {
              tokenId_categoryId: { tokenId, categoryId },
            },
            create: { tokenId, categoryId },
            update: {},
            include: { category: true },
          });
        } catch {
          return null;
        }
      })
    );

    const addedCategories = results
      .filter((r) => r !== null)
      .map((r) => r!.category);

    return NextResponse.json({
      tokenId,
      categories: addedCategories,
    });
  } catch (error) {
    console.error('Error adding categories to artwork:', error);
    return NextResponse.json(
      { error: 'Failed to add categories' },
      { status: 500 }
    );
  }
}

// PUT /api/artwork/[id]/categories - Replace all categories for an artwork
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;
    const body = await request.json();
    const { categoryIds } = body;

    if (!categoryIds || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { error: 'Category IDs array is required' },
        { status: 400 }
      );
    }

    // Ensure artwork stats record exists
    await prisma.artworkStats.upsert({
      where: { id: tokenId },
      create: { id: tokenId, views: 0, likes: 0 },
      update: {},
    });

    // Delete all existing categories
    await prisma.artworkCategory.deleteMany({
      where: { tokenId },
    });

    // Add new categories if any
    if (categoryIds.length > 0) {
      // Verify all categories exist
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      if (categories.length !== categoryIds.length) {
        return NextResponse.json(
          { error: 'One or more categories not found' },
          { status: 404 }
        );
      }

      await prisma.artworkCategory.createMany({
        data: categoryIds.map((categoryId: string) => ({
          tokenId,
          categoryId,
        })),
      });
    }

    // Fetch updated categories
    const updatedCategories = await prisma.artworkCategory.findMany({
      where: { tokenId },
      include: { category: true },
    });

    return NextResponse.json({
      tokenId,
      categories: updatedCategories.map((ac) => ac.category),
    });
  } catch (error) {
    console.error('Error updating artwork categories:', error);
    return NextResponse.json(
      { error: 'Failed to update categories' },
      { status: 500 }
    );
  }
}

// DELETE /api/artwork/[id]/categories - Remove a category from an artwork
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tokenId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    await prisma.artworkCategory.delete({
      where: {
        tokenId_categoryId: { tokenId, categoryId },
      },
    });

    return NextResponse.json({
      tokenId,
      removedCategoryId: categoryId,
    });
  } catch (error) {
    console.error('Error removing category from artwork:', error);
    return NextResponse.json(
      { error: 'Failed to remove category' },
      { status: 500 }
    );
  }
}
