const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBuyersData() {
  try {
    console.log('🔍 Checking buyers data...');
    
    // Check if buyers table exists and has data
    try {
      const buyersCount = await prisma.buyer.count();
      console.log(`✅ Buyers table exists with ${buyersCount} records`);
      
      if (buyersCount > 0) {
        const buyers = await prisma.buyer.findMany({
          take: 5,
          include: {
            businessOwner: {
              select: {
                businessName: true,
                email: true
              }
            }
          }
        });
        
        console.log('📋 Sample buyers:');
        buyers.forEach((buyer, index) => {
          console.log(`  ${index + 1}. ${buyer.contactName} (${buyer.email})`);
          console.log(`     Company: ${buyer.buyersCompanyName || 'N/A'}`);
          console.log(`     Business Owner: ${buyer.businessOwner?.businessName || 'N/A'}`);
          console.log(`     Status: ${buyer.status}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No buyers found in database');
      }
    } catch (error) {
      console.log('❌ Error checking buyers table:', error.message);
    }

    // Check business owners
    try {
      const businessOwnersCount = await prisma.businessOwner.count();
      console.log(`✅ Business owners table exists with ${businessOwnersCount} records`);
      
      if (businessOwnersCount > 0) {
        const businessOwners = await prisma.businessOwner.findMany({
          take: 3,
          include: {
            buyers: {
              select: {
                id: true,
                contactName: true,
                email: true
              }
            }
          }
        });
        
        console.log('🏢 Sample business owners with their buyers:');
        businessOwners.forEach((owner, index) => {
          console.log(`  ${index + 1}. ${owner.businessName} (${owner.email})`);
          console.log(`     Buyers count: ${owner.buyers.length}`);
          if (owner.buyers.length > 0) {
            owner.buyers.forEach(buyer => {
              console.log(`       - ${buyer.contactName} (${buyer.email})`);
            });
          }
          console.log('');
        });
      }
    } catch (error) {
      console.log('❌ Error checking business owners table:', error.message);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuyersData();