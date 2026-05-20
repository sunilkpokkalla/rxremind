'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity, 
  Users, 
  Bell, 
  Settings, 
  CreditCard, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  ActivitySquare
} from 'lucide-react';

interface SidebarProps {
  clinicName: string;
  userEmail: string;
  onSignOut: () => Promise<void>;
}

export default function Sidebar({ clinicName, userEmail, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Activity },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Reminders Log', href: '/reminders', icon: Bell },
    { name: 'Clinic Settings', href: '/settings', icon: Settings },
    { name: 'Billing', href: '/billing', icon: CreditCard },
  ];

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await onSignOut();
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 space-y-1.5 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={`group flex items-center px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon
              className={`mr-3.5 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Sticky Header */}
      <div className="flex md:hidden items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="bg-primary/10 p-2 rounded-xl">
            <ActivitySquare className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">RxRemind</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Sidebar Slideover Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-xs bg-white h-full shadow-2xl z-10 transition-transform">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ActivitySquare className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl text-slate-900">RxRemind</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Clinic Info */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Clinic</div>
              <div className="font-semibold text-slate-800 truncate mt-0.5">{clinicName}</div>
            </div>

            {/* Links */}
            <NavLinks onClick={() => setIsOpen(false)} />

            {/* Footer / Account */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-primary text-white h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition duration-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Persistent Sidebar) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 z-30">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="flex items-center px-6 pb-4 border-b border-slate-100">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-primary p-2.5 rounded-2xl text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
                <ActivitySquare className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">RxRemind</span>
                <span className="block text-[10px] text-primary font-semibold tracking-wider uppercase mt-[-2px]">Clinic Platform</span>
              </div>
            </Link>
          </div>

          {/* Active Clinic Display */}
          <div className="mx-4 my-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-2.5">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Clinic</span>
              <p className="font-semibold text-xs text-slate-800 truncate leading-none mt-1" title={clinicName}>
                {clinicName}
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <NavLinks />

          {/* Sidebar Footer / User Panel */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-3 mb-4 p-1">
              <div className="bg-primary text-white h-9 w-9 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinic Owner</p>
                <p className="text-xs font-bold text-slate-700 truncate mt-0.5" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl transition duration-150"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
