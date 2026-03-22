// Admin Error Debugging Tool
// Run this in the browser console to debug admin errors

window.debugAdminErrors = function() {
  console.log('🔍 Admin Error Debug Tool');
  
  // Test admin service functions
  window.testAdminService = async function() {
    try {
      console.log('📊 Testing adminService.getOrders()...');
      const orders = await window.adminService?.getOrders();
      console.log('✅ Orders loaded:', orders?.length || 0);
    } catch (error) {
      console.error('❌ Orders error:', error);
      console.log('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        statusText: error?.statusText
      });
    }
    
    try {
      console.log('👥 Testing adminService.getUsers()...');
      const users = await window.adminService?.getUsers();
      console.log('✅ Users loaded:', users?.length || 0);
    } catch (error) {
      console.error('❌ Users error:', error);
      console.log('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
    }
    
    try {
      console.log('🛍️ Testing adminService.getProducts()...');
      const products = await window.adminService?.getProducts();
      console.log('✅ Products loaded:', products?.length || 0);
    } catch (error) {
      console.error('❌ Products error:', error);
      console.log('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
    }
  };
  
  // Test notification service
  window.testNotificationService = async function() {
    try {
      console.log('🔔 Testing notificationService.getUnreadCount()...');
      const userId = window.user?.id || 'test-user-id';
      const count = await window.notificationService?.getUnreadCount(userId);
      console.log('✅ Unread count:', count);
    } catch (error) {
      console.error('❌ Notification error:', error);
      console.log('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
    }
  };
  
  // Test supabase connection
  window.testSupabaseConnection = async function() {
    try {
      console.log('🔗 Testing Supabase connection...');
      const { data, error } = await window.supabase.from('products').select('count').limit(1);
      if (error) {
        console.error('❌ Supabase error:', error);
      } else {
        console.log('✅ Supabase connection working');
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
    }
  };
  
  // Check environment variables
  window.checkEnvironment = function() {
    console.log('🌍 Environment Check:');
    console.log('Supabase URL:', window.env?.supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('Supabase Anon Key:', window.env?.supabaseAnonKey ? '✅ Set' : '❌ Missing');
    console.log('Admin Service:', window.adminService ? '✅ Available' : '❌ Missing');
    console.log('Notification Service:', window.notificationService ? '✅ Available' : '❌ Missing');
  };
  
  console.log('🚀 Debug tools loaded!');
  console.log('Run: testAdminService() to test admin functions');
  console.log('Run: testNotificationService() to test notifications');
  console.log('Run: testSupabaseConnection() to test database');
  console.log('Run: checkEnvironment() to check setup');
};

// Auto-load debug tools
if (typeof window !== 'undefined') {
  window.debugAdminErrors();
}
