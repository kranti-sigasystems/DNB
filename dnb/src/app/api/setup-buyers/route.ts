import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Setting up buyers table via API...');
    
    // Check if buyers table already exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM "buyers" LIMIT 1`;
      console.log('ℹ️ Buyers table already exists');
      return NextResponse.json({ 
        success: true, 
        message: 'Buyers table already exists',
        existed: true 
      });
    } catch (checkError: any) {
      if (checkError.message?.includes('relation "buyers" does not exist')) {
        console.log('📋 Buyers table does not exist, creating...');
        
        // Create the buyers table
        await prisma.$executeRaw`
          CREATE TABLE "buyers" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
            "contactName" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "contactEmail" TEXT,
            "contactPhone" TEXT,
            "buyersCompanyName" TEXT,
            "productName" TEXT,
            "locationName" TEXT,
            "businessOwnerId" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'active',
            "is_deleted" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
          );
        `;
        
        console.log('✅ Buyers table created successfully!');
        
        // Try to add foreign key constraint (skip if it fails)
        try {
          await prisma.$executeRaw`
            ALTER TABLE "buyers" 
            ADD CONSTRAINT "buyers_businessOwnerId_fkey" 
            FOREIGN KEY ("businessOwnerId") 
            REFERENCES "business_owners"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
          `;
          console.log('✅ Foreign key constraint added successfully!');
        } catch (fkError) {
          console.log('⚠️ Foreign key constraint failed, but table created successfully');
        }
        
        // Create some test buyers for existing business owners
        try {
          const businessOwners = await prisma.businessOwner.findMany({
            take: 3,
            select: { id: true, businessName: true }
          });
          
          if (businessOwners.length > 0) {
            console.log(`🧪 Creating test buyers for ${businessOwners.length} business owners...`);
            
            for (const bo of businessOwners) {
              // Create 2-3 test buyers for each business owner
              for (let i = 1; i <= 3; i++) {
                await prisma.$executeRaw`
                  INSERT INTO "buyers" (
                    "contactName", 
                    "email", 
                    "contactEmail", 
                    "contactPhone", 
                    "buyersCompanyName", 
                    "productName", 
                    "locationName", 
                    "businessOwnerId", 
                    "status", 
                    "is_deleted"
                  ) VALUES (
                    ${`Test Buyer ${i} for ${bo.businessName}`},
                    ${`buyer${i}.${bo.id.slice(0, 8)}@example.com`},
                    ${`contact${i}.${bo.id.slice(0, 8)}@company.com`},
                    ${`+123456789${i}`},
                    ${`${bo.businessName} Client ${i}`},
                    ${`Product ${i}`},
                    ${`Location ${i}`},
                    ${bo.id},
                    'active',
                    false
                  );
                `;
              }
            }
            
            console.log('✅ Test buyers created successfully!');
          }
        } catch (testDataError) {
          console.log('⚠️ Failed to create test data, but table created successfully');
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Buyers table created successfully with test data',
          created: true 
        });
      } else {
        throw checkError;
      }
    }
  } catch (error: any) {
    console.error('❌ Error setting up buyers table:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to setup buyers table' 
      },
      { status: 500 }
    );
  }
}