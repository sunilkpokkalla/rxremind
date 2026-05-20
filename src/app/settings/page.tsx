import { redirect } from 'next/navigation';
import { AuthManager } from '@/lib/auth';
import { DBBroker } from '@/lib/db';
import SettingsClient from '@/components/SettingsClient';

export const revalidate = 0; // Real-time

export default async function SettingsPage() {
  const session = await AuthManager.getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  let clinic;
  try {
    clinic = await DBBroker.getClinicByOwner(session.id);
    if (!clinic) {
      redirect('/');
    }
  } catch (err) {
    console.error('Settings page database access denied:', err);
    redirect('/login?error=database_access_denied');
  }

  const gatewayStatus = {
    email: {
      configured: !!process.env.RESEND_API_KEY || !!process.env.SENDGRID_API_KEY || !!process.env.TWILIO_SENDGRID_API_KEY,
      driver: process.env.RESEND_API_KEY ? 'Resend' : (process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY) ? 'Twilio SendGrid' : 'None',
      apiKeyMasked: process.env.RESEND_API_KEY 
        ? `re_***${process.env.RESEND_API_KEY.slice(-4)}` 
        : (process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY)
        ? `SG_***${(process.env.SENDGRID_API_KEY || process.env.TWILIO_SENDGRID_API_KEY || '').slice(-4)}`
        : null,
    },
    twilio: {
      configured: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_PHONE_NUMBER,
      sidMasked: process.env.TWILIO_ACCOUNT_SID ? `AC***${process.env.TWILIO_ACCOUNT_SID.slice(-4)}` : null,
      phone: process.env.TWILIO_PHONE_NUMBER || null,
    }
  };

  return <SettingsClient clinic={clinic} gatewayStatus={gatewayStatus} />;
}
