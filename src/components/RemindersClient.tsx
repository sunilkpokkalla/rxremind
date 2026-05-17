'use client';

import React, { useState, useTransition } from 'react';
import { 
  Bell, 
  Calendar, 
  MessageSquare, 
  Smartphone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Filter, 
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Reminder, Patient } from '@/lib/db';
import { sendSingleReminderAction } from '@/app/actions';

interface RemindersClientProps {
  reminders: Reminder[];
  patients: Patient[];
}

export default function RemindersClient({ reminders, patients }: RemindersClientProps) {
  const [activeChannel, setActiveChannel] = useState<'all' | 'WhatsApp' | 'SMS' | 'Email'>('all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'sent' | 'confirmed' | 'failed'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null);
  
  const [quickSendPatientId, setQuickSendPatientId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick Notification trigger
  const handleQuickSend = () => {
    if (!quickSendPatientId) return;
    const patient = patients.find((p) => p.id === quickSendPatientId);
    if (!patient) return;

    setStatusMessage(null);
    startTransition(async () => {
      try {
        await sendSingleReminderAction(quickSendPatientId);
        setStatusMessage({ text: `Manual reminder successfully sent to ${patient.name}!`, type: 'success' });
        setQuickSendPatientId('');
      } catch (err) {
        setStatusMessage({ text: `Failed to notify ${patient.name}.`, type: 'error' });
      }
    });
  };

  // Filter logic
  const filteredReminders = reminders.filter((r) => {
    const matchesChannel = activeChannel === 'all' || r.channel === activeChannel;
    const matchesStatus = activeStatus === 'all' || r.status === activeStatus;
    
    let matchesDate = true;
    if (filterDate) {
      const sentDateStr = r.sent_at.split('T')[0];
      matchesDate = sentDateStr === filterDate;
    }

    return matchesChannel && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Outreach logs</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Alert Dispatch & History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit trail of all WhatsApp, SMS, and Email prescription refill notifications sent to patients.
          </p>
        </div>

        {/* Quick Send Dispatcher */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-2 max-w-md w-full lg:w-auto flex-shrink-0">
          <select
            value={quickSendPatientId}
            onChange={(e) => setQuickSendPatientId(e.target.value)}
            className="w-full sm:w-56 border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Direct Dispatch Patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.medication_name.split(' ')[0]})
              </option>
            ))}
          </select>
          <button
            onClick={handleQuickSend}
            disabled={!quickSendPatientId || isPending}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center transition"
          >
            <Bell className="mr-1.5 h-3.5 w-3.5 fill-current" />
            Send Now
          </button>
        </div>
      </div>

      {/* State Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-sm animate-pulse-subtle ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4.5 w-4.5" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold underline hover:opacity-85">
            Dismiss
          </button>
        </div>
      )}

      {/* Dynamic Filters panel */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Channel Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Channel</label>
          <select
            value={activeChannel}
            onChange={(e) => setActiveChannel(e.target.value as any)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Channels (WhatsApp, SMS, Email)</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="SMS">SMS (Text)</option>
            <option value="Email">Email</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Delivery Status</label>
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value as any)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Statuses (Sent, Confirmed, Failed)</option>
            <option value="sent">Sent</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Dispatch Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Filter Stats Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100/50 p-3 rounded-xl border border-slate-200/40">
        <span className="font-semibold text-slate-700">Showing {filteredReminders.length} reminder log entries</span>
        {(activeChannel !== 'all' || activeStatus !== 'all' || filterDate !== '') && (
          <button
            onClick={() => {
              setActiveChannel('all');
              setActiveStatus('all');
              setFilterDate('');
            }}
            className="text-primary font-bold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table / Cards */}
      {filteredReminders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Filter className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-pulse-soft" />
          <h3 className="text-base font-extrabold text-slate-800">No Reminders Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
            No communication records matched your active filter settings. Click "Clear Filters" to see all history logs.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4">Recipient Patient</th>
                  <th scope="col" className="px-6 py-4">Delivery Channel</th>
                  <th scope="col" className="px-6 py-4">Sent At Timestamp</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Patient Reply</th>
                  <th scope="col" className="px-6 py-4 text-right">Message Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs">
                {filteredReminders.map((reminder) => {
                  const patient = patients.find((p) => p.id === reminder.patient_id);
                  const isExpanded = expandedReminderId === reminder.id;
                  
                  const formattedTime = new Date(reminder.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const formattedDate = new Date(reminder.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <React.Fragment key={reminder.id}>
                      <tr className="hover:bg-slate-50/30 transition duration-700">
                        {/* Patient Name */}
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-800">
                          {patient ? patient.name : 'Unknown Patient'}
                          {patient && (
                            <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">{patient.phone}</span>
                          )}
                        </td>

                        {/* Channel Badge */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            reminder.channel === 'WhatsApp' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : reminder.channel === 'SMS' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {reminder.channel === 'WhatsApp' && <MessageSquare className="mr-1 h-3 w-3" />}
                            {reminder.channel === 'SMS' && <Smartphone className="mr-1 h-3 w-3" />}
                            {reminder.channel === 'Email' && <Mail className="mr-1 h-3 w-3" />}
                            {reminder.channel}
                          </span>
                        </td>

                        {/* Date/Time Column */}
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600 font-medium">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formattedDate}</span>
                            <span>at</span>
                            <span>{formattedTime}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg font-bold ${
                            reminder.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : reminder.status === 'failed'
                              ? 'bg-red-50 text-danger border border-red-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {reminder.status === 'confirmed' && <CheckCircle className="mr-1 h-3.5 w-3.5" />}
                            {reminder.status === 'failed' && <XCircle className="mr-1 h-3.5 w-3.5" />}
                            {reminder.status === 'sent' && <Clock className="mr-1 h-3.5 w-3.5" />}
                            {reminder.status.toUpperCase()}
                          </span>
                        </td>

                        {/* Patient Reply */}
                        <td className="px-6 py-4 font-semibold">
                          {reminder.response ? (
                            <span className={`px-2 py-0.5 rounded-lg border text-[11px] italic font-medium ${
                              reminder.response.toUpperCase() === 'YES' || reminder.response.toUpperCase() === 'CONFIRM'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50'
                                : 'bg-slate-50 text-slate-600 border-slate-200/50'
                            }`}>
                              "{reminder.response}"
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Actions: View Message */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <button
                            onClick={() => setExpandedReminderId(isExpanded ? null : reminder.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                                Hide Text
                              </>
                            ) : (
                              <>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View Text
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Message Content Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/50 px-8 py-4 border-t border-b border-slate-100">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm max-w-3xl space-y-2 relative">
                              <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Generated message payload:</span>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed font-sans select-all">
                                {reminder.message_body}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
