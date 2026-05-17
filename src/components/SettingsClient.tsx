'use client';

import React, { useState, useRef, useTransition, useActionState } from 'react';
import { updateSettingsAction } from '@/app/actions';
import { 
  Building2, 
  MessageSquare, 
  Sliders, 
  Sparkles, 
  Eye, 
  Info,
  CheckCheck
} from 'lucide-react';
import { Clinic } from '@/lib/db';

interface SettingsClientProps {
  clinic: Clinic;
}

export default function SettingsClient({ clinic }: SettingsClientProps) {
  const updateSettingsWithId = updateSettingsAction.bind(null, clinic.id);
  const [state, formAction] = useActionState(updateSettingsWithId, null);
  const [isPending] = useTransition();

  // Local states for live preview
  const [clinicName, setClinicName] = useState(clinic.name);
  const [clinicPhone, setClinicPhone] = useState(clinic.phone || '');
  const [templateText, setTemplateText] = useState(clinic.reminder_template);
  const [daysBefore, setDaysBefore] = useState(clinic.reminder_days_before);
  const [autoReminders, setAutoReminders] = useState(clinic.auto_reminders);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-inject tags at cursor position
  const injectTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newText = before + tag + after;
    setTemplateText(newText);

    // Refocus textarea after state update
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;
    }, 0);
  };

  // Compile template for live preview
  const getCompiledPreview = () => {
    let preview = templateText || '';
    preview = preview.replace(/{{patient_name}}/g, 'Sarah Connor');
    preview = preview.replace(/{{medication_name}}/g, 'Lisinopril 10mg');
    preview = preview.replace(/{{clinic_name}}/g, clinicName || 'Your Clinic');
    
    // Sample date 3 days from now
    const sampleDate = new Date();
    sampleDate.setDate(sampleDate.getDate() + daysBefore);
    const sampleDateStr = sampleDate.toISOString().split('T')[0];
    preview = preview.replace(/{{refill_date}}/g, sampleDateStr);

    return preview;
  };

  // Reset success message on form submit

  // Intercept action completion state
  React.useEffect(() => {
    if (state?.success) {
      setSuccessMsg(state.message || 'Settings successfully saved!');
      // Dismiss toast after 4s
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-sans">Configurations</span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Clinic Profile & Automation Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Adjust clinic meta fields, enable automated daily alerts, and customize the message delivery template.
        </p>
      </div>

      {/* State Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-pulse-subtle">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4.5 w-4.5" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold underline hover:opacity-85">
            Dismiss
          </button>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left 3 Columns: Settings Form */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          <form 
            action={formAction}
            onSubmit={() => setSuccessMsg(null)}
            className="space-y-6"
          >
            {state?.error && (
              <div className="p-3.5 bg-danger-light border border-danger/10 text-danger text-sm font-semibold rounded-xl">
                {state.error}
              </div>
            )}

            {/* Section 1: Clinic metadata */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                1. Clinic Meta Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clinic Name */}
                <div className="space-y-1.5 col-span-2">
                  <label htmlFor="name" className="block text-xs font-bold text-slate-700">
                    Clinic Profile Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                    placeholder="RxRemind Medical Clinic"
                  />
                </div>

                {/* Clinic Phone */}
                <div className="space-y-1.5 col-span-2">
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-700">
                    Clinic Main Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition"
                    placeholder="+1 (555) 934-2391"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Automation Rules */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                <Sliders className="mr-2 h-4 w-4 text-slate-400" />
                2. Automated Dispatch Rules
              </h3>

              {/* Automated reminders toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="pr-4">
                  <label className="text-sm font-bold text-slate-800">Daily Automated Reminders</label>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    When active, the platform scans for pending refills and dispatches alerts every morning at 9:00 AM.
                  </p>
                </div>
                <input 
                  type="hidden" 
                  name="auto_reminders" 
                  value={autoReminders ? 'true' : 'false'} 
                />
                <button
                  type="button"
                  onClick={() => setAutoReminders(!autoReminders)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoReminders ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoReminders ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Days before refill */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex justify-between items-center">
                  <label htmlFor="reminder_days_before" className="text-sm font-bold text-slate-800">
                    Outreach Dispatch Period
                  </label>
                  <span className="px-2.5 py-0.5 bg-primary-light text-primary font-bold text-xs rounded-full">
                    {daysBefore} Days Before Refill
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  How many days before the patient&apos;s next scheduled refill date should the system fire the reminder?
                </p>
                <div className="flex items-center space-x-4 pt-2">
                  <input
                    id="reminder_days_before"
                    name="reminder_days_before"
                    type="range"
                    min="1"
                    max="14"
                    value={daysBefore}
                    onChange={(e) => setDaysBefore(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Template Editor */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                <MessageSquare className="mr-2 h-4 w-4 text-slate-400" />
                3. Outreach Message Template Editor
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="reminder_template" className="block text-xs font-bold text-slate-700">
                    Template Content
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Plain-text template
                  </span>
                </div>
                
                <textarea
                  id="reminder_template"
                  name="reminder_template"
                  ref={textareaRef}
                  required
                  rows={4}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="block w-full border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition font-sans leading-relaxed"
                  placeholder="Hi {{patient_name}}, this is {{clinic_name}} reminding you your prescription for {{medication_name}} is due on {{refill_date}}..."
                />
              </div>

              {/* Tag Injector Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Click tags to inject at cursor:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { tag: '{{patient_name}}', desc: 'Patient Name' },
                    { tag: '{{medication_name}}', desc: 'Medication' },
                    { tag: '{{clinic_name}}', desc: 'Clinic Name' },
                    { tag: '{{refill_date}}', desc: 'Refill Date' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => injectTag(item.tag)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300/80 text-[10px] font-bold rounded-lg border border-slate-200/40 text-slate-700 transition"
                      title={`Inject ${item.desc}`}
                    >
                      {item.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 bg-primary hover:bg-primary-hover disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md shadow-primary/10 transition duration-150"
              >
                {isPending ? 'Saving Configurations...' : 'Save Clinic Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 2 Columns: Smartphone Live WhatsApp Mock Simulator */}
        <div className="lg:col-span-2 flex flex-col items-center justify-start lg:pt-8">
          <div className="w-full max-w-sm bg-slate-900 border-[10px] border-slate-800 rounded-[40px] shadow-2xl overflow-hidden relative aspect-[9/18.5] flex flex-col">
            
            {/* Phone Top Notch Speaker */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex justify-center items-center z-20">
              <div className="w-16 h-4 bg-slate-950 rounded-full" />
            </div>

            {/* WhatsApp Emerald Mock Header */}
            <div className="bg-[#075E54] pt-8 pb-3 px-4 flex items-center space-x-2 text-white flex-shrink-0 z-10 shadow-md">
              <div className="h-8 w-8 rounded-full bg-slate-200 text-[#075E54] font-bold text-xs flex items-center justify-center border border-emerald-700/50 shadow-sm">
                Rx
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs truncate">{clinicName || 'RxRemind Clinic'}</h4>
                <span className="text-[9px] text-emerald-100 block mt-0.5">Online Alert Agent</span>
              </div>
            </div>

            {/* WhatsApp Chat Area Backdrop */}
            <div className="flex-1 bg-[#ECE5DD] p-4 overflow-y-auto space-y-4 relative" style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundSize: 'contain' }}>
              
              {/* WhatsApp Message Bubble */}
              <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-md border border-slate-200/50 text-slate-800 relative max-w-[85%] self-start float-left">
                <span className="block text-[8px] text-primary font-bold uppercase tracking-wider mb-1">Prescription Reminder</span>
                
                <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap select-none">
                  {getCompiledPreview()}
                </p>

                <div className="flex justify-end items-center mt-2.5 text-[8.5px] text-slate-400 space-x-1">
                  <span>9:00 AM</span>
                  <CheckCheck className="h-3 w-3 text-sky-500 fill-current" />
                </div>
              </div>
            </div>

            {/* Phone Bottom Pill bar */}
            <div className="h-5 bg-slate-900 flex justify-center items-center flex-shrink-0">
              <div className="w-28 h-1 bg-white/20 rounded-full" />
            </div>
          </div>
          
          <div className="mt-4 text-center max-w-xs">
            <span className="inline-flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Live Smartphone Simulation
            </span>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Dynamic WhatsApp parser compiles tag placeholders in real-time as you write. Try editing the text editor to see it live!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
