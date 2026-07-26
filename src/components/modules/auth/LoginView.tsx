import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, KeyRound, Sparkles, ArrowRight, Building2, Globe, Sun, Moon, Laptop } from 'lucide-react';
import { PortalRole } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface LoginViewProps {
  onLoginSuccess: (portal: PortalRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState<'login' | 'forgot' | 'otp'>('login');
  const [email, setEmail] = useState('admin@apex.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState(['4', '8', '0', '1']);
  const [isSuperAdminLogin, setIsSuperAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 800);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(isSuperAdminLogin ? 'super_admin' : 'campus_admin');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Top Right Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <div className="flex bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-lg text-xs">
          <button
            onClick={() => setTheme('light')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
              theme === 'light' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
              theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Dark</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
              theme === 'system' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Auto</span>
          </button>
        </div>
      </div>
      {/* Background AI Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0C0C0E] border border-zinc-800/80 rounded-3xl shadow-2xl p-8 backdrop-blur-2xl relative z-10 overflow-hidden">
        {/* Subtle Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-500" />

        {/* Institution Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-xl shadow-lg shadow-indigo-600/20 mb-3">
            FX
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center space-x-2">
            <span>FOODEXA</span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold border ${
              isSuperAdminLogin
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {isSuperAdminLogin ? 'SUPER ADMIN' : 'INSTITUTION'}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center space-x-1.5 font-mono">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>{isSuperAdminLogin ? 'superadmin.foodexa.com' : 'admin.foodexa.com'}</span>
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 mb-6 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSuperAdminLogin(false);
              setEmail('admin@apex.edu');
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              !isSuperAdminLogin
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Institution Admin</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSuperAdminLogin(true);
              setEmail('superadmin@foodexa.io');
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              isSuperAdminLogin
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        </div>

        {/* Step 1: Login Form */}
        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                {isSuperAdminLogin ? 'Super Admin Email' : 'Institution Work Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@university.edu"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">Password</label>
                <button
                  type="button"
                  onClick={() => setStep('forgot')}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              {isLoading ? (
                <span>Securing Session...</span>
              ) : (
                <>
                  <span>Continue to 2FA Step</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Forgot Password */}
        {step === 'forgot' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your registered institution email to receive a secure password reset link.
            </p>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={() => setStep('otp')}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
            >
              Send Verification OTP
            </button>
            <button
              onClick={() => setStep('login')}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Step 3: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-2 border border-indigo-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">Two-Factor Authentication</h3>
              <p className="text-xs text-zinc-400">
                Enter the 4-digit security code sent to <span className="font-mono text-zinc-200">{email}</span>
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const newOtp = [...otp];
                    newOtp[i] = e.target.value;
                    setOtp(newOtp);
                  }}
                  className="w-12 h-12 text-center text-lg font-bold font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-indigo-400 focus:outline-none focus:border-indigo-500"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              {isLoading ? 'Verifying Credentials...' : 'Verify & Launch Dashboard'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('login')}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Change Email / Login Mode
              </button>
            </div>
          </form>
        )}

        {/* Security Footer Badge */}
        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit TLS Encrypted</span>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Google Gemini Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

