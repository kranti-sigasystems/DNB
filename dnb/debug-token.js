const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
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

async function debugToken() {
  try {
    console.log('🔍 Debugging JWT token and business owner relationship...');
    
    // Check if we have the test user
    const testUser = await prisma.user.findUnique({
      where: { email: 'business@test.com' }
    });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Test user found:', {
      id: testUser.id,
      email: testUser.email,
      roleId: testUser.roleId,
      businessName: testUser.businessName
    });
    
    // Check if business owner profile exists
    const businessOwner = await prisma.businessOwner.findFirst({
      where: { userId: testUser.id }
    });
    
    if (!businessOwner) {
      console.log('❌ Business owner profile not found for user');
      return;
    }
    
    console.log('✅ Business owner found:', {
      id: businessOwner.id,
      userId: businessOwner.userId,
      businessName: businessOwner.businessName,
      email: businessOwner.email
    });
    
    // Check buyers for this business owner
    const buyers = await prisma.buyer.findMany({
      where: { businessOwnerId: businessOwner.id }
    });
    
    console.log(`✅ Found ${buyers.length} buyers for this business owner`);
    buyers.forEach((buyer, index) => {
      console.log(`  ${index + 1}. ${buyer.contactName} (${buyer.email}) - ${buyer.status}`);
    });
    
    // Create a test JWT token like the login would
    const tokenPayload = {
      id: testUser.id,
      email: testUser.email,
      userRole: 'business_owner',
      businessOwnerId: businessOwner.id,
      businessName: businessOwner.businessName,
      name: `${testUser.first_name || ''} ${testUser.last_name || ''}`.trim(),
    };
    
    console.log('\n🔑 Token payload that should be created:', tokenPayload);
    
    const testToken = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret', {
      expiresIn: '15m',
    });
    
    console.log('🔑 Test token created');
    
    // Test decoding the token
    const decoded = jwt.verify(testToken, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret');
    console.log('🔓 Decoded token:', decoded);
    
    // Test the business owner lookup function
    async function getBusinessOwnerFromToken(authToken) {
      try {
        const decoded = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET || 'fallback_secret');
        
        console.log('🔍 Decoded token in function:', decoded);
        
        // If the token has businessOwnerId, use it directly
        if (decoded.businessOwnerId) {
          console.log('✅ Found businessOwnerId in token:', decoded.businessOwnerId);
          return decoded.businessOwnerId;
        }
        
        // Otherwise, find business owner by user ID
        if (decoded.id) {
          console.log('🔍 Looking up business owner by user ID:', decoded.id);
          const businessOwner = await prisma.businessOwner.findFirst({
            where: { userId: decoded.id },
            select: { id: true }
          });
          console.log('🔍 Found business owner:', businessOwner);
          return businessOwner?.id;
        }
        
        return null;
      } catch (error) {
        console.error('❌ Error decoding token:', error);
        return null;
      }
    }
    
    const businessOwnerIdFromToken = await getBusinessOwnerFromToken(testToken);
    console.log('🎯 Business owner ID from token function:', businessOwnerIdFromToken);
    
    if (businessOwnerIdFromToken) {
      // Test the actual buyer query
      const testBuyers = await prisma.buyer.findMany({
        where: {
          businessOwnerId: businessOwnerIdFromToken,
          is_deleted: false,
        },
        include: {
          businessOwner: {
            select: {
              businessName: true,
              email: true
            }
          }
        }
      });
      
      console.log(`🎯 Test buyer query returned ${testBuyers.length} buyers`);
      testBuyers.forEach((buyer, index) => {
        console.log(`  ${index + 1}. ${buyer.contactName} - ${buyer.buyersCompanyName} (${buyer.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

debugToken();