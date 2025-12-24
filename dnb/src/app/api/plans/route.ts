import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool for database queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    // Query plans from the database
    const result = await pool.query(`
      SELECT 
        id,
        key,
        name,
        description,
        "priceMonthly",
        "priceYearly",
        currency,
        "billingCycle",
        "maxLocations",
        "maxProducts",
        "maxOffers",
        "maxBuyers",
        features,
        "trialDays",
        "isDefault",
        "isActive",
        "sortOrder",
        "createdAt",
        "updatedAt",
        "stripeProductId",
        "stripePriceMonthlyId",
        "stripePriceYearlyId"
      FROM plans 
      WHERE "isActive" = true
      ORDER BY "sortOrder" ASC
    `);

    // Transform the data to match expected format
    const plans = result.rows.map(plan => ({
      ...plan,
      priceMonthly: plan.priceMonthly ? parseFloat(plan.priceMonthly) : null,
      priceYearly: plan.priceYearly ? parseFloat(plan.priceYearly) : null,
    }));

    return NextResponse.json(plans);
  } catch (error) {
    console.error('GET /api/plans error:', error);

    return NextResponse.json(
      { 
        message: 'Failed to fetch plans',
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      }, 
      { status: 500 }
    );
  }
}
