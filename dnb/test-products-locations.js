const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testProductsLocations() {
  try {
    console.log('🔄 Testing products and locations retrieval...');
    
    // Get business owner
    const businessOwner = await prisma.businessOwner.findFirst({
      select: { id: true, businessName: true }
    });
    
    if (!businessOwner) {
      console.log('❌ No business owner found');
      return;
    }
    
    console.log(`✅ Found business owner: ${businessOwner.businessName} (${businessOwner.id})`);
    
    // Test products
    console.log('\n📦 Testing products...');
    const products = await prisma.product.findMany({
      where: { ownerId: businessOwner.id },
      orderBy: { productName: 'asc' }
    });
    
    console.log(`📦 Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.productName} (${product.code}) - SKU: ${product.sku}`);
    });
    
    // Test locations
    console.log('\n📍 Testing locations...');
    const locations = await prisma.location.findMany({
      where: { ownerId: businessOwner.id },
      orderBy: { locationName: 'asc' }
    });
    
    console.log(`📍 Found ${locations.length} locations:`);
    locations.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.locationName} (${location.code}) - ${location.city}, ${location.state}`);
    });
    
    console.log('\n✅ Database retrieval test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testProductsLocations();