'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { signUpAction } from '@/app/actions';
import { 
  ActivitySquare, 
  Mail, 
  Lock, 
  Building2, 
  Phone, 
  ArrowRight, 
  BadgeCheck, 
  MessageSquare,
  Clock
} from 'lucide-react';

export default function SignupPage() {
  const [state, formAction] = useActionState(signUpAction, null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    // Explicitly scan the DOM for .cf-turnstile elements after a tiny delay
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).turnstile) {
        try {
          (window as any).turnstile.implicitRender();
        } catch (e) {
          // ignore already rendered errors
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFormSubmit = () => {
    setIsLoading(true);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel: Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white z-10 shadow-xl">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-primary p-2.5 rounded-2xl text-white shadow-md shadow-primary/20">
              <ActivitySquare className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">RxRemind</span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Register your Clinic
          </h2>
          <p className="mt-2.5 text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover transition">
              Sign in to your dashboard
            </Link>
          </p>

          {/* Registration Form */}
          <form 
            action={formAction} 
            onSubmit={handleFormSubmit}
            className="mt-8 space-y-6"
          >
            {state?.error && (
              <div className="p-3.5 bg-danger-light border border-danger/10 text-danger text-sm font-semibold rounded-xl">
                {state.error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="clinicName" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Medical Clinic Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    id="clinicName"
                    name="clinicName"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                    placeholder="CareFirst Pediatric Clinic"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="clinicPhone" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Clinic Phone Number
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="clinicPhone"
                    name="clinicPhone"
                    type="tel"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                    placeholder="+1 (555) 019-9988"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Owner Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                    placeholder="dr.smith@yourclinic.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>
            </div>



            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-3.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:bg-slate-400 active:bg-primary-dark rounded-xl transition duration-150 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Setting up Clinic...</span>
                  </span>
                ) : (
                  <>
                    <span>Create Clinic Account</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right panel: Premium Marketing Showcase */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-slate-900 to-indigo-950 opacity-90 z-0" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 filter blur-3xl z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 filter blur-3xl z-0" />

        <div className="relative z-10 max-w-lg text-white">
          <div className="space-y-8">
            <div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-primary-light tracking-wide uppercase">
                Now Live: v2.4 Release
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
                Automated refills, healthier patients.
              </h1>
              <p className="mt-4 text-lg text-slate-300 leading-relaxed">
                RxRemind enables independent medical clinics to reduce prescription drop-offs and administrative burdens using friendly automated reminders.
              </p>
            </div>

            {/* Glowing Statistics */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Patient Care</span>
                </div>
                <div className="text-2xl font-black mt-2">98.4%</div>
                <p className="text-xs text-slate-400 mt-1">Refill response rate</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-primary-light">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Reach</span>
                </div>
                <div className="text-2xl font-black mt-2">24.5k+</div>
                <p className="text-xs text-slate-400 mt-1">Reminders sent monthly</p>
              </div>
            </div>

            {/* Showcase Features list */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-3.5">
                <div className="bg-primary/20 p-2 rounded-xl text-primary-light">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-200">WhatsApp, SMS, and Email integrations</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <div className="bg-primary/20 p-2 rounded-xl text-primary-light">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-200">Intelligent daily automated 9 AM scan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
