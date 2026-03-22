// Utility functions for admin pages

export const handleAdminError = (error, fallbackMessage = 'An error occurred') => {
  // Enhanced error logging
  console.error('Admin Error Details:', {
    error,
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
    statusText: error?.statusText
  });
  
  // Extract error message from various error formats
  let errorMessage = fallbackMessage;
  
  // Supabase errors
  if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error?.message) {
    errorMessage = error.error.message;
  } else if (error?.details) {
    errorMessage = error.details;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Handle specific error codes
  if (error?.code === 'PGRST116' || errorMessage?.includes('does not exist')) {
    return 'Table not found. Please check database setup.';
  }
  
  if (error?.code === 'PGRST200' || errorMessage?.includes('relationship') || errorMessage?.includes('schema cache')) {
    return 'Database relationship error. Please check table relationships in the database.';
  }
  
  if (error?.code === 'PGRST301' || errorMessage?.includes('permission denied')) {
    return 'You do not have permission to access this resource.';
  }
  
  if (errorMessage?.includes('network') || error?.name === 'TypeError') {
    return 'Network error. Please check your connection.';
  }
  
  if (errorMessage?.includes('timeout') || error?.name === 'TimeoutError') {
    return 'Request timed out. Please try again.';
  }
  
  if (errorMessage?.includes('JWT') || errorMessage?.includes('auth')) {
    return 'Authentication error. Please log in again.';
  }
  
  if (errorMessage?.includes('validation') || errorMessage?.includes('invalid')) {
    return 'Invalid data provided. Please check your input.';
  }
  
  // Return the extracted error message or fallback
  return errorMessage || fallbackMessage;
};

export const safeCalculatePercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(decimals);
};

export const safeCurrencyFormat = (amount, decimals = 2) => {
  if (!amount || isNaN(amount)) return '$0.00';
  return `$${parseFloat(amount).toFixed(decimals)}`;
};

export const safeNumberFormat = (number, decimals = 0) => {
  if (!number || isNaN(number)) return '0';
  return parseFloat(number).toFixed(decimals);
};

export const processDateRange = (dateRange) => {
  const days = parseInt(dateRange) || 30;
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  
  return { days, startDate, endDate: now };
};

export const validateDateRange = (dateRange) => {
  const days = parseInt(dateRange);
  return days && days > 0 && days <= 365;
};

export const getSafeArray = (data) => {
  return Array.isArray(data) ? data : [];
};

export const getSafeObject = (data) => {
  return data && typeof data === 'object' ? data : {};
};

export const processCustomerName = (customer) => {
  if (!customer) return 'Unknown Customer';
  
  const firstName = customer.first_name || '';
  const lastName = customer.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return customer.email?.split('@')[0] || 'Unknown Customer';
  }
};

export const processOrderStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing', 
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  };
  
  return statusMap[status] || status || 'Unknown';
};

export const getChartColors = () => {
  return [
    '#10b981', // green
    '#3b82f6', // blue  
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1'  // indigo
  ];
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const formatLargeNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const calculateGrowthRate = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const groupByDate = (data, dateField, dateFormat = 'MMM dd') => {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const key = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
};

export const calculatePercentiles = (data) => {
  if (!data || data.length === 0) return { p25: 0, p50: 0, p75: 0, p90: 0 };
  
  const sorted = [...data].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    p25: sorted[Math.floor(len * 0.25)] || 0,
    p50: sorted[Math.floor(len * 0.5)] || 0,
    p75: sorted[Math.floor(len * 0.75)] || 0,
    p90: sorted[Math.floor(len * 0.9)] || 0
  };
};
