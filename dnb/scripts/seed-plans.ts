import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const existingPlans = await prisma.plan.findMany();
  if (existingPlans.length > 0) {
    return;
  }

  // Create plans
  const plans = [
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
  ];

  for (const plan of plans) {
    const created = await prisma.plan.create({
      data: plan
    });
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