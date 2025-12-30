import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await prisma.$executeRaw`
      ALTER TABLE "offer_draft_products" 
      ADD COLUMN IF NOT EXISTS "sizeDetails" VARCHAR(100)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "offer_draft_products" 
      ADD COLUMN IF NOT EXISTS "breakupDetails" VARCHAR(100)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "offer_draft_products" 
      ADD COLUMN IF NOT EXISTS "priceDetails" VARCHAR(50)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "offer_draft_products" 
      ADD COLUMN IF NOT EXISTS "conditionDetails" VARCHAR(100)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "size_breakups" 
      ADD COLUMN IF NOT EXISTS "sizeDetails" VARCHAR(100)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "size_breakups" 
      ADD COLUMN IF NOT EXISTS "breakupDetails" VARCHAR(100)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "size_breakups" 
      ADD COLUMN IF NOT EXISTS "priceDetails" VARCHAR(50)
    `;
    
    return NextResponse.json({
      success: true,
      message: 'All detail columns added successfully!',
      nextSteps: [
        'Run: npx prisma generate',
        'Restart your development server',
        'Detail fields will now work in offer drafts!'
      ]
    });
    
  } catch (error: any) {
    console.error('❌ Error adding detail columns:', error.message);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json({
        success: true,
        message: 'Columns already exist - that\'s fine!',
        nextSteps: [
          'Run: npx prisma generate',
          'Restart your development server'
        ]
      });
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to add detail columns. You may need to run the SQL commands manually in your database interface.'
    }, { status: 500 });
  }
}