'use client';

import React, { useState, useTransition } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Lock,
  Loader2,
  XCircle,
  X,
  Zap,
  Activity,
  Award,
  Crown
} from 'lucide-react';
import { Clinic } from '@/lib/db';

interface BillingClientProps {
  clinic: Clinic;
  patientCount: number;
  showSuccessBanner?: boolean;
}

export default function BillingClient({ clinic, patientCount, showSuccessBanner = false }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [checkoutPlan, setCheckoutPlan] = useState<'TestPlan' | 'Starter' | 'Growth' | 'Pro' | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dynamic capacity limits
  const getPlanLimit = () => {
    switch (clinic.plan) {
      case 'TestPlan': return 1;
      case 'Starter': return 200;
      case 'Growth': return 800;
      default: return Infinity;
    }
  };

  const limit = getPlanLimit();
  const rawPercentage = limit === Infinity ? 0 : (patientCount / limit) * 100;
  const capacityPercentage = Math.min(100, Math.max(0, rawPercentage));

  const plans = [
    {
      name: 'Starter',
      price: '$49',
      limit: 'Up to 200 Patient Records',
      popular: false,
      badgeText: 'Base Clinic',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      ctaColor: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
      buttonText: 'Activate Starter Base',
      icon: <Activity className="h-5 w-5 text-slate-600" />,
      features: [
        'Up to 200 patient records',
        'Standard clinical Email reminders',
        'Locked 3-day alert dispatch',
        'Standard reporting feed',
        'Standard business support'
      ]
    },
    {
      name: 'Growth',
      price: '$99',
      limit: 'Up to 800 Patient Records',
      popular: true,
      badgeText: '★ Clinic Preferred',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      ctaColor: 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/10',
      buttonText: 'Unlock Growth Plan',
      icon: <Award className="h-5 w-5 text-primary" />,
      features: [
        'Up to 800 patient records',
        'WhatsApp + SMS + Email dispatch',
        'Custom outreach template editor',
        'Flexible 1-14 days alert dispatch slider',
        'Bulk patient spreadsheet uploads',
        'Priority business support (<2hrs)'
      ]
    },
    {
      name: 'Pro',
      price: '$199',
      limit: 'Unlimited Patient Records',
      popular: false,
      badgeText: '✦ Enterprise scale',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      ctaColor: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
      buttonText: 'Unlock Pro Plan',
      icon: <Crown className="h-5 w-5 text-amber-500" />,
      features: [
        'Unlimited patient records',
        'WhatsApp + SMS + Email dispatch',
        'Clinic custom partner brand logo',
        'Automatic daily sweeps (9:00 AM)',
        'Custom Twilio & Resend API integrations',
        'Dedicated 24/7 client manager support'
      ]
    }
  ];

  // Stripe Checkout production redirect pipeline
  const handleUpgradeClick = async (planName: 'TestPlan' | 'Starter' | 'Growth' | 'Pro') => {
    if (clinic.plan === planName && clinic.subscription_active) return;

    setCheckoutPlan(planName);
    setCheckoutStep(0); // Connecting to secure API
    setStatusMessage(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to create payment session');
      }

      setTimeout(() => {
        setCheckoutStep(1); // Redirecting to Stripe
        
        setTimeout(() => {
          window.location.href = data.url;
        }, 1200);
      }, 1000);

    } catch (err: any) {
      console.error('Stripe billing integration error:', err);
      setStatusMessage(err.message || 'Stripe Checkout gateway transaction failed.');
      setCheckoutStep(5); // Error completion
    }
  };

  const getCheckoutStepMessage = () => {
    switch (checkoutStep) {
      case 0: return 'Establishing secure merchant connection...';
      case 1: return 'Redirecting to secure Stripe Checkout hosted gateway...';
      case 4: return 'Subscription Updated! Payment Completed.';
      case 5: return 'Transaction failed. Please try again.';
      default: return 'Loading secure gateway...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stripe Payment Success Alert */}
      {showSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl flex items-start space-x-3.5 shadow-sm animate-fade-in">
          <div className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-emerald-950">Subscription Transaction Cleared!</p>
            <p className="text-slate-600 font-medium text-xs mt-0.5 leading-relaxed">
              Your Stripe subscription cleared successfully. Your clinic is now upgraded to the **{clinic.plan} plan**. All limits have been instantly adjusted!
            </p>
          </div>
        </div>
      )}

      {/* Page Header (Matched exactly to Dashboard Client layout) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Subscription Management</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Clinic Billing & Plans
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unlock standard email reminders, custom WhatsApp workflows, and lift sandbox capacity limits.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl self-start lg:self-auto shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Stripe Merchant Online</span>
        </div>
      </div>

      {/* State Notification */}
      {statusMessage && checkoutPlan === null && (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-pulse-subtle">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold underline hover:opacity-85">
            Dismiss
          </button>
        </div>
      )}

      {/* Premium Pristine White Current Plan Card (Perfect Design Harmony) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        {/* Subtle decorative mesh background */}
        <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[150%] rounded-full bg-primary/5 filter blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                clinic.plan === 'TestPlan' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {clinic.plan === 'TestPlan' ? 'Free Sandbox Test Mode' : 'Premium Active'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Current Plan: {clinic.plan === 'TestPlan' ? 'Sandbox Account' : `${clinic.plan} Plan`}
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Active Clinic Profile Name: <span className="text-slate-800 font-semibold">{clinic.name}</span> • Registered Clinical Email: <span className="text-slate-800 font-semibold">{clinic.email}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 self-start lg:self-auto flex items-center space-x-3.5 shadow-inner">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gateway Terminal</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">Stripe Gateway Mode</p>
            </div>
          </div>
        </div>

        {/* Capacity Progress bar matching standard white metrics */}
        <div className="pt-5 border-t border-slate-100 space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              Patient Database Enrollment Threshold
            </span>
            <span className="text-[11px] font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/50">
              {patientCount} / {limit === Infinity ? 'Unlimited' : `${limit} Patients`}
            </span>
          </div>
          
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                clinic.plan === 'TestPlan' ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${limit === Infinity ? 100 : capacityPercentage}%` }}
            />
          </div>

          {clinic.plan === 'TestPlan' && (
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-2 bg-amber-50 border border-amber-200/50 p-3 rounded-2xl flex items-start gap-2">
              <span className="select-none mt-0.5">🔒</span>
              <span>
                <strong>Sandbox Restriction Notice:</strong> Your sandbox accounts are limited to 1 patient. Upgrading instantly unlocks high-volume patient spreadsheet uploads, removes outreach channel blocks, and enables automatic daily sweeps!
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Pristine White pricing grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {plans.map((plan) => {
          const isCurrent = clinic.subscription_active && clinic.plan === plan.name;
          return (
            <div 
              key={plan.name} 
              className={`bg-white border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                plan.popular 
                  ? 'border-primary ring-2 ring-primary/20 shadow-md shadow-primary/5' 
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-6 translate-y-[-50%]">
                  <span className="px-3 py-0.5 text-[9px] font-bold rounded-full tracking-wider shadow-sm bg-primary text-white border border-primary-hover">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-5">
                {/* Plan Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{plan.name} Plan</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{plan.limit}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    {plan.icon}
                  </div>
                </div>

                <div className="flex items-baseline text-slate-900">
                  <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-xs font-bold text-slate-400">/month</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-3 border-t border-slate-100 text-xs font-medium">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-normal">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button CTA */}
              <div className="pt-5 mt-6 border-t border-slate-100">
                <button
                  onClick={() => handleUpgradeClick(plan.name as any)}
                  disabled={isCurrent || isPending}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-default'
                      : plan.ctaColor
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Active Clinic Tier
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      {plan.name === 'Starter' && !clinic.subscription_active 
                        ? 'Activate Starter Base' 
                        : plan.buttonText}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stripe checkout simulation Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 sm:p-8 space-y-6 animate-zoomIn relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setCheckoutPlan(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-sky-500/10 p-2 rounded-xl text-sky-500">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">rxRemind Checkout</h4>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">Secured by Stripe</span>
                </div>
              </div>
              <Lock className="h-4 w-4 text-slate-400" />
            </div>

            {/* Content Spinner */}
            <div className="text-center py-6 space-y-4">
              {checkoutStep < 4 ? (
                <div className="relative h-14 w-14 mx-auto flex items-center justify-center">
                  <Loader2 className="h-14 w-14 text-primary animate-spin" />
                  <CreditCard className="h-5 w-5 text-slate-800 absolute" />
                </div>
              ) : checkoutStep === 4 ? (
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
                  <ShieldCheck className="h-8 w-8 animate-bounce" />
                </div>
              ) : (
                <div className="h-14 w-14 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
                  <XCircle className="h-8 w-8" />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {checkoutStep === 4 ? 'Payment Confirmed!' : `Activating ${checkoutPlan} Plan`}
                </p>
                <p className="text-xs text-slate-500 font-semibold px-4 mt-1 leading-normal h-8">
                  {getCheckoutStepMessage()}
                </p>
              </div>
            </div>

            {/* Safe Badges */}
            <div className="flex justify-center items-center space-x-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>PCI-DSS Compliant</span>
              <span>•</span>
              <span>Stripe Secure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
