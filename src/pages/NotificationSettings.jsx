import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Mail, MessageSquare, Save, ArrowLeft, Settings } from 'lucide-react';
import useStore from '../store/useStore';
import { getPreferences, updatePreferences } from '../services/profileService';
import LoadingState from '../components/dashboard/LoadingState';

export default function NotificationSettings() {
  const user = useStore(state => state.user);
  const showToast = useStore(state => state.showToast);
  
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    order_updates: true,
    promotional_emails: true,
    newsletter: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getPreferences();
      if (data) {
        setPreferences(data);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
      showToast('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferences);
      showToast('Notification preferences updated successfully');
    } catch (err) {
      console.error('Failed to update preferences:', err);
      showToast('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return <LoadingState message="Loading your notification preferences..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/account"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600 mt-1">Manage how you receive updates from QUEENTHAIR</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 space-y-8">
            {/* Email Notifications */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
                  <p className="text-sm text-gray-600">Choose which email updates you'd like to receive</p>
                </div>
              </div>

              <div className="space-y-4 ml-13">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">All Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive all email notifications from us</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={() => handleToggle('email_notifications')}
                    className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold focus:ring-offset-2"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Order Updates</p>
                    <p className="text-sm text-gray-600">Get notified about your order status, shipping, and delivery</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.order_updates}
                    onChange={() => handleToggle('order_updates')}
                    className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold focus:ring-offset-2"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Promotional Emails</p>
                    <p className="text-sm text-gray-600">Receive special offers, promotions, and exclusive deals</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.promotional_emails}
                    onChange={() => handleToggle('promotional_emails')}
                    className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold focus:ring-offset-2"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Newsletter</p>
                    <p className="text-sm text-gray-600">Weekly updates, hair care tips, and latest trends</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.newsletter}
                    onChange={() => handleToggle('newsletter')}
                    className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold focus:ring-offset-2"
                  />
                </label>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">SMS Notifications</h2>
                  <p className="text-sm text-gray-600">Get important updates via text message</p>
                </div>
              </div>

              <div className="space-y-4 ml-13">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Get order updates and important alerts via text message</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.sms_notifications}
                    onChange={() => handleToggle('sms_notifications')}
                    className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold focus:ring-offset-2"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Looking for other settings?
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/dashboard/preferences"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-dark transition-colors font-medium"
            >
              <Settings className="w-4 h-4" />
              Dashboard Preferences
            </Link>
            <Link 
              to="/dashboard/security"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-dark transition-colors font-medium"
            >
              Security Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
