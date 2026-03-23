import React, { useState, useEffect } from 'react';
import { Star, Check, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format } from 'date-fns';
import { withTimeout } from '../../utils/safeAsync';

const TIMEOUT_MS = 30000; // 30 second timeout

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await withTimeout(() => adminService.getReviews({ status: filter === 'all' ? undefined : filter }), TIMEOUT_MS);
      setReviews(data || []);
    } catch (err) {
      console.error('Reviews load error:', err);
      setError(err.message || 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminService.updateReviewStatus(id, 'approved');
      await loadReviews();
    } catch (err) {
      console.error('Failed to approve review:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await adminService.updateReviewStatus(id, 'rejected');
      await loadReviews();
    } catch (err) {
      console.error('Failed to reject review:', err);
    }
  };

  if (loading) {
    return <LoadingState message="Loading reviews..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadReviews} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm sm:text-base text-gray-600">{reviews.length} reviews</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex flex-wrap gap-1">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'pending' ? 'bg-gold/10 text-purple-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'approved' ? 'bg-gold/10 text-purple-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-gold/10 text-purple-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {reviews.map(review => (
          <div key={review.id} className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    review.is_approved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {review.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1 break-words">{review.title || 'No title'}</h3>
                <p className="text-gray-700 mb-2 break-words">{review.body}</p>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <span>{review.reviewer_name || review.user?.email || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{review.product?.name}</span>
                  <span>•</span>
                  <span>{format(new Date(review.created_at), 'MMM dd, yyyy')}</span>
                  {review.is_verified_purchase && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 font-medium">Verified Purchase</span>
                    </>
                  )}
                </div>
              </div>

              {!review.is_approved && (
                <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    title="Approve"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No {filter !== 'all' ? filter : ''} reviews found
          </div>
        )}
      </div>
    </div>
  );
}
