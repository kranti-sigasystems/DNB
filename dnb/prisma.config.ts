// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Path to your main schema file
  schema: 'prisma/schema.prisma',
  // Where migrations are stored
  migrations: {
    path: 'prisma/migrations',
    // Optional: Seed script location
    seed: 'tsx prisma/seed.ts',
  },
  // Database connection configuration
  datasource: {
    url: env('DATABASE_URL'),
  },
})