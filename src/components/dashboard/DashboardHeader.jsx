import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ShoppingBag, Check, Trash2, Menu } from 'lucide-react';
import useStore from '../../store/useStore';
import { signOut } from '../../services/authService';
import { markAsRead, markAllAsRead, deleteNotification } from '../../services/notificationService';
import { useNotifications, useRealtimeNotifications } from '../../hooks/useNotifications';

export default function DashboardHeader({ type, onMenuClick }) {
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const profile = useStore(state => state.profile);
  const clearAuthState = useStore(state => state.clearAuthState);
  const showToast = useStore(state => state.showToast);
  const markNotificationRead = useStore(state => state.markNotificationRead);
  const markAllNotificationsRead = useStore(state => state.markAllNotificationsRead);
  const addNotification = useStore(state => state.addNotification);
  
  // Use the new hook for notifications
  const { items: notifications, unreadCount, loading, error } = useNotifications(user?.id);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    if (dropdownOpen || notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen, notificationOpen]);

  // Prevent background scroll when the notification sheet is open on small viewports
  useEffect(() => {
    if (!notificationOpen) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => {
      document.body.style.overflow = mq.matches ? 'hidden' : '';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      document.body.style.overflow = '';
      mq.removeEventListener('change', apply);
    };
  }, [notificationOpen]);

  // Real-time notifications subscription
  useRealtimeNotifications(user?.id, (payload) => {
    if (payload.eventType === 'INSERT') {
      addNotification(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      markNotificationRead(payload.new.id);
    }
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      clearAuthState();
      showToast('Signed out successfully');
      navigate('/');
    } catch (error) {
      showToast('Failed to sign out');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      markNotificationRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(user.id);
      markAllNotificationsRead();
      showToast('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      showToast('Failed to mark notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      // The hook will automatically refresh the data
      showToast('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      showToast('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'customer':
        return '👤';
      case 'system':
        return '⚙️';
      case 'inventory':
        return '📊';
      case 'promotion':
        return '🎁';
      case 'review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <Link to="/" className="text-xl font-bold text-gold">
            QUEENTHAIR
          </Link>
          <span className="hidden sm:block text-sm text-gray-500">
            {type === 'admin' ? 'Admin Dashboard' : 'My Account'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Back to Store"
          >
            <ShoppingBag className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-gray-100 rounded-full relative touch-manipulation"
              title="Notifications"
              aria-expanded={notificationOpen}
              aria-haspopup="dialog"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-semibold px-1 leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/20 sm:hidden z-40"
                  aria-hidden
                  onClick={() => setNotificationOpen(false)}
                />
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-full sm:mt-2 z-50 w-auto sm:w-[min(100vw-1.5rem,24rem)] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden max-h-[min(32rem,calc(100dvh-5rem-env(safe-area-inset-bottom,0px)))] sm:max-h-[min(28rem,calc(100dvh-8rem))]"
                >
                  <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 bg-white shrink-0">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">Notifications</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread`}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="shrink-0 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg hover:bg-indigo-50 transition-colors touch-manipulation"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain -webkit-overflow-scrolling-touch">
                    {loading ? (
                      <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
                    ) : error ? (
                      <div className="p-6 text-center text-sm text-red-600">Could not load notifications.</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 sm:p-10 text-center text-gray-500">
                        <Bell className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm sm:text-base">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                            !notification.read ? 'bg-indigo-50/80' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 sm:gap-3.5">
                            <span
                              className="text-xl sm:text-2xl flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white/80 border border-gray-100"
                              aria-hidden
                            >
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-1 xs:gap-3">
                                <h4 className="text-sm sm:text-[15px] font-medium text-gray-900 leading-snug break-words min-w-0">
                                  {notification.title}
                                </h4>
                                <span className="text-[11px] sm:text-xs text-gray-500 tabular-nums flex-shrink-0 xs:text-right">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed break-words">
                                {notification.message}
                              </p>
                              {notification.link && (
                                <Link
                                  to={notification.link}
                                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block font-medium py-1 touch-manipulation"
                                  onClick={() => {
                                    setNotificationOpen(false);
                                    if (!notification.read) handleMarkAsRead(notification.id);
                                  }}
                                >
                                  View details →
                                </Link>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {!notification.read && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs sm:text-sm text-gray-700 hover:text-indigo-700 inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg hover:bg-white/80 border border-transparent hover:border-gray-200 transition-colors touch-manipulation"
                                  >
                                    <Check className="w-4 h-4 flex-shrink-0" />
                                    Mark as read
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors touch-manipulation"
                                >
                                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="shrink-0 border-t border-gray-200 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-3 bg-gray-50/80">
                    <Link
                      to="/account/notifications"
                      className="block w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-800 py-2.5 min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white transition-colors touch-manipulation"
                      onClick={() => setNotificationOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gold" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">
                  {profile?.first_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role || 'customer'}</p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Profile Settings
                </Link>

                <Link
                  to="/"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setDropdownOpen(false)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Back to Store
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
