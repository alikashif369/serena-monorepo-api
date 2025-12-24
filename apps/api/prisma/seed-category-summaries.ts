import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategorySummaries() {
  console.log('Seeding CategorySummaries...');

  const wasteCategory = await prisma.category.findFirst({
    where: { slug: 'waste-management' }
  });

  const serenaOrg = await prisma.organization.findFirst({
    where: { slug: 'serena-asia' }
  });

  // Waste Management Category Summary
  if (wasteCategory) {
    await prisma.categorySummary.create({
      data: {
        categoryId: wasteCategory.id,
        title: 'Waste Management Initiative',
        summary: `TPS-Pakistan, in partnership with WeClean, has launched a waste management initiative at Islamabad Serena Hotel. The project focuses on organic waste recycling and composting, contributing to environmental sustainability by reducing landfill waste and generating valuable compost for gardening and landscaping.`,
        displayOrder: 1
      }
    });
    console.log('✓ Seeded Waste Management category summary');
  }

  // Organization-level Summary
  if (serenaOrg) {
    await prisma.categorySummary.create({
      data: {
        organizationId: serenaOrg.id,
        title: 'Asia Green Initiatives',
        summary: `TPS Asia is advancing its environmental goals through initiatives like solar energy production, waste management, and community-based conservation. These programs integrate renewable energy, enhance community resilience, and promote sustainable practices across all properties.`,
        displayOrder: 1
      }
    });
    console.log('✓ Seeded Serena Asia organization summary');
  }

  console.log('✅ CategorySummaries seeding complete!');
}

seedCategorySummaries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
