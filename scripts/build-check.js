#!/usr/bin/env node

/**
 * Build Validation Script
 * Runs pre-build checks to ensure environment is ready for production build
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const colors = require('colors');

console.log('🔍 QUEENTHAIR Build Validation'.cyan.bold);
console.log('=====================================\n');

// Check 1: Environment Variables
console.log('📋 Checking Environment Variables...'.yellow);

const envPath = '.env';
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!'.red);
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf8');
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let envErrors = [];
requiredVars.forEach(varName => {
  if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
    envErrors.push(varName);
  }
});

if (envErrors.length > 0) {
  console.error('❌ Missing or placeholder environment variables:'.red);
  envErrors.forEach(v => console.error(`   - ${v}`.red));
  console.error('\n💡 Please update your .env file with real values'.yellow);
  process.exit(1);
}

// Check Supabase URL format
const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(https:\/\/.+\.supabase\.co)/);
if (!supabaseUrlMatch) {
  console.error('❌ Invalid VITE_SUPABASE_URL format'.red);
  console.error('💡 Should be: https://your-project-id.supabase.co'.yellow);
  process.exit(1);
}

// Check Supabase key format
const anonKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(eyJ[a-zA-Z0-9._-]+)/);
if (!anonKeyMatch) {
  console.error('❌ Invalid VITE_SUPABASE_ANON_KEY format'.red);
  console.error('💡 Should start with "eyJ" (JWT format)'.yellow);
  process.exit(1);
}

console.log('✅ Environment variables look good!'.green);

// Check 2: Dependencies
console.log('\n📦 Checking Dependencies...'.yellow);

try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@supabase/supabase-js',
    '@stripe/stripe-js',
    'react',
    'react-dom',
    'vite'
  ];

  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );

  if (missingDeps.length > 0) {
    console.error('❌ Missing required dependencies:'.red);
    missingDeps.forEach(dep => console.error(`   - ${dep}`.red));
    console.error('\n💡 Run: npm install'.yellow);
    process.exit(1);
  }

  if (!existsSync('node_modules')) {
    console.error('❌ node_modules directory not found!'.red);
    console.error('💡 Run: npm install'.yellow);
    process.exit(1);
  }

  console.log('✅ Dependencies are installed!'.green);
} catch (error) {
  console.error('❌ Error checking package.json:'.red, error.message);
  process.exit(1);
}

// Check 3: Build Configuration
console.log('\n⚙️  Checking Build Configuration...'.yellow);

if (!existsSync('vite.config.js')) {
  console.error('❌ vite.config.js not found!'.red);
  process.exit(1);
}

try {
  const viteConfig = readFileSync('vite.config.js', 'utf8');
  if (!viteConfig.includes('export default defineConfig')) {
    console.error('❌ Invalid vite.config.js format'.red);
    process.exit(1);
  }
  console.log('✅ Vite configuration is valid!'.green);
} catch (error) {
  console.error('❌ Error reading vite.config.js:'.red, error.message);
  process.exit(1);
}

// Check 4: Source Files
console.log('\n📁 Checking Source Files...'.yellow);

const criticalFiles = [
  'src/App.jsx',
  'src/main.jsx',
  'src/lib/env.js',
  'src/lib/supabaseClient.js'
];

const missingFiles = criticalFiles.filter(file => !existsSync(file));
if (missingFiles.length > 0) {
  console.error('❌ Missing critical source files:'.red);
  missingFiles.forEach(file => console.error(`   - ${file}`.red));
  process.exit(1);
}

console.log('✅ Critical source files exist!'.green);

// Check 5: Try Building
console.log('\n🏗️  Attempting Test Build...'.yellow);

try {
  console.log('Running: npm run build'.cyan);
  const buildOutput = execSync('npm run build', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (!existsSync('dist')) {
    console.error('❌ Build completed but no dist/ folder created!'.red);
    process.exit(1);
  }

  const distFiles = ['index.html'];
  const missingDistFiles = distFiles.filter(file => !existsSync(`dist/${file}`));
  if (missingDistFiles.length > 0) {
    console.error('❌ Build output missing critical files:'.red);
    missingDistFiles.forEach(file => console.error(`   - dist/${file}`.red));
    process.exit(1);
  }

  console.log('✅ Build completed successfully!'.green);
  console.log('✅ dist/ folder created with required files!'.green);
} catch (error) {
  console.error('❌ Build failed!'.red);
  console.error('Build output:'.red, error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout);
  if (error.stderr) console.log('STDERR:', error.stderr);
  process.exit(1);
}

// Success!
console.log('\n🎉 All checks passed!'.green.bold);
console.log('====================================='.cyan);
console.log('✅ Environment variables configured'.green);
console.log('✅ Dependencies installed'.green);
console.log('✅ Build configuration valid'.green);
console.log('✅ Source files present'.green);
console.log('✅ Build process successful'.green);
console.log('\n🚀 Your application is ready for deployment!'.cyan.bold);

console.log('\n📋 Next Steps:'.yellow);
console.log('1. Test the build: npm run preview'.white);
console.log('2. Deploy the dist/ folder to your hosting provider'.white);
console.log('3. Configure environment variables in production'.white);
console.log('4. Deploy Supabase Edge Functions'.white);

console.log('\n🔗 Useful Commands:'.yellow);
console.log('npm run preview  - Test production build locally'.white);
console.log('npm run dev     - Start development server'.white);
console.log('supabase functions deploy - Deploy Edge Functions'.white);
