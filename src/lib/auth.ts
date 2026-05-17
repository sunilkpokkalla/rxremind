import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { DBBroker } from './db';

export interface UserSession {
  id: string;
  email: string;
  clinicId: string;
  clinicName: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const isSupabaseEnabled = supabaseUrl !== '' && supabaseAnonKey !== '';


const SESSION_COOKIE_NAME = 'rxremind_session';

export class AuthManager {
  static getMode(): 'supabase' | 'json' {
    return isSupabaseEnabled ? 'supabase' : 'json';
  }

  // SIGN IN
  static async signIn(email: string, password?: string): Promise<{ success: boolean; error?: string; session?: UserSession }> {
    const cleanEmail = email.toLowerCase().trim();

    // Bypass Supabase and allow instant demo walkthrough on live site
    if (cleanEmail === 'owner@rxremind-demo.com') {
      const session: UserSession = {
        id: 'demo-owner-uuid-12345',
        email: 'owner@rxremind-demo.com',
        clinicId: 'demo-clinic-uuid-12345',
        clinicName: 'RxRemind Premium Medical Clinic',
      };
      (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return { success: true, session };
    }

    if (isSupabaseEnabled) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password',
      });
      if (error) return { success: false, error: error.message };

      // Fetch or create clinic
      let clinic = await DBBroker.getClinicByOwner(data.user.id);
      if (!clinic) {
        clinic = await DBBroker.createClinic({
          owner_id: data.user.id,
          name: 'RxRemind Clinic',
          email: email,
          phone: '',
          logo_url: '',
          plan: 'Starter',
          reminder_days_before: 3,
          auto_reminders: true,
          reminder_template: 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
        });
      }

      const session: UserSession = {
        id: data.user.id,
        email: email,
        clinicId: clinic.id,
        clinicName: clinic.name,
      };

      // Set cookie for Next.js routing convenience
      (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      return { success: true, session };
    } else {
      // Mock Auth Fallback Mode
      // Allow any email + password (password: password or demo defaults)
      const mockEmail = email.toLowerCase().trim();
      let session: UserSession;

      if (mockEmail === 'owner@rxremind-demo.com') {
        session = {
          id: 'demo-owner-uuid-12345',
          email: 'owner@rxremind-demo.com',
          clinicId: 'demo-clinic-uuid-12345',
          clinicName: 'RxRemind Premium Medical Clinic',
        };
      } else {
        // Dynamic new user login in mock mode
        const userId = `mock-user-${Math.random().toString(36).substr(2, 9)}`;
        let clinic = await DBBroker.getClinicByOwner(userId);
        if (!clinic) {
          clinic = await DBBroker.createClinic({
            owner_id: userId,
            name: `${email.split('@')[0].toUpperCase()} Family Clinic`,
            email: email,
            phone: '+1 (555) 999-8888',
            logo_url: '',
            plan: 'Starter',
            reminder_days_before: 3,
            auto_reminders: true,
            reminder_template: 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
          });
        }
        
        session = {
          id: userId,
          email: email,
          clinicId: clinic.id,
          clinicName: clinic.name,
        };
      }

      (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      return { success: true, session };
    }
  }

  // SIGN UP
  static async signUp(email: string, password?: string, clinicName?: string, clinicPhone?: string): Promise<{ success: boolean; error?: string; session?: UserSession }> {
    if (isSupabaseEnabled) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'password',
      });
      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'Registration failed' };

      // Initialize their Clinic
      const clinic = await DBBroker.createClinic({
        owner_id: data.user.id,
        name: clinicName || `${email.split('@')[0].toUpperCase()} Clinic`,
        email: email,
        phone: clinicPhone || '',
        logo_url: '',
        plan: 'Starter',
        reminder_days_before: 3,
        auto_reminders: true,
        reminder_template: 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
      });

      const session: UserSession = {
        id: data.user.id,
        email: email,
        clinicId: clinic.id,
        clinicName: clinic.name,
      };

      (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return { success: true, session };
    } else {
      // Mock Registration
      const userId = `mock-user-${Math.random().toString(36).substr(2, 9)}`;
      const clinic = await DBBroker.createClinic({
        owner_id: userId,
        name: clinicName || `${email.split('@')[0].toUpperCase()} Family Clinic`,
        email: email,
        phone: clinicPhone || '+1 (555) 999-8888',
        logo_url: '',
        plan: 'Starter',
        reminder_days_before: 3,
        auto_reminders: true,
        reminder_template: 'Hi {{patient_name}}, this is a friendly reminder from {{clinic_name}} that your prescription for {{medication_name}} is due for a refill on {{refill_date}}. Reply YES to confirm.',
      });

      const session: UserSession = {
        id: userId,
        email: email,
        clinicId: clinic.id,
        clinicName: clinic.name,
      };

      (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return { success: true, session };
    }
  }

  // SIGN OUT
  static async signOut(): Promise<boolean> {
    if (isSupabaseEnabled) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.signOut();
    }
    (await cookies()).delete(SESSION_COOKIE_NAME);
    return true;
  }

  // GET CURRENT SESSION / USER
  static async getCurrentUser(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie) return null;

    try {
      const session = JSON.parse(sessionCookie.value) as UserSession;
      
      // If Supabase is enabled, ensure session ID is a valid UUID or the mock demo clinic owner ID
      if (isSupabaseEnabled) {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(session.id) && session.id !== 'demo-owner-uuid-12345') {
          // Self-heal and destroy legacy mock cookies instantly
          cookieStore.delete(SESSION_COOKIE_NAME);
          return null;
        }
      }
      
      // Keep clinic name in session synced with DB updates
      const dbClinic = await DBBroker.getClinicByOwner(session.id);
      if (dbClinic && dbClinic.name !== session.clinicName) {
        session.clinicName = dbClinic.name;
        // Update cookie
        cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
      }

      return session;
    } catch {
      return null;
    }
  }
}
