import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Truck, CheckCircle } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const schema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  email: z.string().email('Please enter a valid email address'),
});

export default function TrackOrderPage() {
  const [trackingInfo, setTrackingInfo] = useState(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    // Mock tracking data
    setTrackingInfo({
      orderNumber: data.orderNumber,
      status: 'In Transit',
      estimatedDelivery: 'March 22, 2026',
      timeline: [
        { status: 'Order Placed', date: 'March 15, 2026', completed: true },
        { status: 'Processing', date: 'March 16, 2026', completed: true },
        { status: 'Shipped', date: 'March 18, 2026', completed: true },
        { status: 'In Transit', date: 'March 19, 2026', completed: true },
        { status: 'Out for Delivery', date: 'March 22, 2026', completed: false },
        { status: 'Delivered', date: 'March 22, 2026', completed: false },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <Breadcrumbs items={[{ label: 'Track Order' }]} />
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal mt-4">
            Track Your Order
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Enter your order details to track your shipment
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {!trackingInfo ? (
          <div className="bg-white border border-border rounded-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Order Number"
                {...register('orderNumber')}
                error={errors.orderNumber?.message}
                placeholder="e.g., LH-123456"
              />

              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="you@example.com"
              />

              <Button type="submit" variant="primary" fullWidth size="lg">
                Track Order
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-text-muted text-center">
                You can find your order number in your confirmation email
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Status Card */}
            <div className="bg-white border border-border rounded-lg p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs tracking-wider uppercase text-text-muted mb-1">
                    Order Number
                  </div>
                  <div className="text-lg font-semibold text-charcoal">
                    {trackingInfo.orderNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs tracking-wider uppercase text-text-muted mb-1">
                    Status
                  </div>
                  <div className="text-lg font-semibold text-gold">
                    {trackingInfo.status}
                  </div>
                </div>
              </div>

              <div className="bg-neutral-100 rounded p-4 flex items-center gap-3">
                <Truck className="w-5 h-5 text-gold flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-charcoal">
                    Estimated Delivery
                  </div>
                  <div className="text-xs text-text-muted">
                    {trackingInfo.estimatedDelivery}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-border rounded-lg p-6 sm:p-8">
              <h2 className="text-xs tracking-wider uppercase font-semibold text-charcoal mb-6">
                Tracking Timeline
              </h2>
              <div className="space-y-4">
                {trackingInfo.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.completed
                            ? 'bg-gold text-white'
                            : 'bg-neutral-200 text-neutral-400'
                        }`}
                      >
                        {item.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                      </div>
                      {index < trackingInfo.timeline.length - 1 && (
                        <div
                          className={`w-px h-full min-h-[40px] ${
                            item.completed ? 'bg-gold' : 'bg-neutral-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div
                        className={`text-sm font-medium ${
                          item.completed ? 'text-charcoal' : 'text-text-muted'
                        }`}
                      >
                        {item.status}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {item.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setTrackingInfo(null)}
              variant="outline"
              fullWidth
            >
              Track Another Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
