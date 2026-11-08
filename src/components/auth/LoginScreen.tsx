import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  User,
  ShieldAlert,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { NorseenLogo } from '../common/NorseenLogo';
import { CinematicLoginTransition } from './CinematicLoginTransition';

export const LoginScreen: React.FC = () => {
  const { login, verifyCredentials } = useApp();

  // Inputs strictly start empty - NO default values or autofill
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cinematic animated logo transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ code: string; pwd: string; name: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = userCode.trim();
    const cleanPwd = password.trim();

    if (!cleanCode) {
      setErrorMsg('يرجى إدخال رمز المستخدم للمتابعة');
      return;
    }

    if (!cleanPwd) {
      setErrorMsg('يرجى إدخال كلمة المرور للمتابعة');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Step 2: Verify credentials first without immediate redirect
      const res = verifyCredentials(cleanCode, cleanPwd);
      if (!res.success) {
        setErrorMsg(res.message || 'فشل تسجيل الدخول، يرجى التأكد من صحة رمز المستخدم وكلمة المرور');
        setIsLoading(false);
        return;
      }

      // Step 3: Trigger the 3-4s Cinematic Logo Transition
      setPendingUser({
        code: cleanCode,
        pwd: cleanPwd,
        name: res.user?.fullNameAr || 'مدير النظام',
      });
      setIsTransitioning(true);
      setIsLoading(false);
    }, 200);
  };

  const handleTransitionComplete = () => {
    if (pendingUser) {
      login(pendingUser.code, pendingUser.pwd);
    }
  };

  // If credentials are valid, render the Cinematic Animated Logo Drawing Transition
  if (isTransitioning && pendingUser) {
    return (
      <CinematicLoginTransition
        userName={pendingUser.name}
        onComplete={handleTransitionComplete}
        durationMs={3600}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#051319] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      
      {/* Ambient Fluid Cyan / Teal Aurora Glow Curves (matching the mockup design) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right deep teal aura */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[140px]"></div>
        
        {/* Bottom-left cyan aura */}
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[140px]"></div>

        {/* Center glowing fluid rings/arcs */}
        <svg
          viewBox="0 0 1200 800"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M -100 400 C 200 200, 400 700, 800 350 C 1000 150, 1200 500, 1400 300"
            stroke="url(#ambientTealGrad)"
            strokeWidth="80"
            strokeLinecap="round"
            filter="blur(50px)"
          />
          <path
            d="M 1300 200 C 1000 450, 700 100, 400 550 C 200 750, 0 300, -200 600"
            stroke="url(#ambientCyanGrad)"
            strokeWidth="60"
            strokeLinecap="round"
            filter="blur(60px)"
          />
          <defs>
            <linearGradient id="ambientTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="ambientCyanGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Glassmorphic Frosted Card */}
      <div className="w-full max-w-[460px] bg-slate-900/35 backdrop-blur-2xl rounded-[32px] p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(6,182,212,0.12)] border border-white/10 text-right relative z-10 transition-all">
        
        {/* Header: Official Logo & Title */}
        <div className="flex flex-col items-center text-center pb-2">
          {/* Official NOOR F&B Emblem + "نورسين" */}
          <NorseenLogo size="lg" showText={true} />

          {/* Subtitle: "شاشة تسجيل الدخول" (as requested) */}
          <p className="text-xs sm:text-sm text-slate-300/90 font-medium mt-1.5 tracking-normal">
            شاشة تسجيل الدخول
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Field 1: User Code (رمز المستخدم) */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2">
              رمز المستخدم (User Code) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                autoComplete="off"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="أدخل رمز المستخدم الخاص بك"
                className="w-full pr-11 pl-4 py-3.5 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/[0.12] focus:border-cyan-400 rounded-2xl text-xs font-bold text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400/20 outline-hidden transition shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Field 2: Password (كلمة المرور) */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2">
              كلمة المرور (Password) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full pr-11 pl-11 py-3.5 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/[0.12] focus:border-cyan-400 rounded-2xl text-xs font-bold text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400/20 outline-hidden transition font-mono tracking-wider shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* "تذكرني" (Remember me) Checkbox */}
          <div className="flex items-center justify-end pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white font-medium select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 transition cursor-pointer"
              />
              <span>تذكرني</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-500 hover:from-teal-600 hover:to-cyan-400 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-teal-950/60 hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span>جارٍ التحقق والمصادقة...</span>
            ) : (
              <>
                <span>تسجيل الدخول للمنظومة</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Clean Footer (No "شركة", No "قاعدة بيانات سحابية نشطة", ONLY "نورسين") */}
        <div className="mt-7 pt-5 border-t border-white/[0.08] text-center text-[11px] text-slate-400 font-medium tracking-wide">
          نورسين © 2026 - جميع الحقوق محفوظة
        </div>

      </div>

    </div>
  );
};
