import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAggregateMetrics() {
  console.log('Seeding AggregateMetrics from legacy data...');

  // Find organization and regions
  const serenaOrg = await prisma.organization.findFirst({
    where: { slug: 'serena-asia' }
  });

  if (!serenaOrg) {
    console.error('Serena Asia organization not found');
    return;
  }

  const wwfRegion = await prisma.region.findFirst({
    where: { slug: 'wwf', organizationId: serenaOrg.id }
  });

  const akrspRegion = await prisma.region.findFirst({
    where: { slug: 'akrsp', organizationId: serenaOrg.id }
  });

  const communityCategory = await prisma.category.findFirst({
    where: { slug: 'community-initiatives' }
  });

  // Serena Total Targets (Org-level)
  await prisma.aggregateMetrics.upsert({
    where: {
      entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
        entityType: 'ORGANIZATION',
        organizationId: serenaOrg.id,
        regionId: null,
        categoryId: null,
        metricType: 'PLANTATION_TARGET',
        startYear: 2021,
        endYear: 2023,
        year: null
      }
    },
    update: { targetValue: 600000 },
    create: {
      entityType: 'ORGANIZATION',
      organizationId: serenaOrg.id,
      metricType: 'PLANTATION_TARGET',
      startYear: 2021,
      endYear: 2023,
      targetValue: 600000,
      unit: 'trees',
      label: 'Serena Total Target (2021-2023)',
      displayOrder: 1
    }
  });

  await prisma.aggregateMetrics.upsert({
    where: {
      entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
        entityType: 'ORGANIZATION',
        organizationId: serenaOrg.id,
        regionId: null,
        categoryId: null,
        metricType: 'PLANTATION_ACHIEVED',
        startYear: null,
        endYear: null,
        year: null
      }
    },
    update: { achievedValue: 623195 },
    create: {
      entityType: 'ORGANIZATION',
      organizationId: serenaOrg.id,
      metricType: 'PLANTATION_ACHIEVED',
      achievedValue: 623195,
      unit: 'trees',
      label: 'Serena Total Achieved',
      displayOrder: 2
    }
  });

  console.log('✓ Seeded organization-level metrics');

  // WWF Targets (Region-level)
  if (wwfRegion) {
    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'REGION',
          organizationId: null,
          regionId: wwfRegion.id,
          categoryId: null,
          metricType: 'PLANTATION_TARGET',
          startYear: 2021,
          endYear: 2023,
          year: null
        }
      },
      update: { targetValue: 400000 },
      create: {
        entityType: 'REGION',
        regionId: wwfRegion.id,
        metricType: 'PLANTATION_TARGET',
        startYear: 2021,
        endYear: 2023,
        targetValue: 400000,
        unit: 'trees',
        label: 'WWF Total Target (2021-2023)',
        displayOrder: 1
      }
    });

    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'REGION',
          organizationId: null,
          regionId: wwfRegion.id,
          categoryId: null,
          metricType: 'PLANTATION_ACHIEVED',
          startYear: null,
          endYear: null,
          year: null
        }
      },
      update: { achievedValue: 413725 },
      create: {
        entityType: 'REGION',
        regionId: wwfRegion.id,
        metricType: 'PLANTATION_ACHIEVED',
        achievedValue: 413725,
        unit: 'trees',
        label: 'WWF Total Achieved',
        displayOrder: 2
      }
    });

    console.log('✓ Seeded WWF region metrics');
  }

  // AKRSP Targets (Region-level)
  if (akrspRegion) {
    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'REGION',
          organizationId: null,
          regionId: akrspRegion.id,
          categoryId: null,
          metricType: 'PLANTATION_TARGET',
          startYear: 2021,
          endYear: 2023,
          year: null
        }
      },
      update: { targetValue: 200000 },
      create: {
        entityType: 'REGION',
        regionId: akrspRegion.id,
        metricType: 'PLANTATION_TARGET',
        startYear: 2021,
        endYear: 2023,
        targetValue: 200000,
        unit: 'trees',
        label: 'AKRSP Total Target (2021-2023)',
        displayOrder: 1
      }
    });

    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'REGION',
          organizationId: null,
          regionId: akrspRegion.id,
          categoryId: null,
          metricType: 'PLANTATION_ACHIEVED',
          startYear: null,
          endYear: null,
          year: null
        }
      },
      update: { achievedValue: 209470 },
      create: {
        entityType: 'REGION',
        regionId: akrspRegion.id,
        metricType: 'PLANTATION_ACHIEVED',
        achievedValue: 209470,
        unit: 'trees',
        label: 'AKRSP Total Achieved',
        displayOrder: 2
      }
    });

    console.log('✓ Seeded AKRSP region metrics');
  }

  // Community Initiatives (Category-level)
  if (communityCategory) {
    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'CATEGORY',
          organizationId: null,
          regionId: null,
          categoryId: communityCategory.id,
          metricType: 'COMMUNITY_STOVES',
          startYear: null,
          endYear: null,
          year: null
        }
      },
      update: { achievedValue: 180 },
      create: {
        entityType: 'CATEGORY',
        categoryId: communityCategory.id,
        metricType: 'COMMUNITY_STOVES',
        achievedValue: 180,
        unit: 'units',
        label: 'Total Stoves Distributed',
        displayOrder: 1,
        details: {
          locations: ['Mohra', 'Agharbai - Sherani', 'Shukat Darra']
        }
      }
    });

    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'CATEGORY',
          organizationId: null,
          regionId: null,
          categoryId: communityCategory.id,
          metricType: 'COMMUNITY_SEEDS_FODDER',
          startYear: null,
          endYear: null,
          year: null
        }
      },
      update: { achievedValue: 400 },
      create: {
        entityType: 'CATEGORY',
        categoryId: communityCategory.id,
        metricType: 'COMMUNITY_SEEDS_FODDER',
        achievedValue: 400,
        unit: 'kg',
        label: 'Provided Fodder Seeds',
        displayOrder: 2
      }
    });

    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'CATEGORY',
          organizationId: null,
          regionId: null,
          categoryId: communityCategory.id,
          metricType: 'COMMUNITY_SEEDS_KITCHEN',
          startYear: null,
          endYear: null,
          year: null
        }
      },
      update: { achievedValue: 340 },
      create: {
        entityType: 'CATEGORY',
        categoryId: communityCategory.id,
        metricType: 'COMMUNITY_SEEDS_KITCHEN',
        achievedValue: 340,
        unit: 'units',
        label: 'Kitchen Gardening Seeds',
        displayOrder: 3
      }
    });

    await prisma.aggregateMetrics.upsert({
      where: {
        entityType_organizationId_regionId_categoryId_metricType_startYear_endYear_year: {
          entityType: 'CATEGORY',
          organizationId: null,
          regionId: null,
          categoryId: communityCategory.id,
          metricType: 'COMMUNITY_SOLAR_GEYSERS',
          startYear: null,
          endYear: null,
          year: null
        }
      },
      update: { achievedValue: 5 },
      create: {
        entityType: 'CATEGORY',
        categoryId: communityCategory.id,
        metricType: 'COMMUNITY_SOLAR_GEYSERS',
        achievedValue: 5,
        unit: 'units',
        label: 'Solar Geysers',
        displayOrder: 4
      }
    });

    console.log('✓ Seeded community category metrics');
  }

  console.log('✅ AggregateMetrics seeding complete!');
}

seedAggregateMetrics()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
