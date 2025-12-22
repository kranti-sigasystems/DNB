import { PrismaClient } from '../src/generated/prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { id: 1, name: 'super_admin', description: 'Has full system access, including managing users, roles, and configurations.' },
    { id: 2, name: 'business_owner', description: 'Owns a business account and can manage buyers, offers, and company settings.' },
    { id: 3, name: 'buyer', description: 'Can view and respond to offers, manage purchase requests, and access order history.' },
    { id: 4, name: 'manager', description: 'Oversees operations for a business owner, manages users and offers under that account.' },
    { id: 5, name: 'support_staff', description: 'Handles user issues, provides technical assistance, and monitors system health.' },
    { id: 6, name: 'guest', description: 'Has limited read-only access to public data and previews of available services.' },
  ];

  for (const roleData of roles) {
    try {
      // Using upsert to avoid duplicates
      const role = await prisma.role.upsert({
        where: { id: roleData.id },
        update: {}, // Don't update if exists
        create: {
          id: roleData.id,
          name: roleData.name,
          description: roleData.description,
          isActive: true,
        },
      });
    } catch (error) {
      console.error(`❌ Failed to create role ${roleData.name}:`, error);
    }
  }

  // Verify the seeding
  const roleCount = await prisma.role.count();
  
  // List all roles
  const allRoles = await prisma.role.findMany({
    orderBy: { id: 'asc' }
  });
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });