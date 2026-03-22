import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useStore from '../store/useStore';
import { signUp } from '../services/authService';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const showToast = useStore(state => state.showToast);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      showToast('Account created! Please check your email to confirm.');
      navigate('/login');
    } catch (error) {
      showToast(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-2xl text-charcoal inline-block mb-6">
            QUEEN<span className="text-gold">THAIR</span>
          </Link>
          <h1 className="font-serif text-3xl text-charcoal mb-2">Create Account</h1>
          <p className="text-sm text-text-muted">Join QUEENTHAIR today</p>
        </div>

        <div className="bg-white border border-border rounded-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...register('firstName')}
                error={errors.firstName?.message}
                placeholder="Jane"
              />
              <Input
                label="Last Name"
                {...register('lastName')}
                error={errors.lastName?.message}
                placeholder="Smith"
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
              helperText="Must be at least 8 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="••••••••"
            />

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="w-4 h-4 rounded border-border text-gold focus:ring-gold mt-0.5"
              />
              <label className="text-xs text-text-secondary">
                I agree to the{' '}
                <Link to="/terms" className="text-gold hover:text-gold-light transition-colors">
                  Terms & Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-gold hover:text-gold-light transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg">
              Create Account
            </Button>
          </form>

          <div className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold hover:text-gold-light transition-colors font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
