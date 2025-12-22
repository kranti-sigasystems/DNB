import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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
    
    // Create buyers table
    await prisma.$executeRaw`
      CREATE TABLE "buyers" (
        "id" TEXT NOT NULL,
        "contactName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "contactEmail" TEXT,
        "contactPhone" TEXT,
        "phoneNumber" TEXT,
        "buyersCompanyName" TEXT,
        "businessName" TEXT,
        "productName" TEXT,
        "locationName" TEXT,
        "registrationNumber" TEXT,
        "address" TEXT,
        "city" TEXT,
        "state" TEXT,
        "country" TEXT NOT NULL DEFAULT 'India',
        "postalCode" TEXT,
        "businessOwnerId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Add unique constraints
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "buyers_email_key" ON "buyers"("email");
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
          try {
            await prisma.buyer.create({
              data: {
                contactName: `Test Buyer ${i} for ${bo.businessName}`,
                email: `buyer${i}.${bo.id.slice(0, 8)}@example.com`,
                contactEmail: `contact${i}.${bo.id.slice(0, 8)}@company.com`,
                contactPhone: `+123456789${i}`,
                phoneNumber: `+123456789${i}`,
                buyersCompanyName: `${bo.businessName} Client ${i}`,
                businessName: `${bo.businessName} Client ${i}`,
                productName: `Product ${i}`,
                locationName: `Location ${i}`,
                registrationNumber: `REG${i}${bo.id.slice(0, 6)}`,
                address: `${i} Test Street`,
                city: 'Test City',
                state: 'Test State',
                country: 'India',
                postalCode: `12345${i}`,
                businessOwnerId: bo.id,
                status: 'active',
                is_deleted: false,
              },
            });
          } catch (createError) {
            console.error(`❌ Failed to create buyer ${i} for ${bo.businessName}:`, createError);
          }
        }
      }
    }
    
    // Show summary
    const buyersCount = await prisma.buyer.count();
    
  } catch (error) {
    console.error('❌ Error setting up buyers table:', error);
    throw error;
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