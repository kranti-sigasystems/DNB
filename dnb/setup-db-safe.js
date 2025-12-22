require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database safely...');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if our tables exist by trying to count users
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Found ${userCount} users in database`);

      const planCount = await prisma.plan.count();
      console.log(`✅ Found ${planCount} plans in database`);

      // If we have no plans, create some basic ones
      if (planCount === 0) {
        console.log('📦 Creating basic plans...');

        await prisma.plan.createMany({
          data: [
            {
              key: 'basic',
              name: 'Basic',
              description: 'Best for individuals or small businesses',
              currency: 'INR',
              priceMonthly: 1999, // ₹19.99 in paise
              priceYearly: 19999, // ₹199.99 in paise
              maxUsers: 1,
              maxProducts: 50,
              maxOffers: 100,
              maxBuyers: 50,
              features: JSON.stringify([
                'Up to 50 products',
                'Up to 100 offers',
                'Basic analytics',
                'Email support',
              ]),
              isActive: true,
              sortOrder: 1,
            },
            {
              key: 'advanced',
              name: 'Advanchhfhed',
              description: 'Perfect for growing businesses',
              currency: 'INR',
              priceMonthly: 4999, // ₹49.99 in paise
              priceYearly: 49999, // ₹499.99 in paise
              maxUsers: 5,
              maxProducts: 200,
              maxOffers: 500,
              maxBuyers: 200,
              features: JSON.stringify([
                'Up to 200 products',
                'Up to 500 offers',
                'Advanced analytics',
                'Priority support',
                'Team collaboration',
              ]),
              isActive: true,
              sortOrder: 2,
            },
            {
              key: 'pro',
              name: 'Pro',
              description: 'For large enterprises and agencies',
              currency: 'INR',
              priceMonthly: 9999, // ₹99.99 in paise
              priceYearly: 99999, // ₹999.99 in paise
              maxUsers: 20,
              maxProducts: 1000,
              maxOffers: 2000,
              maxBuyers: 1000,
              features: JSON.stringify([
                'Unlimited products',
                'Unlimited offers',
                'Premium analytics',
                '24/7 phone support',
                'Advanced team features',
                'Custom integrations',
              ]),
              isActive: true,
              sortOrder: 3,
            },
          ],
        });

        console.log('✅ Created 3 basic plans');
      }

      console.log('🎉 Database setup complete!');
      console.log('🎯 You can now test the checkout flow');
    } catch (error) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        console.log('❌ Tables do not exist. Please run database migration:');
        console.log('   npx prisma db push --accept-data-loss');
        process.exit(1);
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n🔧 Try these steps:');
    console.log('1. Check your DATABASE_URL in .env');
    console.log('2. Run: npx prisma db push --accept-data-loss');
    console.log('3. Run this script again');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
