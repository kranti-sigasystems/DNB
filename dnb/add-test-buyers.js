const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addTestBuyers() {
  try {
    const businessOwner = await prisma.businessOwner.findFirst({
      select: { id: true, businessName: true }
    });
    
    if (!businessOwner) {
      return;
    }
    const existingBuyers = await prisma.buyer.count({
      where: { businessOwnerId: businessOwner.id }
    });
    
    if (existingBuyers > 0) {
      return;
    }
    
    const testBuyers = [
      {
        contactName: 'John Smith',
        email: 'john.smith@seafoodco.com',
        contactEmail: 'john.smith@seafoodco.com',
        contactPhone: '+1-555-0101',
        buyersCompanyName: 'Seafood Co Ltd',
        productName: 'Atlantic Salmon',
        locationName: 'Main Warehouse, New York, NY',
        businessOwnerId: businessOwner.id,
        status: 'active',
        is_deleted: false,
      },
      {
        contactName: 'Sarah Johnson',
        email: 'sarah.j@oceanfresh.com',
        contactEmail: 'sarah.j@oceanfresh.com',
        contactPhone: '+1-555-0102',
        buyersCompanyName: 'Ocean Fresh Markets',
        productName: 'Pacific Tuna',
        locationName: 'West Coast Distribution, Los Angeles, CA',
        businessOwnerId: businessOwner.id,
        status: 'active',
        is_deleted: false,
      },
      {
        contactName: 'Mike Chen',
        email: 'mike.chen@asianseafood.com',
        contactEmail: 'mike.chen@asianseafood.com',
        contactPhone: '+1-555-0103',
        buyersCompanyName: 'Asian Seafood Import',
        productName: 'Tiger Shrimp',
        locationName: 'Cold Storage Facility, Seattle, WA',
        businessOwnerId: businessOwner.id,
        status: 'active',
        is_deleted: false,
      },
      {
        contactName: 'Lisa Rodriguez',
        email: 'lisa.r@gourmetfish.com',
        contactEmail: 'lisa.r@gourmetfish.com',
        contactPhone: '+1-555-0104',
        buyersCompanyName: 'Gourmet Fish House',
        productName: 'Blue Crab',
        locationName: 'Processing Plant, Boston, MA',
        businessOwnerId: businessOwner.id,
        status: 'inactive',
        is_deleted: false,
      },
      {
        contactName: 'David Wilson',
        email: 'david.w@premiumlobster.com',
        contactEmail: 'david.w@premiumlobster.com',
        contactPhone: '+1-555-0105',
        buyersCompanyName: 'Premium Lobster Co',
        productName: 'Maine Lobster',
        locationName: 'Regional Office, Miami, FL',
        businessOwnerId: businessOwner.id,
        status: 'active',
        is_deleted: false,
      },
      {
        contactName: 'Emma Thompson',
        email: 'emma.t@fishmarket.com',
        contactEmail: 'emma.t@fishmarket.com',
        contactPhone: '+1-555-0106',
        buyersCompanyName: 'Central Fish Market',
        productName: 'Atlantic Salmon',
        locationName: 'Main Warehouse, New York, NY',
        businessOwnerId: businessOwner.id,
        status: 'active',
        is_deleted: false,
      }
    ];
    
    for (const buyer of testBuyers) {
      const created = await prisma.buyer.create({ data: buyer });
    }
    
    // Show final count
    const finalCount = await prisma.buyer.count({
      where: { businessOwnerId: businessOwner.id }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

addTestBuyers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to add test buyers:', error);
    process.exit(1);
  });