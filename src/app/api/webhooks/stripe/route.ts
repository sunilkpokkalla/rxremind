import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { DBBroker } from '@/lib/db';

export async function POST(req: Request) {
  let payload = '';
  try {
    payload = await req.text();
  } catch (err: any) {
    return new Response('Invalid request body payload', { status: 400 });
  }

  const signature = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: any;

  const isProduction = process.env.NODE_ENV === 'production';

  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('Stripe Webhook Signature verification failed:', err.message);
      return new Response(`Webhook Error: Signature verification failed: ${err.message}`, { status: 400 });
    }
  } else {
    if (isProduction) {
      console.error('STRIPE_WEBHOOK_SECRET is missing in production environment. Webhook execution aborted.');
      return new Response('Webhook Error: Webhook secret is not configured.', { status: 500 });
    }
    // Development sandbox fallback if webhook secret is not bound in local environments
    console.warn('STRIPE_WEBHOOK_SECRET is not configured. Signature verification bypassed (SANDBOX ONLY).');
    try {
      event = JSON.parse(payload);
    } catch {
      return new Response('Malformed JSON payload in sandbox', { status: 400 });
    }
  }

  try {
    // 1. Transaction completed successfully
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const clinicId = session.metadata?.clinicId;
      const planName = session.metadata?.planName as 'Starter' | 'Growth' | 'Pro';

      if (clinicId && planName) {
        // Safe database upgrade mutation using service_role bypass
        await DBBroker.updateClinic(clinicId, { 
          plan: planName,
          subscription_active: true
        }, true);
        console.log(`Clinic ${clinicId} successfully upgraded to tier ${planName} via Stripe webhook.`);
      } else {
        console.error('Webhook session metadata was missing clinicId or planName:', session.metadata);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook processor error:', error);
    return new Response(`Stripe Webhook internal handler failed: ${error.message}`, { status: 500 });
  }
}
