'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Bell, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Mail, 
  MessageSquare,
  Smartphone,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { Patient } from '@/lib/db';
import { deletePatientAction, sendSingleReminderAction } from '@/app/actions';

interface PatientsClientProps {
  patients: Patient[];
}

export default function PatientsClient({ patients }: PatientsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'pending' | 'overdue'>('all');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Status counts
  const countAll = patients.length;
  const countConfirmed = patients.filter((p) => p.status === 'confirmed').length;
  const countPending = patients.filter((p) => p.status === 'pending').length;
  const countOverdue = patients.filter((p) => p.status === 'overdue').length;

  // Filtering + Searching logic
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.medication_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    return p.status === activeFilter && matchesSearch;
  });

  // Handle patient delete
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to delete ${name} from the records?`)) {
      setDeletingId(id);
      startTransition(async () => {
        try {
          await deletePatientAction(id);
          setStatusMessage({ text: `${name} has been removed successfully.`, type: 'success' });
        } catch (err) {
          setStatusMessage({ text: `Failed to delete ${name}.`, type: 'error' });
        } finally {
          setDeletingId(null);
        }
      });
    }
  };

  // Trigger manual reminder
  const handleNotifyNow = (id: string, name: string) => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        await sendSingleReminderAction(id);
        setStatusMessage({ text: `Manual reminder successfully sent to ${name}!`, type: 'success' });
      } catch (err: any) {
        setStatusMessage({ text: `Failed to notify ${name}: ${err.message || 'Unknown error'}`, type: 'error' });
      }
    });
  };

  // Helper: Initial Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Patient Management</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Clinic Patient Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, edit, and send manual outreach notifications for all medical clinic patients.
          </p>
        </div>

        <Link
          href="/patients/new"
          className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold text-white bg-primary hover:bg-primary-hover active:bg-primary-dark rounded-xl transition duration-150 shadow-md shadow-primary/15"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Patient Record
        </Link>
      </div>

      {/* State Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-sm animate-pulse-subtle ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold underline hover:opacity-85">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar & Status Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search by patient name or prescription..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          {[
            { id: 'all', label: 'All', count: countAll, colorClass: 'text-slate-600 bg-slate-200/50' },
            { id: 'confirmed', label: 'Confirmed', count: countConfirmed, colorClass: 'text-emerald-700 bg-emerald-100' },
            { id: 'pending', label: 'Pending', count: countPending, colorClass: 'text-amber-700 bg-amber-100' },
            { id: 'overdue', label: 'Overdue', count: countOverdue, colorClass: 'text-danger bg-danger-light' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center space-x-1.5 ${
                activeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab.colorClass}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table / Grid */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Search className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-pulse-soft" />
          <h3 className="text-base font-extrabold text-slate-800">No Patient Records Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
            No patients matched your current search or status filter. Try clearing your search term or updating filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-4">Patient Name</th>
                    <th scope="col" className="px-6 py-4">Prescribed Medication</th>
                    <th scope="col" className="px-6 py-4">Refill Schedule</th>
                    <th scope="col" className="px-6 py-4">Channel</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPatients.map((patient) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isOverdue = patient.next_refill_date < todayStr && patient.status !== 'confirmed';

                    return (
                      <tr key={patient.id} className="hover:bg-slate-50/50 transition duration-100 group">
                        {/* Name Column */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shadow-sm">
                              {getInitials(patient.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800">{patient.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{patient.phone}</p>
                            </div>
                          </div>
                        </td>

                        {/* Medication Column */}
                        <td className="px-6 py-4">
                          <div className="min-w-[150px]">
                            <p className="text-sm font-semibold text-slate-700 leading-normal">{patient.medication_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Every {patient.refill_frequency_days} days</p>
                          </div>
                        </td>

                        {/* Schedule Column */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center space-x-2 text-slate-600 text-xs">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className={isOverdue ? 'text-danger font-bold' : 'font-medium'}>
                              {patient.next_refill_date}
                            </span>
                            {isOverdue && <AlertTriangle className="h-4.5 w-4.5 text-danger animate-pulse-soft" />}
                          </div>
                        </td>

                        {/* Channel Badge */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            patient.reminder_channel === 'WhatsApp' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : patient.reminder_channel === 'SMS' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {patient.reminder_channel === 'WhatsApp' && <MessageSquare className="mr-1 h-3 w-3" />}
                            {patient.reminder_channel === 'SMS' && <Smartphone className="mr-1 h-3 w-3" />}
                            {patient.reminder_channel === 'Email' && <Mail className="mr-1 h-3 w-3" />}
                            {patient.reminder_channel}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ${
                            patient.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : patient.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-danger'
                          }`}>
                            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                              patient.status === 'confirmed'
                                ? 'bg-emerald-500'
                                : patient.status === 'pending'
                                ? 'bg-amber-500 animate-ping'
                                : 'bg-red-500 animate-ping'
                            }`} />
                            {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Alert trigger */}
                            <button
                              onClick={() => handleNotifyNow(patient.id, patient.name)}
                              disabled={isPending}
                              title="Send Reminder Alert Now"
                              className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition"
                            >
                              <Bell className="h-4 w-4" />
                            </button>

                            {/* Edit Link */}
                            <Link
                              href={`/patients/${patient.id}/edit`}
                              title="Edit Patient"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(patient.id, patient.name)}
                              disabled={deletingId === patient.id}
                              title="Delete Patient"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Grid Card View */}
          <div className="block md:hidden space-y-4">
            {filteredPatients.map((patient) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isOverdue = patient.next_refill_date < todayStr && patient.status !== 'confirmed';

              return (
                <div key={patient.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 relative">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        {getInitials(patient.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-none">{patient.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">{patient.phone}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      patient.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : patient.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-danger'
                    }`}>
                      {patient.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="border-t border-b border-slate-100 py-2.5 space-y-1.5">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Prescription</span>
                      <p className="text-xs font-semibold text-slate-700">{patient.medication_name}</p>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Refill Schedule</span>
                        <span className={`flex items-center space-x-1 mt-0.5 ${isOverdue ? 'text-danger font-bold' : 'text-slate-600'}`}>
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{patient.next_refill_date}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Alert Channel</span>
                        <span className="text-[10px] font-bold text-slate-700 block mt-0.5">{patient.reminder_channel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex justify-between items-center pt-1.5">
                    <button
                      onClick={() => handleNotifyNow(patient.id, patient.name)}
                      disabled={isPending}
                      className="inline-flex items-center text-xs font-bold text-primary hover:opacity-80"
                    >
                      <Bell className="mr-1.5 h-3.5 w-3.5" />
                      Notify Patient
                    </button>

                    <div className="flex space-x-2">
                      <Link
                        href={`/patients/${patient.id}/edit`}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                        title="Edit Patient"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(patient.id, patient.name)}
                        disabled={deletingId === patient.id}
                        className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition"
                        title="Delete Patient"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
