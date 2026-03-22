import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useStore from '../store/useStore';
import { useSignIn } from '../hooks/useAuth';
import { getPostLoginPath } from '../services/authService';
import { getProfile } from '../services/profileService';
import { mergeGuestCart } from '../services/cartService';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const showToast = useStore.getState().showToast;
    try {
      const result = await Promise.race([
        signIn(data.email, data.password),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Sign-in timed out. Check your network and try again.')),
            25000
          )
        ),
      ]);
      const user = result?.session?.user;
      if (!user) {
        showToast('Could not establish a session. Confirm your email if required, then try again.');
        return;
      }

      // Stop spinner as soon as Supabase auth succeeds — mergeGuestCart / getProfile can hang on network/RLS
      setLoading(false);

      const profilePromise = getProfile(user.id).catch((e) => {
        console.warn('[LoginPage] profile fetch after sign-in:', e);
        return null;
      });
      const profile = await Promise.race([
        profilePromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 12_000)),
      ]);

      useStore.getState().setUserAndProfile(user, profile);

      const sessionId = useStore.getState().sessionId;
      if (sessionId) {
        mergeGuestCart(sessionId, user.id).catch((err) => {
          console.error('[LoginPage] cart merge error:', err);
        });
      }

      navigate(getPostLoginPath(profile, location.state), { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      showToast(error?.message || 'Sign in failed. Please try again.');
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
          <h1 className="font-serif text-3xl text-charcoal mb-2">Welcome Back</h1>
          <p className="text-sm text-text-muted">Sign in to your account</p>
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

            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-gold focus:ring-gold" />
                <span className="text-text-secondary">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-gold hover:text-gold-light transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6 text-text-muted text-xs">
            <div className="flex-1 h-px bg-border" />
            <span>or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            <Button variant="outline" fullWidth>
              Continue with Google
            </Button>
            <Button variant="outline" fullWidth>
              Continue with Facebook
            </Button>
          </div>

          <div className="text-center text-sm text-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold hover:text-gold-light transition-colors font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
