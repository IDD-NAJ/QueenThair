import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, X, Upload } from 'lucide-react';
import useStore from '../../store/useStore';
import { getProfile, updateProfile, uploadAvatar, removeAvatar } from '../../services/profileService';
import supabase from '../../lib/supabaseClient';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';

export default function DashboardProfile() {
  const user = useStore(state => state.user);
  const setProfile = useStore(state => state.setProfile);
  const showToast = useStore(state => state.showToast);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [avatarError, setAvatarError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setAvatarError(false);
    
    try {
      const profile = await getProfile();
      setFormData({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        phone: profile?.phone || '',
        email: user.email || '',
        avatar_url: profile?.avatar_url || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarError = () => {
    console.warn('[DashboardProfile] Avatar failed to load, showing placeholder');
    setAvatarError(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setAvatarError(false);

    try {
      const result = await uploadAvatar(user.id, file);
      setFormData(prev => ({ ...prev, avatar_url: result.avatar_url }));
      setProfile(result);
      showToast('Profile photo updated successfully');
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!formData.avatar_url) return;

    setUploading(true);
    setError(null);
    setAvatarError(false);

    try {
      const result = await removeAvatar(user.id);
      setFormData(prev => ({ ...prev, avatar_url: '' }));
      setProfile(result);
      showToast('Profile photo removed');
    } catch (err) {
      console.error('Photo removal error:', err);
      showToast('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim()
      });
      
      setProfile(updated);
      showToast('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      showToast('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <LoadingState message="Loading your profile..." />;
  }

  console.log('[DashboardProfile] Rendering with formData:', formData);
  console.log('[DashboardProfile] Avatar URL in state:', formData.avatar_url);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="relative">
            {formData.avatar_url && !avatarError ? (
              <img
                src={formData.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
                onError={handleAvatarError}
              />
            ) : (
              <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-gold" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
              title="Change photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Profile Photo</h3>
            <p className="text-sm text-gray-600 mb-2">Upload a new photo or remove the current one</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm text-gold hover:text-gold-dark font-medium disabled:opacity-50 flex items-center gap-1"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Change Photo'}
              </button>
              {formData.avatar_url && !avatarError && (
                <button
                  onClick={handlePhotoRemove}
                  disabled={uploading}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold ${
                  validationErrors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your first name"
                required
              />
              {validationErrors.first_name && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold ${
                  validationErrors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your last name"
                required
              />
              {validationErrors.last_name && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold ${
                validationErrors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
            {validationErrors.phone && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.phone}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
