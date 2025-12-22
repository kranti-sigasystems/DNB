const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

async function setupBuyersTable() {
  try {
    await prisma.$executeRaw`DROP TABLE IF EXISTS "buyers" CASCADE;`;
    await prisma.$executeRaw`
      CREATE TABLE "buyers" (
        "id" TEXT NOT NULL,
        "contactName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "contactEmail" TEXT,
        "contactPhone" TEXT,
        "buyersCompanyName" TEXT,
        "productName" TEXT,
        "locationName" TEXT,
        "businessOwnerId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "buyers" 
      ADD CONSTRAINT "buyers_businessOwnerId_fkey" 
      FOREIGN KEY ("businessOwnerId") 
      REFERENCES "business_owners"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    
    // Create some test buyers for existing business owners
    const businessOwners = await prisma.businessOwner.findMany({
      take: 3,
      select: { id: true, businessName: true }
    });
    
    if (businessOwners.length > 0) {
      
      for (const bo of businessOwners) {
        // Create 2-3 test buyers for each business owner
        for (let i = 1; i <= 3; i++) {
          // Use Prisma's create method instead of raw SQL for better type safety
          try {
            await prisma.buyer.create({
              data: {
                contactName: `Test Buyer ${i} for ${bo.businessName}`,
                email: `buyer${i}.${bo.id.slice(0, 8)}@example.com`,
                contactEmail: `contact${i}.${bo.id.slice(0, 8)}@company.com`,
                contactPhone: `+123456789${i}`,
                buyersCompanyName: `${bo.businessName} Client ${i}`,
                productName: `Product ${i}`,
                locationName: `Location ${i}`,
                businessOwnerId: bo.id,
                status: 'active',
                is_deleted: false,
              },
            });
          } catch (createError) {
          }
        }
      }
      
    }
    
    // Show summary
    const buyersCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "buyers"`;
    
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

setupBuyersTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  });