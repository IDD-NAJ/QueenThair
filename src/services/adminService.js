import supabase from '../lib/supabaseClient';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export const adminService = {
  // Dashboard stats
  async getDashboardStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_dashboard_stats');
      
      if (error) {
        console.warn('RPC function not found, calculating stats manually:', error);
        return await this.calculateDashboardStats();
      }
      
      return data?.[0] || await this.calculateDashboardStats();
    } catch (err) {
      console.warn('Using fallback dashboard stats calculation:', err);
      return await this.calculateDashboardStats();
    }
  },

  async calculateDashboardStats() {
    const [orders, users, products, reviews] = await Promise.all([
      this.getOrders({ limit: 1000 }),
      this.getUsers({ limit: 1000 }),
      this.getProducts({ limit: 1000 }),
      this.getReviews({ limit: 1000 })
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalCustomers = new Set(orders.map(o => o.user_id).filter(Boolean)).size;
    const activeUsers = users.filter(u => u.role === 'admin').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const pendingReviews = reviews.filter(r => !r.is_approved).length;
    const approvedReviews = reviews.filter(r => r.is_approved).length;

    // Calculate date-based stats
    const today = new Date();
    const thisWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const revenueToday = orders
      .filter(o => new Date(o.created_at) >= startOfDay(new Date()) && o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);
    
    const revenueThisWeek = orders
      .filter(o => new Date(o.created_at) >= thisWeek && o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);
    
    const revenueThisMonth = orders
      .filter(o => new Date(o.created_at) >= thisMonth && o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);

    const ordersToday = orders.filter(o => new Date(o.created_at) >= startOfDay(new Date())).length;
    const ordersThisWeek = orders.filter(o => new Date(o.created_at) >= thisWeek).length;
    const ordersThisMonth = orders.filter(o => new Date(o.created_at) >= thisMonth).length;

    const newCustomersToday = users.filter(u => 
      u.role === 'customer' && new Date(u.created_at) >= startOfDay(new Date())
    ).length;
    const newCustomersThisWeek = users.filter(u => 
      u.role === 'customer' && new Date(u.created_at) >= thisWeek
    ).length;
    const newCustomersThisMonth = users.filter(u => 
      u.role === 'customer' && new Date(u.created_at) >= thisMonth
    ).length;

    // Calculate inventory stats
    const productsWithInventory = products.filter(p => p.inventory);
    const lowStockProducts = productsWithInventory.filter(p => 
      p.inventory.quantity_available <= p.inventory.low_stock_threshold && 
      p.inventory.quantity_available > 0
    ).length;
    const outOfStockProducts = productsWithInventory.filter(p => 
      p.inventory.quantity_available === 0
    ).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      totalCustomers,
      totalProducts: products.length,
      activeUsers,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      newCustomersToday,
      newCustomersThisWeek,
      newCustomersThisMonth,
      lowStockProducts,
      outOfStockProducts,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      totalReviews: reviews.length,
      pendingReviews,
      approvedReviews
    };
  },

  // Product management
  async getProducts(filters = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        variants:product_variants(*),
        inventory:inventory(*)
      `);

    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createProduct(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Product insert returned no data - check RLS policies');
    }
    return data[0];
  },

  async updateProduct(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Order management
  async getOrders(filters = {}) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:profiles(first_name, last_name),
        items:order_items(*)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateOrderStatus(id, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // User management
  async getUsers(filters = {}) {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        orders:orders(
          id,
          order_number,
          status,
          grand_total,
          created_at
        ),
        addresses:addresses(
          id,
          type,
          full_name,
          phone,
          line1,
          line2,
          city,
          state_region,
          postal_code,
          country,
          is_default
        ),
        reviews:reviews(
          id,
          rating,
          created_at
        )
      `);

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    console.log('AdminService getUsers query result:', { data, error });
    if (data?.length > 0) {
      console.log('Sample customer structure:', data[0]);
    }
    
    if (error) throw error;
    return data;
  },

  async updateUserRole(id, role) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Category management
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  async updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Reviews management
  async getReviews(filters = {}) {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        product:products(name, slug)
      `);

    if (filters.status) {
      // Map status filter to is_approved boolean
      if (filters.status === 'approved') {
        query = query.eq('is_approved', true);
      } else if (filters.status === 'pending') {
        query = query.eq('is_approved', false);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateReviewStatus(id, status) {
    // Map status to is_approved boolean
    const isApproved = status === 'approved';
    
    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved: isApproved })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Contact messages management
  async getContactMessages(filters = {}) {
    let query = supabase
      .from('contact_messages')
      .select('*');

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateContactMessageStatus(id, status) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteContactMessage(id) {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Bulk product operations
  async bulkInsertProducts(products) {
    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (error) throw error;
    return data;
  },

  // Analytics functions
  async getAnalyticsData(dateRange = 30) {
    const [orders, products, users] = await Promise.all([
      this.getOrders({ limit: 5000 }),
      this.getProducts({ limit: 1000 }),
      this.getUsers({ limit: 2000 })
    ]);

    return {
      orders,
      products,
      users,
      dateRange
    };
  },

  // Customer insights
  async getCustomerInsights() {
    const [users, orders, addresses] = await Promise.all([
      this.getUsers({ limit: 2000 }),
      this.getOrders({ limit: 5000 }),
      supabase.from('addresses').select('*').limit(5000)
    ]);

    // Attach addresses to users
    const usersWithAddresses = users.map(user => ({
      ...user,
      addresses: addresses.data?.filter(addr => addr.user_id === user.id) || []
    }));

    return {
      users: usersWithAddresses,
      orders
    };
  },

  // Financial data
  async getFinancialData(dateRange = 30) {
    const orders = await this.getOrders({ limit: 5000 });
    const products = await this.getProducts({ limit: 1000 });

    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);
    
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= cutoffDate
    );

    return {
      orders: filteredOrders,
      products,
      dateRange
    };
  },

  // Inventory analytics
  async getInventoryAnalytics() {
    const [products, inventory] = await Promise.all([
      this.getProducts({ limit: 2000 }),
      supabase.from('inventory').select('*').limit(2000)
    ]);

    // Attach inventory data to products
    const productsWithInventory = products.map(product => ({
      ...product,
      inventory: inventory.data?.find(inv => inv.product_id === product.id) || {}
    }));

    return productsWithInventory;
  },

  // System health
  async getSystemHealth() {
    try {
      const checks = await Promise.allSettled([
        supabase.from('products').select('count').limit(1),
        supabase.from('orders').select('count').limit(1),
        supabase.from('users').select('count').limit(1),
        supabase.from('profiles').select('count').limit(1)
      ]);

      return {
        database: checks.every(check => check.status === 'fulfilled'),
        tables: {
          products: checks[0].status === 'fulfilled',
          orders: checks[1].status === 'fulfilled',
          users: checks[2].status === 'fulfilled',
          profiles: checks[3].status === 'fulfilled'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        database: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Recent activity
  async getRecentActivity(limit = 50) {
    const [recentOrders, recentUsers, recentReviews] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(limit),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(limit),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(limit)
    ]);

    return {
      orders: recentOrders.data || [],
      users: recentUsers.data || [],
      reviews: recentReviews.data || []
    };
  },

  // ── Analytics Functions ───────────────────────────────────────
  async getRevenueAnalytics(days = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_revenue_analytics', { days });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('RPC function not found, using fallback:', err);
      return await this.calculateRevenueAnalytics(days);
    }
  },

  async calculateRevenueAnalytics(days = 30) {
    const orders = await this.getOrders({ limit: 5000 });
    const cutoffDate = subDays(new Date(), days);
    
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= cutoffDate && order.status !== 'cancelled'
    );

    const dailyData = filteredOrders.reduce((acc, order) => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          ordersCount: 0,
          uniqueCustomers: new Set()
        };
      }
      acc[date].revenue += order.grand_total || 0;
      acc[date].ordersCount += 1;
      acc[date].uniqueCustomers.add(order.user_id);
      return acc;
    }, {});

    return Object.values(dailyData).map(day => ({
      ...day,
      uniqueCustomers: day.uniqueCustomers.size,
      avgOrderValue: day.ordersCount > 0 ? day.revenue / day.ordersCount : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  async getTopProducts(days = 30, limitCount = 10) {
    try {
      const { data, error } = await supabase
        .rpc('get_top_products', { days, limit_count: limitCount });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('RPC function not found, using fallback:', err);
      return await this.calculateTopProducts(days, limitCount);
    }
  },

  async calculateTopProducts(days = 30, limitCount = 10) {
    const orders = await this.getOrders({ limit: 5000 });
    const cutoffDate = subDays(new Date(), days);
    
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= cutoffDate && order.status !== 'cancelled'
    );

    const productSales = {};
    
    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              product_id: item.product_id,
              product_name: item.product?.name || 'Unknown',
              product_slug: item.product?.slug || '',
              total_sold: 0,
              revenue: 0,
              category_name: item.product?.category?.name || 'Uncategorized'
            };
          }
          productSales[item.product_id].total_sold += item.quantity || 0;
          productSales[item.product_id].revenue += (item.quantity || 0) * (item.unit_price || 0);
        });
      }
    });

    return Object.values(productSales)
      .map(product => ({
        ...product,
        avg_price: product.total_sold > 0 ? product.revenue / product.total_sold : 0
      }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limitCount);
  },

  async getCustomerAnalytics(days = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_customer_analytics', { days });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('RPC function not found, using fallback:', err);
      return await this.calculateCustomerAnalytics(days);
    }
  },

  async calculateCustomerAnalytics(days = 30) {
    const [users, orders] = await Promise.all([
      this.getUsers({ limit: 2000 }),
      this.getOrders({ limit: 5000 })
    ]);
    
    const cutoffDate = subDays(new Date(), days);
    const customers = users.filter(u => u.role === 'customer');
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= cutoffDate
    );

    // Group by date
    const dailyData = {};
    
    // New customers by date
    customers.forEach(customer => {
      const date = format(new Date(customer.created_at), 'yyyy-MM-dd');
      if (new Date(customer.created_at) >= cutoffDate) {
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            newCustomers: 0,
            totalCustomers: 0,
            repeatCustomers: 0
          };
        }
        dailyData[date].newCustomers += 1;
      }
    });

    // Calculate cumulative customers and repeat customers
    const sortedDates = Object.keys(dailyData).sort();
    let totalCustomers = 0;
    
    sortedDates.forEach(date => {
      totalCustomers += dailyData[date].newCustomers;
      dailyData[date].totalCustomers = totalCustomers;
      
      // Calculate repeat customers for this date
      const dateOrders = filteredOrders.filter(order => 
        format(new Date(order.created_at), 'yyyy-MM-dd') === date
      );
      
      const repeatCustomerIds = new Set();
      dateOrders.forEach(order => {
        if (order.user_id) {
          const customerOrders = filteredOrders.filter(o => 
            o.user_id === order.user_id && 
            new Date(o.created_at) < new Date(order.created_at)
          );
          if (customerOrders.length > 0) {
            repeatCustomerIds.add(order.user_id);
          }
        }
      });
      
      dailyData[date].repeatCustomers = repeatCustomerIds.size;
      dailyData[date].customerRetentionRate = totalCustomers > 0 
        ? Math.round((repeatCustomerIds.size / totalCustomers) * 100 * 100) / 100
        : 0;
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  async getCategoryAnalytics(days = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_category_analytics', { days });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('RPC function not found, using fallback:', err);
      return await this.calculateCategoryAnalytics(days);
    }
  },

  async calculateCategoryAnalytics(days = 30) {
    const orders = await this.getOrders({ limit: 5000 });
    const cutoffDate = subDays(new Date(), days);
    
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= cutoffDate && order.status !== 'cancelled'
    );

    const categoryData = {};
    
    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const categoryName = item.product?.category?.name || 'Uncategorized';
          const categoryId = item.product?.category_id;
          
          if (!categoryData[categoryId]) {
            categoryData[categoryId] = {
              category_id: categoryId,
              category_name: categoryName,
              total_sold: 0,
              revenue: 0,
              orders_count: 0,
              products: new Set()
            };
          }
          
          categoryData[categoryId].total_sold += item.quantity || 0;
          categoryData[categoryId].revenue += (item.quantity || 0) * (item.unit_price || 0);
          categoryData[categoryId].orders_count += 1;
          categoryData[categoryId].products.add(item.product_id);
        });
      }
    });

    return Object.values(categoryData)
      .map(category => ({
        ...category,
        avg_order_value: category.orders_count > 0 ? category.revenue / category.orders_count : 0,
        top_product: Array.from(category.products)[0] || null
      }))
      .sort((a, b) => b.revenue - a.revenue);
  },

  async getGeographicDistribution() {
    try {
      const { data, error } = await supabase
        .rpc('get_geographic_distribution');
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('RPC function not found, using fallback:', err);
      return await this.calculateGeographicDistribution();
    }
  },

  async calculateGeographicDistribution() {
    const [addresses, profiles, orders] = await Promise.all([
      supabase.from('addresses').select('*'),
      this.getUsers({ limit: 2000 }),
      this.getOrders({ limit: 5000 })
    ]);

    const customers = profiles.filter(p => p.role === 'customer');
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    
    const locationData = {};
    
    addresses.data?.forEach(address => {
      const customer = customers.find(c => c.id === address.user_id);
      if (customer) {
        const key = `${address.country}-${address.state_region}-${address.city}`;
        
        if (!locationData[key]) {
          locationData[key] = {
            country: address.country,
            state_region: address.state_region,
            city: address.city,
            customer_count: 0,
            total_orders: 0,
            total_revenue: 0,
            customers: new Set()
          };
        }
        
        locationData[key].customers.add(address.user_id);
        locationData[key].customer_count = locationData[key].customers.size;
      }
    });
    
    // Add order data
    validOrders.forEach(order => {
      if (order.user_id) {
        const customerAddresses = addresses.data?.filter(a => a.user_id === order.user_id);
        customerAddresses?.forEach(address => {
          const key = `${address.country}-${address.state_region}-${address.city}`;
          if (locationData[key]) {
            locationData[key].total_orders += 1;
            locationData[key].total_revenue += order.grand_total || 0;
          }
        });
      }
    });

    return Object.values(locationData)
      .filter(location => location.customer_count > 0)
      .sort((a, b) => b.customer_count - a.customer_count);
  },

  // ── Coupon / Promo Code Management (table: promo_codes) ─────────────
  async getCoupons() {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createCoupon(couponData) {
    const { data, error } = await supabase
      .from('promo_codes')
      .insert(couponData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCoupon(id, updates) {
    const { data, error } = await supabase
      .from('promo_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCoupon(id) {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ── Announcement Management ───────────────────────────────────
  async getAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createAnnouncement(announcementData) {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAnnouncement(id, updates) {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAnnouncement(id) {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateAnnouncementOrder(id, sortOrder) {
    const { data, error } = await supabase
      .from('announcements')
      .update({ sort_order: sortOrder })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async logActivity(adminUserId, actionType, entityType, entityId, details = null) {
    try {
      // Get current user if not provided
      let userId = adminUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      // Skip logging if no user ID available
      if (!userId) {
        console.warn('Cannot log activity: No user ID available');
        return;
      }

      const { error } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: userId,
          action: actionType,
          entity_type: entityType,
          entity_id: entityId,
          details: details
        });
      
      if (error) throw error;
    } catch (err) {
      console.warn('Failed to log activity:', err);
    }
  },

  async getActivities(filters = {}) {
    let query = supabase
      .from('admin_activity_logs')
      .select(`
        *,
        profiles(first_name, last_name, email)
      `);

    if (filters.actionType) {
      query = query.eq('action', filters.actionType);
    }
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.adminUserId) {
      query = query.eq('admin_id', filters.adminUserId);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100);
    
    if (error) throw error;
    return data || [];
  },

  // ── Enhanced Product Management ────────────────────────────────
  async getProductsWithImages(filters = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        variants:product_variants(*),
        inventory:inventory(*),
        images:product_images(*),
        reviews:reviews(count)
      `);

    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.status === 'active') {
      query = query.eq('is_active', true);
    } else if (filters.status === 'inactive') {
      query = query.eq('is_active', false);
    }
    if (filters.featured) {
      query = query.eq('featured', true);
    }
    if (filters.new_arrival) {
      query = query.eq('new_arrival', true);
    }
    if (filters.best_seller) {
      query = query.eq('best_seller', true);
    }
    if (filters.on_sale) {
      query = query.eq('on_sale', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createProductWithImages(productData, imageData = null) {
    // Ensure required fields have defaults
    const completeProductData = {
      ...productData,
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      featured: productData.featured || false,
      new_arrival: productData.new_arrival || false,
      best_seller: productData.best_seller || false,
      on_sale: productData.on_sale || false,
      rating_average: 0,
      review_count: 0
    };

    // Create the product
    const { data: products, error: productError } = await supabase
      .from('products')
      .insert(completeProductData)
      .select();
    
    if (productError) {
      console.error('Product insert error:', productError);
      throw productError;
    }

    if (!products || products.length === 0) {
      throw new Error('Failed to create product: No data returned');
    }

    const product = products[0];

    try {
      // Create inventory record
      await supabase
        .from('inventory')
        .insert({
          product_id: product.id,
          quantity_available: 0,
          quantity_reserved: 0,
          low_stock_threshold: 5,
          track_inventory: true,
          allow_backorder: false
        });

      // Handle images if provided
      if (imageData && imageData.length > 0) {
        const imagesToInsert = imageData.filter(img => img.url).map((img, index) => ({
          product_id: product.id,
          image_url: img.url,
          alt_text: img.alt_text || productData.name,
          sort_order: index,
          is_primary: index === 0
        }));

        if (imagesToInsert.length > 0) {
          await supabase
            .from('product_images')
            .insert(imagesToInsert);
        }
      }

      return product;
    } catch (error) {
      // If anything fails, try to rollback the product creation
      console.error('Error creating product resources:', error);
      await supabase.from('products').delete().eq('id', product.id);
      throw error;
    }
  },

  // ── Admin Permissions ───────────────────────────────────────────
  async checkAdminPermission(userId, permission) {
    try {
      // Get user role and permissions
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, permissions')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Super admins have all permissions
      if (profile.role === 'super_admin') {
        return true;
      }
      
      // Check if permission is in user's permission array
      if (profile.permissions && Array.isArray(profile.permissions)) {
        return profile.permissions.includes(permission);
      }
      
      // Default role-based permissions
      const rolePermissions = {
        admin: [
          'products.view', 'products.create', 'products.edit', 'products.delete',
          'orders.view', 'orders.edit', 'customers.view', 'analytics.view',
          'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
          'collections.view', 'collections.create', 'collections.edit', 'collections.delete',
          'banners.view', 'banners.create', 'banners.edit', 'banners.delete',
          'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.delete',
          'shipping.view', 'shipping.edit', 'taxes.view', 'taxes.edit',
          'email_templates.view', 'email_templates.edit',
          'reviews.view', 'reviews.edit', 'messages.view', 'messages.edit',
          'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
          'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.delete',
          'reports.view', 'integrations.view', 'backup.view', 'logs.view'
        ],
        manager: [
          'products.view', 'products.create', 'products.edit',
          'orders.view', 'orders.edit', 'customers.view',
          'categories.view', 'categories.create', 'categories.edit',
          'collections.view', 'collections.create', 'collections.edit',
          'banners.view', 'banners.create', 'banners.edit',
          'reviews.view', 'reviews.edit', 'messages.view', 'messages.edit',
          'coupons.view', 'coupons.create', 'coupons.edit'
        ],
        support: [
          'orders.view', 'customers.view', 'messages.view', 'messages.edit',
          'reviews.view', 'reviews.edit'
        ]
      };
      
      const userPermissions = rolePermissions[profile.role] || [];
      return userPermissions.includes(permission);
    } catch (error) {
      console.warn('Permission check failed:', error);
      return false;
    }
  },

  async getAdminUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updateAdminPermissions(userId, permissions) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ permissions })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ── Search Functionality ───────────────────────────────────────────
  async searchAdmin(query, type = 'all') {
    try {
      const results = {};
      
      if (type === 'all' || type === 'products') {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, slug, price, category:categories(name)')
          .ilike('name', `%${query}%`)
          .limit(10);
        results.products = products || [];
      }
      
      if (type === 'all' || type === 'orders') {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, status, grand_total, created_at, email')
          .or(`order_number.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10);
        results.orders = orders || [];
      }
      
      if (type === 'all' || type === 'customers') {
        const { data: customers } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, created_at')
          .ilike('first_name', `%${query}%`)
          .ilike('last_name', `%${query}%`)
          .ilike('email', `%${query}%`)
          .limit(10);
        results.customers = customers || [];
      }
      
      if (type === 'all' || type === 'categories') {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, slug')
          .ilike('name', `%${query}%`)
          .limit(10);
        results.categories = categories || [];
      }
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return { products: [], orders: [], customers: [], categories: [] };
    }
  },

  // ── Notification System (table: notifications) ───────────────────────
  async getNotifications(userId, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    return data || [];
  },

  async markNotificationAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createNotification(userId, type, title, message, actionUrl = null) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return notification;
  },

  // ── Dashboard Preferences (stored in admin_settings) ─────────────────
  async getDashboardPreferences(userId) {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', `dashboard_prefs_${userId}`)
      .single();
    
    if (error && error.code !== 'PGRST116') return null;
    return data?.value_json || null;
  },

  async updateDashboardPreferences(userId, preferences) {
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({
        key: `dashboard_prefs_${userId}`,
        value_json: preferences,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ── Enhanced Order Management ───────────────────────────────────
  async getOrderDetails(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:profiles(first_name, last_name, email),
        items:order_items(
          *,
          product:products(name, slug),
          product_images:product_images(image_url, alt_text, is_primary)
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateOrderStatus(orderId, status, notes = null) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async addOrderNote(orderId, note) {
    const { data, error } = await supabase
      .from('orders')
      .select('notes')
      .eq('id', orderId)
      .single();
    
    if (error) throw error;

    const currentNotes = data.notes || [];
    const newNote = {
      id: crypto.randomUUID(),
      note,
      created_at: new Date().toISOString(),
      created_by: 'admin' // This should come from auth context
    };

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ notes: [...currentNotes, newNote] })
      .eq('id', orderId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    return updatedOrder;
  },

  // ── Enhanced Customer Management ────────────────────────────────
  async getCustomerDetails(customerId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        addresses:addresses(*),
        orders:orders(
          id,
          order_number,
          status,
          grand_total,
          created_at,
          items:order_items(count)
        ),
        reviews:reviews(*)
      `)
      .eq('id', customerId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCustomerProfile(customerId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', customerId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getCustomerOrders(customerId, filters = {}) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name, slug)
        )
      `)
      .eq('user_id', customerId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // ── Inventory Management ───────────────────────────────────────
  async getInventoryList(filters = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        inventory:inventory(*),
        variants:product_variants(*),
        images:product_images(image_url, is_primary)
      `)
      .eq('is_active', true);

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.stockLevel) {
      if (filters.stockLevel === 'low') {
        query = query.lt('inventory.quantity_available', 'inventory.low_stock_threshold')
          .gt('inventory.quantity_available', 0);
      } else if (filters.stockLevel === 'out') {
        query = query.eq('inventory.quantity_available', 0);
      } else if (filters.stockLevel === 'normal') {
        query = query.gte('inventory.quantity_available', 'inventory.low_stock_threshold');
      }
    }

    const { data, error } = await query.order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async updateStock(productId, quantity, reason = 'adjustment') {
    // Get current inventory
    const { data: currentInventory, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_id', productId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // Update or create inventory record
    let inventoryData;
    if (currentInventory) {
      const { data, error } = await supabase
        .from('inventory')
        .update({ 
          quantity_available: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId)
        .select()
        .single();
      
      if (error) throw error;
      inventoryData = data;
    } else {
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          product_id: productId,
          quantity_available: quantity,
          quantity_reserved: 0,
          low_stock_threshold: 5,
          track_inventory: true,
          allow_backorder: false
        })
        .select()
        .single();
      
      if (error) throw error;
      inventoryData = data;
    }

    // Log the movement
    const quantityChange = quantity - (currentInventory?.quantity_available || 0);
    await this.logInventoryMovement(productId, quantityChange, reason);

    return inventoryData;
  },

  async logInventoryMovement(productId, quantityChange, movementType, referenceId = null, notes = null) {
    // inventory_movements table not in schema — log to admin_activity_logs instead
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: `inventory_${movementType}`,
          entity_type: 'inventory',
          entity_id: productId,
          details: { quantity_change: quantityChange, reference_id: referenceId, notes }
        });
    } catch (err) {
      console.warn('Failed to log inventory movement:', err);
    }
  },

  async getInventoryMovements(filters = {}) {
    // Fallback: return inventory records with change history from activity logs
    let query = supabase
      .from('admin_activity_logs')
      .select(`
        *,
        product:entity_id
      `)
      .eq('entity_type', 'inventory');

    if (filters.productId) {
      query = query.eq('entity_id', filters.productId);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100);
    
    if (error) return [];
    return data || [];
  },

  _parseCsvToArray(str) {
    if (!str || typeof str !== 'string') return [];
    return str.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  },

  _arrayToCsv(arr) {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.join(', ');
  },

  // ── admin_settings (key/value) ─────────────────────────────────
  async getAdminSetting(key) {
    const { data, error } = await supabase.from('admin_settings').select('*').eq('key', key).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async upsertAdminSetting(key, options = {}) {
    const existing = await this.getAdminSetting(key);
    const payload = { updated_at: new Date().toISOString() };
    if (Object.prototype.hasOwnProperty.call(options, 'value_text')) payload.value_text = options.value_text;
    if (Object.prototype.hasOwnProperty.call(options, 'value_json')) payload.value_json = options.value_json;
    if (Object.prototype.hasOwnProperty.call(options, 'description')) payload.description = options.description;
    if (existing?.id) {
      const { data, error } = await supabase.from('admin_settings').update(payload).eq('key', key).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('admin_settings').insert({ key, ...payload }).select().single();
    if (error) throw error;
    return data;
  },

  // ── Banners ───────────────────────────────────────────────────
  _bannerToRow(form) {
    const device = form.device_target === 'all' ? 'primary' : form.device_target;
    return {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: form.image_url,
      mobile_image_url: form.mobile_image_url || null,
      link_url: form.link_url || null,
      link_text: form.button_text || null,
      button_style: device || 'primary',
      text_color: form.text_color || '#FFFFFF',
      text_position: form.position || 'center',
      sort_order: Number(form.sort_order) || 0,
      is_active: !!form.active,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null
    };
  },

  _bannerFromRow(row) {
    const style = row.button_style || 'primary';
    const device = ['desktop', 'mobile'].includes(style) ? style : 'all';
    return {
      ...row,
      button_text: row.link_text || '',
      position: row.text_position || 'homepage',
      device_target: device,
      active: row.is_active,
      background_color: '#000000',
      clicks: 0,
      impressions: 0
    };
  },

  async getBanners() {
    const { data, error } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map((r) => this._bannerFromRow(r));
  },

  async createBanner(form) {
    const { data, error } = await supabase.from('banners').insert(this._bannerToRow(form)).select().single();
    if (error) throw error;
    return this._bannerFromRow(data);
  },

  async updateBanner(id, form) {
    const { data, error } = await supabase.from('banners').update(this._bannerToRow(form)).eq('id', id).select().single();
    if (error) throw error;
    return this._bannerFromRow(data);
  },

  async deleteBanner(id) {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Blogs ─────────────────────────────────────────────────────
  _blogFromRow(row, authorProfile) {
    const authorName = authorProfile
      ? [authorProfile.first_name, authorProfile.last_name].filter(Boolean).join(' ')
      : '';
    const tags = Array.isArray(row.tags) ? row.tags.join(', ') : '';
    return {
      ...row,
      status: row.is_published ? 'published' : 'draft',
      author: authorName,
      tags,
      meta_title: row.seo_title || '',
      meta_description: row.seo_description || '',
      allow_comments: true,
      views: row.view_count || 0,
      comments: 0
    };
  },

  async getBlogs() {
    const { data, error } = await supabase
      .from('blogs')
      .select(`*, author:profiles(first_name, last_name)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this._blogFromRow(r, r.author));
  },

  async createBlog(form, authorId) {
    const tags = this._parseCsvToArray(form.tags);
    const row = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content,
      featured_image: form.featured_image || null,
      author_id: authorId || null,
      category: form.category || null,
      tags: tags.length ? tags : null,
      is_published: form.status === 'published',
      is_featured: !!form.featured,
      published_at: form.status === 'published' ? (form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString()) : null,
      seo_title: form.meta_title || null,
      seo_description: form.meta_description || null
    };
    const { data, error } = await supabase.from('blogs').insert(row).select(`*, author:profiles(first_name, last_name)`).single();
    if (error) throw error;
    return this._blogFromRow(data, data.author);
  },

  async updateBlog(id, form) {
    const tags = this._parseCsvToArray(form.tags);
    const row = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content,
      featured_image: form.featured_image || null,
      category: form.category || null,
      tags: tags.length ? tags : null,
      is_published: form.status === 'published',
      is_featured: !!form.featured,
      published_at: form.status === 'published' ? (form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString()) : null,
      seo_title: form.meta_title || null,
      seo_description: form.meta_description || null
    };
    const { data, error } = await supabase.from('blogs').update(row).eq('id', id).select(`*, author:profiles(first_name, last_name)`).single();
    if (error) throw error;
    return this._blogFromRow(data, data.author);
  },

  async deleteBlog(id) {
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Shipping zones & rates ────────────────────────────────────
  async getShippingZonesWithRates() {
    const [{ data: zones, error: zErr }, { data: rates, error: rErr }] = await Promise.all([
      supabase.from('shipping_zones').select('*').order('name'),
      supabase.from('shipping_rates').select('*').order('name')
    ]);
    if (zErr) throw zErr;
    if (rErr) throw rErr;
    const zlist = zones || [];
    const rlist = rates || [];
    const zonesUi = zlist.map((z) => ({
      id: z.id,
      name: z.name,
      countries: this._arrayToCsv(z.countries),
      states: this._arrayToCsv(z.states),
      postal_codes: this._arrayToCsv(z.postal_codes),
      active: z.is_active,
      created_at: z.created_at,
      rate_count: rlist.filter((r) => r.zone_id === z.id).length
    }));
    const ratesUi = rlist.map((r) => {
      const zone = zlist.find((z) => z.id === r.zone_id);
      let type = 'flat_rate';
      if (r.rate_type === 'weight_based') type = 'per_weight';
      if (r.rate_type === 'price_based') type = 'per_item';
      return {
        id: r.id,
        name: r.name,
        zone_id: r.zone_id,
        zone_name: zone?.name || '',
        type,
        base_cost: String(r.base_rate ?? 0),
        cost_per_item: '0.00',
        cost_per_weight: '0.00',
        free_shipping_threshold: r.free_shipping_threshold != null ? String(r.free_shipping_threshold) : '',
        min_delivery_days: r.min_delivery_days != null ? String(r.min_delivery_days) : '',
        max_delivery_days: r.max_delivery_days != null ? String(r.max_delivery_days) : '',
        active: r.is_active,
        created_at: r.created_at
      };
    });
    return { zones: zonesUi, rates: ratesUi };
  },

  _shippingRateTypeToDb(uiType) {
    if (uiType === 'per_weight') return 'weight_based';
    if (uiType === 'per_item') return 'price_based';
    return 'flat';
  },

  async upsertShippingZone(form, id = null) {
    const row = {
      name: form.name,
      countries: this._parseCsvToArray(form.countries),
      states: this._parseCsvToArray(form.states),
      postal_codes: this._parseCsvToArray(form.postal_codes),
      is_active: !!form.active
    };
    if (!row.countries.length) row.countries = ['US'];
    if (id) {
      const { data, error } = await supabase.from('shipping_zones').update(row).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('shipping_zones').insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async deleteShippingZone(id) {
    const { error } = await supabase.from('shipping_zones').delete().eq('id', id);
    if (error) throw error;
  },

  async upsertShippingRate(form, id = null) {
    const row = {
      zone_id: form.zone_id,
      name: form.name,
      description: null,
      rate_type: this._shippingRateTypeToDb(form.type),
      base_rate: parseFloat(form.base_cost) || 0,
      min_order_amount: null,
      max_order_amount: null,
      free_shipping_threshold: form.free_shipping_threshold ? parseFloat(form.free_shipping_threshold) : null,
      min_delivery_days: form.min_delivery_days ? parseInt(form.min_delivery_days, 10) : null,
      max_delivery_days: form.max_delivery_days ? parseInt(form.max_delivery_days, 10) : null,
      is_active: !!form.active
    };
    if (id) {
      const { data, error } = await supabase.from('shipping_rates').update(row).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('shipping_rates').insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async deleteShippingRate(id) {
    const { error } = await supabase.from('shipping_rates').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Tax rates & classes (classes stored in admin_settings) ──
  async getTaxData() {
    const [{ data: rates, error: rErr }, classesRow] = await Promise.all([
      supabase.from('tax_rates').select('*').order('priority', { ascending: true }),
      this.getAdminSetting('tax_classes')
    ]);
    if (rErr) throw rErr;
    const classes = classesRow?.value_json?.items || [];
    const defaultClass = classes[0];
    const rules = (rates || []).map((t) => ({
      id: t.id,
      name: t.name,
      country: t.country,
      state: t.state_region || '',
      postal_codes: t.postal_code || '',
      tax_class_id: defaultClass?.id || '',
      tax_class_name: defaultClass?.name || 'Standard',
      rate: String(t.rate ?? 0),
      compounding: !!t.compound,
      shipping: !!t.shipping_taxable,
      active: t.is_active,
      priority: t.priority ?? 0,
      created_at: t.created_at
    }));
    const classesUi = classes.length
      ? classes.map((c) => ({
          ...c,
          rule_count: rules.filter((r) => r.tax_class_id === c.id).length
        }))
      : [
          { id: 'standard', name: 'Standard', slug: 'standard', description: 'Default', created_at: null, rule_count: rules.length }
        ];
    return { rules, classes: classesUi };
  },

  async upsertTaxRate(form, id = null) {
    const countries = this._parseCsvToArray(form.country);
    const row = {
      name: form.name,
      country: countries[0] || 'US',
      state_region: form.state || null,
      city: null,
      postal_code: form.postal_codes || null,
      rate: parseFloat(form.rate) || 0,
      priority: Number(form.priority) || 0,
      compound: !!form.compounding,
      shipping_taxable: !!form.shipping,
      is_active: form.active !== false
    };
    if (id) {
      const { data, error } = await supabase.from('tax_rates').update(row).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('tax_rates').insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async deleteTaxRate(id) {
    const { error } = await supabase.from('tax_rates').delete().eq('id', id);
    if (error) throw error;
  },

  async saveTaxClasses(items) {
    await this.upsertAdminSetting('tax_classes', { value_json: { items } });
  },

  // ── Staff / admin users (profiles.role = admin) ───────────────
  async getStaffAdminUsers() {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: false });
    if (error) throw error;
    const roleLabels = { admin: 'Admin', super_admin: 'Super Admin', manager: 'Manager', support: 'Support', customer: 'Customer' };
    return (data || []).map((row) => ({
      id: row.id,
      name: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Admin',
      email: row.email || '',
      role: row.role,
      role_name: roleLabels[row.role] || row.role,
      active: true,
      phone: row.phone || '',
      department: '',
      last_login: null,
      created_at: row.created_at,
      login_count: 0,
      two_factor_enabled: false,
      _profile: row
    }));
  },

  async updateStaffProfile(userId, { first_name, last_name, phone, email }) {
    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    return this.updateCustomerProfile(userId, updates);
  },

  // ── Activity → system log shape (AdminLogs) ───────────────────
  mapActivityToSystemLog(row) {
    const admin = row.profiles;
    const email = admin?.email || '';
    const name = admin ? [admin.first_name, admin.last_name].filter(Boolean).join(' ') : '';
    let level = 'info';
    if (row.action === 'delete') level = 'warning';
    if (String(row.action || '').includes('error') || String(row.action || '').includes('fail')) level = 'error';
    if (row.action === 'create') level = 'success';
    const category = (row.entity_type || 'system').toLowerCase();
    const catMap = {
      order: 'api',
      product: 'database',
      customer: 'auth',
      coupon: 'api',
      inventory: 'database'
    };
    return {
      id: row.id,
      level,
      message: `${row.action || 'action'} on ${row.entity_type || 'entity'}${name ? ` by ${name}` : ''}`,
      category: catMap[category] || 'system',
      category_name: row.entity_type || 'System',
      user_id: row.admin_id,
      user_email: email,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: row.created_at,
      context: row.details || {}
    };
  },

  async getSystemLogs(filters = {}) {
    const rows = await this.getActivities({ ...filters, limit: filters.limit || 200 });
    return (rows || []).map((r) => this.mapActivityToSystemLog(r));
  },

  // ── Integrations / maintenance / site prefs / backups / templates
  async getIntegrationsList() {
    const row = await this.getAdminSetting('integrations');
    return row?.value_json?.items || [];
  },

  async saveIntegrationsList(items) {
    await this.upsertAdminSetting('integrations', { value_json: { items } });
  },

  async getMaintenanceBundle() {
    const [modeRow, schedRow, sysRow] = await Promise.all([
      this.getAdminSetting('maintenance_mode'),
      this.getAdminSetting('maintenance_schedule'),
      this.getAdminSetting('maintenance_system_status')
    ]);
    return {
      maintenanceMode: modeRow?.value_json?.enabled === true,
      scheduledMaintenance: schedRow?.value_json || null,
      systemStatus: sysRow?.value_json || {}
    };
  },

  async setMaintenanceMode(enabled) {
    await this.upsertAdminSetting('maintenance_mode', { value_json: { enabled: !!enabled } });
  },

  async setMaintenanceSchedule(payload) {
    await this.upsertAdminSetting('maintenance_schedule', { value_json: payload });
  },

  async setMaintenanceSystemSettings(payload) {
    await this.upsertAdminSetting('maintenance_system_settings', { value_json: payload });
  },

  async getSiteStoreSettings() {
    const row = await this.getAdminSetting('site_store_settings');
    return (
      row?.value_json || {
        siteName: 'QueenTEE',
        siteUrl: '',
        supportEmail: '',
        currency: 'USD',
        taxRate: '0',
        shippingFee: '0',
        freeShippingThreshold: '0'
      }
    );
  },

  async saveSiteStoreSettings(payload) {
    await this.upsertAdminSetting('site_store_settings', { value_json: payload });
  },

  async getHomepageCategorySection() {
    const row = await this.getAdminSetting('homepage_category_section');
    return row?.value_json || null;
  },

  async saveHomepageCategorySection(payload) {
    await this.upsertAdminSetting('homepage_category_section', { value_json: payload });
  },

  _homepageShowcaseStoragePathFromPublicUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const marker = '/object/public/homepage-showcase/';
    const i = url.indexOf(marker);
    if (i === -1) return null;
    let path = url.slice(i + marker.length).split('?')[0];
    path = decodeURIComponent(path);
    if (!path || path.includes('..') || path.startsWith('/')) return null;
    return path;
  },

  /** Remove a file from `homepage-showcase` only when the URL is our public object path; external URLs are ignored. */
  async deleteHomepageShowcaseMediaIfOwned(publicUrl) {
    const path = this._homepageShowcaseStoragePathFromPublicUrl(publicUrl);
    if (!path) return;
    const { error } = await supabase.storage.from('homepage-showcase').remove([path]);
    if (error) console.warn('Homepage showcase storage delete:', error.message);
  },

  /**
   * Resolves Content-Type for Storage uploads. Supabase rejects unknown/empty MIME types with 400 when the bucket
   * has allowed_mime_types set; some OSes report empty type or non-standard values (e.g. image/jpg).
   */
  _contentTypeForHomepageShowcaseUpload(file) {
    const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const ext = rawExt || '';
    const fromExt = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime'
    }[ext];
    const t = (file.type || '').trim().toLowerCase();
    const normalized =
      t === 'image/jpg' || t === 'image/pjpeg' ? 'image/jpeg' : t;
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]);
    if (normalized && allowed.has(normalized)) return normalized;
    if (fromExt) return fromExt;
    return null;
  },

  /** Upload image or video to storage bucket `homepage-showcase` (apply migration 033). */
  async uploadHomepageShowcaseMedia(file) {
    const contentType = this._contentTypeForHomepageShowcaseUpload(file);
    if (!contentType) {
      throw new Error(
        'Unsupported file type for homepage media. Use JPEG, PNG, GIF, WebP, MP4, WebM, or MOV.'
      );
    }
    const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const ext =
      rawExt ||
      ({
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov'
      }[contentType] ||
        'bin');
    const path = `cards/${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
    const { error } = await supabase.storage.from('homepage-showcase').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType
    });
    if (error) throw error;
    const { data } = supabase.storage.from('homepage-showcase').getPublicUrl(path);
    return data.publicUrl;
  },

  async getBackupRecords() {
    const row = await this.getAdminSetting('backup_records');
    return row?.value_json?.items || [];
  },

  async saveBackupRecords(items) {
    await this.upsertAdminSetting('backup_records', { value_json: { items } });
  },

  async getEmailTemplatesStore() {
    const row = await this.getAdminSetting('email_templates');
    return row?.value_json?.items || [];
  },

  async saveEmailTemplatesStore(items) {
    await this.upsertAdminSetting('email_templates', { value_json: { items } });
  },

  async listSavedReports() {
    const row = await this.getAdminSetting('saved_admin_reports');
    return row?.value_json?.reports || [];
  },

  async saveSavedReports(reports) {
    await this.upsertAdminSetting('saved_admin_reports', { value_json: { reports } });
  },

  // ── Product Variants Management ──────────────────────────────
  async deleteProductVariants(productId) {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);
    
    if (error) throw error;
  },

  async createProductVariants(productId, variants) {
    if (!variants || variants.length === 0) return [];
    
    const variantsToInsert = variants.map(v => ({
      product_id: productId,
      sku: v.sku,
      color: v.color,
      length: v.length,
      density: v.density,
      price_override: v.price_override ? parseFloat(v.price_override) : null,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select();
    
    if (error) throw error;
    return data || [];
  },

  async updateProductImage(productId, imageUrl) {
    const { data, error } = await supabase
      .from('product_images')
      .update({ image_url: imageUrl })
      .eq('product_id', productId)
      .eq('is_primary', true)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  _reportDateCutoff(rangeKey) {
    const now = new Date();
    if (rangeKey === 'today') return startOfDay(now);
    if (rangeKey === 'yesterday') return startOfDay(subDays(now, 1));
    if (rangeKey === 'last_7_days') return subDays(now, 7);
    if (rangeKey === 'last_30_days') return subDays(now, 30);
    if (rangeKey === 'last_90_days') return subDays(now, 90);
    if (rangeKey === 'this_month') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (rangeKey === 'last_month') return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    if (rangeKey === 'this_year') return new Date(now.getFullYear(), 0, 1);
    return subDays(now, 30);
  },

  async getReportPayload(reportType, dateRangeKey = 'last_30_days') {
    const cutoff = this._reportDateCutoff(dateRangeKey);
    const orders = await this.getOrders({ limit: 5000 });
    const products = await this.getProducts({ limit: 2000 });
    const users = await this.getUsers({ limit: 3000 });
    const inRange = (o) => new Date(o.created_at) >= cutoff;
    const rangeOrders = orders.filter(inRange);

    if (reportType === 'sales_summary') {
      const totalRevenue = rangeOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.grand_total || 0), 0);
      const dailyMap = {};
      rangeOrders.forEach((o) => {
        if (o.status === 'cancelled') return;
        const d = format(new Date(o.created_at), 'yyyy-MM-dd');
        dailyMap[d] = (dailyMap[d] || 0) + (o.grand_total || 0);
      });
      const dailySales = Object.entries(dailyMap)
        .map(([date, sales]) => ({ date, sales }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const topProducts = await this.calculateTopProducts(30, 5);
      return {
        totalRevenue,
        totalOrders: rangeOrders.length,
        averageOrderValue: rangeOrders.length ? totalRevenue / rangeOrders.length : 0,
        topProducts: (topProducts || []).map((p) => ({ name: p.product_name, sales: p.total_sold, revenue: p.revenue })),
        dailySales: dailySales.slice(-14)
      };
    }

    if (reportType === 'product_performance') {
      const topSelling = await this.calculateTopProducts(90, 10);
      const lowStock = products
        .filter((p) => p.inventory && p.inventory.quantity_available <= (p.inventory.low_stock_threshold || 5))
        .slice(0, 15)
        .map((p) => ({
          name: p.name,
          stock: p.inventory?.quantity_available ?? 0,
          reorderLevel: p.inventory?.low_stock_threshold ?? 5
        }));
      return {
        topSelling: (topSelling || []).map((p) => ({
          name: p.product_name,
          units: p.total_sold,
          revenue: p.revenue,
          growth: 0
        })),
        lowStock
      };
    }

    if (reportType === 'customer_analysis') {
      const customerOrders = {};
      rangeOrders.forEach((o) => {
        const key = o.user_id || o.email;
        customerOrders[key] = (customerOrders[key] || 0) + 1;
      });
      const newCustomers = users.filter((u) => u.role === 'customer' && new Date(u.created_at) >= cutoff).length;
      return {
        totalCustomers: users.filter((u) => u.role === 'customer').length,
        newCustomers,
        repeatCustomers: Object.values(customerOrders).filter((c) => c > 1).length
      };
    }

    if (reportType === 'inventory_report') {
      return {
        products: products.map((p) => ({
          name: p.name,
          sku: p.slug,
          quantity: p.inventory?.quantity_available ?? 0,
          lowStockThreshold: p.inventory?.low_stock_threshold ?? 0
        }))
      };
    }

    if (reportType === 'order_summary') {
      const byStatus = {};
      rangeOrders.forEach((o) => {
        byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      });
      return { byStatus, total: rangeOrders.length };
    }

    if (reportType === 'financial_report') {
      const paid = rangeOrders.filter((o) => o.status !== 'cancelled');
      const revenue = paid.reduce((s, o) => s + (o.grand_total || 0), 0);
      const tax = paid.reduce((s, o) => s + (o.tax_total || 0), 0);
      const shipping = paid.reduce((s, o) => s + (o.shipping_total || 0), 0);
      return { revenue, tax, shipping, net: revenue - tax };
    }

    if (reportType === 'tax_report') {
      const { data: taxRates } = await supabase.from('tax_rates').select('*').eq('is_active', true);
      const taxCollected = rangeOrders.reduce((s, o) => s + (o.tax_total || 0), 0);
      return { taxCollected, activeRates: taxRates || [] };
    }

    if (reportType === 'marketing_performance') {
      return {
        ordersWithPromo: rangeOrders.filter((o) => o.promo_code).length,
        totalOrders: rangeOrders.length
      };
    }

    return {};
  }
};

export default adminService;
