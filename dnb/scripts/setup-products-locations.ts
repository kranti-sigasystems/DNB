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
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.warn('⚠️ Could not add unique constraint for products:', error.message);
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
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.warn('⚠️ Could not add foreign key constraint for products:', error.message);
      }
    }
    
    // Create locations table
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
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.warn('⚠️ Could not add unique constraint for locations:', error.message);
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
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.warn('⚠️ Could not add foreign key constraint for locations:', error.message);
      }
    }
    
    // Create some sample data for existing business owners
    const businessOwners = await prisma.businessOwner.findMany({
      take: 3,
      select: { id: true, businessName: true }
    });
    
    if (businessOwners.length > 0) {
      for (const bo of businessOwners) {
        // Create sample products
        for (let i = 1; i <= 3; i++) {
          try {
            await prisma.product.create({
              data: {
                code: `PROD${i}${bo.id.slice(0, 6)}`,
                productName: `Product ${i} - ${bo.businessName}`,
                species: [`Species ${i}A`, `Species ${i}B`],
                size: [`Small`, `Medium`, `Large`],
                sku: `SKU${i}${bo.id.slice(0, 4)}`,
                ownerId: bo.id,
              },
            });
          } catch (error) {
            // Product might already exist, skip
          }
        }
        
        // Create sample locations
        for (let i = 1; i <= 2; i++) {
          try {
            await prisma.location.create({
              data: {
                locationName: `${bo.businessName} Location ${i}`,
                code: `LOC${i}${bo.id.slice(0, 6)}`,
                city: `City ${i}`,
                state: `State ${i}`,
                country: 'India',
                address: `${i} Business Street, Industrial Area`,
                postalCode: `12345${i}`,
                ownerId: bo.id,
              },
            });
          } catch (error) {
            // Location might already exist, skip
          }
        }
      }
    }
    
    // Show summary
    const productsCount = await prisma.product.count();
    const locationsCount = await prisma.location.count();
    
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