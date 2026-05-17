'use server';

import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// SIGN IN ACTION
export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email) {
    return { success: false, error: 'Email is required' };
  }

  const result = await AuthManager.signIn(email, password);
  
  if (result.success) {
    revalidatePath('/');
    redirect('/');
  } else {
    return { success: false, error: result.error || 'Invalid credentials' };
  }
}

// SIGN UP ACTION
export async function signUpAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clinicName = formData.get('clinicName') as string;
  const clinicPhone = formData.get('clinicPhone') as string;

  if (!email || !password || !clinicName) {
    return { success: false, error: 'Email, password, and clinic name are required' };
  }

  const result = await AuthManager.signUp(email, password, clinicName, clinicPhone);

  if (result.success) {
    revalidatePath('/');
    redirect('/');
  } else {
    return { success: false, error: result.error || 'Registration failed' };
  }
}

// SIGN OUT ACTION
export async function signOutAction() {
  await AuthManager.signOut();
  revalidatePath('/');
  redirect('/login');
}

// TRIGGER CRON REMINDER SCAN ACTION
export async function triggerScanAction(clinicId: string) {
  const result = await DBBroker.triggerReminderScan(clinicId);
  revalidatePath('/');
  return result;
}

// SIMULATE PATIENT REPLY ACTION
export async function simulatePatientReplyAction(patientId: string, responseText: string) {
  await DBBroker.simulatePatientReply(patientId, responseText);
  revalidatePath('/');
}

// SEND SINGLE MANUAL REMINDER ACTION
export async function sendSingleReminderAction(patientId: string) {
  const patient = await DBBroker.getPatientById(patientId);
  if (!patient) throw new Error('Patient not found');
  
  const clinic = await DBBroker.getClinicById(patient.clinic_id);
  if (!clinic) throw new Error('Clinic not found');

  let msg = clinic.reminder_template || '';
  msg = msg.replace(/{{patient_name}}/g, patient.name);
  msg = msg.replace(/{{medication_name}}/g, patient.medication_name);
  msg = msg.replace(/{{clinic_name}}/g, clinic.name);
  msg = msg.replace(/{{refill_date}}/g, patient.next_refill_date);

  await DBBroker.createReminder({
    patient_id: patient.id,
    clinic_id: clinic.id,
    sent_at: new Date().toISOString(),
    channel: patient.reminder_channel,
    response: null,
    status: 'sent',
    message_body: msg
  });

  await DBBroker.updatePatient(patient.id, { status: 'pending' });
  revalidatePath('/');
}

// DELETE PATIENT ACTION
export async function deletePatientAction(patientId: string) {
  await DBBroker.deletePatient(patientId);
  revalidatePath('/patients');
  revalidatePath('/');
}

// UPDATE CLINIC SETTINGS ACTION
export async function updateSettingsAction(clinicId: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const reminder_template = formData.get('reminder_template') as string;
  const reminder_days_before = parseInt(formData.get('reminder_days_before') as string) || 3;
  const auto_reminders = formData.get('auto_reminders') === 'true';

  if (!name) {
    return { success: false, error: 'Clinic name is required' };
  }

  await DBBroker.updateClinic(clinicId, {
    name,
    phone,
    reminder_template,
    reminder_days_before,
    auto_reminders,
  });

  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true, message: 'Clinic configurations successfully updated!' };
}

// UPGRADE PLAN SERVER ACTION (STRIPE SIMULATOR)
export async function upgradePlanAction(clinicId: string, selectedPlan: 'Starter' | 'Growth' | 'Pro') {
  await DBBroker.updateClinic(clinicId, { plan: selectedPlan });
  revalidatePath('/billing');
  revalidatePath('/');
  return { success: true, message: `Subscription successfully upgraded to ${selectedPlan} Plan!` };
}



// CREATE PATIENT ACTION
export async function createPatientAction(prevState: any, formData: FormData) {
  const session = await AuthManager.getCurrentUser();
  if (!session) {
    return { success: false, error: 'You must be logged in to create patients' };
  }

  const clinic = await DBBroker.getClinicByOwner(session.id);
  if (!clinic) {
    return { success: false, error: 'Your clinic account could not be found. Please try logging out and logging back in.' };
  }

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const medication_name = formData.get('medication_name') as string;
  const refill_frequency_days = parseInt(formData.get('refill_frequency_days') as string);
  const next_refill_date = formData.get('next_refill_date') as string;
  const reminder_channel = formData.get('reminder_channel') as 'WhatsApp' | 'SMS' | 'Email';

  if (!name || !phone || !medication_name || !refill_frequency_days || !next_refill_date || !reminder_channel) {
    return { success: false, error: 'All fields marked with an asterisk are required' };
  }

  // Create patient record
  await DBBroker.createPatient({
    clinic_id: clinic.id,
    name,
    phone,
    email: email || '',
    medication_name,
    refill_frequency_days,
    next_refill_date,
    reminder_channel,
    status: 'confirmed', // Start as confirmed when enrolling
  });

  revalidatePath('/patients');
  revalidatePath('/');
  redirect('/patients');
}

// UPDATE PATIENT ACTION
export async function updatePatientAction(patientId: string, prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const medication_name = formData.get('medication_name') as string;
  const refill_frequency_days = parseInt(formData.get('refill_frequency_days') as string);
  const next_refill_date = formData.get('next_refill_date') as string;
  const reminder_channel = formData.get('reminder_channel') as 'WhatsApp' | 'SMS' | 'Email';
  const status = formData.get('status') as 'confirmed' | 'pending' | 'overdue';

  if (!name || !phone || !medication_name || !refill_frequency_days || !next_refill_date || !reminder_channel || !status) {
    return { success: false, error: 'All fields marked with an asterisk are required' };
  }

  await DBBroker.updatePatient(patientId, {
    name,
    phone,
    email: email || '',
    medication_name,
    refill_frequency_days,
    next_refill_date,
    reminder_channel,
    status,
  });

  revalidatePath('/patients');
  revalidatePath('/');
  redirect('/patients');
}


