#!/usr/bin/env node

/**
 * Manual Detail Columns Script
 * 
 * This script adds the missing detail columns to the offer_draft_products table
 * using direct SQL execution.
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

interface Column {
  name: string;
  type: string;
}

async function addDetailColumnsManual(): Promise<void> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Connecting to database...\n');
    await client.connect();
    
    console.log('📋 Adding detail columns to offer_draft_products table...');
    
    // Add columns one by one with IF NOT EXISTS
    const columns: Column[] = [
      { name: 'sizeDetails', type: 'VARCHAR(100)' },
      { name: 'breakupDetails', type: 'VARCHAR(100)' },
      { name: 'priceDetails', type: 'VARCHAR(50)' },
      { name: 'conditionDetails', type: 'VARCHAR(100)' }
    ];
    
    for (const column of columns) {
      try {
        const query = `ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}`;
        await client.query(query);
        console.log(`✅ Added ${column.name} column`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('already exists')) {
          console.log(`✅ ${column.name} column already exists`);
        } else {
          console.error(`❌ Error adding ${column.name}:`, errorMessage);
        }
      }
    }
    
    console.log('\n✅ All detail columns processed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Run: npx prisma generate');
    console.log('  2. Restart your development server');
    console.log('  3. Detail fields will now work in offer drafts!');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error connecting to database:', errorMessage);
    console.log('\n🔧 Manual fix needed:');
    console.log('  Go to your Supabase SQL Editor and run these commands:');
    console.log('  ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "sizeDetails" VARCHAR(100);');
    console.log('  ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "breakupDetails" VARCHAR(100);');
    console.log('  ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "priceDetails" VARCHAR(50);');
    console.log('  ALTER TABLE "offer_draft_products" ADD COLUMN IF NOT EXISTS "conditionDetails" VARCHAR(100);');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
addDetailColumnsManual()
  .then(() => {
    console.log('\n🎉 Database update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });