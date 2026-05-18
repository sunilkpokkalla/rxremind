import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { AuthManager } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await AuthManager.getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: You must be signed in to upgrade plans.' }, { status: 401 });
    }

    const { planName } = await req.json();
    if (!planName || !['Growth', 'Pro'].includes(planName)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Map plans to Stripe Product Price IDs from environment variables
    let priceId = '';
    if (planName === 'Growth') {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH || '';
    } else if (planName === 'Pro') {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '';
    }

    // Fallback sandbox/mock prices if env keys are not bound yet, to prevent immediate crashes!
    if (!priceId) {
      priceId = planName === 'Growth' ? 'price_growth_placeholder' : 'price_pro_placeholder';
    }

    const origin = req.headers.get('origin') || 'https://rxremind.us';

    // Create a hosted Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/billing`,
      metadata: {
        clinicId: session.clinicId,
        planName: planName,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe Checkout Session initialization failed:', error);
    return NextResponse.json({ error: error.message || 'Gateway initialization failed' }, { status: 500 });
  }
}
