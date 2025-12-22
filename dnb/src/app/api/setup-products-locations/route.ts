import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Setting up products and locations tables via API...');
    
    // Create products table
    console.log('📦 Creating products table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "code" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "species" TEXT[] NOT NULL DEFAULT '{}',
        "size" TEXT[] DEFAULT '{}',
        "sku" TEXT,
        "ownerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "products_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Add unique constraint for products
    try {
      await prisma.$executeRaw`
        ALTER TABLE "products" 
        ADD CONSTRAINT "products_code_ownerId_key" 
        UNIQUE ("code", "ownerId");
      `;
    } catch (error) {
      // Constraint might already exist
    }
    
    // Add foreign key constraint for products
    try {
      await prisma.$executeRaw`
        ALTER TABLE "products" 
        ADD CONSTRAINT "products_ownerId_fkey" 
        FOREIGN KEY ("ownerId") 
        REFERENCES "business_owners"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      // Constraint might already exist
    }
    
    console.log('✅ Products table created successfully!');
    
    // Create locations table
    console.log('📍 Creating locations table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "locations" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "locationName" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "country" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "postalCode" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Add unique constraint for locations
    try {
      await prisma.$executeRaw`
        ALTER TABLE "locations" 
        ADD CONSTRAINT "locations_code_ownerId_key" 
        UNIQUE ("code", "ownerId");
      `;
    } catch (error) {
      // Constraint might already exist
    }
    
    // Add foreign key constraint for locations
    try {
      await prisma.$executeRaw`
        ALTER TABLE "locations" 
        ADD CONSTRAINT "locations_ownerId_fkey" 
        FOREIGN KEY ("ownerId") 
        REFERENCES "business_owners"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (error) {
      // Constraint might already exist
    }
    
    console.log('✅ Locations table created successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Products and locations tables created successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error setting up products and locations tables:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to setup products and locations tables' 
      },
      { status: 500 }
    );
  }
}