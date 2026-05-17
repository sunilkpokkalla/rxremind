import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthManager } from "@/lib/auth";
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

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased font-sans bg-background text-foreground">
        {session ? (
          <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar navigation */}
            <Sidebar 
              clinicName={session.clinicName} 
              userEmail={session.email} 
              onSignOut={signOutAction} 
            />

            {/* Core page wrapper */}
            <div className="flex-1 md:pl-64 flex flex-col">
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
