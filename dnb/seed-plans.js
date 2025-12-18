// // Seed plans data
// const { PrismaClient } = require('./src/generated/prisma');
// const { PrismaPg } = require('@prisma/adapter-pg');

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL,
// });

// const prisma = new PrismaClient({ adapter });

// async function main() {
//   console.log('🌱 Seeding plans...');

//   // Delete existing plans
//   await prisma.plan.deleteMany();

//   // Create plans
//   const plans = [
//     {
//       key: 'basic',
//       name: 'Basic',
//       description: 'Best for individuals or small businesses',
//       currency: 'INR',
//       priceMonthly: 1999, // ₹19.99 in paise
//       priceYearly: 19999, // ₹199.99 in paise
//       maxUsers: 1,
//       maxProducts: 50,
//       maxOffers: 100,
//       maxBuyers: 50,
//       features: JSON.stringify([
//         'Up to 50 products',
//         'Up to 100 offers',
//         'Basic analytics',
//         'Email support'
//       ]),
//       isActive: true,
//       sortOrder: 1
//     },
//     {
//       key: 'advanced',
//       name: 'Advanced',
//       description: 'Perfect for growing businesses',
//       currency: 'INR',
//       priceMonthly: 4999, // ₹49.99 in paise
//       priceYearly: 49999, // ₹499.99 in paise
//       maxUsers: 5,
//       maxProducts: 200,
//       maxOffers: 500,
//       maxBuyers: 200,
//       features: JSON.stringify([
//         'Up to 200 products',
//         'Up to 500 offers',
//         'Advanced analytics',
//         'Priority support',
//         'Team collaboration'
//       ]),
//       isActive: true,
//       sortOrder: 2
//     },
//     {
//       key: 'pro',
//       name: 'Pro',
//       description: 'For large enterprises and agencies',
//       currency: 'INR',
//       priceMonthly: 9999, // ₹99.99 in paise
//       priceYearly: 99999, // ₹999.99 in paise
//       maxUsers: 20,
//       maxProducts: 1000,
//       maxOffers: 2000,
//       maxBuyers: 1000,
//       features: JSON.stringify([
//         'Unlimited products',
//         'Unlimited offers',
//         'Premium analytics',
//         '24/7 phone support',
//         'Advanced team features',
//         'Custom integrations'
//       ]),
//       isActive: true,
//       sortOrder: 3
//     }
//   ];

//   for (const plan of plans) {
//     const created = await prisma.plan.create({
//       data: plan
//     });
//     console.log(`✅ Created plan: ${created.name}`);
//   }

//   console.log('🎉 Plans seeded successfully!');
// }

// main()
//   .catch((e) => {
//     console.error('❌ Seeding failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if plans already exist
  const existingPlans = await prisma.plan.findMany();
  if (existingPlans.length === 0) {
    console.log('Creating default plans...');

    await prisma.plan.createMany({
      data: [
        {
          key: 'free',
          name: 'Free Plan',
          description: 'Perfect for getting started',
          currency: 'INR',
          priceMonthly: 0,
          priceYearly: 0,
          maxUsers: 1,
          maxProducts: 50,
          maxOffers: 100,
          maxBuyers: 50,
          features: JSON.stringify([
            'Basic dashboard',
            'Up to 50 products',
            'Up to 100 offers',
            'Email support',
          ]),
          trialDays: 14,
          isDefault: true,
          isActive: true,
          sortOrder: 1,
        },
        {
          key: 'starter',
          name: 'Starter Plan',
          description: 'For growing businesses',
          currency: 'INR',
          priceMonthly: 19900, // 199 INR in cents
          priceYearly: 199000, // 1990 INR in cents
          maxUsers: 3,
          maxProducts: 200,
          maxOffers: 500,
          maxBuyers: 200,
          features: JSON.stringify([
            'All Free features',
            'Up to 3 users',
            'Up to 200 products',
            'Up to 500 offers',
            'Priority support',
            'Advanced analytics',
          ]),
          trialDays: 7,
          isActive: true,
          sortOrder: 2,
        },
        {
          key: 'business',
          name: 'Business Plan',
          description: 'For established businesses',
          currency: 'INR',
          priceMonthly: 49900, // 499 INR in cents
          priceYearly: 499000, // 4990 INR in cents
          maxUsers: 10,
          maxProducts: 1000,
          maxOffers: 5000,
          maxBuyers: 1000,
          features: JSON.stringify([
            'All Starter features',
            'Up to 10 users',
            'Unlimited products',
            'Unlimited offers',
            '24/7 phone support',
            'Custom integrations',
            'API access',
          ]),
          isActive: true,
          sortOrder: 3,
        },
      ],
    });

    console.log('✅ Plans created successfully');
  } else {
    console.log(`✅ ${existingPlans.length} plans already exist`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
