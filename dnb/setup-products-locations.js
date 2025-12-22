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

async function setupProductsAndLocations() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "products" (
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
    
    // Add unique constraint for products
    try {
      await prisma.$executeRaw`
        ALTER TABLE "products" 
        ADD CONSTRAINT "products_code_ownerId_key" 
        UNIQUE ("code", "ownerId");
      `;
    } catch (error) {
      if (!error.message.includes('already exists')) {
      }
    }
    
    // Add foreign key constraint for products
    try {
      await prisma.$executeRaw`
        ALTER TABLE "products" 
        ADD CONSTRAINT "products_ownerId_fkey" 
        FOREIGN KEY ("ownerId") 
        REFERENCES "business_owners"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      if (!error.message.includes('already exists')) {
        
      }
    }
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "locations" (
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
    
    // Add unique constraint for locations
    try {
      await prisma.$executeRaw`
        ALTER TABLE "locations" 
        ADD CONSTRAINT "locations_code_ownerId_key" 
        UNIQUE ("code", "ownerId");
      `;
    } catch (error) {
      if (!error.message.includes('already exists')) {
      }
    }
    
    // Add foreign key constraint for locations
    try {
      await prisma.$executeRaw`
        ALTER TABLE "locations" 
        ADD CONSTRAINT "locations_ownerId_fkey" 
        FOREIGN KEY ("ownerId") 
        REFERENCES "business_owners"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
    }
    
    // Show summary
    const productsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "products"`;
    const locationsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "locations"`;
    
  } catch (error) {
    console.error('❌ Error setting up products and locations tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupProductsAndLocations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });