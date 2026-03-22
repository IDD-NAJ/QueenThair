import { loadStripe } from '@stripe/stripe-js';
import { env } from './env';

// Lazy singleton – Stripe JS is loaded only when first needed
let stripePromise = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(env.stripePublishableKey);
  }
  return stripePromise;
};
