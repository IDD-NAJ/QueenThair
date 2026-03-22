import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import Layout from './components/layout/Layout';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useScrollToTop } from './hooks/useScrollToTop';
import { useAuthInit } from './hooks/useAuth';
import { useAutoLogout } from './hooks/useAutoLogout';
import ErrorBoundary from './components/ErrorBoundary';
import InactivityWarning from './components/common/InactivityWarning';

function AppContent() {
  const location = useLocation();
  useScrollPosition();
  useScrollToTop({ behavior: 'instant', handleHash: true });
  useAuthInit();
  
  // Auto-logout after inactivity
  const { showWarning, countdown, resetTimer } = useAutoLogout();

  // Don't wrap dashboard/admin routes in main Layout (they have their own DashboardLayout)
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <>
      {/* Inactivity Warning Modal */}
      {showWarning && (
        <InactivityWarning 
          countdown={countdown} 
          onStayLoggedIn={resetTimer} 
        />
      )}

      {isDashboardRoute ? (
        <AppRoutes />
      ) : (
        <Layout>
          <AppRoutes />
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
