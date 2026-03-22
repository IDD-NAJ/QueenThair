import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { submitReview } from '../../services/reviewService';
import useStore from '../../store/useStore';
import Button from '../common/Button';
import Input from '../common/Input';

export default function ReviewForm({ productId, onReviewSubmitted }) {
  const { user, showToast } = useStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      showToast('Please select a rating');
      return;
    }

    if (!title.trim() || !body.trim()) {
      showToast('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitReview({
        productId,
        userId: user.id,
        rating,
        title: title.trim(),
        body: body.trim(),
        reviewerName: reviewerName.trim() || user.email.split('@')[0],
      });

      showToast('Review submitted successfully! It will appear after admin approval.');
      
      // Reset form
      setRating(0);
      setTitle('');
      setBody('');
      setReviewerName('');

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      showToast('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-neutral-50 border border-border rounded-lg p-6 text-center">
        <p className="text-text-secondary mb-4">Please log in to write a review</p>
        <Button to="/login" variant="secondary" size="sm">
          Log In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-charcoal mb-4">Write a Review</h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-charcoal mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? 'fill-gold text-gold'
                    : 'text-neutral-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label htmlFor="review-title" className="block text-sm font-medium text-charcoal mb-2">
          Review Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          maxLength={100}
          required
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label htmlFor="review-body" className="block text-sm font-medium text-charcoal mb-2">
          Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts about this product"
          rows={5}
          maxLength={1000}
          required
          className="w-full px-4 py-2.5 border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold transition-colors resize-none"
        />
        <div className="text-xs text-text-muted mt-1 text-right">
          {body.length}/1000 characters
        </div>
      </div>

      {/* Reviewer Name */}
      <div className="mb-6">
        <label htmlFor="reviewer-name" className="block text-sm font-medium text-charcoal mb-2">
          Display Name (optional)
        </label>
        <Input
          id="reviewer-name"
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder={user.email.split('@')[0]}
          maxLength={50}
        />
        <p className="text-xs text-text-muted mt-1">
          Leave blank to use your email username
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        fullWidth
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>

      <p className="text-xs text-text-muted mt-3 text-center">
        Your review will be published after admin approval
      </p>
    </form>
  );
}
