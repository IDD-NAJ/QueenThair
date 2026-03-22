import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useStore from '../store/useStore';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const showToast = useStore(state => state.showToast);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log('Password reset for:', data.email);
    setSubmitted(true);
    showToast('Password reset link sent to your email');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="font-serif text-3xl text-charcoal mb-3">Check Your Email</h1>
          <p className="text-sm text-text-muted mb-6">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </p>
          <Button to="/login" variant="secondary" fullWidth>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-2xl text-charcoal inline-block mb-6">
            QUEEN<span className="text-gold">THAIR</span>
          </Link>
          <h1 className="font-serif text-3xl text-charcoal mb-2">Forgot Password?</h1>
          <p className="text-sm text-text-muted">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white border border-border rounded-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="you@example.com"
            />

            <Button type="submit" variant="primary" fullWidth size="lg">
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gold hover:text-gold-light transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
