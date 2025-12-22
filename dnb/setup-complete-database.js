const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

async function setupCompleteDatabase() {
  try {
    console.log('🚀 Setting up complete database...');
    
    // Step 1: Create a test business owner user if not exists
    console.log('👤 Creating test business owner user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: 'business@test.com' }
      });
    } catch (error) {
      console.log('⚠️ Users table may not exist, will create user after schema setup');
    }
    
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email: 'business@test.com',
            password: hashedPassword,
            first_name: 'John',
            last_name: 'Business',
            roleId: 2, // business_owner role
            businessName: 'Test Business Corp'
          }
        });
        console.log('✅ Created test user:', user.email);
      } catch (error) {
        console.log('❌ Failed to create user:', error.message);
        return;
      }
    } else {
      console.log('✅ Test user already exists:', user.email);
    }
    
    // Step 2: Create business owner profile if not exists
    console.log('🏢 Creating business owner profile...');
    
    let businessOwner;
    try {
      businessOwner = await prisma.businessOwner.findUnique({
        where: { userId: user.id }
      });
    } catch (error) {
      console.log('⚠️ Business owners table may not exist');
    }
    
    if (!businessOwner) {
      try {
        businessOwner = await prisma.businessOwner.create({
          data: {
            userId: user.id,
            businessName: 'Test Business Corp',
            first_name: 'John',
            last_name: 'Business',
            email: 'business@test.com',
            phoneNumber: '+1234567890',
            registrationNumber: 'REG123456',
            country: 'United States',
            state: 'California',
            city: 'San Francisco',
            address: '123 Business St',
            postalCode: '94105',
            status: 'active',
            is_verified: true,
            is_approved: true
          }
        });
        console.log('✅ Created business owner profile:', businessOwner.businessName);
      } catch (error) {
        console.log('❌ Failed to create business owner:', error.message);
        return;
      }
    } else {
      console.log('✅ Business owner profile already exists:', businessOwner.businessName);
    }
    
    // Step 3: Create test buyers for the business owner
    console.log('👥 Creating test buyers...');
    
    let existingBuyers = 0;
    try {
      existingBuyers = await prisma.buyer.count({
        where: { businessOwnerId: businessOwner.id }
      });
    } catch (error) {
      console.log('⚠️ Buyers table may not exist');
    }
    
    if (existingBuyers === 0) {
      const buyersData = [
        {
          contactName: 'Alice Johnson',
          email: 'alice@company1.com',
          contactEmail: 'alice.johnson@company1.com',
          contactPhone: '+1234567891',
          buyersCompanyName: 'Tech Solutions Inc',
          businessName: 'Tech Solutions Inc',
          productName: 'Software License',
          locationName: 'New York',
          country: 'United States',
          city: 'New York',
          state: 'NY',
          address: '456 Tech Ave',
          postalCode: '10001',
          status: 'active'
        },
        {
          contactName: 'Bob Smith',
          email: 'bob@company2.com',
          contactEmail: 'bob.smith@company2.com',
          contactPhone: '+1234567892',
          buyersCompanyName: 'Manufacturing Corp',
          businessName: 'Manufacturing Corp',
          productName: 'Industrial Equipment',
          locationName: 'Chicago',
          country: 'United States',
          city: 'Chicago',
          state: 'IL',
          address: '789 Industrial Blvd',
          postalCode: '60601',
          status: 'active'
        },
        {
          contactName: 'Carol Davis',
          email: 'carol@company3.com',
          contactEmail: 'carol.davis@company3.com',
          contactPhone: '+1234567893',
          buyersCompanyName: 'Retail Enterprises',
          businessName: 'Retail Enterprises',
          productName: 'Retail Software',
          locationName: 'Los Angeles',
          country: 'United States',
          city: 'Los Angeles',
          state: 'CA',
          address: '321 Retail St',
          postalCode: '90210',
          status: 'active'
        },
        {
          contactName: 'David Wilson',
          email: 'david@company4.com',
          contactEmail: 'david.wilson@company4.com',
          contactPhone: '+1234567894',
          buyersCompanyName: 'Healthcare Systems',
          businessName: 'Healthcare Systems',
          productName: 'Medical Software',
          locationName: 'Miami',
          country: 'United States',
          city: 'Miami',
          state: 'FL',
          address: '654 Health Ave',
          postalCode: '33101',
          status: 'inactive'
        },
        {
          contactName: 'Eva Martinez',
          email: 'eva@company5.com',
          contactEmail: 'eva.martinez@company5.com',
          contactPhone: '+1234567895',
          buyersCompanyName: 'Education Partners',
          businessName: 'Education Partners',
          productName: 'Learning Platform',
          locationName: 'Austin',
          country: 'United States',
          city: 'Austin',
          state: 'TX',
          address: '987 Education Dr',
          postalCode: '73301',
          status: 'active'
        }
      ];
      
      let createdCount = 0;
      for (const buyerData of buyersData) {
        try {
          await prisma.buyer.create({
            data: {
              ...buyerData,
              businessOwnerId: businessOwner.id
            }
          });
          createdCount++;
        } catch (error) {
          console.log(`⚠️ Failed to create buyer ${buyerData.contactName}:`, error.message);
        }
      }
      
      console.log(`✅ Created ${createdCount} test buyers`);
    } else {
      console.log(`✅ ${existingBuyers} buyers already exist for this business owner`);
    }
    
    // Step 4: Verify the setup
    console.log('\n📊 Database setup summary:');
    
    try {
      const userCount = await prisma.user.count();
      const businessOwnerCount = await prisma.businessOwner.count();
      const buyerCount = await prisma.buyer.count();
      
      console.log(`  Users: ${userCount}`);
      console.log(`  Business Owners: ${businessOwnerCount}`);
      console.log(`  Buyers: ${buyerCount}`);
      
      // Show sample data
      const sampleBuyers = await prisma.buyer.findMany({
        take: 3,
        include: {
          businessOwner: {
            select: {
              businessName: true,
              email: true
            }
          }
        }
      });
      
      console.log('\n📋 Sample buyers:');
      sampleBuyers.forEach((buyer, index) => {
        console.log(`  ${index + 1}. ${buyer.contactName} (${buyer.email})`);
        console.log(`     Company: ${buyer.buyersCompanyName}`);
        console.log(`     Business Owner: ${buyer.businessOwner.businessName}`);
        console.log(`     Status: ${buyer.status}`);
        console.log('');
      });
    } catch (error) {
      console.log('⚠️ Could not verify setup:', error.message);
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Test login credentials:');
    console.log('  Email: business@test.com');
    console.log('  Password: password123');
    console.log('  Role: Business Owner');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupCompleteDatabase()
  .then(() => {
    console.log('\n✅ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });