// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Path to your main schema file
  schema: 'prisma/schema.prisma',
  // Database connection configuration
  datasource: {
    url: env('DATABASE_URL'),
  },
})