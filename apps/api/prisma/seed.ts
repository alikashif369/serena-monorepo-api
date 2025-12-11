import { PrismaClient } from '../src/generated/prisma-client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@serenagreen.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'serenagreen@123';
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminHashedPassword,
      name: 'Serena Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: adminEmail,
      password: adminHashedPassword,
      name: 'Serena Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create organizations
  const serenaAsia = await prisma.organization.upsert({
    where: { slug: 'serena-asia' },
    update: {},
    create: {
      name: 'Serena Asia',
      slug: 'serena-asia',
      description: 'Serena Green operations in Asia',
    },
  });

  const serenaAfrica = await prisma.organization.upsert({
    where: { slug: 'serena-africa' },
    update: {},
    create: {
      name: 'Serena Africa',
      slug: 'serena-africa',
      description: 'Serena Green operations in Africa',
    },
  });

  // Create regions for Serena Asia
  const pakistan = await prisma.region.upsert({
    where: { organizationId_slug: { organizationId: serenaAsia.id, slug: 'pakistan' } },
    update: {},
    create: {
      name: 'Pakistan',
      slug: 'pakistan',
      organizationId: serenaAsia.id,
    },
  });

  // Create regions for Serena Africa
  const kenya = await prisma.region.upsert({
    where: { organizationId_slug: { organizationId: serenaAfrica.id, slug: 'kenya' } },
    update: {},
    create: {
      name: 'Kenya',
      slug: 'kenya',
      organizationId: serenaAfrica.id,
    },
  });

  // Create categories for Pakistan
  const plantationCategory = await prisma.category.upsert({
    where: { regionId_slug: { regionId: pakistan.id, slug: 'plantation-sites' } },
    update: {},
    create: {
      name: 'Plantation Sites',
      slug: 'plantation-sites',
      type: 'PLANTATION',
      regionId: pakistan.id,
    },
  });

  const solarCategory = await prisma.category.upsert({
    where: { regionId_slug: { regionId: pakistan.id, slug: 'solar-sites' } },
    update: {},
    create: {
      name: 'Solar Sites',
      slug: 'solar-sites',
      type: 'SOLAR',
      regionId: pakistan.id,
    },
  });

  // Create categories for Kenya
  const conservationCategory = await prisma.category.upsert({
    where: { regionId_slug: { regionId: kenya.id, slug: 'conservation' } },
    update: {},
    create: {
      name: 'Conservation',
      slug: 'conservation',
      type: 'RESTORATION',
      regionId: kenya.id,
    },
  });

  // Create subcategories
  const akrsp = await prisma.subCategory.upsert({
    where: { categoryId_slug: { categoryId: plantationCategory.id, slug: 'akrsp' } },
    update: {},
    create: {
      name: 'AKRSP',
      slug: 'akrsp',
      categoryId: plantationCategory.id,
    },
  });

  const solar2025 = await prisma.subCategory.upsert({
    where: { categoryId_slug: { categoryId: solarCategory.id, slug: 'installed-2025' } },
    update: {},
    create: {
      name: 'Installed 2025',
      slug: 'installed-2025',
      categoryId: solarCategory.id,
    },
  });

  console.log('✅ Seeding complete!');
  console.log(`Created:
    - Admin user: ${adminUser.email}
    - Organizations: ${serenaAsia.name}, ${serenaAfrica.name}
    - Regions: ${pakistan.name}, ${kenya.name}
    - Categories: ${plantationCategory.name}, ${solarCategory.name}, ${conservationCategory.name}
    - SubCategories: ${akrsp.name}, ${solar2025.name}
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
