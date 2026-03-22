# CSV Product Upload Guide

## Overview
The admin dashboard now supports bulk product uploads via CSV files, allowing you to quickly import multiple products at once.

## How to Use

### 1. Access CSV Upload
- Navigate to **Admin Dashboard** → **Products**
- Click the **"Import CSV"** button in the top right corner

### 2. Download Template
- Click **"Download Template"** in the modal to get a pre-formatted CSV file
- The template includes all required columns and an example row

### 3. Prepare Your CSV File

#### Required Columns:
- `name` - Product name (required)
- `slug` - URL-friendly identifier (required, must be unique)
- `category_slug` - Category identifier (required, must match existing category)
- `base_price` - Product price in USD (required, numeric)

#### Optional Columns:
- `product_type` - Type: wig or accessory (default: wig)
- `compare_at_price` - Original price for sale items (numeric)
- `short_description` - Brief product description
- `description` - Full product description
- `is_active` - true/false or 1/0 (default: false)
- `featured` - true/false or 1/0 (default: false)
- `new_arrival` - true/false or 1/0 (default: false)
- `best_seller` - true/false or 1/0 (default: false)
- `on_sale` - true/false or 1/0 (default: false)

**Note:** Product images must be added separately through the product edit interface after CSV upload. Images are stored in a separate `product_images` table and cannot be uploaded via CSV.

### 4. CSV Format Example

```csv
name,slug,product_type,category_slug,base_price,compare_at_price,short_description,description,is_active,featured,new_arrival,best_seller,on_sale
Brazilian Body Wave 22",brazilian-body-wave-22,wig,lace-front-wigs,299.99,399.99,Premium Brazilian body wave wig,High-quality Brazilian body wave human hair wig with natural texture and shine,true,false,true,false,true
```

### 5. Upload Process
1. Select your prepared CSV file
2. Review the preview showing the first 5 rows
3. Check for any validation errors (displayed in red)
4. Click **"Upload Products"** to import
5. Wait for confirmation message

## Validation Rules

### Product Name
- Cannot be empty
- Will be trimmed of whitespace

### Slug
- Cannot be empty
- Must be unique across all products
- Should be lowercase with hyphens (e.g., `brazilian-body-wave-22`)

### Category Slug
- Must match an existing category slug in the database
- Common categories: `wigs`, `bundles`, `closures`, `frontals`, `accessories`

### Prices
- Must be valid numbers
- Cannot be negative
- Use decimal format (e.g., 299.99)

### Product Type
- Must be one of: `wig`, `accessory`
- Case-insensitive
- Default: `wig`

### Boolean Fields
- Accept: `true`, `false`, `1`, `0`
- Case-insensitive

## Tips for Success

### 1. Use Existing Categories
Before uploading, check your existing categories in the admin panel to ensure your `category_slug` values match.

### 2. Unique Slugs
Ensure each product has a unique slug. Duplicate slugs will cause the upload to fail.

### 3. Text with Commas
If your description contains commas, wrap the entire field in double quotes:
```csv
"High-quality wig, perfect for any occasion"
```

### 4. Line Breaks in Descriptions
For multi-line descriptions, use `\n` or wrap in quotes with actual line breaks:
```csv
"First line
Second line
Third line"
```

### 5. Test with Small Batches
Start with a small CSV file (5-10 products) to ensure your format is correct before uploading hundreds of products.

### 6. Adding Product Images
**Important:** Product images cannot be uploaded via CSV. After importing products:
1. Navigate to the Products page in admin dashboard
2. Click the edit button on the product
3. Upload images through the product edit interface
4. Images are stored in the `product_images` table with support for:
   - Multiple images per product
   - Primary image designation
   - Alt text for accessibility
   - Sort order for image galleries

## Troubleshooting

### "Category not found" Error
- Verify the category slug exists in your database
- Check for typos or extra spaces
- Category slugs are case-sensitive

### "Invalid price" Error
- Ensure prices are numbers without currency symbols
- Use decimal point (.) not comma (,)
- Remove any spaces or special characters

### "Duplicate slug" Error
- Each product must have a unique slug
- Check your CSV for duplicate entries
- Verify against existing products in the database

### Upload Fails Silently
- Check browser console for errors
- Verify you have admin permissions
- Ensure Supabase connection is active

## Technical Details

### Files Created
- `src/services/csvService.js` - CSV parsing and validation
- `src/components/admin/CSVUploadModal.jsx` - Upload UI component
- `adminService.bulkInsertProducts()` - Bulk insert method

### Database
Products are inserted into the `products` table with all RLS policies applied.

### Limitations
- Maximum file size: Browser dependent (typically 10MB+)
- No automatic image upload (images must be pre-hosted)
- Variants must be added separately after product creation

## Future Enhancements
- Support for product variants in CSV
- Automatic image upload from local files
- Update existing products (currently insert-only)
- Export products to CSV
- Validation preview before upload
