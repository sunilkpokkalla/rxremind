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
  XCircle
} from 'lucide-react';
import { Clinic } from '@/lib/db';
import { upgradePlanAction } from '@/app/actions';

interface BillingClientProps {
  clinic: Clinic;
}

export default function BillingClient({ clinic }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [checkoutPlan, setCheckoutPlan] = useState<'Starter' | 'Growth' | 'Pro' | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      price: '$49',
      limit: '200 patients limit',
      popular: false,
      colorClass: 'border-slate-200 hover:border-slate-300',
      buttonText: 'Starter Base',
      features: [
        'Up to 200 patient records',
        'Standard Email reminders',
        '3 days-before alert default',
        'Standard dashboard reporting',
        'Next-day online support'
      ]
    },
    {
      name: 'Growth',
      price: '$99',
      limit: '800 patients limit',
      popular: true,
      colorClass: 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/5 hover:border-primary-hover scale-[1.02]',
      buttonText: 'Upgrade to Growth',
      features: [
        'Up to 800 patient records',
        'WhatsApp + SMS + Email alerts',
        'Custom reminder message editor',
        'Dynamic days-before alerts slider',
        'Incoming webhook simulators',
        'Priority online support (under 2hrs)'
      ]
    },
    {
      name: 'Pro',
      price: '$199',
      limit: 'Unlimited patients',
      popular: false,
      colorClass: 'border-slate-200 hover:border-slate-300',
      buttonText: 'Upgrade to Pro',
      features: [
        'Unlimited patient records',
        'WhatsApp + SMS + Email alerts',
        'Custom Twilio/Resend API config',
        'Custom daily automated scan cron',
        'Multi-user clinic seat logins',
        'Dedicated 24/7 phone support'
      ]
    }
  ];

  // Stripe Checkout pipeline simulator
  const handleUpgradeClick = (planName: 'Starter' | 'Growth' | 'Pro') => {
    if (clinic.plan === planName) return;

    setCheckoutPlan(planName);
    setCheckoutStep(0);
    setStatusMessage(null);

    // Sequence 1: Connecting (1000ms)
    setTimeout(() => {
      setCheckoutStep(1); // Authenticating
      
      // Sequence 2: Authenticating (1000ms)
      setTimeout(() => {
        setCheckoutStep(2); // Generating Subscription Invoice
        
        // Sequence 3: Generating invoice (800ms)
        setTimeout(() => {
          setCheckoutStep(3); // Completing Sync
          
          // Sequence 4: Finalize Server action (800ms)
          setTimeout(() => {
            startTransition(async () => {
              try {
                const res = await upgradePlanAction(clinic.id, planName);
                setStatusMessage(res.message);
                setCheckoutStep(4); // Success Completion
                
                // Close modal after 1.5s
                setTimeout(() => {
                  setCheckoutPlan(null);
                  setCheckoutStep(0);
                }, 1500);
              } catch (err) {
                setStatusMessage('Stripe Checkout gateway transaction failed.');
                setCheckoutStep(5); // Error
              }
            });
          }, 800);
        }, 800);
      }, 1000);
    }, 1000);
  };

  const getCheckoutStepMessage = () => {
    switch (checkoutStep) {
      case 0: return 'Connecting to Stripe secure checkout API...';
      case 1: return 'Authenticating clinic merchant account...';
      case 2: return 'Generating subscription agreement and invoice...';
      case 3: return 'Synchronizing clinic database tier credentials...';
      case 4: return 'Subscription Updated! Payment Completed.';
      case 5: return 'Transaction failed. Please try again.';
      default: return 'Loading secure gateway...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Subscription Management</span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Clinic Billing & Plans</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your clinic's billing tier, upgrade patient quota tiers, or integrate your credit card.
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

      {/* Current Plan Indicator Card */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden shadow-xl">
        {/* Background blobs */}
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[150%] rounded-full bg-primary/20 filter blur-3xl" />
        <div className="absolute bottom-[-50%] left-[-10%] w-[30%] h-[100%] rounded-full bg-emerald-500/10 filter blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-primary-light uppercase tracking-wider">
              Current Billing Account
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {clinic.plan} Plan
            </h2>
            <p className="text-xs text-slate-400">
              Billing Date: <span className="font-semibold text-slate-300">Monthly, renews on the 1st</span> • Registered Email: <span className="font-semibold text-slate-300">{clinic.email}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm self-start md:self-auto flex items-center space-x-3.5">
            <div className="bg-primary-light/10 p-2.5 rounded-xl text-primary-light">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulated Merchant</span>
              <p className="text-sm font-bold text-slate-200 mt-0.5">Stripe Gateway Mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((plan) => {
          const isCurrent = clinic.plan === plan.name;
          return (
            <div 
              key={plan.name} 
              className={`bg-white border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${plan.colorClass}`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-6 translate-y-[-50%] px-3.5 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-md">
                  Most Popular
                </span>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{plan.name} Plan</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{plan.limit}</p>
                </div>

                <div className="flex items-baseline text-slate-900">
                  <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-sm font-bold text-slate-400">/mo</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-normal font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6">
                <button
                  onClick={() => handleUpgradeClick(plan.name as any)}
                  disabled={isCurrent || isPending}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : plan.popular
                      ? 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/10'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCurrent ? 'Active Subscription' : plan.buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stripe checkout simulation Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 sm:p-8 space-y-6 animate-zoomIn relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-sky-500/10 p-2 rounded-xl text-sky-500">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">RxRemind Checkout</h4>
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
                  <CreditCard className="h-5 w-5 text-slate-700 absolute" />
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
                  {checkoutStep === 4 ? 'Payment Confirmed!' : `Subscribing to ${checkoutPlan} Plan`}
                </p>
                <p className="text-xs text-slate-500 font-semibold px-4 mt-1 leading-normal h-8">
                  {getCheckoutStepMessage()}
                </p>
              </div>
            </div>

            {/* Safe Badges */}
            <div className="flex justify-center items-center space-x-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>PCI Compliant</span>
              <span>•</span>
              <span>SSL Encryption</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
