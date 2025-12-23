import { PrismaClient } from '../src/generated/prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {

  try {
    // Check if we can connect to the database
    await prisma.$connect();

    // Get counts of existing data
    const userCount = await prisma.user.count();
    const planCount = await prisma.plan.count();
    const businessOwnerCount = await prisma.businessOwner.count();
    const buyerCount = await prisma.buyer.count();
    const productCount = await prisma.product.count();
    const locationCount = await prisma.location.count();
    } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });