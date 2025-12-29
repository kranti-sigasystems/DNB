import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use DIRECT_URL if available, otherwise fall back to DATABASE_URL
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Create PostgreSQL adapter
const adapter = new PrismaPg({
  connectionString: connectionString!,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test connection on startup in development
if (process.env.NODE_ENV === 'development') {
  prisma
    .$connect()
    .then(() => console.log('✅ Prisma connected to database'))
    .catch((error) => console.error('❌ Prisma connection error:', error));
}
