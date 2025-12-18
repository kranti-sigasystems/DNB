require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Try to get a user to see what fields exist
    const user = await prisma.$queryRaw`SELECT * FROM users LIMIT 1`;
    console.log('\n📋 User table columns:');
    if (user && user.length > 0) {
      console.log(Object.keys(user[0]));
    }
    
    // Check business_owners table
    const businessOwner = await prisma.$queryRaw`SELECT * FROM business_owners LIMIT 1`;
    console.log('\n📋 Business Owners table columns:');
    if (businessOwner && businessOwner.length > 0) {
      console.log(Object.keys(businessOwner[0]));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();