// src/lib/utils/merge-prisma.js
const fs = require('fs/promises');
const path = require('path');

async function mergePrismaSchemas() {
  try {
    console.log('📦 Merging Prisma schemas...');
    
    const projectRoot = process.cwd();
    const modelDir = path.join(projectRoot, 'prisma/models');
    const outputFile = path.join(projectRoot, 'prisma/schema.prisma');
    
    console.log(`Looking in: ${modelDir}`);
    
    // Read all .prisma files from models directory
    const files = await fs.readdir(modelDir);
    const prismaFiles = files.filter(file => file.endsWith('.prisma'));
    
    if (prismaFiles.length === 0) {
      console.error('❌ No .prisma files found in prisma/models/');
      process.exit(1);
    }
    
    console.log(`Found ${prismaFiles.length} model files:`);
    prismaFiles.forEach(file => console.log(`  - ${file}`));
    
    // Create base schema
    let mergedSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
    
    // Add imports
    mergedSchema += '\n// Import model files\n';
    prismaFiles.forEach(file => {
      mergedSchema += `import "./models/${file}"\n`;
    });
    
    // Write output
    await fs.writeFile(outputFile, mergedSchema, 'utf-8');
    console.log(`✅ Schema created at: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  mergePrismaSchemas();
}

module.exports = { mergePrismaSchemas };