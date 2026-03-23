import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { getWishlist, removeFromWishlist } from '../../services/wishlistService';
import Img from '../../components/common/Img';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import EmptyState from '../../components/dashboard/EmptyState';

export default function DashboardWishlist() {
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const showToast = useStore(state => state.showToast);
  const addToCart = useStore(state => state.addToCart);
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getWishlist(user.id);
      // getWishlist returns { wishlist, items }
      setWishlistItems(data?.items || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId, variantId = null) => {
    try {
      await removeFromWishlist(user.id, productId, variantId);
      showToast('Removed from wishlist');
      await loadWishlist();
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      showToast('Failed to remove item');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast('Added to cart');
  };

  if (loading) {
    return <LoadingState message="Loading your wishlist..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadWishlist} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600">{wishlistItems.length} items saved</p>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love to your wishlist for easy access later"
          actionLabel="Browse Products"
          actionLink="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden group">
              <div className="relative aspect-square bg-gray-100">
                <button
                  onClick={() => handleRemove(item.product_id, item.variant_id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors z-10"
                >
                  <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
                </button>
                <Img
                  src={item.product?.images?.[0]?.image_url || item.product?.images?.[0]?.url || item.product?.image}
                  alt={item.product?.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => navigate(`/product/${item.product?.slug}`)}
                />
              </div>
              
              <div className="p-4">
                <h3 
                  className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-gold"
                  onClick={() => navigate(`/product/${item.product?.slug}`)}
                >
                  {item.product?.name}
                </h3>
                <p className="text-lg font-bold text-gold mb-3">
                  ${item.product?.base_price?.toFixed(2)}
                </p>
                
                <button
                  onClick={() => handleAddToCart(item.product)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
