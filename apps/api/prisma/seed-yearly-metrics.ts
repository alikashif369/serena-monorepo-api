import { PrismaClient } from '@prisma/client';
import * as calculationsData from '../../../serenagreen_old_code/src/assets/CALCULATIONS.json';

const prisma = new PrismaClient();

async function seedYearlyMetrics() {
  console.log('Seeding YearlyMetrics from CALCULATIONS.json...');

  for (const locationData of calculationsData) {
    // Find site by location name
    const site = await prisma.site.findFirst({
      where: {
        name: {
          contains: locationData.Location,
          mode: 'insensitive'
        }
      }
    });

    if (!site) {
      console.warn(`Site not found for location: ${locationData.Location}`);
      continue;
    }

    // Seed data for years 2020-2025
    for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
      const yearlyMetric = {
        siteId: site.id,
        year,
        treeCanopy: locationData[`TreeCanopy${year}`] || null,
        greenArea: locationData[`GreenArea${year}`] || null,
        barrenLand: locationData[`BarrenLand${year}`] || null,
        wetLand: locationData[`WetLand${year}`] || null,
        snow: locationData[`Snow${year}`] || null,
        rock: locationData[`Rock${year}`] || null,
        water: locationData[`Water${year}`] || null,
        buildup: locationData[`Buildup${year}`] || null,
        solarPanels: locationData[`SolarPanels${year}`] || null,
      };

      await prisma.yearlyMetrics.upsert({
        where: { siteId_year: { siteId: site.id, year } },
        update: yearlyMetric,
        create: yearlyMetric
      });

      console.log(`✓ Seeded YearlyMetrics for ${site.name} (${year})`);
    }
  }

  console.log('✅ YearlyMetrics seeding complete!');
}

seedYearlyMetrics()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
