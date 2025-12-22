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

async function checkBusinessOwnerMismatch() {
  try {
    console.log('🔍 Checking business owner ID mismatch...');
    
    // Check what business owner ID the buyers are associated with
    const buyers = await prisma.buyer.findMany({
      select: {
        id: true,
        contactName: true,
        email: true,
        businessOwnerId: true,
        businessOwner: {
          select: {
            id: true,
            businessName: true,
            email: true,
            userId: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${buyers.length} buyers in database:`);
    buyers.forEach((buyer, index) => {
      console.log(`  ${index + 1}. ${buyer.contactName} (${buyer.email})`);
      console.log(`     Business Owner ID: ${buyer.businessOwnerId}`);
      console.log(`     Business Owner: ${buyer.businessOwner.businessName} (${buyer.businessOwner.email})`);
      console.log(`     User ID: ${buyer.businessOwner.userId}`);
      console.log('');
    });
    
    // Check all business owners
    const businessOwners = await prisma.businessOwner.findMany({
      select: {
        id: true,
        businessName: true,
        email: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            roleId: true
          }
        }
      }
    });
    
    console.log(`🏢 Found ${businessOwners.length} business owners:`);
    businessOwners.forEach((bo, index) => {
      console.log(`  ${index + 1}. ${bo.businessName} (${bo.email})`);
      console.log(`     Business Owner ID: ${bo.id}`);
      console.log(`     User ID: ${bo.userId}`);
      console.log(`     User Email: ${bo.user.email}`);
      console.log(`     User Role: ${bo.user.roleId}`);
      console.log('');
    });
    
    // Find the business owner with ID from the logs
    const currentBusinessOwnerId = '07f6592d-ce5c-4fec-a6da-86f8321950e2';
    const currentBusinessOwner = await prisma.businessOwner.findUnique({
      where: { id: currentBusinessOwnerId },
      include: {
        user: true,
        buyers: true
      }
    });
    
    if (currentBusinessOwner) {
      console.log(`🎯 Current logged-in business owner (${currentBusinessOwnerId}):`);
      console.log(`   Name: ${currentBusinessOwner.businessName}`);
      console.log(`   Email: ${currentBusinessOwner.email}`);
      console.log(`   User Email: ${currentBusinessOwner.user.email}`);
      console.log(`   Buyers Count: ${currentBusinessOwner.buyers.length}`);
      
      if (currentBusinessOwner.buyers.length === 0) {
        console.log('❌ This business owner has NO buyers!');
        console.log('💡 Solution: Create buyers for this business owner OR login with the correct account');
      }
    } else {
      console.log(`❌ Business owner with ID ${currentBusinessOwnerId} not found!`);
    }
    
    // Find the test business owner we created
    const testBusinessOwner = await prisma.businessOwner.findFirst({
      where: { 
        user: { email: 'business@test.com' }
      },
      include: {
        user: true,
        buyers: true
      }
    });
    
    if (testBusinessOwner) {
      console.log(`🧪 Test business owner (business@test.com):`);
      console.log(`   Business Owner ID: ${testBusinessOwner.id}`);
      console.log(`   Name: ${testBusinessOwner.businessName}`);
      console.log(`   Buyers Count: ${testBusinessOwner.buyers.length}`);
      
      if (testBusinessOwner.buyers.length > 0) {
        console.log('✅ This business owner HAS buyers!');
        console.log('💡 Solution: Login with business@test.com / password123');
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkBusinessOwnerMismatch();