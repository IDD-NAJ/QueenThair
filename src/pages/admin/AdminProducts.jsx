import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, X, Upload, Save, FileUp as FileUpIcon } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { listProducts } from '../../api/products';
import { getCategories } from '../../services/categoryService';
import supabase from '../../lib/supabaseClient';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import CSVUploadModal from '../../components/admin/CSVUploadModal';
import { withTimeout } from '../../utils/safeAsync';

const TIMEOUT_MS = 30000; // 30 second timeout

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    product_type: 'wig',
    category_id: '',
    base_price: '',
    compare_at_price: '',
    short_description: '',
    description: '',
    is_active: true,
    featured: false,
    new_arrival: false,
    best_seller: false,
    on_sale: false,
    imageUrl: '',
  });

  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    sku: '',
    color: '',
    length: '',
    density: '150%',
    price_override: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [productsData, categoriesData] = await Promise.all([
        withTimeout(() => adminService.getProductsWithImages({}), TIMEOUT_MS),
        withTimeout(() => adminService.getCategories(), TIMEOUT_MS)
      ]);
      
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Products data load error:', err);
      setError(err.message || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?.id === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        product_type: product.product_type || 'wig',
        category_id: product.category?.id || '',
        base_price: product.base_price || '',
        compare_at_price: product.compare_at_price || '',
        short_description: product.short_description || '',
        description: product.description || '',
        is_active: product.is_active ?? true,
        featured: product.featured || false,
        new_arrival: product.new_arrival || false,
        best_seller: product.best_seller || false,
        on_sale: product.on_sale || false,
        imageUrl: product.images?.[0]?.image_url || '',
      });
      setVariants(product.variants || []);
      // Set image preview from existing product
      if (product.images?.[0]?.image_url) {
        setImagePreview(product.images[0].image_url);
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        slug: '',
        product_type: 'wig',
        category_id: '',
        base_price: '',
        compare_at_price: '',
        short_description: '',
        description: '',
        is_active: true,
        featured: false,
        new_arrival: false,
        best_seller: false,
        on_sale: false,
        imageUrl: '',
      });
      setVariants([]);
    }
    setImageFile(null);
    setImagePreview(null);
    if (!product) {
      setFormData(prev => ({ ...prev, imageUrl: '' })); // Clear URL for new product
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' })); // Clear URL
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from name
    if (name === 'name' && !editingProduct) {
      const slug = value.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setFormData(prev => ({ ...prev, imageUrl: '' })); // Clear URL when file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, imageUrl: url }));
    setImageFile(null); // Clear file when URL is entered
    if (url) {
      setImagePreview(url); // Show preview of URL image
    } else {
      setImagePreview(null);
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.color || !newVariant.length) {
      alert('Please enter color and length for the variant');
      return;
    }

    const sku = `${formData.slug}-${newVariant.color}-${newVariant.length}`.toUpperCase().replace(/\s+/g, '-');
    
    setVariants(prev => [...prev, { ...newVariant, sku }]);
    setNewVariant({
      sku: '',
      color: '',
      length: '',
      density: '150%',
      price_override: '',
    });
  };

  const handleRemoveVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (productId) => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Check user admin status first
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        throw new Error('You must be logged in to create products');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log('User profile:', profile);
      
      if (profile?.role !== 'admin') {
        throw new Error('You must be an admin to create products');
      }

      let productId = editingProduct?.id;
      const currentUser = user.id;

      // Prepare product data (exclude imageUrl as it's handled separately)
      const { imageUrl, ...productDataWithoutImage } = formData;
      const productData = {
        ...productDataWithoutImage,
        base_price: parseFloat(formData.base_price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      };

      // Handle image data
      const imageData = imagePreview ? [{
        url: imageFile ? null : formData.imageUrl, // Will be uploaded separately
        alt_text: formData.name
      }] : null;

      if (editingProduct) {
        // Update existing product
        await adminService.updateProduct(productId, productData);
        
        // Handle image updates
        if (imageFile) {
          const imageUrl = await uploadImage(productId);
          await supabase
            .from('product_images')
            .upsert({
              product_id: productId,
              image_url: imageUrl,
              alt_text: formData.name,
              sort_order: 0,
              is_primary: true
            });
        } else if (formData.imageUrl && formData.imageUrl !== editingProduct.images?.[0]?.image_url) {
          await supabase
            .from('product_images')
            .upsert({
              product_id: productId,
              image_url: formData.imageUrl,
              alt_text: formData.name,
              sort_order: 0,
              is_primary: true
            });
        }

        // Log activity
        await adminService.logActivity(currentUser, 'update', 'product', productId, {
          changes: productData
        });
      } else {
        // Create new product with images - use service method that handles RLS
        console.log('Creating product with data:', productData);
        console.log('Image data:', imageData);
        
        // Use adminService.createProductWithImages which handles inventory and images
        const product = await adminService.createProductWithImages(productData, imageData);
        console.log('Product created via service:', product);
        productId = product.id;
        
        // Handle file upload if needed (separate from the URL-based images)
        if (imageFile) {
          const uploadedUrl = await uploadImage(productId);
          console.log('Image uploaded:', uploadedUrl);
          
          // Update the product image with the uploaded file URL
          await adminService.updateProductImage(productId, uploadedUrl);
        }

        // Log activity
        await adminService.logActivity(currentUser, 'create', 'product', productId, {
          product: productData
        });
      }

      // Handle variants using adminService
      if (variants.length > 0) {
        // Delete existing variants if editing
        if (editingProduct) {
          await adminService.deleteProductVariants(productId);
        }

        // Create new variants
        await adminService.createProductVariants(productId, variants);
      }

      await loadData();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Failed to save product: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
      await adminService.deleteProduct(id);
      
      // Log activity
      await adminService.logActivity(null, 'delete', 'product', id, {
        deleted: true
      });
      
      await loadData();
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product: ' + err.message);
    }
  };

  if (loading) {
    return <LoadingState message="Loading products..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm sm:text-base text-gray-600">{filteredProducts.length} total products</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowCSVModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileUpIcon className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3 overflow-hidden">
                        {product.images?.[0]?.image_url && (
                          <img 
                            src={product.images[0].image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">${product.base_price?.toFixed(2) || '0.00'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.inventory?.quantity_available || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                        className="text-gold hover:text-gold-dark"
                        title="View Product"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Type *
                    </label>
                    <select
                      name="product_type"
                      value={formData.product_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="wig">Wig</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price *
                    </label>
                    <input
                      type="number"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compare At Price
                    </label>
                    <input
                      type="number"
                      name="compare_at_price"
                      value={formData.compare_at_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Image</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imageFile && <span className="text-sm text-gray-600">{imageFile.name}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>

                {imagePreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
                  </div>
                )}
              </div>

              {/* Variants */}
              {formData.product_type === 'wig' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Color"
                      value={newVariant.color}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, color: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                    <input
                      type="text"
                      placeholder='Length (e.g., 16")'
                      value={newVariant.length}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, length: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                    <input
                      type="text"
                      placeholder="Density (e.g., 150%)"
                      value={newVariant.density}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, density: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark"
                    >
                      Add Variant
                    </button>
                  </div>

                  {variants.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Color</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Length</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Density</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {variants.map((variant, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{variant.sku}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{variant.color}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{variant.length}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{variant.density}</td>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Flags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Flags</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-gold focus:ring-gold rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-gold focus:ring-gold rounded"
                    />
                    <span className="text-sm text-gray-700">Featured</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="new_arrival"
                      checked={formData.new_arrival}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-gold focus:ring-gold rounded"
                    />
                    <span className="text-sm text-gray-700">New Arrival</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="best_seller"
                      checked={formData.best_seller}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-gold focus:ring-gold rounded"
                    />
                    <span className="text-sm text-gray-700">Best Seller</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="on_sale"
                      checked={formData.on_sale}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-gold focus:ring-gold rounded"
                    />
                    <span className="text-sm text-gray-700">On Sale</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
