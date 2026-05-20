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
  UserPlus,
  FileSpreadsheet,
  Upload,
  X,
  Download,
  Sparkles
} from 'lucide-react';
import { Patient, Clinic } from '@/lib/db';
import { deletePatientAction, sendSingleReminderAction, importPatientsAction } from '@/app/actions';

interface PatientsClientProps {
  clinic: Clinic;
  patients: Patient[];
}

export default function PatientsClient({ clinic, patients }: PatientsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'pending' | 'overdue'>('all');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // CSV Importer States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedPatients, setParsedPatients] = useState<Array<{
    data: {
      name: string;
      phone: string;
      email: string;
      medication_name: string;
      refill_frequency_days: number;
      next_refill_date: string;
      reminder_channel: 'WhatsApp' | 'SMS' | 'Email';
    };
    errors: string[];
  }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
        const res = await sendSingleReminderAction(id);
        if (res && !res.success) {
          setStatusMessage({ text: `Failed to notify ${name}: ${res.error}`, type: 'error' });
        } else {
          setStatusMessage({ text: `Manual reminder successfully sent to ${name}!`, type: 'success' });
        }
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

  // CSV Importer Event Helpers & Parsers
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Phone,Email,Medication Name,Refill Frequency Days,Next Refill Date,Reminder Channel\n"
      + "John Doe,+18669837226,john@example.com,Lisinopril 10mg,30,2026-06-15,SMS\n"
      + "Jane Smith,+18669837226,jane@example.com,Atorvastatin 20mg,90,2026-07-01,WhatsApp\n"
      + "Robert Johnson,+18669837226,robert@example.com,Metformin 500mg,30,2026-06-20,Email";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "rxremind_patients_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      const rows = parseCSV(text);
      validateRows(rows);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/);
    const result: any[] = [];
    if (lines.length < 2) return [];
    
    // Parse headers - clean them up
    const headers = lines[0].split(',').map(h => 
      h.trim().replace(/^["']|["']$/g, '').toLowerCase()
    );
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
      
      const rowObj: any = {};
      headers.forEach((header, index) => {
        const key = header
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        rowObj[key] = values[index] || '';
      });
      result.push(rowObj);
    }
    return result;
  };

  const validateRows = (rows: any[]) => {
    const validated = rows.map((row) => {
      const errors: string[] = [];
      
      // Fuzzy mapping for headers
      const name = (row.name || row.patient_name || row.fullname || '').trim();
      const phone = (row.phone || row.phone_number || row.mobile || '').trim();
      const email = (row.email || row.email_address || '').trim();
      
      const medication_name = (
        row.medication_name || 
        row.medication || 
        row.prescription || 
        row.drug || 
        ''
      ).trim();
      
      const rawFreq = row.refill_frequency_days || row.refill_frequency || row.frequency || '';
      const refill_frequency_days = parseInt(rawFreq);
      
      const next_refill_date = (row.next_refill_date || row.next_refill || row.refill_date || '').trim();
      
      const rawChannel = (row.reminder_channel || row.channel || 'SMS').trim().toLowerCase();
      let reminder_channel: 'WhatsApp' | 'SMS' | 'Email' = 'SMS';
      if (rawChannel.includes('whatsapp')) reminder_channel = 'WhatsApp';
      else if (rawChannel.includes('email')) reminder_channel = 'Email';
      else reminder_channel = 'SMS';

      // Validations
      if (!name) errors.push('Name is required.');
      if (!phone) errors.push('Phone number is required.');
      if (!medication_name) errors.push('Medication name is required.');
      
      if (isNaN(refill_frequency_days) || refill_frequency_days <= 0) {
        errors.push('Refill frequency must be a valid positive number.');
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!next_refill_date || !dateRegex.test(next_refill_date)) {
        errors.push('Next refill date must be in YYYY-MM-DD format.');
      }

      return {
        data: {
          name,
          phone,
          email,
          medication_name,
          refill_frequency_days: isNaN(refill_frequency_days) ? 30 : refill_frequency_days,
          next_refill_date,
          reminder_channel
        },
        errors
      };
    });
    
    setParsedPatients(validated);
  };

  const handleImportUpload = () => {
    const validPatients = parsedPatients
      .filter(p => p.errors.length === 0)
      .map(p => p.data);
      
    if (validPatients.length === 0) return;
    
    setIsImporting(true);
    startTransition(async () => {
      try {
        const res = await importPatientsAction(validPatients);
        if (res.success) {
          setStatusMessage({ 
            text: `Successfully imported ${res.count} patients into your clinic database! 🚀`, 
            type: 'success' 
          });
          setIsImportModalOpen(false);
          setParsedPatients([]);
        }
      } catch (err: any) {
        setStatusMessage({ 
          text: `Failed to import patients: ${err.message || 'Unknown server error'}`, 
          type: 'error' 
        });
      } finally {
        setIsImporting(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Premium Subscription Inactive Notice Bar */}
      {!clinic.subscription_active && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm animate-in fade-in-50 duration-300">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="flex-shrink-0 flex items-center justify-center h-5 px-2 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 rounded-md">
              Sandbox
            </span>
            <p className="text-xs text-amber-900 font-semibold leading-relaxed truncate md:whitespace-normal">
              {patients.length >= 1 ? (
                `Successfully enrolled 1 test patient (${patients[0]?.name || 'Patient'}). Unlock unlimited profiles, manual spreadsheet uploads, and automated daily sweeps by upgrading your plan.`
              ) : (
                "Active sandbox test mode (1 patient limit). Activate your plan to upload spreadsheets, enable sweeps, and add unlimited patient records."
              )}
            </p>
          </div>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm shadow-amber-600/10 transition flex-shrink-0 cursor-pointer"
          >
            Upgrade Plan
            <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Patient Management</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Clinic Patient Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, edit, and send manual outreach notifications for all medical clinic patients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition duration-150 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            Import Patients (Excel/CSV)
          </button>

          <Link
            href="/patients/new"
            className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold text-white bg-primary hover:bg-primary-hover active:bg-primary-dark rounded-xl transition duration-150 shadow-md shadow-primary/15"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Patient Record
          </Link>
        </div>
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

      {/* Excel / CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Batch Import Patients</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Upload a CSV spreadsheet to enroll multiple patients at once.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedPatients([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Info Alert */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-slate-500 leading-normal">
                    <span className="font-extrabold text-slate-800 block mb-1">Spreadsheet Guidelines</span>
                    To ensure flawless importing, please save your Excel sheet as a **CSV (Comma Separated Values)** file. 
                    Your file must include headers that map to:
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-mono text-[9px] text-primary bg-white p-2 rounded-xl border border-slate-200/50">
                      <div>• Name</div>
                      <div>• Phone</div>
                      <div>• Email (Optional)</div>
                      <div>• Medication Name</div>
                      <div>• Refill Frequency Days</div>
                      <div>• Next Refill Date (YYYY-MM-DD)</div>
                      <div>• Reminder Channel</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 rounded-xl transition shadow-sm flex-shrink-0 cursor-pointer"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Template CSV
                </button>
              </div>

              {/* Upload Drag Drop Box */}
              {parsedPatients.length === 0 ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center transition relative ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    id="csv-file-upload"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-800">Drag and drop your CSV file here</span>
                  <span className="text-xs text-slate-400 mt-1">or click to browse your computer</span>
                </div>
              ) : (
                /* Parsed Preview Table */
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Detected Rows ({parsedPatients.length})
                    </span>
                    <button
                      onClick={() => setParsedPatients([])}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
                    >
                      Clear & Upload Another
                    </button>
                  </div>
                  
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-[11px]">
                      <thead className="bg-slate-50 font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Patient Name</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Prescription</th>
                          <th className="px-4 py-3">Freq</th>
                          <th className="px-4 py-3">Next Refill</th>
                          <th className="px-4 py-3">Channel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedPatients.map((patient, idx) => {
                          const hasErrors = patient.errors.length > 0;
                          return (
                            <tr key={idx} className={hasErrors ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}>
                              <td className="px-4 py-3">
                                {hasErrors ? (
                                  <div className="flex items-center space-x-1 text-red-600 font-bold" title={patient.errors.join(' ')}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-[9px]">Error</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-[9px]">Valid</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-700">{patient.data.name || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-4 py-3 text-slate-500">{patient.data.phone || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-4 py-3 text-slate-700">{patient.data.medication_name || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-4 py-3 text-slate-500">{patient.data.refill_frequency_days}d</td>
                              <td className="px-4 py-3 text-slate-500">{patient.data.next_refill_date || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-4 py-3">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                  patient.data.reminder_channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-800' :
                                  patient.data.reminder_channel === 'Email' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {patient.data.reminder_channel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Validation Error Alerts */}
                  {parsedPatients.some(p => p.errors.length > 0) && (
                    <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-2 text-red-800 text-[11px] font-semibold leading-relaxed">
                      <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                      <div>
                        Some rows contain validation issues (highlighted above). Only valid rows will be uploaded when you click submit. Please correct the errors in your spreadsheet or proceed with the valid rows.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedPatients([]);
                }}
                className="px-4.5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                disabled={isImporting || parsedPatients.length === 0 || !parsedPatients.some(p => p.errors.length === 0)}
                onClick={handleImportUpload}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 transition flex items-center cursor-pointer"
              >
                {isImporting ? 'Saving Patients...' : `Upload ${parsedPatients.filter(p => p.errors.length === 0).length} Patients`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
