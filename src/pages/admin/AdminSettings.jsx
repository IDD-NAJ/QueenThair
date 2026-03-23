import React, { useState, useEffect } from 'react';
import { Save, Globe, CreditCard, Truck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { withTimeout } from '../../utils/safeAsync';

const TIMEOUT_MS = 30000; // 30 second timeout

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'QueenTEE',
    siteUrl: '',
    supportEmail: '',
    currency: 'USD',
    taxRate: '0',
    shippingFee: '0',
    freeShippingThreshold: '0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await withTimeout(() => adminService.getSiteStoreSettings(), TIMEOUT_MS);
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (e) {
        console.error('Settings load error:', e);
        setLoadError(e.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.saveSiteStoreSettings(settings);
      await adminService.logActivity(null, 'update', 'site_settings', null, { siteName: settings.siteName });
      window.alert('Settings saved to admin_settings.');
    } catch (e) {
      window.alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-600 text-sm">Loading settings…</div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your store settings</p>
        {loadError && (
          <p className="mt-2 text-sm text-amber-700">Could not load saved settings ({loadError}). Defaults are shown.</p>
        )}
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">General Settings</h3>
            <p className="text-sm text-gray-600">Basic store information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
            <input
              type="url"
              value={settings.siteUrl}
              onChange={(e) => setSettings({...settings, siteUrl: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Payment Settings</h3>
            <p className="text-sm text-gray-600">Configure payment options</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({...settings, currency: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings.taxRate}
              onChange={(e) => setSettings({...settings, taxRate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Shipping Settings</h3>
            <p className="text-sm text-gray-600">Configure shipping options</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.shippingFee}
              onChange={(e) => setSettings({...settings, shippingFee: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({...settings, freeShippingThreshold: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors w-full sm:w-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving…' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
