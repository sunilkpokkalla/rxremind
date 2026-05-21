import { NextResponse } from 'next/server';
import { DBBroker } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('id') || '';

    if (!patientId) {
      return new Response(renderErrorHTML('Missing confirmation credentials.'), {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      });
    }

    const patient = await DBBroker.getPatientById(patientId, true);
    if (!patient) {
      return new Response(renderErrorHTML('No patient was found matching these credentials.'), {
        headers: { 'Content-Type': 'text/html' },
        status: 404
      });
    }

    const clinic = await DBBroker.getClinicById(patient.clinic_id, true);
    const clinicName = clinic ? clinic.name : 'your clinic';

    // Auto-confirm and automatically schedule their next refill date in the DB!
    await DBBroker.simulatePatientReply(patient.id, 'YES');

    // Return a beautiful, high-fidelity responsive confirmation page
    return new Response(renderSuccessHTML(patient.name, patient.medication_name, clinicName), {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (err: any) {
    console.error('Email confirmation error:', err);
    return new Response(renderErrorHTML(err.message || 'An unexpected error occurred.'), {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}

function renderSuccessHTML(patientName: string, medicationName: string, clinicName: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Refill Request Confirmed | RxRemind</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          background: radial-gradient(circle at top right, #f8fafc, #eff6ff);
          color: #0f172a;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          padding: 48px 40px;
          border-radius: 32px;
          box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.08);
          max-width: 480px;
          width: 90%;
          text-align: center;
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .checkmark-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 28px;
          box-shadow: 0 10px 20px -5px rgba(34, 197, 94, 0.3);
        }
        .checkmark-icon {
          width: 38px;
          height: 38px;
          color: #16a34a;
        }
        h1 {
          font-size: 26px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        p {
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 32px;
        }
        .card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 32px;
          text-align: left;
        }
        .card-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .card-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: 600;
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .value {
          font-weight: 700;
          color: #334155;
          font-size: 14px;
        }
        .badge {
          background: #eff6ff;
          color: #2563eb;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
        }
        .footer-note {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="checkmark-wrapper">
          <svg class="checkmark-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1>Refill Confirmed!</h1>
        <p>Your prescription refill request has been successfully processed and recorded. Thank you!</p>
        
        <div class="card">
          <div class="card-row">
            <span class="label">Patient Name</span>
            <span class="value">${patientName}</span>
          </div>
          <div class="card-row">
            <span class="label">Medication</span>
            <span class="value">${medicationName}</span>
          </div>
          <div class="card-row">
            <span class="label">Provider</span>
            <span class="value">${clinicName}</span>
          </div>
          <div class="card-row">
            <span class="label">Refill Status</span>
            <span class="badge">Approved</span>
          </div>
        </div>

        <div class="footer-note">You can safely close this window now.</div>
      </div>
    </body>
    </html>
  `;
}

function renderErrorHTML(message: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation Error | RxRemind</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          background: radial-gradient(circle at top right, #f8fafc, #fef2f2);
          color: #0f172a;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          padding: 48px 40px;
          border-radius: 32px;
          box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.08);
          max-width: 480px;
          width: 90%;
          text-align: center;
        }
        .error-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 28px;
        }
        .error-icon {
          width: 38px;
          height: 38px;
          color: #dc2626;
        }
        h1 {
          font-size: 24px;
          font-weight: 800;
          color: #991b1b;
          margin: 0 0 12px;
        }
        p {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 24px;
        }
        .button {
          display: inline-block;
          background: #0f172a;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-wrapper">
          <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h1>Invalid Confirmation Link</h1>
        <p>${message}</p>
        <a href="https://rxremind.us" class="button">Go to RxRemind</a>
      </div>
    </body>
    </html>
  `;
}
