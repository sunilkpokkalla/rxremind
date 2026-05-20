'use client';

import React, { useState, useTransition } from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Lock,
  RefreshCw,
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
      limit: 'Up to 200 Patients',
      popular: false,
      colorClass: 'border-slate-200 hover:border-teal-100 hover:shadow-xl hover:shadow-slate-100/40',
      buttonText: 'Activate Starter Base',
      badgeText: 'CLINIC BASE',
      badgeColor: 'bg-slate-100 text-slate-700',
      ctaColor: 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/10',
      icon: <Activity className="h-5 w-5 text-teal-600" />,
      features: [
        'Up to 200 patient records',
        'Standard Email reminders',
        '3 days-before alert default (Locked)',
        'Standard dashboard analytics',
        'Next-day support dispatch'
      ]
    },
    {
      name: 'Growth',
      price: '$99',
      limit: 'Up to 800 Patients',
      popular: true,
      colorClass: 'border-primary ring-4 ring-primary/10 shadow-2xl shadow-primary/8 hover:border-primary-hover scale-[1.03] md:scale-[1.04] z-10',
      buttonText: 'Unlock Growth Plan',
      badgeText: '★ MOST POPULAR',
      badgeColor: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
      ctaColor: 'bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white hover:opacity-95 shadow-xl shadow-primary/20 animate-pulse-subtle',
      icon: <Award className="h-6 w-6 text-emerald-500" />,
      features: [
        'Up to 800 patient records',
        'WhatsApp + SMS + Email reminders',
        'Custom template message editor',
        'Dynamic alert schedule slider',
        'Bulk patient spreadsheet uploads',
        'Priority online support (< 2 hrs)'
      ]
    },
    {
      name: 'Pro',
      price: '$199',
      limit: 'Unlimited Patients',
      popular: false,
      colorClass: 'bg-slate-900 border-slate-800 text-white hover:border-slate-700 shadow-xl hover:shadow-2xl hover:shadow-teal-950/20',
      buttonText: 'Scale to Unlimited Pro',
      badgeText: '✦ ENTERPRISE POWER',
      badgeColor: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950',
      ctaColor: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-500 hover:to-amber-600 font-extrabold shadow-lg shadow-amber-500/10',
      icon: <Crown className="h-5 w-5 text-amber-400" />,
      features: [
        'Unlimited patient records',
        'WhatsApp + SMS + Email reminders',
        'Custom clinic brand logo settings',
        'Automatic daily sweeps (9:00 AM)',
        'Direct Twilio & Resend API locks',
        '24/7 Priority phone & online support'
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
      case 0: return 'Establishing PCI-DSS secure connection...';
      case 1: return 'Redirecting to secure Stripe Checkout hosted gateway...';
      case 4: return 'Subscription Updated! Payment Completed.';
      case 5: return 'Transaction failed. Please try again.';
      default: return 'Loading secure gateway...';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stripe Payment Success Alert */}
      {showSuccessBanner && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-500/10 text-emerald-800 rounded-3xl flex items-start space-x-4 animate-fade-in shadow-md shadow-emerald-500/5">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2 rounded-2xl shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-emerald-950 text-base">Subscription Transaction Confirmed!</p>
            <p className="text-slate-600 font-semibold text-xs mt-1 leading-relaxed">
              Congratulations! Your payment cleared via Stripe. Your clinic accounts, custom rules, and outreach volume limits are now fully unlocked under the **{clinic.plan} plan**.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-slate-100 pb-5">
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-sans">Subscription Management</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">Clinic Billing & Plans</h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Unlock standard email reminders, custom WhatsApp workflows, and lift sandbox capacity limits.
        </p>
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

      {/* Premium Dashboard Current Plan Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-[32px] relative overflow-hidden shadow-2xl border border-slate-800">
        {/* Glowing background meshes */}
        <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[150%] rounded-full bg-teal-500/15 filter blur-[80px]" />
        <div className="absolute bottom-[-40%] left-[-10%] w-[40%] h-[120%] rounded-full bg-emerald-500/10 filter blur-[60px]" />

        <div className="relative z-10 p-8 sm:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  clinic.plan === 'TestPlan' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse-subtle' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}>
                  {clinic.plan === 'TestPlan' ? 'Free Sandbox Test Mode' : 'Premium Active Clinic'}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                {clinic.plan === 'TestPlan' ? 'Sandbox Account' : `${clinic.plan} Plan`}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Clinic: <span className="text-slate-200 font-bold">{clinic.name}</span> • Registered: <span className="text-slate-300 font-bold">{clinic.email}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md self-start md:self-auto flex items-center space-x-4 shadow-xl">
              <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-3 rounded-xl text-slate-900 shadow-md">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gateway Merchant</span>
                <p className="text-sm font-black text-slate-200 mt-0.5">Stripe Gateway Mode</p>
              </div>
            </div>
          </div>

          {/* CAPACITY PROGRESS INTEGRATION (CRITICAL PSYCHOLOGICAL UPGRADE TRIGGER) */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="h-4.5 w-4.5 text-teal-400" />
                Clinic Patient Capacity Progress
              </span>
              <span className="text-xs font-black text-slate-200 bg-white/10 px-3 py-1 rounded-full">
                {patientCount} / {limit === Infinity ? 'Unlimited' : limit} Patients Registered
              </span>
            </div>
            
            <div className="h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                  clinic.plan === 'TestPlan' ? 'from-amber-400 to-amber-500' : 'from-teal-400 to-emerald-500'
                }`}
                style={{ width: `${limit === Infinity ? 100 : capacityPercentage}%` }}
              />
            </div>

            {clinic.plan === 'TestPlan' && (
              <p className="text-[11px] text-amber-400 font-extrabold flex items-start gap-1.5 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
                <span>⚠️ Sandbox Restriction: Your sandbox demo is locked to 1 patient record and email verification mode. Upgrade to Growth or Pro below to immediately unlock unlimited bulk uploads, lift verification locks, and enable live WhatsApp & SMS alert dispatching!</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Header */}
      <div className="text-center space-y-2 pt-4 max-w-xl mx-auto">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Select Clinic Upgrades</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Upgrade to instantly expand your capability, secure automated scans, and access live delivery networks.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-2 pb-8">
        {plans.map((plan) => {
          const isCurrent = clinic.subscription_active && clinic.plan === plan.name;
          return (
            <div 
              key={plan.name} 
              className={`bg-white border rounded-[32px] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${plan.colorClass} ${
                plan.popular ? 'shadow-2xl shadow-primary/8 ring-4 ring-primary/5' : 'hover:scale-[1.01]'
              }`}
            >
              {/* Plan Header badge */}
              <div className="absolute top-0 right-6 translate-y-[-50%]">
                <span className={`px-3 py-1 text-[9px] font-black rounded-full tracking-wider shadow-md ${plan.badgeColor}`}>
                  {plan.badgeText}
                </span>
              </div>

              <div className="space-y-6">
                {/* Plan Badge & Title */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.name} Plan</h3>
                    <p className={`text-xs font-black uppercase tracking-wider mt-1.5 ${plan.name === 'Pro' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {plan.limit}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-2xl ${plan.name === 'Pro' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    {plan.icon}
                  </div>
                </div>

                <div className="flex items-baseline">
                  <span className={`text-5xl font-black tracking-tight ${plan.name === 'Pro' ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                  <span className={`ml-1 text-sm font-bold ${plan.name === 'Pro' ? 'text-slate-400' : 'text-slate-400'}`}>/month</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 pt-4 text-xs font-semibold">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className={`mr-2.5 p-0.5 rounded-full flex-shrink-0 mt-0.5 ${plan.name === 'Pro' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className={`${plan.name === 'Pro' ? 'text-slate-300' : 'text-slate-600'} leading-normal`}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button CTA */}
              <div className="pt-6 mt-8 border-t border-slate-100/50">
                <button
                  onClick={() => handleUpgradeClick(plan.name as any)}
                  disabled={isCurrent || isPending}
                  className={`w-full py-4 px-5 rounded-2xl text-xs font-black transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200 shadow-none'
                      : plan.ctaColor
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                      Active Tier
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
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
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl max-w-sm w-full p-6 sm:p-8 space-y-6 animate-zoomIn relative">
            
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
                <div className="bg-sky-500/10 p-2.5 rounded-xl text-sky-500">
                  <CreditCard className="h-5 w-5 animate-pulse-subtle" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">rxRemind Gateway</h4>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">Secured by Stripe</span>
                </div>
              </div>
              <Lock className="h-4.5 w-4.5 text-slate-400" />
            </div>

            {/* Content Spinner */}
            <div className="text-center py-6 space-y-4">
              {checkoutStep < 4 ? (
                <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  <CreditCard className="h-6 w-6 text-slate-800 absolute" />
                </div>
              ) : checkoutStep === 4 ? (
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
                  <ShieldCheck className="h-9 w-9 animate-bounce" />
                </div>
              ) : (
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
                  <XCircle className="h-9 w-9" />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-base font-black text-slate-800">
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
              <span>Stripe Elements</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
