import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, ChevronDown, Building2, Clock,
  LogOut, Sun, Moon, Laptop, Menu, X, QrCode,
  Settings, User, Shield, HelpCircle, FileText,
  Sparkles, Smartphone, Check, Eye, EyeOff,
  CreditCard, Lock
} from 'lucide-react';
import { Institution, PortalRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentPortal: PortalRole;
  onPortalChange: (portal: PortalRole) => void;
  currentInstitution: Institution;
  onInstitutionSelect: (inst: Institution) => void;
  onOpenAISearch: () => void;
  onOpenQRScanner: () => void;
  onOpenStudentSync?: () => void;
  onLogout: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPortal,
  currentInstitution,
  onOpenAISearch,
  onOpenQRScanner,
  onOpenStudentSync,
  onLogout,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemeDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = currentInstitution?.contactPerson || user?.email?.split('@')[0] || 'Administrator';
  const displayEmail = user?.email || '';
  const institutionName = currentInstitution?.name || 'Loading...';
  const institutionStatus = currentInstitution?.status || 'active';

  const statusColor = institutionStatus === 'active' ? 'bg-emerald-500' : institutionStatus === 'suspended' ? 'bg-amber-500' : institutionStatus === 'disabled' ? 'bg-red-500' : 'bg-zinc-500';

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#09090B]/80 dark:bg-[#09090B]/80 backdrop-blur-xl saturate-[180%] border-b border-zinc-800/50 px-4 sm:px-6 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-all"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* FOODEXA Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-[11px] tracking-tight">FX</span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] tracking-tight text-white">FOODEXA</span>
              {currentPortal !== 'super_admin' && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20">
                  Campus OS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-6 w-px bg-zinc-800/60" />

        {/* Institution Info */}
        {currentPortal !== 'super_admin' && (
          <div className="hidden md:flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
              <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
              <span className="text-xs font-medium text-zinc-300 max-w-[160px] truncate">{institutionName}</span>
            </div>
          </div>
        )}

        {currentPortal === 'super_admin' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Super Admin</span>
          </div>
        )}
      </div>

      {/* Center - Global Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <button
          onClick={onOpenAISearch}
          className="relative w-full group"
        >
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center">
            <Search className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            readOnly
            placeholder="Search students, orders, menu..."
            className="w-full bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700/60 rounded-xl py-2 pl-10 pr-20 text-xs text-zinc-200 placeholder:text-zinc-500 cursor-pointer focus:outline-none focus:border-indigo-500/40 focus:bg-zinc-800/60 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-[10px] font-mono text-zinc-500 border border-zinc-700/50">Ctrl K</span>
          </div>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        {onOpenStudentSync && (
          <button
            onClick={onOpenStudentSync}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all"
            title="Student View Sync"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenQRScanner}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all"
          title="QR Scanner"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {/* Time */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-zinc-500 font-mono px-2.5 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeStr}</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-zinc-800/60 mx-1" />

        {/* Theme Toggle */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            className="p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all"
            title="Theme"
          >
            {theme === 'light' && <Sun className="w-4 h-4" />}
            {theme === 'dark' && <Moon className="w-4 h-4" />}
            {theme === 'system' && <Laptop className="w-4 h-4" />}
          </button>

          {showThemeDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-[#0C0C0E] border border-zinc-800 rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in-down">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Appearance
              </div>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setTheme(mode); setShowThemeDropdown(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors rounded-lg mx-1 ${
                    theme === mode
                      ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  <span className="flex items-center gap-2.5">
                    {mode === 'light' && <Sun className="w-3.5 h-3.5" />}
                    {mode === 'dark' && <Moon className="w-3.5 h-3.5" />}
                    {mode === 'system' && <Laptop className="w-3.5 h-3.5" />}
                    <span className="capitalize">{mode}</span>
                  </span>
                  {theme === mode && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#09090B]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0C0C0E] border border-zinc-800 rounded-2xl shadow-2xl z-50 animate-fade-in-down overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
                <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                <span className="text-[10px] text-zinc-500">Mark all read</span>
              </div>
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-xs text-zinc-500">No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-zinc-800/60 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg shadow-indigo-500/20">
              {displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{displayName}</p>
              <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{displayEmail}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0C0C0E] border border-zinc-800 rounded-2xl shadow-2xl z-50 animate-fade-in-down overflow-hidden">
              {/* Profile Header */}
              <div className="px-4 py-3.5 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                    {displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{displayName}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{displayEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1.5">
                <button className="w-full px-4 py-2 text-left flex items-center gap-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span>Account</span>
                </button>
                <button className="w-full px-4 py-2 text-left flex items-center gap-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">
                  <Building2 className="w-4 h-4 text-zinc-500" />
                  <span>Institution Details</span>
                </button>
                <button className="w-full px-4 py-2 text-left flex items-center gap-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">
                  <Bell className="w-4 h-4 text-zinc-500" />
                  <span>Notifications</span>
                </button>
                <button className="w-full px-4 py-2 text-left flex items-center gap-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">
                  <Lock className="w-4 h-4 text-zinc-500" />
                  <span>Security</span>
                </button>
              </div>

              <div className="mx-3 h-px bg-zinc-800/60" />

              <div className="py-1.5">
                <button className="w-full px-4 py-2 text-left flex items-center gap-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">
                  <HelpCircle className="w-4 h-4 text-zinc-500" />
                  <span>Help & Support</span>
                </button>
                <button className="w-full px-4 py-2 text-left flex items-center gap-3 text-xs text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span>Terms of Service</span>
                </button>
              </div>

              <div className="mx-3 h-px bg-zinc-800/60" />

              <div className="py-1.5">
                <button
                  onClick={() => { setShowProfileMenu(false); onLogout(); }}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
