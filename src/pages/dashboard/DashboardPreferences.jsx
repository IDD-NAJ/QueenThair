import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Mail, MessageSquare, Save, ExternalLink } from 'lucide-react';
import useStore from '../../store/useStore';
import { getPreferences, updatePreferences } from '../../services/profileService';
import LoadingState from '../../components/dashboard/LoadingState';

export default function DashboardPreferences() {
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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(preferences);
      showToast('Preferences updated successfully');
    } catch (err) {
      showToast('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key]
    });
  };

  if (loading) {
    return <LoadingState message="Loading your preferences..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600">Manage how you receive updates from us</p>
        </div>
        <Link
          to="/account/notifications"
          className="inline-flex items-center gap-2 px-4 py-2 text-gold border border-gold rounded-lg hover:bg-gold hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Full Settings
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
            </div>

            <div className="space-y-3 ml-13">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive all email notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={() => handleToggle('email_notifications')}
                  className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">Order Updates</p>
                  <p className="text-sm text-gray-600">Get notified about your order status</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.order_updates}
                  onChange={() => handleToggle('order_updates')}
                  className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">Promotional Emails</p>
                  <p className="text-sm text-gray-600">Receive special offers and promotions</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.promotional_emails}
                  onChange={() => handleToggle('promotional_emails')}
                  className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">Newsletter</p>
                  <p className="text-sm text-gray-600">Weekly updates and hair care tips</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.newsletter}
                  onChange={() => handleToggle('newsletter')}
                  className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold"
                />
              </label>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-600">Receive text message updates</p>
              </div>
            </div>

            <div className="ml-13">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Get order updates via text message</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sms_notifications}
                  onChange={() => handleToggle('sms_notifications')}
                  className="w-5 h-5 text-gold rounded focus:ring-2 focus:ring-gold"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
