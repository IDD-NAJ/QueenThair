import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingPage from '../components/common/LoadingPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AdminRoute from '../components/common/AdminRoute';
import GuestRoute from '../components/common/GuestRoute';

// ═══════════════════════════════════════════════════════════════════════════
// CRITICAL ROUTES - Load immediately (needed for first paint)
// ═══════════════════════════════════════════════════════════════════════════
const HomePage = lazy(() => import('../pages/HomePage'));
const ShopPage = lazy(() => import('../pages/ShopPage'));
const ProductPage = lazy(() => import('../pages/ProductPage'));

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES - Lazy load (not needed for initial render)
// ═══════════════════════════════════════════════════════════════════════════
const CollectionPage = lazy(() => import('../pages/CollectionPage'));
const WishlistPage = lazy(() => import('../pages/WishlistPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const HairAccessoriesPage = lazy(() => import('../pages/HairAccessoriesPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const FAQPage = lazy(() => import('../pages/FAQPage'));
const ShippingReturnsPage = lazy(() => import('../pages/ShippingReturnsPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const TrackOrderPage = lazy(() => import('../pages/TrackOrderPage'));

// ═══════════════════════════════════════════════════════════════════════════
// AUTH ROUTES - Lazy load (only needed when user wants to login)
// ═══════════════════════════════════════════════════════════════════════════
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));

// ═══════════════════════════════════════════════════════════════════════════
// CHECKOUT ROUTES - Lazy load (only needed when checking out)
// ═══════════════════════════════════════════════════════════════════════════
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('../pages/OrderSuccessPage'));

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT ROUTES - Lazy load (only for logged-in users)
// ═══════════════════════════════════════════════════════════════════════════
const AccountPage = lazy(() => import('../pages/AccountPage'));
const NotificationSettings = lazy(() => import('../pages/NotificationSettings'));

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD ROUTES - Lazy load (only for logged-in users)
// ═══════════════════════════════════════════════════════════════════════════
const DashboardLayout = lazy(() => import('../components/dashboard/DashboardLayout'));
const DashboardOverview = lazy(() => import('../pages/dashboard/DashboardOverview'));
const DashboardOrders = lazy(() => import('../pages/dashboard/DashboardOrders'));
const DashboardProfile = lazy(() => import('../pages/dashboard/DashboardProfile'));
const DashboardAddresses = lazy(() => import('../pages/dashboard/DashboardAddresses'));
const DashboardWishlist = lazy(() => import('../pages/dashboard/DashboardWishlist'));
const DashboardSecurity = lazy(() => import('../pages/dashboard/DashboardSecurity'));
const DashboardSupport = lazy(() => import('../pages/dashboard/DashboardSupport'));
const DashboardPreferences = lazy(() => import('../pages/dashboard/DashboardPreferences'));

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES - Lazy load (only for admin users - saves ~18kB for regular users)
// ═══════════════════════════════════════════════════════════════════════════
const AdminOverview = lazy(() => import('../pages/admin/AdminOverview'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers'));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
const AdminInventory = lazy(() => import('../pages/admin/AdminInventory'));
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'));
const AdminMessages = lazy(() => import('../pages/admin/AdminMessages'));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons'));
const AdminActivity = lazy(() => import('../pages/admin/AdminActivity'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));
const AdminAnnouncements = lazy(() => import('../pages/admin/AdminAnnouncements'));
const ProductImportPage = lazy(() => import('../pages/admin/ProductImportPage'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminCustomerInsights = lazy(() => import('../pages/admin/AdminCustomerInsights'));
const AdminFinancial = lazy(() => import('../pages/admin/AdminFinancial'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminCollections = lazy(() => import('../pages/admin/AdminCollections'));
const AdminBanners = lazy(() => import('../pages/admin/AdminBanners'));
const AdminHomepageShowcase = lazy(() => import('../pages/admin/AdminHomepageShowcase'));
const AdminBlogs = lazy(() => import('../pages/admin/AdminBlogs'));
const AdminShipping = lazy(() => import('../pages/admin/AdminShipping'));
const AdminTaxes = lazy(() => import('../pages/admin/AdminTaxes'));
const AdminEmailTemplates = lazy(() => import('../pages/admin/AdminEmailTemplates'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminReports = lazy(() => import('../pages/admin/AdminReports'));
const AdminIntegrations = lazy(() => import('../pages/admin/AdminIntegrations'));
const AdminBackup = lazy(() => import('../pages/admin/AdminBackup'));
const AdminLogs = lazy(() => import('../pages/admin/AdminLogs'));
const AdminMaintenance = lazy(() => import('../pages/admin/AdminMaintenance'));
const AdminLayout = lazy(() => import('../components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));

// ═══════════════════════════════════════════════════════════════════════════
// ERROR PAGES - Lazy load
// ═══════════════════════════════════════════════════════════════════════════
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:category" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/collections" element={<Navigate to="/shop" replace />} />
        <Route path="/collections/:slug" element={<CollectionPage />} />
        <Route path="/new-arrivals" element={<Navigate to="/collections/new-arrivals" replace />} />
        <Route path="/best-sellers" element={<Navigate to="/collections/best-sellers" replace />} />
        <Route path="/sale" element={<Navigate to="/collections/sale" replace />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/search" element={<SearchPage />} />
        
        {/* Auth routes - only accessible when not authenticated */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        
        {/* Checkout routes */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/shipping" element={<Navigate to="/checkout" replace />} />
        <Route path="/checkout/payment" element={<Navigate to="/checkout" replace />} />
        <Route path="/checkout/review" element={<Navigate to="/checkout" replace />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        
        {/* Protected account routes */}
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/account/orders" element={<ProtectedRoute><AccountPage section="orders" /></ProtectedRoute>} />
        <Route path="/account/orders/:orderId" element={<ProtectedRoute><AccountPage section="order-detail" /></ProtectedRoute>} />
        <Route path="/account/wishlist" element={<Navigate to="/wishlist" replace />} />
        <Route path="/account/addresses" element={<ProtectedRoute><AccountPage section="addresses" /></ProtectedRoute>} />
        <Route path="/account/profile" element={<ProtectedRoute><AccountPage section="profile" /></ProtectedRoute>} />
        <Route path="/account/settings" element={<ProtectedRoute><AccountPage section="settings" /></ProtectedRoute>} />
        <Route path="/account/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        
        {/* User Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout type="user" /></ProtectedRoute>}>
          <Route index element={<DashboardOverview />} />
          <Route path="orders" element={<DashboardOrders />} />
          <Route path="orders/:orderId" element={<DashboardOrders />} />
          <Route path="profile" element={<DashboardProfile />} />
          <Route path="addresses" element={<DashboardAddresses />} />
          <Route path="wishlist" element={<DashboardWishlist />} />
          <Route path="security" element={<DashboardSecurity />} />
          <Route path="support" element={<DashboardSupport />} />
          <Route path="preferences" element={<DashboardPreferences />} />
        </Route>
        
        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/import" element={<ProductImportPage />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="collections" element={<AdminCollections />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="homepage-showcase" element={<AdminHomepageShowcase />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="customer-insights" element={<AdminCustomerInsights />} />
          <Route path="financial" element={<AdminFinancial />} />
          <Route path="shipping" element={<AdminShipping />} />
          <Route path="taxes" element={<AdminTaxes />} />
          <Route path="email-templates" element={<AdminEmailTemplates />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="integrations" element={<AdminIntegrations />} />
          <Route path="backup" element={<AdminBackup />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
        </Route>
        
        {/* Info pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        
        {/* Hair Accessories */}
        <Route path="/hair-accessories" element={<HairAccessoriesPage />} />
        <Route path="/hair-accessories/:category" element={<HairAccessoriesPage />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
