import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Dynamically load Node's native modules to bypass Cloudflare Pages / Workers Edge bundler static-analysis
const fs = typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge' ? require('f' + 's') : null;
const path = typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge' ? require('p' + 'ath') : null;

// Define DB Types
export interface Clinic {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string;
  logo_url: string;
  plan: 'Starter' | 'Growth' | 'Pro';
  reminder_days_before: number;
  auto_reminders: boolean;
  reminder_template: string;
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email: string;
  medication_name: string;
  refill_frequency_days: number;
  next_refill_date: string; // YYYY-MM-DD
  reminder_channel: 'WhatsApp' | 'SMS' | 'Email';
  status: 'confirmed' | 'pending' | 'overdue';
  created_at: string;
}

export interface Reminder {
  id: string;
  patient_id: string;
  clinic_id: string;
  sent_at: string; // ISO datetime
  channel: 'WhatsApp' | 'SMS' | 'Email';
  response: string | null;
  status: 'sent' | 'failed' | 'confirmed';
  message_body: string;
  created_at: string;
}

interface LocalDB {
  clinics: Clinic[];
  patients: Patient[];
  reminders: Reminder[];
}

const DB_FILE_PATH = path ? path.join(process.cwd(), 'db.json') : '';

// Initialize Supabase if keys are provided
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const isSupabaseEnabled = supabaseUrl !== '' && supabaseAnonKey !== '';


let supabaseClient: SupabaseClient | null = null;
if (isSupabaseEnabled) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

// Generate high-fidelity seed data for the local fallback
function getSeedData(): LocalDB {
  const demoClinicId = 'demo-clinic-uuid-12345';
  const demoOwnerId = 'demo-owner-uuid-12345';

  const clinics: Clinic[] = [
    {
      id: demoClinicId,
      owner_id: demoOwnerId,
      name: 'RxRemind Premium Medical Clinic',
      email: 'owner@rxremind-demo.com',
      phone: '+1 (555) 934-2391',
      logo_url: '',
      plan: 'Growth',
      reminder_days_before: 3,
      auto_reminders: true,
      reminder_template: 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // Formulate dates relative to today
  const today = new Date();
  const getRelativeDateStr = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const patients: Patient[] = [
    {
      id: 'patient-1',
      clinic_id: demoClinicId,
      name: 'Sarah Connor',
      phone: '+1 (555) 123-4567',
      email: 'sarah.connor@sky.net',
      medication_name: 'Lisinopril 10mg (Blood Pressure)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(15), // Safe in future
      reminder_channel: 'WhatsApp',
      status: 'confirmed',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-2',
      clinic_id: demoClinicId,
      name: 'Bruce Wayne',
      phone: '+1 (555) 987-6543',
      email: 'bruce@waynecorp.com',
      medication_name: 'Atorvastatin 20mg (Cholesterol)',
      refill_frequency_days: 90,
      next_refill_date: getRelativeDateStr(3), // Refill in 3 days (matches threshold!)
      reminder_channel: 'SMS',
      status: 'pending',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-3',
      clinic_id: demoClinicId,
      name: 'Peter Parker',
      phone: '+1 (555) 555-0199',
      email: 'peter.parker@dailybugle.com',
      medication_name: 'Albuterol Inhaler (Asthma)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(-2), // Refill was 2 days ago! Overdue!
      reminder_channel: 'WhatsApp',
      status: 'overdue',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-4',
      clinic_id: demoClinicId,
      name: 'Clark Kent',
      phone: '+1 (555) 777-8888',
      email: 'clark@dailyplanet.com',
      medication_name: 'Levothyroxine 50mcg (Thyroid)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(3), // Refill in 3 days (matches threshold!)
      reminder_channel: 'Email',
      status: 'pending',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-5',
      clinic_id: demoClinicId,
      name: 'Diana Prince',
      phone: '+1 (555) 444-3333',
      email: 'diana@louvre.museum',
      medication_name: 'Metformin 500mg (Diabetes)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(25), // Safe in future
      reminder_channel: 'WhatsApp',
      status: 'confirmed',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-6',
      clinic_id: demoClinicId,
      name: 'Tony Stark',
      phone: '+1 (555) 300-3000',
      email: 'tony@starkindustries.com',
      medication_name: 'Amlodipine 5mg (Blood Pressure)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(-4), // 4 days ago! Overdue!
      reminder_channel: 'SMS',
      status: 'overdue',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-7',
      clinic_id: demoClinicId,
      name: 'Barry Allen',
      phone: '+1 (555) 111-2222',
      email: 'barry@ccpd.gov',
      medication_name: 'Methylphenidate 20mg (ADHD)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(3), // Refill in 3 days!
      reminder_channel: 'WhatsApp',
      status: 'pending',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-8',
      clinic_id: demoClinicId,
      name: 'Selina Kyle',
      phone: '+1 (555) 969-6969',
      email: 'selina@gothamcats.org',
      medication_name: 'Gabapentin 300mg (Nerve Pain)',
      refill_frequency_days: 60,
      next_refill_date: getRelativeDateStr(45), // Safe in future
      reminder_channel: 'SMS',
      status: 'confirmed',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-9',
      clinic_id: demoClinicId,
      name: 'Steve Rogers',
      phone: '+1 (555) 194-1194',
      email: 'cap@shield.org',
      medication_name: 'Sildenafil 20mg (Cardiovascular)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(-1), // 1 day ago! Overdue!
      reminder_channel: 'Email',
      status: 'overdue',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-10',
      clinic_id: demoClinicId,
      name: 'Arthur Curry',
      phone: '+1 (555) 007-0007',
      email: 'aquaman@atlantis.gov',
      medication_name: 'Omega-3 Acid Ethyl Esters (Heart Health)',
      refill_frequency_days: 30,
      next_refill_date: getRelativeDateStr(2), // 2 days in future
      reminder_channel: 'WhatsApp',
      status: 'pending',
      created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const reminders: Reminder[] = [
    {
      id: 'reminder-1',
      patient_id: 'patient-1',
      clinic_id: demoClinicId,
      sent_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'WhatsApp',
      response: 'YES',
      status: 'confirmed',
      message_body: 'Hi Sarah Connor, this is a friendly reminder from RxRemind Premium Medical Clinic that your prescription for Lisinopril 10mg (Blood Pressure) is due for a refill. Reply YES to confirm.',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-2',
      patient_id: 'patient-2',
      clinic_id: demoClinicId,
      sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      channel: 'SMS',
      response: null,
      status: 'sent',
      message_body: 'Hi Bruce Wayne, this is a friendly reminder from RxRemind Premium Medical Clinic that your prescription for Atorvastatin 20mg (Cholesterol) is due for a refill. Reply YES to confirm.',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-3',
      patient_id: 'patient-3',
      clinic_id: demoClinicId,
      sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'WhatsApp',
      response: null,
      status: 'failed',
      message_body: 'Hi Peter Parker, this is a friendly reminder from RxRemind Premium Medical Clinic that your prescription for Albuterol Inhaler (Asthma) is due for a refill. Reply YES to confirm.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-4',
      patient_id: 'patient-5',
      clinic_id: demoClinicId,
      sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'WhatsApp',
      response: 'CONFIRM',
      status: 'confirmed',
      message_body: 'Hi Diana Prince, this is a friendly reminder from RxRemind Premium Medical Clinic that your prescription for Metformin 500mg (Diabetes) is due for a refill. Reply YES to confirm.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reminder-5',
      patient_id: 'patient-8',
      clinic_id: demoClinicId,
      sent_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      channel: 'SMS',
      response: 'YES',
      status: 'confirmed',
      message_body: 'Hi Selina Kyle, this is a friendly reminder from RxRemind Premium Medical Clinic that your prescription for Gabapentin 300mg (Nerve Pain) is due for a refill. Reply YES to confirm.',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  return { clinics, patients, reminders };
}

// Local Database JSON Helpers
function readLocalDB(): LocalDB {
  try {
    if (!fs) {
      return { clinics: [], patients: [], reminders: [] };
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      const seed = getSeedData();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading local JSON db:', err);
    return { clinics: [], patients: [], reminders: [] };
  }
}

function writeLocalDB(data: LocalDB): void {
  try {
    if (!fs) return;
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local JSON db:', err);
  }
}

// Global Database Controller Class
export class DBBroker {
  static getMode(): 'supabase' | 'json' {
    return isSupabaseEnabled ? 'supabase' : 'json';
  }

  // CLINICS API
  static async getAllClinics(): Promise<Clinic[]> {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('clinics')
        .select('*');
      if (error) throw error;
      return data || [];
    } else {
      const db = readLocalDB();
      return db.clinics;
    }
  }

  static async getClinicByOwner(ownerId: string): Promise<Clinic | null> {

    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('clinics')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDB();
      // In local mode, we bind the clinic directly or return the demo one
      const clinic = db.clinics.find((c) => c.owner_id === ownerId || c.owner_id === 'demo-owner-uuid-12345');
      return clinic || null;
    }
  }

  static async createClinic(clinic: Omit<Clinic, 'id' | 'created_at'>): Promise<Clinic> {
    const newClinic: Clinic = {
      ...clinic,
      id: `clinic-${Math.random().toString(36).substring(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('clinics')
        .insert([clinic])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDB();
      db.clinics.push(newClinic);
      writeLocalDB(db);
      return newClinic;
    }
  }

  static async updateClinic(id: string, updates: Partial<Clinic>): Promise<Clinic> {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('clinics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDB();
      const idx = db.clinics.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Clinic not found');
      db.clinics[idx] = { ...db.clinics[idx], ...updates };
      writeLocalDB(db);
      return db.clinics[idx];
    }
  }

  // PATIENTS API
  static async getPatients(clinicId: string): Promise<Patient[]> {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const db = readLocalDB();
      // Ensure patient statuses are logically kept up to date with time
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedPatients = db.patients
        .filter((p) => p.clinic_id === clinicId || clinicId === 'demo-clinic-uuid-12345')
        .map((p) => {
          let status = p.status;
          if (p.next_refill_date < todayStr && p.status !== 'confirmed') {
            status = 'overdue';
          }
          return { ...p, status };
        });
      
      // Update DB if statuses changed
      let changed = false;
      db.patients.forEach((p, idx) => {
        const matching = updatedPatients.find((up) => up.id === p.id);
        if (matching && matching.status !== p.status) {
          db.patients[idx].status = matching.status;
          changed = true;
        }
      });
      if (changed) writeLocalDB(db);

      return updatedPatients.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  static async getPatientById(id: string): Promise<Patient | null> {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDB();
      const p = db.patients.find((pat) => pat.id === id);
      return p || null;
    }
  }

  static async createPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    const newPatient: Patient = {
      ...patient,
      id: `patient-${Math.random().toString(36).substring(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('patients')
        .insert([patient])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDB();
      db.patients.push(newPatient);
      writeLocalDB(db);
      return newPatient;
    }
  }

  static async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDB();
      const idx = db.patients.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Patient not found');
      
      db.patients[idx] = { ...db.patients[idx], ...updates };
      writeLocalDB(db);
      return db.patients[idx];
    }
  }

  static async deletePatient(id: string): Promise<boolean> {
    if (isSupabaseEnabled && supabaseClient) {
      const { error } = await supabaseClient
        .from('patients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const db = readLocalDB();
      const originalLen = db.patients.length;
      db.patients = db.patients.filter((p) => p.id !== id);
      // Clean up reminders relating to deleted patient
      db.reminders = db.reminders.filter((r) => r.patient_id !== id);
      writeLocalDB(db);
      return db.patients.length < originalLen;
    }
  }

  // REMINDERS API
  static async getReminders(clinicId: string): Promise<Reminder[]> {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('reminders')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const db = readLocalDB();
      return db.reminders
        .filter((r) => r.clinic_id === clinicId || clinicId === 'demo-clinic-uuid-12345')
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    }
  }

  static async createReminder(reminder: Omit<Reminder, 'id' | 'created_at'>): Promise<Reminder> {
    const newReminder: Reminder = {
      ...reminder,
      id: `reminder-${Math.random().toString(36).substring(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('reminders')
        .insert([reminder])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = readLocalDB();
      db.reminders.push(newReminder);
      writeLocalDB(db);
      return newReminder;
    }
  }

  // TRIGGERS A DAILY REMINDER SCAN (CRON LOGIC)
  // Calculates next_refill_date = today + reminder_days_before
  static async triggerReminderScan(clinicId: string): Promise<{ scanned: number; sent: number }> {
    const clinic = await this.getClinicByOwner(clinicId);
    if (!clinic) throw new Error('Clinic not found');

    const patients = await this.getPatients(clinic.id);
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + (clinic.reminder_days_before || 3));
    const targetDateStr = targetDate.toISOString().split('T')[0];

    let scanned = 0;
    let sent = 0;

    for (const patient of patients) {
      scanned++;
      // Check if patient next_refill_date matches targets
      // Also verify we haven't already sent a reminder today for this patient to prevent double-reminding!
      if (patient.next_refill_date === targetDateStr) {
        // Double-send check
        const reminders = await this.getReminders(clinic.id);
        const alreadySentToday = reminders.some((r) => {
          const sentDate = new Date(r.sent_at).toISOString().split('T')[0];
          const todayStr = today.toISOString().split('T')[0];
          return r.patient_id === patient.id && sentDate === todayStr;
        });

        if (!alreadySentToday && clinic.auto_reminders) {
          // Construct message template
          let msg = clinic.reminder_template || '';
          msg = msg.replace(/{{patient_name}}/g, patient.name);
          msg = msg.replace(/{{medication_name}}/g, patient.medication_name);
          msg = msg.replace(/{{clinic_name}}/g, clinic.name);
          msg = msg.replace(/{{refill_date}}/g, patient.next_refill_date);

          // Log the reminder
          await this.createReminder({
            patient_id: patient.id,
            clinic_id: clinic.id,
            sent_at: new Date().toISOString(),
            channel: patient.reminder_channel,
            response: null,
            status: 'sent',
            message_body: msg
          });

          // Mark patient status as pending (since reminder was sent and is awaiting reply)
          await this.updatePatient(patient.id, { status: 'pending' });
          sent++;
        }
      }
    }

    return { scanned, sent };
  }

  // Simulation support for patient incoming SMS replies
  static async simulatePatientReply(patientId: string, responseText: string): Promise<boolean> {
    const db = readLocalDB();
    const patientIdx = db.patients.findIndex((p) => p.id === patientId);
    if (patientIdx === -1) return false;

    const patient = db.patients[patientIdx];
    const uppercaseReply = responseText.toUpperCase().trim();
    const isConfirmation = uppercaseReply === 'YES' || uppercaseReply === 'CONFIRM';

    // Update patient status to confirmed if they replied positive
    if (isConfirmation) {
      db.patients[patientIdx].status = 'confirmed';
      // Auto-advance refill date by frequency
      const oldRefillDate = new Date(patient.next_refill_date);
      const newRefillDate = new Date(oldRefillDate);
      newRefillDate.setDate(oldRefillDate.getDate() + patient.refill_frequency_days);
      db.patients[patientIdx].next_refill_date = newRefillDate.toISOString().split('T')[0];
    }

    // Find the latest reminder for this patient and update it
    const patientReminders = db.reminders
      .filter((r) => r.patient_id === patientId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

    if (patientReminders.length > 0) {
      const latestReminderId = patientReminders[0].id;
      const reminderIdx = db.reminders.findIndex((r) => r.id === latestReminderId);
      if (reminderIdx !== -1) {
        db.reminders[reminderIdx].response = responseText;
        db.reminders[reminderIdx].status = isConfirmation ? 'confirmed' : 'sent';
      }
    } else {
      // Create a mock reminder entry to log the incoming chat message
      db.reminders.push({
        id: `reminder-${Math.random().toString(36).substr(2, 9)}`,
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        sent_at: new Date().toISOString(),
        channel: patient.reminder_channel,
        response: responseText,
        status: isConfirmation ? 'confirmed' : 'sent',
        message_body: `[INCOMING REPLY via ${patient.reminder_channel}]: "${responseText}"`,
        created_at: new Date().toISOString(),
      });
    }

    writeLocalDB(db);
    return true;
  }
}
