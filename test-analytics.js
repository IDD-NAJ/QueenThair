// Analytics Test Script
// Run this in browser console to debug analytics issues

window.testAnalytics = async function() {
  console.log('🔍 Testing Analytics Data Loading...');
  
  try {
    // Test individual service calls
    console.log('📊 Testing adminService.getOrders()...');
    const orders = await window.adminService?.getOrders();
    console.log('Orders result:', orders);
    console.log('Orders count:', orders?.length);
    console.log('First order sample:', orders?.[0]);
    
    console.log('🛍️ Testing adminService.getProducts()...');
    const products = await window.adminService?.getProducts();
    console.log('Products result:', products);
    console.log('Products count:', products?.length);
    console.log('First product sample:', products?.[0]);
    
    console.log('👥 Testing adminService.getUsers()...');
    const users = await window.adminService?.getUsers();
    console.log('Users result:', users);
    console.log('Users count:', users?.length);
    console.log('First user sample:', users?.[0]);
    
    // Test data relationships
    if (orders?.length > 0 && products?.length > 0) {
      console.log('🔗 Testing order-product relationships...');
      const firstOrder = orders[0];
      console.log('First order items:', firstOrder.items);
      
      if (firstOrder.items && firstOrder.items.length > 0) {
        const firstItem = firstOrder.items[0];
        const matchingProduct = products.find(p => p.id === firstItem.product_id);
        console.log('First item:', firstItem);
        console.log('Matching product:', matchingProduct);
      }
    }
    
    // Test utilities
    console.log('🛠️ Testing utility functions...');
    console.log('getSafeArray test:', window.getSafeArray?.(orders));
    console.log('safeCurrencyFormat test:', window.safeCurrencyFormat?.(123.45));
    console.log('safeCalculatePercentage test:', window.safeCalculatePercentage?.(25, 100));
    
  } catch (error) {
    console.error('❌ Analytics test failed:', error);
    console.log('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
  }
};

// Load the test function
if (typeof window !== 'undefined') {
  console.log('🔍 Analytics test script loaded!');
  console.log('Run: testAnalytics() to debug analytics data loading');
}
