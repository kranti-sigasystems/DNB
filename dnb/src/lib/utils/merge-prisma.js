// src/lib/utils/merge-prisma.js
const fs = require('fs/promises');
const path = require('path');

console.log('🚀 Starting Prisma schema merge...');

async function main() {
  try {
    const projectRoot = process.cwd();
    const modelDir = path.join(projectRoot, 'prisma/models');
    const outputFile = path.join(projectRoot, 'prisma/schema.prisma');
    
    console.log('Project:', projectRoot);
    
    // Ensure directories exist
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.mkdir(modelDir, { recursive: true });
    
    // Get files
    let files = [];
    try {
      files = await fs.readdir(modelDir);
    } catch {
      console.log('No models directory, creating...');
    }
    
    const prismaFiles = files.filter(f => f.endsWith('.prisma'));
    console.log(`Found ${prismaFiles.length} .prisma files`);
    
    if (prismaFiles.length === 0) {
      console.log('No model files found.');
      return;
    }
    
    // Build schema CORRECTLY
    let schema = `// Auto-generated
// Date: ${new Date().toISOString()}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

`;
    
    // CONCATENATE actual content, NOT import statements
    for (const file of prismaFiles) {
      console.log('Adding content from:', file);
      const filePath = path.join(modelDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      schema += `\n// === ${file} ===\n`;
      schema += content + '\n';
    }
    
    // Write
    await fs.writeFile(outputFile, schema);
    console.log('✅ Schema created successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();