export const SITE_NAME = 'QUEENTHAIR';
export const SITE_DESCRIPTION = 'Premium Human Hair Wigs & Extensions';
export const SITE_URL = 'https://QUEENTHAIR.com';

export const CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';

export const FREE_SHIPPING_THRESHOLD = 99;
export const TAX_RATE = 0.08;

export const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: '5-7 business days',
    price: 0,
    minOrder: FREE_SHIPPING_THRESHOLD,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: '2-3 business days',
    price: 19.99,
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day',
    price: 29.99,
  },
];

export const PRODUCT_SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviews' },
];

export const ITEMS_PER_PAGE = 12;

export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};
