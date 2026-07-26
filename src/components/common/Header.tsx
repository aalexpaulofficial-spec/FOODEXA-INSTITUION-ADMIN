import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  Building2,
  Clock,
  LogOut,
  Sliders,
  CheckCircle2,
  ArrowRightLeft,
  QrCode,
  Smartphone,
  Sun,
  Moon,
  Laptop,
  Menu,
  X
} from 'lucide-react';
import { Institution, PortalRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentPortal: PortalRole;
  onPortalChange: (portal: PortalRole) => void;
  institutions: Institution[];
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
  onPortalChange,
  institutions,
  currentInstitution,
  onInstitutionSelect,
  onOpenAISearch,
  onOpenQRScanner,
  onOpenStudentSync,
  onLogout,
  isMobileMenuOpen = false,
  onToggleMobileMenu
}) => {
  const { theme, setTheme } = useTheme();
  const [timeStr, setTimeStr] = useState<string>('');
  const [showInstDropdown, setShowInstDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#09090B] border-b border-zinc-800/50 px-3 sm:px-6 flex items-center justify-between text-[#FAFAFA]">
      {/* Left Section: Mobile Menu Toggle, Brand Logo & Institution Badge */}
      <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
        {/* Mobile Navigation Drawer Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5 text-zinc-300" />}
        </button>

        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
          onClick={() => window.location.reload()}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <span className="font-black text-white text-xs tracking-tight">FX</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight text-white block leading-none">FOODEXA</span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Campus OS</span>
          </div>
        </div>

        <div className="hidden md:block h-6 w-px bg-zinc-800/80" />

        {/* Active Institution or Super Admin Banner */}
        {currentPortal !== 'super_admin' ? (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="max-w-[120px] md:max-w-[180px] truncate">{currentInstitution.name}</span>
            <span className="hidden md:inline px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold border border-indigo-500/20">
              Campus
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">superadmin.foodexa.com</span>
          </div>
        )}

        {/* Theme Toggle beside Institution Profile */}
        <div className="relative">
          <button
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-all shadow-sm"
            title="Switch Theme"
          >
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
            {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            {theme === 'system' && <Laptop className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="capitalize hidden sm:inline">{theme === 'system' ? 'System' : theme}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {showThemeDropdown && (
            <div className="absolute left-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-fade-in">
              <div className="px-3 py-1 text-[10px] uppercase font-mono font-bold text-zinc-500 border-b border-zinc-800/80 mb-1">
                Appearance Theme
              </div>
              
              <button
                onClick={() => {
                  setTheme('light');
                  setShowThemeDropdown(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                  theme === 'light'
                    ? 'bg-amber-500/10 text-amber-400 font-bold'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>☀️ Light Mode</span>
                </span>
                {theme === 'light' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <button
                onClick={() => {
                  setTheme('dark');
                  setShowThemeDropdown(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                  theme === 'dark'
                    ? 'bg-indigo-500/10 text-indigo-400 font-bold'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>🌙 Dark Mode</span>
                </span>
                {theme === 'dark' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              </button>

              <button
                onClick={() => {
                  setTheme('system');
                  setShowThemeDropdown(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                  theme === 'system'
                    ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                  <span>💻 System Default</span>
                </span>
                {theme === 'system' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle Section: AI Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div
          onClick={onOpenAISearch}
          className="relative w-full cursor-pointer group"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="AI Search: students, orders, or reports..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-full py-1.5 pl-10 pr-10 text-xs text-zinc-200 placeholder:text-zinc-500 cursor-pointer focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">⌘K</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Right Section: Express Scan, Clock, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time Student App Live View Button */}
        {onOpenStudentSync && (
          <button
            onClick={onOpenStudentSync}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-lg transition-all shadow-sm shadow-amber-500/10"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Student View Sync</span>
          </button>
        )}

        {/* Express QR Scanner CTA */}
        <button
          onClick={onOpenQRScanner}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition-all"
        >
          <QrCode className="w-3.5 h-3.5 text-indigo-400" />
          <span>QR Scanner</span>
        </button>

        {/* Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-zinc-400 font-mono bg-zinc-900/40 px-2.5 py-1 rounded-md border border-zinc-800/50">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{timeStr || '12:00 PM'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0C0C0E] border border-zinc-800 rounded-2xl shadow-2xl py-3 px-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                <span className="font-bold text-zinc-200">Campus Alerts</span>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">
                  2 Unread
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="font-semibold text-zinc-200 text-xs">Express Pickup Locker Ready</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Counter 02 QR scanners active.</div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">10m ago</div>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="font-semibold text-amber-400 text-xs">AI Peak Rush Alert</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Predicted 450+ lunch orders between 12:30 - 01:15 PM.</div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">25m ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {currentPortal === 'super_admin' ? 'SA' : 'CA'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-none text-white">
                {currentPortal === 'super_admin' ? 'Super Admin' : 'Dr. Alex Morgan'}
              </p>
              <p className="text-[10px] text-zinc-500 leading-tight truncate">
                {currentPortal === 'super_admin' ? 'admin@foodexa.com' : 'campus@university.edu'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0C0C0E] border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-zinc-800">
                <div className="font-bold text-zinc-200">
                  {currentPortal === 'super_admin' ? 'Super Admin' : 'Dr. Alex Morgan'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {currentPortal === 'super_admin' ? 'admin@foodexa.com' : 'campus@university.edu'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full px-3 py-2 text-left hover:bg-red-500/10 text-red-400 flex items-center space-x-2 border-t border-zinc-800/80 mt-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

