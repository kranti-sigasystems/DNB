const { PrismaClient } = require('./src/generated/prisma');
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
});

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 Existing tables:');
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // Check if buyers table exists
    const buyersTableExists = tables.some(table => table.table_name === 'buyers');
    
    if (!buyersTableExists) {
      console.log('\n🏗️ Creating buyers table...');
      
      // Create buyers table with correct structure
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
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Add unique constraints
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "buyers_email_key" ON "buyers"("email");
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "buyers_registrationNumber_key" ON "buyers"("registrationNumber");
      `;
      
      console.log('✅ Buyers table created successfully');
    } else {
      console.log('✅ Buyers table already exists');
    }
    
    // Check if business_owners table exists
    const businessOwnersTableExists = tables.some(table => table.table_name === 'business_owners');
    
    if (!businessOwnersTableExists) {
      console.log('\n🏗️ Creating business_owners table...');
      
      await prisma.$executeRaw`
        CREATE TABLE "business_owners" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "businessName" TEXT NOT NULL,
          "first_name" TEXT,
          "last_name" TEXT,
          "email" TEXT NOT NULL,
          "phoneNumber" TEXT,
          "registrationNumber" TEXT NOT NULL,
          "country" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "address" TEXT NOT NULL,
          "postalCode" TEXT NOT NULL,
          "planId" TEXT,
          "paymentId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "is_deleted" BOOLEAN NOT NULL DEFAULT false,
          "is_verified" BOOLEAN NOT NULL DEFAULT false,
          "is_approved" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "business_owners_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Add unique constraints
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "business_owners_userId_key" ON "business_owners"("userId");
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "business_owners_businessName_key" ON "business_owners"("businessName");
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "business_owners_email_key" ON "business_owners"("email");
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "business_owners_registrationNumber_key" ON "business_owners"("registrationNumber");
      `;
      
      console.log('✅ Business owners table created successfully');
    } else {
      console.log('✅ Business owners table already exists');
    }
    
    // Check if users table exists
    const usersTableExists = tables.some(table => table.table_name === 'users');
    
    if (!usersTableExists) {
      console.log('\n🏗️ Creating users table...');
      
      await prisma.$executeRaw`
        CREATE TABLE "users" (
          "id" TEXT NOT NULL,
          "first_name" TEXT,
          "last_name" TEXT,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "roleId" INTEGER NOT NULL,
          "businessName" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "stripeCustomerId" TEXT,
          "subscriptionId" TEXT,

          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        );
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
      `;
      
      console.log('✅ Users table created successfully');
    } else {
      console.log('✅ Users table already exists');
    }
    
    // Add foreign key constraints if tables exist
    if (buyersTableExists || businessOwnersTableExists) {
      try {
        console.log('\n🔗 Adding foreign key constraints...');
        
        // Add foreign key from buyers to business_owners
        await prisma.$executeRaw`
          ALTER TABLE "buyers" 
          DROP CONSTRAINT IF EXISTS "buyers_businessOwnerId_fkey";
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "buyers" 
          ADD CONSTRAINT "buyers_businessOwnerId_fkey" 
          FOREIGN KEY ("businessOwnerId") 
          REFERENCES "business_owners"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `;
        
        // Add foreign key from business_owners to users
        await prisma.$executeRaw`
          ALTER TABLE "business_owners" 
          DROP CONSTRAINT IF EXISTS "business_owners_userId_fkey";
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "business_owners" 
          ADD CONSTRAINT "business_owners_userId_fkey" 
          FOREIGN KEY ("userId") 
          REFERENCES "users"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `;
        
        console.log('✅ Foreign key constraints added successfully');
      } catch (error) {
        console.log('⚠️ Foreign key constraints may already exist or tables not ready:', error.message);
      }
    }
    
    console.log('\n🎉 Database schema fix completed!');
    
  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseSchema()
  .then(() => {
    console.log('\n✅ Schema fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema fix failed:', error);
    process.exit(1);
  });