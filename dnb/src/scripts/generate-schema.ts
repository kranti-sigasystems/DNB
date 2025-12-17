import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generatePrismaSchema() {
  console.log('🔄 Generating Prisma schema from model files...');
  
  // Base schema configuration
  const baseSchema = `// ============================================
// AUTO-GENERATED PRISMA SCHEMA
// Generated from individual model files
// Generated: ${new Date().toISOString()}
// ============================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;
  
  const modelsDir = path.join(__dirname, '../prisma/models');
  const outputFile = path.join(__dirname, '../prisma/schema.prisma');
  
  // Check if models directory exists
  if (!fs.existsSync(modelsDir)) {
    console.error('❌ Models directory not found:', modelsDir);
    process.exit(1);
  }
  
  // Get all .prisma model files
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.prisma'))
    .sort();
  
  if (modelFiles.length === 0) {
    console.error('❌ No .prisma model files found in', modelsDir);
    process.exit(1);
  }
  
  let schemaContent = baseSchema;
  
  // Merge all model files
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    schemaContent += `\n// ================================\n`;
    schemaContent += `// Model: ${file.replace('.prisma', '')}\n`;
    schemaContent += `// ================================\n\n`;
    schemaContent += content;
    schemaContent += '\n';
  });
  
  // Write the final schema
  fs.writeFileSync(outputFile, schemaContent);
  
  console.log(`✅ Generated schema with ${modelFiles.length} models:`);
  modelFiles.forEach(file => console.log(`   📄 ${file}`));
  console.log(`📁 Output: ${outputFile}`);
}

// Run the script
generatePrismaSchema();