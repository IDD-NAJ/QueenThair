#!/usr/bin/env node

/**
 * Newsletter Fix Verification Script
 * Run this after applying migration 020 to verify everything works
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyNewsletterFix() {
  console.log('🔍 Verifying Newsletter Subscription Fix...\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Check table exists
  console.log('1️⃣  Checking if newsletter_subscribers table exists...');
  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      results.failed.push('Table newsletter_subscribers does not exist');
    } else if (error) {
      results.warnings.push(`Table check warning: ${error.message}`);
    } else {
      results.passed.push('Table newsletter_subscribers exists');
    }
  } catch (err) {
    results.failed.push(`Table check failed: ${err.message}`);
  }

  // Test 2: Test anonymous insert (RLS policy)
  console.log('2️⃣  Testing anonymous user can insert...');
  const testEmail = `test-${Date.now()}@example.com`;
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: testEmail,
        source: 'verification_script',
        status: 'active',
        metadata: { test: true }
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42501') {
        results.failed.push('RLS policy blocks anonymous insert - Migration 020 not applied!');
      } else if (error.code === '42703') {
        results.failed.push('Column mismatch - using status field but table has is_active');
      } else {
        results.failed.push(`Insert failed: ${error.message} (code: ${error.code})`);
      }
    } else {
      results.passed.push('Anonymous user can insert successfully');
      
      // Cleanup test record
      await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('email', testEmail);
    }
  } catch (err) {
    results.failed.push(`Insert test failed: ${err.message}`);
  }

  // Test 3: Test duplicate email handling
  console.log('3️⃣  Testing duplicate email constraint...');
  const duplicateEmail = `duplicate-${Date.now()}@example.com`;
  try {
    // First insert
    const { error: firstError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: duplicateEmail,
        source: 'verification_script',
        status: 'active'
      });

    if (firstError) {
      results.warnings.push(`First insert failed: ${firstError.message}`);
    } else {
      // Second insert (should fail)
      const { error: secondError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: duplicateEmail,
          source: 'verification_script',
          status: 'active'
        });

      if (secondError && secondError.code === '23505') {
        results.passed.push('Duplicate email constraint working correctly');
      } else if (!secondError) {
        results.failed.push('Duplicate email was allowed - unique constraint missing!');
      } else {
        results.warnings.push(`Duplicate test unexpected error: ${secondError.message}`);
      }

      // Cleanup
      await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('email', duplicateEmail);
    }
  } catch (err) {
    results.warnings.push(`Duplicate test failed: ${err.message}`);
  }

  // Test 4: Test normalized email (case insensitive)
  console.log('4️⃣  Testing normalized email constraint...');
  const normalizedEmail = `normalized-${Date.now()}@example.com`;
  try {
    // Insert lowercase
    const { error: lowerError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail.toLowerCase(),
        source: 'verification_script',
        status: 'active'
      });

    if (lowerError) {
      results.warnings.push(`Normalized test first insert failed: ${lowerError.message}`);
    } else {
      // Try uppercase (should fail due to normalized unique index)
      const { error: upperError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: normalizedEmail.toUpperCase(),
          source: 'verification_script',
          status: 'active'
        });

      if (upperError && upperError.code === '23505') {
        results.passed.push('Normalized email constraint working (case-insensitive)');
      } else if (!upperError) {
        results.warnings.push('Case-insensitive constraint may not be working');
      }

      // Cleanup
      await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('email', normalizedEmail.toLowerCase());
    }
  } catch (err) {
    results.warnings.push(`Normalized email test failed: ${err.message}`);
  }

  // Test 5: Verify schema has correct fields
  console.log('5️⃣  Checking schema fields...');
  const testSchemaEmail = `schema-${Date.now()}@example.com`;
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: testSchemaEmail,
        source: 'verification_script',
        status: 'active',
        metadata: { test: true }
      })
      .select('id, email, source, status, metadata, user_id, subscribed_at, created_at, updated_at')
      .single();

    if (error) {
      results.warnings.push(`Schema check failed: ${error.message}`);
    } else {
      const hasAllFields = data.id && data.email && data.source && data.status && 
                          data.metadata !== undefined && data.subscribed_at && 
                          data.created_at && data.updated_at !== undefined;
      
      if (hasAllFields) {
        results.passed.push('All required schema fields present');
      } else {
        results.failed.push('Missing required schema fields');
      }

      // Cleanup
      await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('email', testSchemaEmail);
    }
  } catch (err) {
    results.warnings.push(`Schema verification failed: ${err.message}`);
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(60) + '\n');

  if (results.passed.length > 0) {
    console.log('✅ PASSED:');
    results.passed.forEach(msg => console.log(`   ✓ ${msg}`));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(msg => console.log(`   ⚠ ${msg}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ FAILED:');
    results.failed.forEach(msg => console.log(`   ✗ ${msg}`));
    console.log('');
  }

  console.log('='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('✅ All critical tests passed!');
    console.log('Newsletter subscription should work correctly.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    console.log('Please apply migration 020 and try again.\n');
    console.log('Run this command in Supabase Dashboard SQL Editor:');
    console.log('  Copy contents of: supabase/migrations/020_newsletter_final_fix.sql\n');
    process.exit(1);
  }
}

verifyNewsletterFix().catch(err => {
  console.error('❌ Verification script error:', err);
  process.exit(1);
});
