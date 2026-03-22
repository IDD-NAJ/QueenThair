import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  console.log('Checking RLS policies on newsletter_subscribers...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'newsletter_subscribers';
    `
  });

  if (error) {
    console.error('Error checking policies:', error);
    console.log('\nTrying alternative method...\n');
    
    // Try direct query
    const { data: tableData, error: tableError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('Table access error:', tableError);
    }
    
    return;
  }

  console.log('Current RLS Policies:');
  console.log(JSON.stringify(data, null, 2));
}

checkRLS();
