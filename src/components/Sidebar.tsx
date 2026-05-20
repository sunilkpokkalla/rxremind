'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, 
  Bell, 
  Settings, 
  CreditCard, 
  LogOut, 
  Menu, 
  X, 
  BarChart3,
  LayoutDashboard
} from 'lucide-react';

interface SidebarProps {
  clinicName: string;
  userEmail: string;
  plan: string;
  onSignOut: () => Promise<void>;
}

export default function Sidebar({ clinicName, userEmail, plan, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Format plan names for presentation
  const getPlanLabel = () => {
    switch (plan) {
      case 'TestPlan': return 'Test Plan';
      case 'Starter': return 'Starter Plan';
      case 'Growth': return 'Growth Plan';
      case 'Pro': return 'Pro Plan';
      default: return 'Test Plan';
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Reminders', href: '/reminders', icon: Bell },
    { name: 'Analytics', href: '#', icon: BarChart3, disabled: true },
    { name: 'Settings', href: '/settings', icon: Settings },
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

  const getInitials = (name: string) => {
    if (!name) return 'CH';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' 
          ? pathname === '/' 
          : pathname.startsWith(item.href) && item.href !== '#';
        
        return (
          <Link
            key={item.name}
            href={item.disabled ? '#' : item.href}
            onClick={(e) => {
              if (item.disabled) {
                e.preventDefault();
                alert("Analytics dashboards are premium assets compiled automatically on daily crons. Live clinic analytical charts are currently displaying previews on the main dashboard!");
                return;
              }
              if (onClick) onClick();
            }}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              isActive
                ? 'bg-blue-50 text-blue-600 font-bold'
                : item.disabled
                ? 'text-slate-400 cursor-not-allowed opacity-80'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon
              className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                isActive ? 'text-blue-600' : item.disabled ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-600'
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
        <div className="flex items-center space-x-2">
          {/* Blue rounded square logo with pill icon inside */}
          <div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10">
            <span className="text-white text-base font-extrabold select-none">💊</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-950">RxRemind</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Sidebar Slideover Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />

          <div className="relative flex flex-col w-60 max-w-xs bg-white h-full shadow-2xl z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-black">💊</span>
                </div>
                <span className="font-extrabold text-lg text-slate-900">RxRemind</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <NavLinks onClick={() => setIsOpen(false)} />

            {/* Footer / Account */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-slate-200 text-slate-700 h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs">
                  {getInitials(clinicName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{clinicName}</h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-black uppercase rounded-full tracking-wider mt-0.5 inline-block">
                    {getPlanLabel()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition duration-150"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Persistent Sidebar - 240px wide) */}
      <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 z-30">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          {/* Logo Brand Header with Blue Square + Pill logo & text */}
          <div className="flex items-center px-6 pb-5 border-b border-slate-100/80">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/10 transition-transform group-hover:scale-105 flex items-center justify-center">
                <span className="text-white text-sm font-extrabold select-none">💊</span>
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-slate-950">RxRemind</span>
                <span className="block text-[8px] text-blue-600 font-extrabold tracking-wider uppercase mt-[-4px]">SaaS Platform</span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <NavLinks />

          {/* Sidebar Footer Account Info with avatar & initials & plan badge */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center space-x-3 p-1">
              <div className="bg-slate-150 border border-slate-200 text-slate-700 h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                {getInitials(clinicName)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 truncate" title={clinicName}>{clinicName}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded-full tracking-wider">
                    {getPlanLabel()}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl transition duration-150 cursor-pointer"
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
