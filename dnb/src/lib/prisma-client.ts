import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({
    adapter,
    log: ['error'],
  });
} else {
  if (!global.__prisma) {
    // Create PostgreSQL connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Create Prisma adapter
    const adapter = new PrismaPg(pool);

    global.__prisma = new PrismaClient({
      adapter,
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export default prisma;