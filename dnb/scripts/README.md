# Database Setup Scripts

This directory contains TypeScript scripts for setting up and seeding the database.

## Available Scripts

### 1. Seed Plans (`seed-plans.ts`)
Creates default subscription plans in the database.

```bash
npm run db:seed-plans
```

### 2. Setup Products & Locations (`setup-products-locations.ts`)
Creates the products and locations tables and adds sample data.

```bash
npm run db:setup-products-locations
```

### 3. Setup Buyers Table (`setup-buyers-table.ts`)
Creates the buyers table and adds sample buyer data.

```bash
npm run db:setup-buyers
```

### 4. Setup All
Runs all setup scripts in the correct order.

```bash
npm run db:setup-all
```

## Prerequisites

- Ensure your `.env` file has a valid `DATABASE_URL`
- Run `npm run prisma:generate` first to generate the Prisma client
- Make sure your database is running and accessible

## Order of Execution

1. First run the main database migrations: `npm run prisma:migrate`
2. Then run the setup scripts in this order:
   - `npm run db:seed-plans`
   - `npm run db:setup-products-locations`
   - `npm run db:setup-buyers`

Or simply run: `npm run db:setup-all`

## Notes

- These scripts are idempotent - they can be run multiple times safely
- They will skip creating data that already exists
- All scripts include proper error handling and logging