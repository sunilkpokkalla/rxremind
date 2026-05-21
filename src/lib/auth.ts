import { cookies, headers } from 'next/headers';
import { DBBroker } from './db';
import { createSupabaseServer } from './supabaseServer';

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

    // Bypass Supabase and allow instant demo walkthrough on live site (development/staging only)
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && cleanEmail === 'owner@rxremind-demo.com') {
      const session: UserSession = {
        id: 'demo-owner-uuid-12345',
        email: 'owner@rxremind-demo.com',
        clinicId: 'demo-clinic-uuid-12345',
        clinicName: 'RxRemind Premium Medical Clinic',
      };
      (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return { success: true, session };
    }

    if (isSupabaseEnabled) {
      const supabase = await createSupabaseServer();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password',
      });
      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'Authentication failed' };

      // Fetch or create clinic
      let clinic = await DBBroker.getClinicByOwner(data.user.id);
      if (!clinic) {
        clinic = await DBBroker.createClinic({
          owner_id: data.user.id,
          name: 'RxRemind Clinic',
          email: email,
          phone: '',
          logo_url: '',
          plan: 'Pro',
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
            plan: 'Pro',
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
      const supabase = await createSupabaseServer();

      // Dynamically determine current environment host to redirect verified users correctly
      let redirectTo = 'https://rxremind.us/api/auth/callback';
      try {
        const headersList = await headers();
        const host = headersList.get('host') || '';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        redirectTo = `${protocol}://${host}/api/auth/callback`;
      } catch {
        // ignore
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'password',
        options: {
          emailRedirectTo: redirectTo,
        }
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
        plan: 'TestPlan',
        subscription_active: false,
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
        plan: 'TestPlan',
        subscription_active: false,
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

  // FORGOT PASSWORD
  static async forgotPassword(email: string, origin: string): Promise<{ success: boolean; error?: string; simulatedLink?: string }> {
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseEnabled) {
      const supabase = await createSupabaseServer();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } else {
      // Mock mode forgot password
      const clinics = await DBBroker.getAllClinics();
      const clinic = clinics.find((c) => c.email.toLowerCase().trim() === cleanEmail);
      if (!clinic) {
        return { success: false, error: 'No registered medical clinic found under this email address.' };
      }

      const simulatedLink = `/reset-password?email=${encodeURIComponent(cleanEmail)}`;
      return { success: true, simulatedLink };
    }
  }

  // RESET PASSWORD
  static async resetPassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseEnabled) {
      const supabase = await createSupabaseServer();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } else {
      return { success: true };
    }
  }

  // SIGN OUT
  static async signOut(): Promise<boolean> {
    const cookieStore = await cookies();
    if (isSupabaseEnabled) {
      const supabase = await createSupabaseServer();
      await supabase.auth.signOut();
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return true;
  }

  // GET CURRENT SESSION / USER
  static async getCurrentUser(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    // Gracefully bypass Supabase validation for the mock demo account to allow instant walkthrough (non-production only)
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction && sessionCookie) {
      try {
        const decodedValue = decodeURIComponent(sessionCookie.value);
        const session = JSON.parse(decodedValue) as UserSession;
        if (session && session.email === 'owner@rxremind-demo.com') {
          return session;
        }
      } catch {
        // ignore
      }
    }

    if (isSupabaseEnabled) {
      try {
        const supabase = await createSupabaseServer();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) return null;

        // Fetch their clinic dynamically to guarantee absolute context accuracy
        const clinic = await DBBroker.getClinicByOwner(user.id);
        if (!clinic) return null;

        return {
          id: user.id,
          email: user.email || '',
          clinicId: clinic.id,
          clinicName: clinic.name,
        };
      } catch {
        return null;
      }
    }

    if (!sessionCookie) return null;

    try {
      const decodedValue = decodeURIComponent(sessionCookie.value);
      const session = JSON.parse(decodedValue) as UserSession;
      
      if (session && session.email && session.clinicId) {
        return session;
      }
      return null;
    } catch {
      return null;
    }
  }
}
