import React from 'react';
import { Star, CheckCircle } from 'lucide-react';

export default function ReviewList({ reviews, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-border rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-24 h-4 bg-neutral-200 rounded" />
              <div className="w-32 h-4 bg-neutral-200 rounded" />
            </div>
            <div className="w-full h-4 bg-neutral-200 rounded mb-2" />
            <div className="w-3/4 h-4 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-neutral-50 border border-border rounded-lg p-8 text-center">
        <p className="text-text-muted">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-border rounded-lg p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'fill-gold text-gold'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                {review.is_verified_purchase && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified Purchase</span>
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-charcoal mb-1">{review.title}</h4>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{review.reviewer_name}</span>
                <span>•</span>
                <span>{new Date(review.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {review.body}
          </p>
        </div>
      ))}
    </div>
  );
}
