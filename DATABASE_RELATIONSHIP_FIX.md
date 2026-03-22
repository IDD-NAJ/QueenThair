# Database Relationship Error Fix

## 🔍 **Error Identified**

**Error Details**:
```
code: 'PGRST200'
message: "Could not find a relationship between 'products' and 'product_inventory' in the schema cache"
details: "Searched for a foreign key relationship between 'products' and 'product_inventory' in the schema 'public', but no matches were found."
hint: "Perhaps you meant 'inventory' instead of 'product_inventory'."
```

**Root Cause**: The adminService was trying to access `product_inventory` table but the actual table is named `inventory`.

## ✅ **Fixes Applied**

### **1. Fixed AdminService Table Reference**
**File**: `src/services/adminService.js`

**Changed**:
```javascript
// Before (incorrect)
inventory:product_inventory(*)

// After (correct)  
inventory:inventory(*)
```

### **2. Enhanced Error Handling**
**File**: `src/services/adminUtils.js`

**Added**:
```javascript
if (error?.code === 'PGRST200' || errorMessage?.includes('relationship') || errorMessage?.includes('schema cache')) {
  return 'Database relationship error. Please check table relationships in the database.';
}
```

### **3. Created Database Schema Checker**
**File**: `check-db-schema.js`

**Purpose**: Verify table relationships and identify schema issues.

## 🔧 **Verification Steps**

### **Step 1: Test the Fix**
1. Refresh the admin page
2. Check if the PGRST200 error is resolved
3. Verify product data loads correctly

### **Step 2: Run Schema Checker**
In browser console, run:
```javascript
checkDatabaseSchema()
```

This will verify:
- ✅ All required tables exist
- ✅ Table relationships work correctly
- ✅ No schema cache issues

### **Step 3: Test Admin Pages**
Navigate to and test:
- `/admin/products` - Should load products with inventory
- `/admin/inventory` - Should show inventory data
- `/admin/analytics` - Should load product analytics

## 🗄️ **Database Schema Requirements**

### **Required Tables**
```sql
-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- ... other fields
);

-- Inventory table (correct name)
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity_available INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants table
CREATE TABLE product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  color TEXT,
  length TEXT,
  density TEXT DEFAULT '150%',
  price_override DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Foreign Key Relationships**
```sql
-- Product to Inventory (one-to-one)
ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product to Variants (one-to-many)
ALTER TABLE product_variants 
ADD CONSTRAINT fk_variants_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product to Category (many-to-one)
ALTER TABLE products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES categories(id);
```

## 🚀 **Expected Results After Fix**

### **Before Fix**:
```
❌ PGRST200 Error: Could not find relationship between 'products' and 'product_inventory'
❌ Admin pages fail to load product data
❌ Inventory management broken
```

### **After Fix**:
```
✅ Products load with inventory data
✅ Admin analytics work correctly
✅ Inventory management functional
✅ No PGRST200 errors
```

## 🔍 **Troubleshooting**

### **If Error Persists**:

#### **1. Check Table Names**
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%inventory%';
```

#### **2. Check Foreign Keys**
```sql
-- Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

#### **3. Refresh Schema Cache**
```sql
-- In Supabase SQL Editor, run this to refresh schema cache
NOTIFY pgrst, 'reload schema';
```

#### **4. Verify Table Structure**
```sql
-- Check inventory table structure
\d inventory

-- Check products table structure  
\d products
```

## 📋 **Common Issues & Solutions**

### **Issue 1: Wrong Table Name**
**Symptom**: PGRST200 error with wrong table name in hint
**Solution**: Update adminService to use correct table name

### **Issue 2: Missing Foreign Key**
**Symptom**: Relationship errors between tables
**Solution**: Add proper foreign key constraints

### **Issue 3: Schema Cache Stale**
**Symptom**: PGRST200 errors even with correct schema
**Solution**: Refresh PostgREST schema cache

### **Issue 4: RLS Policies Blocking**
**Symptom**: Permission errors on table relationships
**Solution**: Update RLS policies to allow joins

## 🎯 **Verification Commands**

### **Test Product Loading**
```javascript
// In browser console
window.adminService.getProducts().then(console.log).catch(console.error);
```

### **Test Schema Checker**
```javascript
// In browser console
checkDatabaseSchema();
```

### **Test Admin Pages**
1. Visit `/admin/products`
2. Visit `/admin/inventory` 
3. Visit `/admin/analytics`
4. Check console for errors

## ✅ **Summary**

The PGRST200 error was caused by incorrect table name reference in adminService. The fix involved:

1. ✅ Changed `product_inventory` to `inventory` in adminService
2. ✅ Enhanced error handling for PGRST200 errors
3. ✅ Created database schema verification tools
4. ✅ Provided troubleshooting guide

The admin pages should now load correctly with proper product and inventory data! 🎉
