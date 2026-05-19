'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Clinic, Patient, Reminder } from '@/lib/db';
import { triggerScanAction, simulatePatientReplyAction, sendSingleReminderAction } from '@/app/actions';

interface DashboardClientProps {
  clinic: Clinic;
  patients: Patient[];
  reminders: Reminder[];
}

export default function DashboardClient({ clinic, patients, reminders }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [selectedPatientReply, setSelectedPatientReply] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('YES');

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const totalPatients = patients.length;
  const overduePatients = patients.filter((p) => p.status === 'overdue');
  const pendingPatients = patients.filter((p) => p.status === 'pending');
  const confirmedPatients = patients.filter((p) => p.status === 'confirmed');

  // Reminders today
  const todayReminders = reminders.filter((r) => r.sent_at.split('T')[0] === todayStr);
  const remindersSentTodayCount = todayReminders.length;
  const confirmationsTodayCount = todayReminders.filter((r) => r.status === 'confirmed').length;

  // Calculate global confirmation response rate
  const confirmedRemindersCount = reminders.filter(r => r.status === 'confirmed').length;
  const totalSentCount = reminders.length;
  const responseRate = totalSentCount > 0 
    ? Math.round((confirmedRemindersCount / totalSentCount) * 100) 
    : 0;

  // Trigger automated daily scan
  const handleTriggerScan = () => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        const result = await triggerScanAction(clinic.id);
        setStatusMessage({
          text: `Daily scan completed! Verified ${result.scanned} patients. Dispatched ${result.sent} new automated reminders.`,
          type: result.sent > 0 ? 'success' : 'info'
        });
      } catch (err) {
        setStatusMessage({ text: 'Failed to run daily reminder check.', type: 'error' });
      }
    });
  };

  // Dispatch individual reminder
  const handleSendManualReminder = (patientId: string, patientName: string) => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        await sendSingleReminderAction(patientId);
        setStatusMessage({
          text: `Emergency manual reminder successfully dispatched to ${patientName}!`,
          type: 'success'
        });
      } catch (err) {
        setStatusMessage({ text: `Failed to notify ${patientName}.`, type: 'error' });
      }
    });
  };

  // Simulate patient SMS/WhatsApp reply
  const handleSimulateReply = (patientId: string, patientName: string, customReply?: string) => {
    setStatusMessage(null);
    const textReply = customReply || replyInput;
    startTransition(async () => {
      try {
        await simulatePatientReplyAction(patientId, textReply);
        setStatusMessage({
          text: `Incoming message simulated from ${patientName}: "${textReply}". Database updated!`,
          type: 'success'
        });
        setSelectedPatientReply(null);
      } catch (err) {
        setStatusMessage({ text: 'Failed to simulate incoming message.', type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Premium Subscription Inactive Notice Bar */}
      {!clinic.subscription_active && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in-50 duration-300">
          <div className="flex items-start space-x-3.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <AlertTriangle className="h-5 w-5 animate-pulse-soft" />
            </div>
            <div className="text-xs">
              <span className="font-extrabold text-amber-950 block text-sm">Subscription Pending / Inactive</span>
              <p className="text-slate-600 mt-1 leading-relaxed max-w-2xl font-medium">
                Your clinic's automated reminders and patient outreach services are currently paused. Enable your billing subscription plan to immediately activate daily refill checks, manual outreach notifications, and CSV list imports.
              </p>
            </div>
          </div>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/10 transition flex-shrink-0 cursor-pointer"
          >
            Activate Subscription Plan
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Clinic Dashboard</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Welcome back, {clinic.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Clinic Plan: <span className="font-semibold text-slate-700">{clinic.plan} Tier</span> • Auto-Reminders: <span className="font-semibold text-emerald-600">{clinic.auto_reminders ? 'Enabled' : 'Disabled'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTriggerScan}
            disabled={isPending}
            className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover active:bg-primary-dark disabled:bg-slate-400 rounded-xl transition shadow-sm shadow-primary/10"
          >
            {isPending ? (
              <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-2 h-3.5 w-3.5 fill-current" />
            )}
            Run Daily Refill Check (9 AM)
          </button>
          <Link
            href="/patients/new"
            className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            + Add Patient
          </Link>
        </div>
      </div>

      {/* State Notification Toasts */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-sm animate-pulse-subtle ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : statusMessage.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline hover:opacity-80 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Patients */}
        <Link href="/patients" className="glass-card glass-card-hover p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
            <div className="text-3xl font-extrabold text-slate-800 mt-2">{totalPatients}</div>
            <span className="inline-flex items-center text-[10px] font-bold text-primary mt-1">
              Manage Patients <ChevronRight className="ml-0.5 h-3 w-3" />
            </span>
          </div>
          <div className="bg-primary-light p-3 rounded-2xl text-primary">
            <Users className="h-6 w-6" />
          </div>
        </Link>

        {/* Reminders Today */}
        <Link href="/reminders" className="glass-card glass-card-hover p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alerts Sent Today</span>
            <div className="text-3xl font-extrabold text-slate-800 mt-2">{remindersSentTodayCount}</div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Active Outreach Queue
            </span>
          </div>
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <Bell className="h-6 w-6" />
          </div>
        </Link>

        {/* Confirmations Today */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Response Rate</span>
            <div className="text-3xl font-extrabold text-slate-800 mt-2">{responseRate}%</div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {confirmationsTodayCount} Confirmed today
            </span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Overdue Patients */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          {overduePatients.length > 0 && (
            <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-danger rounded-full animate-ping m-2" />
          )}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Refills</span>
            <div className="text-3xl font-extrabold text-danger mt-2">{overduePatients.length}</div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Needs clinic intervention
            </span>
          </div>
          <div className={`p-3 rounded-2xl ${overduePatients.length > 0 ? 'bg-red-100 text-danger animate-pulse-soft' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Sections (Overdue Refills & Active Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Overdue & Simulators */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Overdue Patients Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <h3 className="font-extrabold text-slate-900 text-base">Critical Overdue Refills</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-red-100 text-danger rounded-full text-xs font-bold">
                {overduePatients.length} Patients Overdue
              </span>
            </div>

            {overduePatients.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold">Excellent! No patients are overdue for prescriptions today.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {overduePatients.map((patient) => (
                  <div key={patient.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{patient.name}</h4>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{patient.reminder_channel}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">{patient.medication_name}</p>
                      <p className="text-[10px] text-danger font-bold uppercase tracking-wider mt-1">Refill Date passed: {patient.next_refill_date}</p>
                    </div>

                    <button
                      onClick={() => handleSendManualReminder(patient.id, patient.name)}
                      disabled={isPending}
                      className="flex-shrink-0 px-3.5 py-1.5 text-xs font-bold text-white bg-danger hover:bg-danger-hover rounded-xl shadow-sm transition"
                    >
                      Notify Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response Simulator Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-extrabold text-slate-900 text-base">Patient Reply Webhook Simulator</h3>
              </div>
              <span className="px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-bold">
                Interactive Testing
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              When a patient responds <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-primary-dark">&quot;YES&quot;</code> or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-primary-dark">&quot;CONFIRM&quot;</code> to our WhatsApp/SMS reminder, their status updates to <span className="text-emerald-600 font-bold">Confirmed</span> and their next refill calendar is automatically bumped forward by their refill frequency. Use the simulator below to play with this!
            </p>

            {pendingPatients.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl mt-4 bg-slate-50/50">
                <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-pulse-soft" />
                <p className="text-xs font-semibold">No patients are currently in "Pending" status awaiting alerts.</p>
                <p className="text-[10px] text-slate-400 mt-1">Click "Run Daily Refill Check" above to trigger pending notifications!</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Patient list */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Select Pending Patient</label>
                    <select
                      value={selectedPatientReply || ''}
                      onChange={(e) => setSelectedPatientReply(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700"
                    >
                      <option value="" disabled>-- Choose pending patient --</option>
                      {pendingPatients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.medication_name.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Type message reply</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="YES"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800"
                      />
                      <button
                        onClick={() => {
                          const pat = pendingPatients.find(p => p.id === selectedPatientReply);
                          if (pat) handleSimulateReply(pat.id, pat.name);
                        }}
                        disabled={!selectedPatientReply || isPending}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl disabled:bg-slate-300 transition"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pre-fill Quick Buttons */}
                {selectedPatientReply && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Simulations:</span>
                    <button
                      onClick={() => {
                        const pat = pendingPatients.find(p => p.id === selectedPatientReply);
                        if (pat) handleSimulateReply(pat.id, pat.name, 'YES');
                      }}
                      disabled={isPending}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200/50 transition"
                    >
                      Simulate &quot;YES&quot; (Auto-Confirm & Reschedule!)
                    </button>
                    <button
                      onClick={() => {
                        const pat = pendingPatients.find(p => p.id === selectedPatientReply);
                        if (pat) handleSimulateReply(pat.id, pat.name, 'Need more time');
                      }}
                      disabled={isPending}
                      className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition"
                    >
                      Simulate custom response
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Activity Feed */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col h-[525px]">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 flex-shrink-0">
            <Clock className="h-5 w-5 text-indigo-500" />
            <h3 className="font-extrabold text-slate-900 text-base">Recent Patient Activity</h3>
          </div>

          {reminders.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-center p-6">
              <MessageSquare className="h-10 w-10 text-slate-200 mb-2" />
              <p className="text-sm font-semibold">No patient interactions recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Logs populate here as automated and manual reminders are sent.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
              {reminders.slice(0, 10).map((log) => {
                const patName = patients.find(p => p.id === log.patient_id)?.name || 'Patient';
                const formattedTime = new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const formattedDate = new Date(log.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <div key={log.id} className="relative flex space-x-3 items-start group">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      log.status === 'confirmed' 
                        ? 'bg-emerald-500 ring-4 ring-emerald-50' 
                        : log.status === 'failed'
                        ? 'bg-red-500 ring-4 ring-red-50'
                        : 'bg-primary ring-4 ring-primary-light'
                    }`} />
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">{patName}</p>
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">
                          {log.channel}
                        </span>
                      </div>

                      {log.response ? (
                        <div className="mt-1 bg-slate-50 rounded-xl p-2 border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient replied:</p>
                          <p className="text-xs text-slate-700 font-medium italic mt-0.5">&quot;{log.response}&quot;</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal truncate">{log.message_body}</p>
                      )}

                      <div className="flex items-center space-x-1.5 text-[9px] font-bold text-slate-400 mt-1.5">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>{formattedTime}</span>
                        <span>•</span>
                        <span className={log.status === 'confirmed' ? 'text-emerald-600' : 'text-slate-500'}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
