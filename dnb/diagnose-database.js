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
  log: ['query', 'error'],
});

async function diagnoseDatabaseIssue() {
  try {
    console.log('🔍 Diagnosing database issue...');
    
    // Check what tables exist
    console.log('\n1. Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 Existing tables:');
    if (tables.length === 0) {
      console.log('  ❌ No tables found in database');
    } else {
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`);
      });
    }
    
    // Check buyers table structure if it exists
    const buyersTableExists = tables.some(table => table.table_name === 'buyers');
    if (buyersTableExists) {
      console.log('\n2. Checking buyers table structure...');
      const buyersColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'buyers' 
        ORDER BY ordinal_position;
      `;
      
      console.log('📋 Buyers table columns:');
      buyersColumns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Try to count buyers
      try {
        const buyerCount = await prisma.buyer.count();
        console.log(`✅ Buyers count: ${buyerCount}`);
      } catch (error) {
        console.log('❌ Error counting buyers:', error.message);
      }
    } else {
      console.log('\n❌ Buyers table does not exist');
    }
    
    // Check business_owners table
    const businessOwnersTableExists = tables.some(table => table.table_name === 'business_owners');
    if (businessOwnersTableExists) {
      console.log('\n3. Checking business_owners table...');
      try {
        const businessOwnerCount = await prisma.businessOwner.count();
        console.log(`✅ Business owners count: ${businessOwnerCount}`);
      } catch (error) {
        console.log('❌ Error counting business owners:', error.message);
      }
    } else {
      console.log('\n❌ Business_owners table does not exist');
    }
    
    // Check users table
    const usersTableExists = tables.some(table => table.table_name === 'users');
    if (usersTableExists) {
      console.log('\n4. Checking users table...');
      try {
        const userCount = await prisma.user.count();
        console.log(`✅ Users count: ${userCount}`);
      } catch (error) {
        console.log('❌ Error counting users:', error.message);
      }
    } else {
      console.log('\n❌ Users table does not exist');
    }
    
    // Test a simple query to see what fails
    console.log('\n5. Testing Prisma queries...');
    try {
      console.log('Testing user query...');
      const users = await prisma.user.findMany({ take: 1 });
      console.log(`✅ User query successful, found ${users.length} users`);
    } catch (error) {
      console.log('❌ User query failed:', error.message);
    }
    
    try {
      console.log('Testing business owner query...');
      const businessOwners = await prisma.businessOwner.findMany({ take: 1 });
      console.log(`✅ Business owner query successful, found ${businessOwners.length} business owners`);
    } catch (error) {
      console.log('❌ Business owner query failed:', error.message);
    }
    
    try {
      console.log('Testing buyer query...');
      const buyers = await prisma.buyer.findMany({ take: 1 });
      console.log(`✅ Buyer query successful, found ${buyers.length} buyers`);
    } catch (error) {
      console.log('❌ Buyer query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database diagnosis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDatabaseIssue();