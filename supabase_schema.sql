-- ====================================================================
-- RxRemind Supabase Database Schema, Triggers, and RLS Policies Setup
-- ====================================================================
-- Copy and paste this script directly into your Supabase SQL Editor and run it!

-- 1. CLEANUP EXISTING TABLES (Optional, comment out if not doing a fresh install)
-- DROP TABLE IF EXISTS reminders CASCADE;
-- DROP TABLE IF EXISTS patients CASCADE;
-- DROP TABLE IF EXISTS clinics CASCADE;

-- 2. CREATE CLINICS TABLE
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'Starter' CHECK (plan IN ('Starter', 'Growth', 'Pro')),
  reminder_days_before INTEGER NOT NULL DEFAULT 3,
  auto_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_template TEXT NOT NULL DEFAULT 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. CREATE PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  refill_frequency_days INTEGER NOT NULL DEFAULT 30,
  next_refill_date DATE NOT NULL,
  reminder_channel TEXT NOT NULL DEFAULT 'WhatsApp' CHECK (reminder_channel IN ('WhatsApp', 'SMS', 'Email')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'overdue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CREATE REMINDERS TABLE
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  channel TEXT NOT NULL DEFAULT 'WhatsApp' CHECK (channel IN ('WhatsApp', 'SMS', 'Email')),
  response TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'confirmed')),
  message_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

-- --- CLINICS POLICIES ---
CREATE POLICY "Users can view their own clinic profile" 
  ON clinics FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own clinic profile" 
  ON clinics FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own clinic profile" 
  ON clinics FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own clinic profile" 
  ON clinics FOR DELETE 
  USING (auth.uid() = owner_id);


-- --- PATIENTS POLICIES ---
CREATE POLICY "Users can view patients in their clinic" 
  ON patients FOR SELECT 
  USING (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert patients into their clinic" 
  ON patients FOR INSERT 
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update patients in their clinic" 
  ON patients FOR UPDATE 
  USING (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete patients from their clinic" 
  ON patients FOR DELETE 
  USING (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));


-- --- REMINDERS POLICIES ---
CREATE POLICY "Users can view reminders for their clinic" 
  ON reminders FOR SELECT 
  USING (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert reminders for their clinic" 
  ON reminders FOR INSERT 
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update reminders in their clinic" 
  ON reminders FOR UPDATE 
  USING (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete reminders from their clinic" 
  ON reminders FOR DELETE 
  USING (clinic_id IN (SELECT id FROM clinics WHERE owner_id = auth.uid()));

-- --- CLINICS PLAN PROTECTION TRIGGER ---
-- Only allow updates to 'plan' if executed by service_role/postgres (bypass for authenticated/anon roles)
CREATE OR REPLACE FUNCTION protect_clinic_plan() 
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.plan IS DISTINCT FROM OLD.plan) THEN
    IF current_setting('role', true) IN ('authenticated', 'anon') THEN
      RAISE EXCEPTION 'Direct database updates to the clinic plan are prohibited. Upgrades must be processed via Stripe checkout.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_clinic_plan_trigger
BEFORE UPDATE ON clinics
FOR EACH ROW
EXECUTE FUNCTION protect_clinic_plan();

-- ====================================================================
-- AUTOMATED REMINDERS SCHEDULER & CRON VIEW (HELPFUL HINT)
-- ====================================================================
-- Note: Your cron jobs are triggered externally via Next.js Edge route:
-- https://rxremind.us/api/cron/reminders
-- Using a bearer token / cron trigger header.
