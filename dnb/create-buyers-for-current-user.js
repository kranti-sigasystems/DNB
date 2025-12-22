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

async function createBuyersForCurrentUser() {
  try {
    console.log('🎯 Creating buyers for your current business owner account...');
    
    // Your current business owner ID from the logs
    const currentBusinessOwnerId = '07f6592d-ce5c-4fec-a6da-86f8321950e2';
    
    // Verify the business owner exists
    const businessOwner = await prisma.businessOwner.findUnique({
      where: { id: currentBusinessOwnerId }
    });
    
    if (!businessOwner) {
      console.log('❌ Business owner not found');
      return;
    }
    
    console.log(`✅ Found business owner: ${businessOwner.businessName} (${businessOwner.email})`);
    
    // Check if buyers already exist
    const existingBuyers = await prisma.buyer.count({
      where: { businessOwnerId: currentBusinessOwnerId }
    });
    
    if (existingBuyers > 0) {
      console.log(`✅ ${existingBuyers} buyers already exist for this business owner`);
      return;
    }
    
    // Create buyers for your current account
    const buyersData = [
      {
        contactName: 'Sarah Johnson',
        email: 'sarah@techcorp.com',
        contactEmail: 'sarah.johnson@techcorp.com',
        contactPhone: '+1234567801',
        buyersCompanyName: 'TechCorp Solutions',
        businessName: 'TechCorp Solutions',
        productName: 'Enterprise Software',
        locationName: 'Seattle',
        country: 'United States',
        city: 'Seattle',
        state: 'WA',
        address: '100 Tech Ave',
        postalCode: '98101',
        status: 'active'
      },
      {
        contactName: 'Michael Brown',
        email: 'michael@innovate.com',
        contactEmail: 'michael.brown@innovate.com',
        contactPhone: '+1234567802',
        buyersCompanyName: 'Innovate Industries',
        businessName: 'Innovate Industries',
        productName: 'Digital Platform',
        locationName: 'San Francisco',
        country: 'United States',
        city: 'San Francisco',
        state: 'CA',
        address: '200 Innovation St',
        postalCode: '94102',
        status: 'active'
      },
      {
        contactName: 'Emily Davis',
        email: 'emily@globaltech.com',
        contactEmail: 'emily.davis@globaltech.com',
        contactPhone: '+1234567803',
        buyersCompanyName: 'GlobalTech Ltd',
        businessName: 'GlobalTech Ltd',
        productName: 'Cloud Services',
        locationName: 'New York',
        country: 'United States',
        city: 'New York',
        state: 'NY',
        address: '300 Global Plaza',
        postalCode: '10001',
        status: 'active'
      },
      {
        contactName: 'James Wilson',
        email: 'james@futuresoft.com',
        contactEmail: 'james.wilson@futuresoft.com',
        contactPhone: '+1234567804',
        buyersCompanyName: 'FutureSoft Inc',
        businessName: 'FutureSoft Inc',
        productName: 'AI Solutions',
        locationName: 'Austin',
        country: 'United States',
        city: 'Austin',
        state: 'TX',
        address: '400 Future Blvd',
        postalCode: '73301',
        status: 'inactive'
      },
      {
        contactName: 'Lisa Anderson',
        email: 'lisa@smartsystems.com',
        contactEmail: 'lisa.anderson@smartsystems.com',
        contactPhone: '+1234567805',
        buyersCompanyName: 'Smart Systems Co',
        businessName: 'Smart Systems Co',
        productName: 'IoT Platform',
        locationName: 'Denver',
        country: 'United States',
        city: 'Denver',
        state: 'CO',
        address: '500 Smart Way',
        postalCode: '80201',
        status: 'active'
      }
    ];
    
    console.log(`🏗️ Creating ${buyersData.length} buyers...`);
    
    let createdCount = 0;
    for (const buyerData of buyersData) {
      try {
        await prisma.buyer.create({
          data: {
            ...buyerData,
            businessOwnerId: currentBusinessOwnerId
          }
        });
        console.log(`✅ Created: ${buyerData.contactName} (${buyerData.email})`);
        createdCount++;
      } catch (error) {
        console.log(`❌ Failed to create ${buyerData.contactName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} buyers for your account!`);
    console.log('\n📊 Summary:');
    console.log(`  Business Owner: ${businessOwner.businessName}`);
    console.log(`  Email: ${businessOwner.email}`);
    console.log(`  Buyers Created: ${createdCount}`);
    console.log('\n🔄 Now refresh your dashboard to see the buyers!');
    
  } catch (error) {
    console.error('❌ Failed to create buyers:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createBuyersForCurrentUser();