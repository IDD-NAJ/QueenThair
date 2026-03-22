import React from 'react';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import SearchModal from '../search/SearchModal';
import Toast from '../common/Toast';
import ScrollToTopButton from '../common/ScrollToTopButton';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-warm-white">
      <AnnouncementBar />
      <Header />
      <MobileMenu />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchModal />
      <Toast />
      <ScrollToTopButton />
    </div>
  );
}
