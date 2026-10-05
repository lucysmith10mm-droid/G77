import { PlanConfig, PlanId } from '../src/types';

export const OFFICIAL_PLANS: Record<PlanId, PlanConfig> = {
  PLAN_7_DAYS: {
    id: 'PLAN_7_DAYS',
    name: '7 DAYS ACCESS',
    duration: '7 days',
    amount: 5, // $5 USD
    amountCents: 500,
    currency: 'USD',
    unlimited: true,
    description: 'Unlimited AI video generation for 7 days with SEE DANCE 2.5 + SEE DANCE 2.0 models.',
    features: [
      'SEE DANCE 2.5 Unlimited Access',
      'SEE DANCE 2.0 Unlimited Access',
      'Full 4K Ultra-HD Video Diffusion (60 FPS)',
      'Zero Queue High-Priority GPU Rendering',
      'Multi-Prompt Camera Motion Controls',
      'Instant Email Access Delivery'
    ]
  },
  PLAN_30_DAYS: {
    id: 'PLAN_30_DAYS',
    name: '30 DAYS ACCESS',
    duration: '30 days',
    amount: 5, // $5 USD Flash Promo
    amountCents: 500,
    currency: 'USD',
    unlimited: true,
    description: 'Unlimited AI video generation for 30 days with SEE DANCE 2.5 + SEE DANCE 2.0 models.',
    features: [
      'SEE DANCE 2.5 Unlimited Access',
      'SEE DANCE 2.0 Unlimited Access',
      'Full 4K Ultra-HD Video Diffusion (60 FPS)',
      'Zero Queue High-Priority GPU Rendering',
      'Advanced Cinematic Trajectory & Lighting',
      'Instant Email Access Delivery'
    ]
  },
  PLAN_LIFETIME: {
    id: 'PLAN_LIFETIME',
    name: 'LIFETIME ACCESS',
    duration: 'Lifetime',
    amount: 400, // $400 USD
    amountCents: 40000,
    currency: 'USD',
    unlimited: true,
    isBestValue: true,
    description: 'Unlimited AI video generation forever with SEE DANCE 2.5 + SEE DANCE 2.0 models. One-time payment.',
    features: [
      'SEE DANCE 2.5 Unlimited Access',
      'SEE DANCE 2.0 Unlimited Access',
      'Full 4K Ultra-HD Video Diffusion (60 FPS)',
      'Zero Queue VIP Priority GPU Cluster',
      'All Future SEE DANCE Video Engine Updates',
      'One-Time Payment • Never Expires'
    ]
  }
};

export const DEFAULT_ACCESS_LINK = 'https://www.dola.com/chat';
export const OWNER_EMAIL = 'harishsingh9208@gmail.com';
export const SUPPORT_EMAIL = 'lucysmith10mm@gmail.com';

