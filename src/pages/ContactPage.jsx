import React, { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import useStore from '../store/useStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export default function ContactPage() {
  const showToast = useStore(state => state.showToast);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log('Contact form submitted:', data);
    showToast('Message sent successfully! We\'ll get back to you soon.');
    reset();
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Contact Us' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Contact Us
          </h1>
          <p className="text-sm text-text-muted mt-2">
            We're here to help with any questions you may have
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal mb-4">Get In Touch</h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-8">
              Have a question or need assistance? We're here to help! Fill out the form and our team will get back to you within 24 hours.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0 text-gold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-charcoal mb-1">Email</div>
                  <a href="mailto:support@Queenthair.com" className="text-sm text-text-secondary hover:text-gold transition-colors">
                    support@Queenthair.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0 text-gold">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-charcoal mb-1">Phone</div>
                  <a href="tel:+18007833624" className="text-sm text-text-secondary hover:text-gold transition-colors">
                    1-800-QUEENTHAIR
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0 text-gold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-charcoal mb-1">Address</div>
                  <div className="text-sm text-text-secondary">
                    123 Beauty Lane<br />
                    Los Angeles, CA 90001
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-charcoal mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Name"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Your name"
              />

              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="you@example.com"
              />

              <Input
                label="Subject"
                {...register('subject')}
                error={errors.subject?.message}
                placeholder="How can we help?"
              />

              <div>
                <label className="text-xs tracking-wider uppercase font-semibold text-text-secondary block mb-2">
                  Message
                </label>
                <textarea
                  {...register('message')}
                  rows="6"
                  placeholder="Your message..."
                  className="w-full border border-border rounded px-4 py-3 text-sm text-text-primary transition-all outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(176,155,114,0.1)] bg-white placeholder:text-neutral-400 resize-none"
                />
                {errors.message && (
                  <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" variant="primary" fullWidth size="lg">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
