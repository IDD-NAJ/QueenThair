# Product CSV Import System - Quick Setup

## Prerequisites
- Supabase project configured
- Admin user account created
- Supabase CLI installed (optional, for deployment)

## Setup Steps

### 1. Apply Database Migration

**Option A: Using Supabase CLI**
```bash
cd c:\Users\DANE\Documents\website\QueenTEE
supabase db push
```

**Option B: Manual via Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/018_product_import_logs.sql`
3. Copy and execute the SQL

### 2. Deploy Edge Function

**Option A: Using Supabase CLI**
```bash
supabase functions deploy import-products-csv
```

**Option B: Manual via Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Create new function named `import-products-csv`
3. Copy code from `supabase/functions/import-products-csv/index.ts`
4. Deploy

### 3. Verify Environment Variables

Ensure `.env` file contains:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Ensure Supabase Dashboard has these secrets set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Test the System

1. **Login as Admin**
   - Navigate to `/login`
   - Login with admin credentials
   - Verify profile role is `admin`

2. **Access Import Page**
   - Navigate to `/admin/products/import`
   - Or click "Import Products" in admin sidebar

3. **Download Template**
   - Click "Template" or "With Samples" button
   - Verify CSV downloads

4. **Test Dry Run**
   - Upload sample CSV
   - Configure options
   - Click "Validate & Preview"
   - Verify validation works

5. **Test Import**
   - Use validated CSV
   - Click "Commit Import"
   - Verify products created
   - Check import history

## File Structure

```
QueenTEE/
├── supabase/
│   ├── migrations/
│   │   └── 018_product_import_logs.sql
│   └── functions/
│       └── import-products-csv/
│           └── index.ts
├── src/
│   ├── services/
│   │   ├── adminImportService.js
│   │   └── csvTemplateService.js
│   ├── pages/
│   │   └── admin/
│   │       └── ProductImportPage.jsx
│   ├── components/
│   │   └── dashboard/
│   │       └── DashboardSidebar.jsx (updated)
│   └── routes/
│       └── index.jsx (updated)
└── docs/
    └── PRODUCT_CSV_IMPORT_GUIDE.md
```

## Quick Test CSV

Create a file `test-import.csv`:

```csv
product_slug,product_name,product_type,category_slug,category_name,base_price,sku,color,length,quantity_available,is_active
test-product-1,Test Product 1,extension,test-category,Test Category,99.99,TEST-001,1B,22,100,true
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] `product_import_logs` table exists
- [ ] Edge function deployed
- [ ] Edge function accessible via API
- [ ] Admin can access `/admin/products/import`
- [ ] Template download works
- [ ] CSV upload and parsing works
- [ ] Validation works (dry run)
- [ ] Import works (commit)
- [ ] Products created in database
- [ ] Variants created correctly
- [ ] Inventory synced
- [ ] Import history logged
- [ ] Error reporting works
- [ ] Failed rows export works

## Common Issues

### "Edge Function not found"
- Redeploy function: `supabase functions deploy import-products-csv`
- Check function name matches exactly

### "Unauthorized" error
- Verify user has `admin` role in profiles table
- Check RLS policies on product_import_logs

### "Cannot read file"
- Ensure CSV is valid UTF-8
- Check for special characters
- Try with sample template

### Import takes too long
- Reduce file size
- Batch into smaller imports
- Check network connection

## Support

For detailed documentation, see:
- `docs/PRODUCT_CSV_IMPORT_GUIDE.md` - Complete user guide
- Edge Function code comments
- Service layer documentation

## Next Steps

After setup:
1. Create product categories if needed
2. Create collections if needed
3. Prepare product data in CSV format
4. Test with small batch first
5. Import full catalog
6. Verify all data synced correctly

## Maintenance

### Regular Tasks
- Monitor import logs for errors
- Clean up old import logs periodically
- Update CSV templates as schema evolves
- Review failed imports and fix data issues

### Updates
When updating the system:
1. Test in development first
2. Backup database before major changes
3. Update documentation
4. Notify admin users of changes
