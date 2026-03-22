# Admin Error Debugging Guide

## 🔍 Current Error Analysis

You're seeing these errors in the console:
```
notificationService.js:111 getUnreadCount error: Object
adminUtils.js:4 Admin Error: Object
adminUtils.js:4 Admin Error: Object
```

These are generic error objects that need proper message extraction. Let's debug them step by step.

## 🛠️ Immediate Fixes Applied

### **1. Enhanced Error Logging**
Updated `adminUtils.js` and `notificationService.js` with detailed error logging:

```javascript
console.error('Admin Error Details:', {
  error,
  message: error?.message,
  code: error?.code,
  details: error?.details,
  hint: error?.hint,
  status: error?.status,
  statusText: error?.statusText
});
```

### **2. Better Error Message Extraction**
```javascript
// Extract error message from various error formats
let errorMessage = fallbackMessage;

if (error?.message) {
  errorMessage = error.message;
} else if (error?.error?.message) {
  errorMessage = error.error.message;
} else if (error?.details) {
  errorMessage = error.details;
} else if (typeof error === 'string') {
  errorMessage = error;
}
```

## 🔧 Debugging Steps

### **Step 1: Check Console Details**
After the fixes, you should see detailed error information instead of just "Object". Look for:
- `message`: The actual error message
- `code`: Supabase error codes (PGRST116, PGRST301, etc.)
- `details`: Additional error details
- `hint`: Database hints

### **Step 2: Run Debug Tools**
Open browser console and run:

```javascript
// Load debug tools (if not auto-loaded)
debugAdminErrors();

// Test individual services
testAdminService();        // Test orders, users, products
testNotificationService(); // Test notifications
testSupabaseConnection();  // Test database connection
checkEnvironment();        // Check environment setup
```

### **Step 3: Common Error Scenarios**

#### **A. Table Missing Errors**
```
code: "PGRST116"
message: "relation \"notifications\" does not exist"
```
**Fix**: Run database migrations to create missing tables.

#### **B. Permission Errors**
```
code: "PGRST301"
message: "permission denied for relation notifications"
```
**Fix**: Check RLS policies and user permissions.

#### **C. Network/Connection Errors**
```
name: "TypeError"
message: "Failed to fetch"
```
**Fix**: Check Supabase URL and keys in `.env` file.

#### **D. Authentication Errors**
```
message: "JWT expired"
message: "Invalid token"
```
**Fix**: User needs to re-authenticate.

## 🗄️ Database Issues to Check

### **1. Missing Tables**
Run these SQL commands in Supabase SQL Editor:

```sql
-- Check if notifications table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'notifications';

-- Check if profiles table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- Check if orders table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'orders';
```

### **2. RLS Policies**
Check if RLS policies exist:

```sql
-- Check RLS policies on notifications
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications';
```

## 🔧 Environment Setup Check

### **1. Supabase Configuration**
Check your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **2. Environment Variables**
In browser console, run:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
```

## 🚀 Quick Fix Solutions

### **Solution 1: Disable Notifications Temporarily**
If notifications are causing issues, disable them temporarily:

```javascript
// In notificationService.js
export async function getUnreadCount(userId) {
  try {
    // Temporarily return 0 to prevent errors
    return 0;
    
    // Original code below...
  } catch (error) {
    return 0; // Always return 0 on error
  }
}
```

### **Solution 2: Graceful Fallback**
Update admin pages to handle missing data gracefully:

```javascript
// In admin pages
const loadData = async () => {
  try {
    const data = await adminService.getOrders();
    setOrders(data || []);
  } catch (error) {
    console.warn('Failed to load orders, using empty array');
    setOrders([]); // Fallback to empty array
  }
};
```

### **Solution 3: Database Migration**
Run the missing migrations:

```sql
-- Create notifications table if missing
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 📊 Monitoring & Prevention

### **1. Error Boundaries**
Add error boundaries to catch and display errors gracefully:

```javascript
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'Unknown error occurred'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### **2. Health Check Service**
Create a health check service:

```javascript
export const healthCheck = async () => {
  const checks = {
    database: false,
    tables: {},
    auth: false
  };

  try {
    // Test database connection
    const { error } = await supabase.from('products').select('count').limit(1);
    checks.database = !error;

    // Test specific tables
    const tables = ['orders', 'profiles', 'notifications', 'products'];
    for (const table of tables) {
      try {
        await supabase.from(table).select('count').limit(1);
        checks.tables[table] = true;
      } catch (e) {
        checks.tables[table] = false;
      }
    }

    // Test auth
    const { data: { user } } = await supabase.auth.getUser();
    checks.auth = !!user;

  } catch (error) {
    console.error('Health check failed:', error);
  }

  return checks;
};
```

## 🎯 Next Steps

1. **Check Console**: Look for detailed error messages after the fixes
2. **Run Debug Tools**: Use the debugging script to identify issues
3. **Fix Database**: Run missing migrations if needed
4. **Test Services**: Verify each service works independently
5. **Monitor**: Keep an eye on console for new errors

## 📞 Support

If errors persist:
1. Copy the detailed error messages from console
2. Run the debug tools and share the output
3. Check your Supabase dashboard for table status
4. Verify your environment variables are correct

The enhanced error handling should now show you exactly what's going wrong instead of generic "Object" errors! 🔍
