import React, { useState, useEffect } from 'react';
import { Image, Edit2, Trash2, Eye, EyeOff, Plus, Search, ArrowUp, ArrowDown, ExternalLink, Monitor, Smartphone } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '',
    button_text: '',
    position: 'homepage',
    device_target: 'all',
    active: true,
    sort_order: 0,
    start_date: '',
    end_date: '',
    background_color: '#000000',
    text_color: '#ffffff'
  });

  const bannerPositions = [
    { value: 'homepage', label: 'Homepage Hero' },
    { value: 'homepage_below', label: 'Homepage Below Hero' },
    { value: 'category', label: 'Category Page' },
    { value: 'product', label: 'Product Page' },
    { value: 'cart', label: 'Cart Page' },
    { value: 'footer', label: 'Footer' }
  ];

  const deviceTargets = [
    { value: 'all', label: 'All Devices' },
    { value: 'desktop', label: 'Desktop Only' },
    { value: 'mobile', label: 'Mobile Only' }
  ];

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getBanners();
      setBanners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingBanner) {
        await adminService.updateBanner(editingBanner.id, formData);
        await adminService.logActivity(null, 'update', 'banner', editingBanner.id, { title: formData.title });
      } else {
        const created = await adminService.createBanner(formData);
        await adminService.logActivity(null, 'create', 'banner', created.id, { title: formData.title });
      }
      
      setShowModal(false);
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        mobile_image_url: '',
        link_url: '',
        button_text: '',
        position: 'homepage',
        device_target: 'all',
        active: true,
        sort_order: 0,
        start_date: '',
        end_date: '',
        background_color: '#000000',
        text_color: '#ffffff'
      });
      loadBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      link_url: banner.link_url,
      button_text: banner.button_text,
      position: banner.position,
      device_target: banner.device_target,
      active: banner.active,
      sort_order: banner.sort_order,
      start_date: banner.start_date,
      end_date: banner.end_date,
      background_color: banner.background_color,
      text_color: banner.text_color
    });
    setShowModal(true);
  };

  const handleDelete = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      try {
        await adminService.deleteBanner(bannerId);
        await adminService.logActivity(null, 'delete', 'banner', bannerId, {});
        loadBanners();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleBannerStatus = async (bannerId, active) => {
    try {
      const b = banners.find((x) => x.id === bannerId);
      if (!b) return;
      await adminService.updateBanner(bannerId, { ...b, active: !active });
      loadBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const moveBanner = async (bannerId, direction) => {
    try {
      const sorted = [...banners].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const idx = sorted.findIndex((x) => x.id === bannerId);
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= sorted.length) return;
      const a = sorted[idx];
      const b = sorted[swap];
      const orderA = a.sort_order || 0;
      const orderB = b.sort_order || 0;
      await adminService.updateBanner(a.id, { ...a, sort_order: orderB });
      await adminService.updateBanner(b.id, { ...b, sort_order: orderA });
      loadBanners();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading banners..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadBanners} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-600">Manage homepage banners and promotional graphics</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search banners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {filteredBanners.map((banner, index) => (
          <div key={banner.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Banner Preview */}
              <div className="lg:w-1/3 bg-gray-100">
                {banner.image_url ? (
                  <img 
                    src={banner.image_url} 
                    alt={banner.title}
                    className="w-full h-48 lg:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-48 lg:h-full flex items-center justify-center bg-gray-200">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Banner Details */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{banner.title}</h3>
                    <p className="text-gray-600 mt-1">{banner.subtitle}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveBanner(banner.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveBanner(banner.id, 'down')}
                      disabled={index === filteredBanners.length - 1}
                      className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleBannerStatus(banner.id, banner.active)}
                      className="p-1 text-gray-400 hover:text-yellow-600"
                    >
                      {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium">{bannerPositions.find(p => p.value === banner.position)?.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Device Target</p>
                    <p className="font-medium flex items-center">
                      {banner.device_target === 'desktop' && <Monitor className="w-4 h-4 mr-1" />}
                      {banner.device_target === 'mobile' && <Smartphone className="w-4 h-4 mr-1" />}
                      {banner.device_target === 'all' && <><Monitor className="w-4 h-4 mr-1" /><Smartphone className="w-4 h-4" /></>}
                      {deviceTargets.find(d => d.value === banner.device_target)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Schedule</p>
                    <p className="font-medium">
                      {banner.start_date && new Date(banner.start_date).toLocaleDateString()}
                      {banner.end_date && ` - ${new Date(banner.end_date).toLocaleDateString()}`}
                      {!banner.start_date && !banner.end_date && 'Always active'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Button</p>
                    <p className="font-medium">{banner.button_text || 'No button'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Link</p>
                    {banner.link_url ? (
                      <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center">
                        {banner.link_url}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <p className="font-medium">No link</p>
                    )}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Impressions</p>
                      <p className="font-medium">{banner.impressions?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Clicks</p>
                      <p className="font-medium">{banner.clicks?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CTR</p>
                      <p className="font-medium">
                        {banner.impressions > 0 ? `${((banner.clicks / banner.impressions) * 100).toFixed(2)}%` : '0%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sort Order</p>
                      <p className="font-medium">{banner.sort_order}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desktop Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.mobile_image_url}
                      onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link URL
                    </label>
                    <input
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {bannerPositions.map(position => (
                        <option key={position.value} value={position.value}>
                          {position.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Target
                    </label>
                    <select
                      value={formData.device_target}
                      onChange={(e) => setFormData({ ...formData, device_target: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {deviceTargets.map(target => (
                        <option key={target.value} value={target.value}>
                          {target.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="h-10 w-20 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="h-10 w-20 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    {editingBanner ? 'Update' : 'Create'} Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
