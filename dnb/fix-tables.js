const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['error'] });

async function fixTables() {
  try {
    await prisma.$executeRaw`DROP TABLE IF EXISTS "products" CASCADE;`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "locations" CASCADE;`;
    
    await prisma.$executeRaw`
      CREATE TABLE "products" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "code" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "species" TEXT[] NOT NULL DEFAULT '{}',
        "size" TEXT[] DEFAULT '{}',
        "sku" TEXT,
        "ownerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "products_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE "locations" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "locationName" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "country" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "postalCode" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
      );
    `;
    // Get a business owner to add sample data
    const businessOwner = await prisma.businessOwner.findFirst({
      select: { id: true, businessName: true }
    });
    
    if (businessOwner) {
      
      // Add sample products
      await prisma.$executeRaw`
        INSERT INTO "products" ("code", "productName", "species", "size", "sku", "ownerId")
        VALUES 
          ('FISH001', 'Atlantic Salmon', ARRAY['Salmon', 'Atlantic'], ARRAY['Small', 'Medium', 'Large'], 'AS-001', ${businessOwner.id}),
          ('FISH002', 'Pacific Tuna', ARRAY['Tuna', 'Pacific'], ARRAY['Medium', 'Large', 'Extra Large'], 'PT-002', ${businessOwner.id}),
          ('SHRIMP001', 'Tiger Shrimp', ARRAY['Shrimp', 'Tiger'], ARRAY['Small', 'Medium'], 'TS-001', ${businessOwner.id}),
          ('CRAB001', 'Blue Crab', ARRAY['Crab', 'Blue'], ARRAY['Medium', 'Large'], 'BC-001', ${businessOwner.id}),
          ('LOBSTER001', 'Maine Lobster', ARRAY['Lobster', 'Maine'], ARRAY['Large', 'Extra Large'], 'ML-001', ${businessOwner.id});
      `;
      
      // Add sample locations
      await prisma.$executeRaw`
        INSERT INTO "locations" ("locationName", "code", "city", "state", "country", "address", "postalCode", "ownerId")
        VALUES 
          ('Main Warehouse', 'MW001', 'New York', 'New York', 'USA', '123 Harbor Street, Dock 5', '10001', ${businessOwner.id}),
          ('West Coast Distribution', 'WC002', 'Los Angeles', 'California', 'USA', '456 Pacific Avenue, Suite 200', '90001', ${businessOwner.id}),
          ('Cold Storage Facility', 'CS003', 'Seattle', 'Washington', 'USA', '789 Fishermans Wharf', '98101', ${businessOwner.id}),
          ('Processing Plant', 'PP004', 'Boston', 'Massachusetts', 'USA', '321 Industrial Boulevard', '02101', ${businessOwner.id}),
          ('Regional Office', 'RO005', 'Miami', 'Florida', 'USA', '654 Ocean Drive, Floor 10', '33101', ${businessOwner.id});
      `;
    }
    
    // Show counts
    const productsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "products"`;
    const locationsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "locations"`;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

fixTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });