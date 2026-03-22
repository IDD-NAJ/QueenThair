# Product CSV Import System - Complete Guide

## Overview

The Product CSV Import system allows administrators to bulk upload and update products along with all related data (variants, inventory, images, categories, collections) through a secure, validated CSV import process.

## Features

✅ **Bulk Product Management**
- Create new products
- Update existing products
- Multiple variants per product
- Automatic inventory sync
- Image management
- Category and collection assignment

✅ **Validation & Preview**
- Dry-run mode for validation
- Preview parsed data before commit
- Row-level error reporting
- Downloadable error reports

✅ **Multiple Import Modes**
- **Upsert**: Create new + update existing (default)
- **Full Sync**: Replace all data for imported products
- **Inventory Only**: Update only stock quantities
- **Pricing Only**: Update only pricing information

✅ **Table Synchronization**
All related tables stay synchronized:
- `products`
- `product_variants`
- `inventory`
- `product_images`
- `categories`
- `collections`
- `collection_products`

✅ **Security & Audit**
- Admin-only access
- Server-side validation
- Import history logging
- Detailed reporting

## Architecture

### Components

1. **Database Migration**: `supabase/migrations/018_product_import_logs.sql`
   - Creates `product_import_logs` table for audit trail
   - RLS policies for admin access

2. **Edge Function**: `supabase/functions/import-products-csv/index.ts`
   - Secure server-side CSV processing
   - Admin authorization check
   - Multi-table transaction handling
   - Validation and error reporting

3. **Services**:
   - `src/services/adminImportService.js` - API client
   - `src/services/csvTemplateService.js` - Template generation and parsing

4. **UI**: `src/pages/admin/ProductImportPage.jsx`
   - File upload interface
   - Import options configuration
   - Preview and validation display
   - Results reporting

## Setup Instructions

### 1. Apply Database Migration

```bash
# Navigate to project root
cd c:\Users\DANE\Documents\website\QueenTEE

# Apply migration using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard SQL Editor
# Copy and run: supabase/migrations/018_product_import_logs.sql
```

### 2. Deploy Edge Function

```bash
# Deploy the import function
supabase functions deploy import-products-csv

# Verify deployment
supabase functions list
```

### 3. Set Environment Variables

Ensure your `.env` file has:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

The Edge Function uses these server-side variables (set in Supabase Dashboard):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Access the Import Page

Navigate to: `/admin/products/import`

Or click "Import Products" in the admin sidebar.

## CSV Format Specification

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `product_slug` | Unique URL-friendly identifier | `brazilian-body-wave-22` |
| `product_name` | Display name | `Brazilian Body Wave 22"` |

### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | UUID | Leave empty for new, provide for updates |
| `short_description` | Text | Brief summary |
| `description` | Text | Full description |
| `product_type` | Enum | `bundle`, `wig`, `extension`, `accessory` |
| `category_slug` | Text | Category identifier |
| `category_name` | Text | Category display name |
| `base_price` | Decimal | Base price (e.g., `299.99`) |
| `compare_at_price` | Decimal | Original price for comparison |
| `featured` | Boolean | `true`, `false`, `1`, `0`, `yes`, `no` |
| `new_arrival` | Boolean | Same as above |
| `best_seller` | Boolean | Same as above |
| `on_sale` | Boolean | Same as above |
| `badge` | Text | Badge text (e.g., `Best Seller`) |
| `seo_title` | Text | SEO meta title |
| `seo_description` | Text | SEO meta description |
| `is_active` | Boolean | Product active status |

### Variant Fields

| Field | Type | Description |
|-------|------|-------------|
| `variant_id` | UUID | Leave empty for new, provide for updates |
| `sku` | Text | Stock keeping unit (must be unique) |
| `color` | Text | Color option |
| `length` | Text | Length option |
| `density` | Text | Density option |
| `size` | Text | Size option |
| `material` | Text | Material description |
| `option_label` | Text | Display label for variant |
| `price_override` | Decimal | Override product base price |
| `compare_at_price_override` | Decimal | Override compare price |
| `variant_active` | Boolean | Variant active status |

### Inventory Fields

| Field | Type | Description |
|-------|------|-------------|
| `quantity_available` | Integer | Available stock |
| `quantity_reserved` | Integer | Reserved stock |
| `low_stock_threshold` | Integer | Alert threshold (default: 5) |
| `track_inventory` | Boolean | Enable inventory tracking |
| `allow_backorder` | Boolean | Allow backorders |

### Image Fields

| Field | Type | Description |
|-------|------|-------------|
| `primary_image_url` | URL | Main product image |
| `image_urls` | URLs | Additional images separated by `\|` |
| `alt_texts` | Text | Alt texts separated by `\|` (must match image count) |

### Collection Fields

| Field | Type | Description |
|-------|------|-------------|
| `collection_slugs` | Text | Collection identifiers separated by `\|` |
| `collection_names` | Text | Collection names separated by `\|` |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `sort_order` | Integer | Display order |
| `tags` | Text | Comma-separated tags |
| `metadata_json` | JSON | Additional metadata |

## CSV Examples

### Example 1: Single Product with One Variant

```csv
product_slug,product_name,product_type,category_slug,base_price,sku,color,length,quantity_available
brazilian-wave-22,Brazilian Body Wave 22",extension,brazilian-hair,299.99,BBW-22-1B,1B,22,50
```

### Example 2: Product with Multiple Variants

```csv
product_slug,product_name,product_type,category_slug,base_price,sku,color,length,density,quantity_available
brazilian-wave-22,Brazilian Body Wave 22",extension,brazilian-hair,299.99,BBW-22-1B-150,1B,22,150%,50
brazilian-wave-22,,,,,BBW-22-1B-180,1B,22,180%,30
brazilian-wave-22,,,,,BBW-22-2-150,2,22,150%,40
```

### Example 3: Product with Images and Collections

```csv
product_slug,product_name,base_price,primary_image_url,image_urls,alt_texts,collection_slugs,collection_names
luxury-wig,Luxury Lace Wig,599.99,https://example.com/main.jpg,https://example.com/side.jpg|https://example.com/back.jpg,Side view|Back view,summer-collection|best-sellers,Summer Collection|Best Sellers
```

## Multi-Value Field Format

Separate multiple values with the pipe character (`|`):

```csv
image_urls: url1|url2|url3
alt_texts: alt1|alt2|alt3
collection_slugs: slug1|slug2
collection_names: name1|name2
```

**Important**: Counts must match (e.g., 3 image URLs = 3 alt texts)

## Import Modes

### Upsert Mode (Default)
- Creates new products
- Updates existing products by slug
- Preserves data not in CSV
- Adds new variants/images/collections

### Full Sync Mode
- Creates/updates products
- Replaces all images for imported products
- Replaces all collection assignments
- Optionally archives products not in CSV

### Inventory Only Mode
- Updates only inventory quantities
- Products must already exist
- Ignores other fields

### Pricing Only Mode
- Updates only price fields
- Products must already exist
- Ignores other fields

## Import Options

### Auto-Create Categories
When enabled, creates categories that don't exist.
When disabled, validation fails if category not found.

### Auto-Create Collections
When enabled, creates collections that don't exist.
When disabled, validation fails if collection not found.

### Replace Images
When enabled, removes existing images and replaces with CSV data.
When disabled, adds new images without removing existing ones.

### Replace Collections
When enabled, removes existing collection assignments and replaces with CSV data.
When disabled, adds new collection assignments without removing existing ones.

## Validation Rules

### Required Validations
- ✅ `product_slug` must be present and valid format
- ✅ `product_name` must be present
- ✅ Prices must be valid numbers
- ✅ SKUs must be unique within file
- ✅ Image URLs and alt texts must have matching counts
- ✅ Collection slugs and names must have matching counts

### Format Validations
- ✅ Slugs: lowercase, hyphens only, no spaces
- ✅ Booleans: `true`, `false`, `1`, `0`, `yes`, `no`, `y`, `n`
- ✅ Numbers: valid decimal format
- ✅ URLs: valid HTTP/HTTPS format
- ✅ Product type: must be one of allowed values

### Duplicate Detection
- ✅ Duplicate slugs within file
- ✅ Duplicate SKUs within file
- ✅ Duplicate image URLs (cleaned automatically)

## Import Workflow

### Step 1: Prepare CSV
1. Download template from import page
2. Fill in product data
3. Validate format locally

### Step 2: Upload & Validate
1. Upload CSV file
2. Configure import options
3. Click "Validate & Preview"
4. Review validation report

### Step 3: Review Preview
1. Check total rows parsed
2. Review validation errors
3. Fix errors if needed
4. Re-upload and validate

### Step 4: Commit Import
1. Click "Commit Import"
2. Wait for processing
3. Review import report
4. Download failed rows if any

### Step 5: Verify Results
1. Check products in admin panel
2. Verify variants created
3. Confirm inventory updated
4. Check images and collections

## Import Report

After import, you'll receive a detailed report:

### Summary Statistics
- Total rows processed
- Valid rows
- Invalid rows
- Products created
- Products updated
- Failed rows

### Detailed Breakdown
- Variants created/updated
- Inventory records updated
- Categories created
- Collections created
- Images created/updated

### Error Information
- Validation errors by row
- Failed rows with error messages
- Warnings (non-blocking issues)

### Export Options
- Download failed rows as CSV
- Re-process failed rows after fixes

## Import History

All imports are logged in `product_import_logs` table:

- Admin user who performed import
- Filename
- Import mode
- Timestamp
- Success/failure counts
- Full report JSON

Access history in the import page sidebar.

## Best Practices

### Data Preparation
1. ✅ Always use dry-run mode first
2. ✅ Start with small test files
3. ✅ Keep SKUs unique and meaningful
4. ✅ Use consistent slug format
5. ✅ Validate URLs before upload

### Import Strategy
1. ✅ Import categories first (or enable auto-create)
2. ✅ Import collections first (or enable auto-create)
3. ✅ Import products with base data
4. ✅ Import variants and inventory
5. ✅ Import images last

### Error Handling
1. ✅ Review all validation errors
2. ✅ Fix errors in source file
3. ✅ Re-validate before commit
4. ✅ Export failed rows for analysis
5. ✅ Process failed rows separately

### Performance
1. ✅ Batch imports in reasonable sizes (100-500 products)
2. ✅ Avoid very large files (>1000 rows)
3. ✅ Use inventory-only mode for stock updates
4. ✅ Use pricing-only mode for price updates

## Troubleshooting

### Common Issues

**Issue**: "Product slug is required"
- **Solution**: Ensure every row has a `product_slug` value

**Issue**: "Duplicate slug in file"
- **Solution**: Check for duplicate product_slug values (except for multi-variant products)

**Issue**: "Invalid price format"
- **Solution**: Use decimal format without currency symbols (e.g., `299.99` not `$299.99`)

**Issue**: "Image URLs and alt texts count mismatch"
- **Solution**: Ensure same number of URLs and alt texts separated by `|`

**Issue**: "Category does not exist"
- **Solution**: Enable "Auto-create categories" or create category first

**Issue**: "SKU already exists"
- **Solution**: Use unique SKUs or update existing variant by providing `variant_id`

**Issue**: "Import failed: Unauthorized"
- **Solution**: Ensure you're logged in as admin user

**Issue**: "Edge Function timeout"
- **Solution**: Reduce file size, batch into smaller imports

### Validation Errors

All validation errors include:
- Row number
- Field name
- Error message

Fix errors in your CSV and re-upload.

### Failed Rows

If some rows fail during import:
1. Download failed rows CSV
2. Fix errors in the file
3. Re-import only failed rows

## Security Considerations

### Admin-Only Access
- Import function verifies admin role
- RLS policies enforce admin access
- Non-admin users cannot access import page

### Server-Side Processing
- All validation runs server-side
- Uses service role key securely
- No sensitive keys exposed to client

### Data Integrity
- Transactional processing per product
- Orphaned records prevented
- Foreign key constraints enforced

## API Reference

### Upload CSV Import

**Endpoint**: `POST /functions/v1/import-products-csv`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body**:
```
file: CSV file
options: JSON string with import options
```

**Response**:
```json
{
  "report": {
    "totalRows": 100,
    "validRows": 95,
    "invalidRows": 5,
    "productsCreated": 50,
    "productsUpdated": 45,
    "errors": [...],
    "failedRows": [...]
  },
  "preview": [...] // Only in dry-run mode
}
```

## Support

For issues or questions:
1. Check validation errors in import report
2. Review this documentation
3. Check import history for patterns
4. Contact system administrator

## Changelog

### Version 1.0.0 (2026-03-19)
- Initial release
- Support for all product-related tables
- Multiple import modes
- Validation and preview
- Import history logging
- Comprehensive error reporting
