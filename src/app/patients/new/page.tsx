'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { createPatientAction } from '@/app/actions';
import { 
  UserPlus, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  ArrowLeft,
  CalendarDays,
  Smartphone,
  ChevronLeft
} from 'lucide-react';


export default function NewPatientPage() {
  const [state, formAction] = useFormState(createPatientAction, null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = () => {
    setIsLoading(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Directory
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Patient Records</span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Enroll New Patient</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add a patient record to start sending automated prescription refill reminders.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <form 
          action={formAction} 
          onSubmit={handleFormSubmit}
          className="space-y-6"
        >
          {state?.error && (
            <div className="p-3.5 bg-danger-light border border-danger/10 text-danger text-sm font-semibold rounded-xl">
              {state.error}
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Personal & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-bold text-slate-700">
                  Full Name <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                    placeholder="Sarah Connor"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-slate-700">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                  Include country code (e.g. +1) for WhatsApp & SMS delivery.
                </p>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="email" className="block text-xs font-bold text-slate-700">
                  Email Address <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                    placeholder="sarah.connor@sky.net"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Prescription Details */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Prescription & Reminder Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Medication Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="medication_name" className="block text-xs font-bold text-slate-700">
                  Prescription Medication Name <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary-dark">
                    <span className="text-sm font-bold">Rx</span>
                  </div>
                  <input
                    id="medication_name"
                    name="medication_name"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                    placeholder="Lisinopril 10mg (Blood Pressure)"
                  />
                </div>
              </div>

              {/* Refill Frequency */}
              <div className="space-y-1.5">
                <label htmlFor="refill_frequency_days" className="block text-xs font-bold text-slate-700">
                  Refill Frequency (Days) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <input
                    id="refill_frequency_days"
                    name="refill_frequency_days"
                    type="number"
                    required
                    min="1"
                    defaultValue="30"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Next Refill Date */}
              <div className="space-y-1.5">
                <label htmlFor="next_refill_date" className="block text-xs font-bold text-slate-700">
                  Next Scheduled Refill Date <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    id="next_refill_date"
                    name="next_refill_date"
                    type="date"
                    required
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition text-slate-600"
                  />
                </div>
              </div>

              {/* Preferred Channel */}
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="reminder_channel" className="block text-xs font-bold text-slate-700">
                  Preferred Notification Channel <span className="text-danger">*</span>
                </label>
                <select
                  id="reminder_channel"
                  name="reminder_channel"
                  required
                  defaultValue="WhatsApp"
                  className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                >
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="SMS">Standard Text Message (SMS)</option>
                  <option value="Email">Email Outreach</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
            <Link
              href="/patients"
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:bg-slate-400 rounded-xl transition duration-150 shadow-md shadow-primary/10"
            >
              {isLoading ? 'Enrolling Patient...' : 'Save Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
