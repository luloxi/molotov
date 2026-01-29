import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Abstract', slug: 'abstract', description: 'Non-representational art using shapes, colors, and forms', color: '#8B5CF6' },
  { name: 'Photography', slug: 'photography', description: 'Photographic artworks and digital photography', color: '#10B981' },
  { name: 'Digital Art', slug: 'digital-art', description: 'Art created using digital tools and software', color: '#3B82F6' },
  { name: 'Illustration', slug: 'illustration', description: 'Hand-drawn and digital illustrations', color: '#F59E0B' },
  { name: 'Generative', slug: 'generative', description: 'Art created with algorithms and code', color: '#EC4899' },
  { name: 'AI Art', slug: 'ai-art', description: 'Art created with artificial intelligence tools', color: '#6366F1' },
  { name: '3D', slug: '3d', description: 'Three-dimensional digital artworks and renders', color: '#14B8A6' },
  { name: 'Pixel Art', slug: 'pixel-art', description: 'Retro-style pixel-based artwork', color: '#EF4444' },
  { name: 'Animation', slug: 'animation', description: 'Animated artworks and motion graphics', color: '#F97316' },
  { name: 'Collage', slug: 'collage', description: 'Mixed media and collage artworks', color: '#84CC16' },
  { name: 'Portrait', slug: 'portrait', description: 'Portrait artworks and character art', color: '#A855F7' },
  { name: 'Landscape', slug: 'landscape', description: 'Nature and landscape artworks', color: '#22C55E' },
];

async function main() {
  console.log('Seeding database...');

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    console.log(`  Created category: ${category.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
