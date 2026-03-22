import React from 'react';
import Header from './Header';
import TopBar from './TopBar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import Toast from './Toast';
import ScrollToTop from './common/ScrollToTop';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <Toast />
      <ScrollToTop />
    </div>
  );
}
