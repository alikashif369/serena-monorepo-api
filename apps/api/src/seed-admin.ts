/**
 * Seed Admin Script
 *
 * Creates the initial SUPER_ADMIN user for SerenaGreen.
 * Run this script once to bootstrap the admin system.
 *
 * Usage:
 *   npx ts-node src/seed-admin.ts --email="admin@serenagreen.com" --password="SecurePassword123!" --name="Super Admin"
 *
 * Or with npm script (add to package.json):
 *   "seed:admin": "ts-node src/seed-admin.ts"
 *   npm run seed:admin -- --email="admin@example.com" --password="password" --name="Admin"
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface AdminArgs {
  email: string;
  password: string;
  name: string;
}

function parseArgs(): AdminArgs {
  const args = process.argv.slice(2);
  const result: Partial<AdminArgs> = {};

  for (const arg of args) {
    const [key, value] = arg.split('=');
    const cleanKey = key.replace('--', '');

    if (cleanKey === 'email') result.email = value;
    if (cleanKey === 'password') result.password = value;
    if (cleanKey === 'name') result.name = value;
  }

  if (!result.email || !result.password) {
    console.error('\x1b[31mError: Missing required arguments\x1b[0m');
    console.log('\nUsage:');
    console.log('  npx ts-node src/seed-admin.ts --email="admin@example.com" --password="YourPassword123!" --name="Super Admin"');
    console.log('\nRequired arguments:');
    console.log('  --email     Admin email address');
    console.log('  --password  Admin password (min 8 characters)');
    console.log('\nOptional arguments:');
    console.log('  --name      Admin name (default: "Super Admin")');
    process.exit(1);
  }

  return {
    email: result.email,
    password: result.password,
    name: result.name || 'Super Admin',
  };
}

async function main() {
  console.log('\n\x1b[36m╔════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[36m║     SerenaGreen Admin Seed Script          ║\x1b[0m');
  console.log('\x1b[36m╚════════════════════════════════════════════╝\x1b[0m\n');

  const { email, password, name } = parseArgs();

  // Validate password length
  if (password.length < 8) {
    console.error('\x1b[31mError: Password must be at least 8 characters long\x1b[0m');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('\x1b[31mError: Invalid email format\x1b[0m');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('\x1b[33mWarning: A user with this email already exists\x1b[0m');
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Role: ${existingUser.role}`);
      console.log(`  Created: ${existingUser.createdAt}`);
      console.log('\nNo changes made.');
      return;
    }

    // Check if any SUPER_ADMIN exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (existingSuperAdmin) {
      console.log('\x1b[33mWarning: A SUPER_ADMIN already exists\x1b[0m');
      console.log(`  Email: ${existingSuperAdmin.email}`);
      console.log(`  Name: ${existingSuperAdmin.name}`);
      console.log('\nDo you still want to create another SUPER_ADMIN? (This script will continue)');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    console.log('\x1b[32m✓ SUPER_ADMIN created successfully!\x1b[0m\n');
    console.log('  User Details:');
    console.log(`  ├─ ID: ${user.id}`);
    console.log(`  ├─ Email: ${user.email}`);
    console.log(`  ├─ Name: ${user.name}`);
    console.log(`  ├─ Role: ${user.role}`);
    console.log(`  └─ Created: ${user.createdAt}`);
    console.log('\n\x1b[33mImportant: Please save these credentials securely!\x1b[0m');
    console.log('\x1b[33mYou can now login at: http://localhost:4000/login\x1b[0m\n');

  } catch (error) {
    console.error('\x1b[31mError creating admin:\x1b[0m', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
