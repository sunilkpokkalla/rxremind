import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthManager } from "@/lib/auth";
import { DBBroker } from "@/lib/db";
import { signOutAction } from "./actions";
import Script from "next/script";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "RxRemind — Premium Prescription Refill Reminder Platform",
  description: "Prescription reminder and patient outreach automation platform for independent medical clinics.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await AuthManager.getCurrentUser();
  let clinicPlan = "TestPlan";

  if (session) {
    try {
      const clinic = await DBBroker.getClinicByOwner(session.id);
      if (clinic) {
        clinicPlan = clinic.plan;
      }
    } catch (err) {
      console.error("Layout clinic plan fetch failed:", err);
    }
  }

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased font-sans bg-background text-foreground">
        {session ? (
          <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
            {/* Sidebar navigation */}
            <Sidebar 
              clinicName={session.clinicName} 
              userEmail={session.email} 
              plan={clinicPlan}
              onSignOut={signOutAction} 
            />

            {/* Core page wrapper */}
            <div className="flex-grow md:pl-60 flex flex-col">
              <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto transition-all duration-200">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
