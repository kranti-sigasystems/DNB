const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addSampleData() {
  try {
    const businessOwner = await prisma.businessOwner.findFirst({
      select: { id: true, businessName: true }
    });
    
    if (!businessOwner) {
      return;
    }
    
    // Check if products already exist
    const existingProducts = await prisma.product.count({
      where: { ownerId: businessOwner.id }
    });
    
    if (existingProducts > 0) {
    } else {
      
      const products = [
        {
          code: 'FISH001',
          productName: 'Atlantic Salmon',
          species: ['Salmon', 'Atlantic'],
          size: ['Small', 'Medium', 'Large'],
          sku: 'AS-001',
          ownerId: businessOwner.id,
        },
        {
          code: 'FISH002',
          productName: 'Pacific Tuna',
          species: ['Tuna', 'Pacific'],
          size: ['Medium', 'Large', 'Extra Large'],
          sku: 'PT-002',
          ownerId: businessOwner.id,
        },
        {
          code: 'SHRIMP001',
          productName: 'Tiger Shrimp',
          species: ['Shrimp', 'Tiger'],
          size: ['Small', 'Medium'],
          sku: 'TS-001',
          ownerId: businessOwner.id,
        },
        {
          code: 'CRAB001',
          productName: 'Blue Crab',
          species: ['Crab', 'Blue'],
          size: ['Medium', 'Large'],
          sku: 'BC-001',
          ownerId: businessOwner.id,
        },
        {
          code: 'LOBSTER001',
          productName: 'Maine Lobster',
          species: ['Lobster', 'Maine'],
          size: ['Large', 'Extra Large'],
          sku: 'ML-001',
          ownerId: businessOwner.id,
        }
      ];
      
      for (const product of products) {
        const created = await prisma.product.create({ data: product });
      }
    }
    
    // Check if locations already exist
    const existingLocations = await prisma.location.count({
      where: { ownerId: businessOwner.id }
    });
      
      const locations = [
        {
          locationName: 'Main Warehouse',
          code: 'MW001',
          city: 'New York',
          state: 'New York',
          country: 'USA',
          address: '123 Harbor Street, Dock 5',
          postalCode: '10001',
          ownerId: businessOwner.id,
        },
        {
          locationName: 'West Coast Distribution',
          code: 'WC002',
          city: 'Los Angeles',
          state: 'California',
          country: 'USA',
          address: '456 Pacific Avenue, Suite 200',
          postalCode: '90001',
          ownerId: businessOwner.id,
        },
        {
          locationName: 'Cold Storage Facility',
          code: 'CS003',
          city: 'Seattle',
          state: 'Washington',
          country: 'USA',
          address: '789 Fishermans Wharf',
          postalCode: '98101',
          ownerId: businessOwner.id,
        },
        {
          locationName: 'Processing Plant',
          code: 'PP004',
          city: 'Boston',
          state: 'Massachusetts',
          country: 'USA',
          address: '321 Industrial Boulevard',
          postalCode: '02101',
          ownerId: businessOwner.id,
        },
        {
          locationName: 'Regional Office',
          code: 'RO005',
          city: 'Miami',
          state: 'Florida',
          country: 'USA',
          address: '654 Ocean Drive, Floor 10',
          postalCode: '33101',
          ownerId: businessOwner.id,
        }
      ];
      
      for (const location of locations) {
        const created = await prisma.location.create({ data: location });
    }
    
    // Show final counts
    const finalProductsCount = await prisma.product.count({
      where: { ownerId: businessOwner.id }
    });
    const finalLocationsCount = await prisma.location.count({
      where: { ownerId: businessOwner.id }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

addSampleData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to add sample data:', error);
    process.exit(1);
  });