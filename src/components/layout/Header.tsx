import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  LogOut,
  User,
  Shield,
  RotateCcw,
  Clock,
  Cloud,
  RefreshCw,
  Trash2,
  Database,
  Layers,
  ChevronDown,
  CheckCircle2,
  Check,
  AlertTriangle,
  Settings,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Sparkles,
  Upload,
} from 'lucide-react';
import { USER_ROLES } from '../../data/initialData';
import { NorseenLogo } from '../common/NorseenLogo';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    activeBranchFilter,
    setActiveBranchFilter,
    userAssignedBranches,
    isGlobalUser,
    branches,
    cloudStatus,
    isSyncing,
    lastCloudSync,
    isCleanDatabase,
    cloudStats,
    clearAllDefaultValuesAndResetCloud,
    loadDemoSampleData,
    syncAllToCloud,
    updateCurrentUserProfile,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [newUpdateAvailable, setNewUpdateAvailable] = useState<string | null>(null);
  const [mountTime] = useState<number>(() => Date.now());

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Listen to remote app version broadcasts from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'system_config', 'app_version'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.timestamp && data.timestamp > mountTime) {
            setNewUpdateAvailable(data.version || 'إصدار جديد');
          }
        }
      });
      return () => unsub();
    } catch (err) {
      console.warn('Could not listen for remote app updates:', err);
    }
  }, [mountTime]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Account Management Form State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-LY', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // When opening Account Modal, sync current user values
  const openAccountModal = () => {
    if (!currentUser) return;
    setProfileName(currentUser.fullNameAr);
    setProfileEmail(currentUser.email || '');
    setEmailNotifications(currentUser.emailNotificationsEnabled ?? true);
    setProfileAvatar(currentUser.avatarUrl);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileError(null);
    setShowUserMenu(false);
    setShowAccountModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    // Limit image size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfileAvatar(base64);
      setProfileError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url: string) => {
    setProfileAvatar(url);
    setProfileError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!currentUser) return;
    if (!profileName.trim()) {
      setProfileError('الاسم الكامل مطلوب');
      return;
    }

    // Password change validation
    let passwordToUpdate: string | undefined = undefined;
    if (newPassword.trim() || confirmPassword.trim() || currentPassword.trim()) {
      if (!currentPassword.trim()) {
        setProfileError('يرجى إدخال كلمة المرور الحالية لتأكيد التغيير');
        return;
      }
      if (currentUser.password && currentUser.password !== currentPassword.trim()) {
        setProfileError('كلمة المرور الحالية غير صحيحة');
        return;
      }
      if (newPassword.trim().length < 4) {
        setProfileError('كلمة المرور الجديدة يجب أن تتكون من 4 خانات على الأقل');
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setProfileError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
        return;
      }
      passwordToUpdate = newPassword.trim();
    }

    // Validate email format if provided
    if (profileEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileEmail.trim())) {
        setProfileError('صيغة البريد الإلكتروني غير صالحة');
        return;
      }
    }

    setIsSavingProfile(true);

    try {
      const res = await updateCurrentUserProfile({
        fullNameAr: profileName.trim(),
        avatarUrl: profileAvatar,
        email: profileEmail.trim(),
        emailNotificationsEnabled: emailNotifications,
        ...(passwordToUpdate && { password: passwordToUpdate }),
      });

      if (res.success) {
        setShowAccountModal(false);
        setActionMessage('تم حفظ وتحديث بيانات الحساب وكلمة المرور تلقائياً بنجاح!');
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        setProfileError(res.error || 'حدث خطأ أثناء حفظ التعديلات');
      }
    } catch (err) {
      setProfileError('حدث خطأ غير متوقع أثناء الحفظ');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleClearAll = async () => {
    const res = await clearAllDefaultValuesAndResetCloud();
    setShowClearConfirm(false);
    if (res.success) {
      setActionMessage('تم مسح القيم الافتراضية بنجاح وتهيئة قاعدة بيانات سحابية نظيفة!');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleLoadDemo = async () => {
    const res = await loadDemoSampleData();
    setShowDemoConfirm(false);
    if (res.success) {
      setActionMessage('تم تحميل البيانات التجريبية ومزامنتها مع قاعدة البيانات السحابية!');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleSyncNow = async () => {
    const res = await syncAllToCloud();
    if (res.success) {
      setActionMessage('تمت المزامنة السحابية بنجاح!');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  if (!currentUser) return null;

  const roleInfo = USER_ROLES.find((r) => r.id === currentUser.role);

  // Modern preset avatars for quick picking
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#061922]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Right Brand info in Arabic with NorseenLogo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <NorseenLogo size="sm" showText={false} theme="dark" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white tracking-tight text-xl text-right drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                  نورسين
                </span>
                <span className="text-cyan-400 font-bold text-sm">✦</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  نظام الإدارة المؤسسية
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/60 font-sans hidden sm:block">Norseen Enterprise Management System</p>
            </div>
          </div>

          {/* Center: Branch Scope & Cloud Live Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Branch Scope Switcher */}
            <div className="flex items-center bg-slate-900/70 backdrop-blur-md rounded-2xl p-1.5 border border-cyan-500/30 shadow-inner">
              <div className="flex items-center gap-1.5 px-2.5 text-xs font-semibold text-cyan-300">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">نطاق الفرع:</span>
              </div>

              {isGlobalUser ? (
                <select
                  value={activeBranchFilter}
                  onChange={(e) => setActiveBranchFilter(e.target.value)}
                  className="bg-[#0b2835] border border-cyan-500/40 rounded-xl text-xs font-bold text-white py-1.5 px-3 outline-hidden focus:ring-2 focus:ring-cyan-400 cursor-pointer shadow-xs"
                >
                  <option value="all">🌐 كافة الفروع (عرض شامل)</option>
                  {branches
                    .filter((b) => b.isActive)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        🏢 {b.nameAr}
                      </option>
                    ))}
                </select>
              ) : userAssignedBranches.length > 1 ? (
                <select
                  value={activeBranchFilter}
                  onChange={(e) => setActiveBranchFilter(e.target.value)}
                  className="bg-[#0b2835] border border-cyan-500/40 rounded-xl text-xs font-bold text-white py-1.5 px-3 outline-hidden focus:ring-2 focus:ring-cyan-400 cursor-pointer shadow-xs"
                >
                  <option value="all">فروعي المخصصة ({userAssignedBranches.length})</option>
                  {userAssignedBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.nameAr}
                    </option>
                  ))}
                </select>
              ) : userAssignedBranches.length === 1 ? (
                <span className="bg-[#0b2835] border border-cyan-500/40 text-cyan-300 text-xs font-bold py-1.5 px-3 rounded-xl shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  {userAssignedBranches[0].nameAr}
                </span>
              ) : (
                <span className="text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl">غير معين لفرع</span>
              )}
            </div>

            {/* Cloud Real-Time Live Status & Force Sync Button */}
            <div className="flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md rounded-2xl p-1.5 border border-cyan-500/30 shadow-inner">
              <button
                type="button"
                onClick={() => setShowCloudModal(true)}
                title="عرض حالة قاعدة البيانات السحابية Firestore"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-cyan-950/50 transition cursor-pointer text-xs font-bold"
              >
                <div className="relative flex items-center justify-center">
                  <Cloud className={`w-4 h-4 ${cloudStatus === 'connected' ? 'text-emerald-400' : cloudStatus === 'connecting' ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                      cloudStatus === 'connected'
                        ? 'bg-emerald-400 animate-pulse'
                        : cloudStatus === 'connecting'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
                <span className="hidden xl:inline text-[11px] text-cyan-200">
                  {cloudStatus === 'connected'
                    ? 'السحابة متصلة ومزامنة'
                    : cloudStatus === 'connecting'
                    ? 'جارِ الاتصال...'
                    : 'محلي (أوفلاين)'}
                </span>
                {lastCloudSync && (
                  <span className="hidden 2xl:inline text-[10px] text-cyan-400/70 font-mono">
                    ({lastCloudSync})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                title="مزامنة فورية لكافة الموظفين والمشغلين والبيانات مع السحابة"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  isSyncing
                    ? 'bg-cyan-900 text-cyan-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline text-[11px]">
                  {isSyncing ? 'جارِ المزامنة...' : 'مزامنة سحابية'}
                </span>
              </button>
            </div>

          </div>

          {/* Left: Clock & User Profile Pill with ONLY [إدارة الحساب] & [تسجيل الخروج] */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/70 border border-cyan-500/30 px-3.5 py-2 rounded-2xl text-xs text-cyan-200 font-mono shadow-inner">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime}</span>
            </div>

            {/* User Dropdown Button */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 transition border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] cursor-pointer text-right group"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullNameAr}
                    className="w-9 h-9 rounded-full object-cover shadow-xs border-2 border-cyan-400/60"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-500 text-white font-black flex items-center justify-center text-sm shadow-xs border border-cyan-300/40">
                    {currentUser.fullNameAr.charAt(0)}
                  </div>
                )}
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white leading-tight group-hover:text-cyan-300 transition">
                    {currentUser.fullNameAr}
                  </div>
                  <div className="text-[10px] text-cyan-400/80 font-medium">
                    {roleInfo?.nameAr || currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              {/* Strict User Menu: Shows ONLY "إدارة الحساب" and "تسجيل الخروج" as requested */}
              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-[#081e28]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-cyan-500/40 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-white">
                  <div className="p-3 border-b border-white/10 text-right">
                    <p className="text-[11px] text-cyan-400/70">حساب المستخدم</p>
                    <p className="text-sm font-bold text-white">{currentUser.fullNameAr}</p>
                    <p className="text-xs text-slate-300 font-mono">@{currentUser.username}</p>
                    {currentUser.email && (
                      <p className="text-[11px] text-cyan-300 font-mono mt-0.5 truncate">
                        {currentUser.email}
                      </p>
                    )}
                  </div>

                  <div className="py-1.5 space-y-1">
                    {/* Item 1: إدارة الحساب */}
                    <button
                      onClick={openAccountModal}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-200 hover:text-cyan-300 hover:bg-cyan-950/50 rounded-xl transition text-right cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>إدارة الحساب</span>
                    </button>

                    <div className="border-t border-white/10 my-1"></div>

                    {/* Item 2: تسجيل الخروج */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/40 rounded-xl transition text-right cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Floating Action Message notification */}
        {actionMessage && (
          <div className="bg-cyan-600 text-white text-xs py-2 px-4 text-center font-bold shadow-md flex items-center justify-center gap-2 transition-all">
            <CheckCircle2 className="w-4 h-4 text-cyan-200" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Global Broadcast Live Update Banner */}
        {newUpdateAvailable && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white text-xs py-2 px-4 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mx-auto">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span>تم نشر تحديث جديد للمنظومة على الدومين السحابي ({newUpdateAvailable})! اضغط لتحديث البرنامج واستلام كافة الميزات الآن.</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-teal-900 rounded-lg font-bold text-xs transition cursor-pointer shadow-xs shrink-0"
            >
              تحديث البرنامج الآن ↻
            </button>
          </div>
        )}
      </header>

      {/* Account Management Modal (إدارة الحساب) */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">إدارة الحساب الشخصي</h3>
                  <p className="text-xs text-slate-500">تعديل الصورة، كلمة المرور، وربط البريد الإلكتروني للإشعارات</p>
                </div>
              </div>

              <button
                onClick={() => setShowAccountModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 text-right">
              {/* 1. Profile Picture Section (إضافة وتعديل الصورة الشخصية) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  الصورة الشخصية (Profile Picture)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current Avatar Preview */}
                  <div className="relative group shrink-0">
                    {profileAvatar ? (
                      <img
                        src={profileAvatar}
                        alt="Preview"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-black text-2xl flex items-center justify-center border-2 border-slate-300 shadow-md">
                        {profileName ? profileName.charAt(0) : 'ن'}
                      </div>
                    )}

                    {profileAvatar && (
                      <button
                        type="button"
                        onClick={() => setProfileAvatar(undefined)}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-700 transition cursor-pointer"
                        title="حذف الصورة"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 text-right w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة من الجهاز</span>
                      </button>

                      {profileAvatar && (
                        <button
                          type="button"
                          onClick={() => setProfileAvatar(undefined)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          استعادة الشعار الافتراضي
                        </button>
                      )}
                    </div>

                    {/* Presets */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">أو اختر صورة جاهزة:</span>
                      <div className="flex items-center gap-2">
                        {presetAvatars.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPresetAvatar(preset)}
                            className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                              profileAvatar === preset ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <img src={preset} alt={`preset ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. User Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">اسم الموظف / المستخدم بالعربية</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">رمز المستخدم (اسم الدخول)</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.username}
                    className="w-full px-3.5 py-2.5 bg-slate-200 border-2 border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 3. Email Linking & Notification Alerts (ربط البريد الإلكتروني) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    ربط الحساب بالبريد الإلكتروني (Email Linking)
                  </label>
                  {profileEmail && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      جاهز للربط
                    </span>
                  )}
                </div>

                <div>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="name@norseen.ly أو بريدك الشخصي..."
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden font-mono transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    سيتم ربط حسابك بهذا البريد لإرسال إشعارات المنظومة والمهام المكلفة وسجلات الحضور والغياب.
                  </p>
                </div>

                {/* Notification Toggle */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-700 font-medium">
                      تفعيل استلام الإشعارات والتنبيهات عبر البريد
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* 4. Password Change Section (تعديل كلمة المرور) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    تعديل كلمة المرور (Change Password)
                  </label>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (اتركه فارغاً إذا كنت لا ترغب بتغييرها)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1">كلمة المرور الحالية</label>
                    <div className="relative">
                      <input
                        type={showOldPwd ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الحالية للتحقق"
                        className="w-full pr-3.5 pl-9 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPwd(!showOldPwd)}
                        className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 hover:text-slate-800"
                      >
                        {showOldPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* New Password */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-800 mb-1">كلمة المرور الجديدة</label>
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="كلمة مرور جديدة"
                          className="w-full pr-3.5 pl-9 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 hover:text-slate-800"
                        >
                          {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-800 mb-1">تأكيد كلمة المرور</label>
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="أعد كتابتها"
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-70"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ الحفظ التلقائي...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>حفظ وتحديث الحساب تلقائياً</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud Database Management Modal */}
      {showCloudModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">قاعدة البيانات السحابية (Firebase Cloud)</h3>
                  <p className="text-xs text-slate-500">حالة الاتصال الفوري والمزامنة وإدارة السجلات</p>
                </div>
              </div>

              <button
                onClick={() => setShowCloudModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cloud Connection Details Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">حالة الاتصال السحابي:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  متصل ومفعل (Connected Live)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">مشروع Google Cloud / Firebase:</span>
                <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {cloudStats.projectId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">معرف قاعدة بيانات Firestore:</span>
                <span className="text-[11px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[260px]">
                  {cloudStats.databaseId}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">وضع البيانات الحالي:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isCleanDatabase
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isCleanDatabase ? '✨ قاعدة بيانات نقية (فارغة بدون قيم افتراضية)' : '📦 بيانات تجريبية موسعة'}
                </span>
              </div>

              {lastCloudSync && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>آخر مزامنة سحابية:</span>
                  <span className="font-mono">{lastCloudSync}</span>
                </div>
              )}
            </div>

            {/* Collections Count Grid */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                إحصائيات المجموعات السحابية الحالية:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.employees}</div>
                  <div className="text-[11px] text-slate-500">الموظفين</div>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.branches}</div>
                  <div className="text-[11px] text-slate-500">الفروع</div>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.users}</div>
                  <div className="text-[11px] text-slate-500">المستخدمين</div>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.incidents}</div>
                  <div className="text-[11px] text-slate-500">الغياب والتأخير</div>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.requests}</div>
                  <div className="text-[11px] text-slate-500">الطلبات</div>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.tasks}</div>
                  <div className="text-[11px] text-slate-500">المهام</div>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.catalogItems}</div>
                  <div className="text-[11px] text-slate-500">أصناف الكتالوج</div>
                </div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                  <div className="text-lg font-black text-slate-900">{cloudStats.counts.purchaseOrders}</div>
                  <div className="text-[11px] text-slate-500">طلبات التوريد</div>
                </div>
              </div>
            </div>

            {/* Cloud Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCloudModal(false);
                  setShowClearConfirm(true);
                }}
                disabled={isSyncing}
                className="w-full flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-amber-900 font-bold text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div>مسح القيم الافتراضية وتصفير قاعدة البيانات</div>
                    <div className="text-[11px] font-normal text-amber-700">
                      حذف السجلات التجريبية والبدء ببيانات جديدة وفارغة مع الإبقاء على حساب المشرف العام
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-amber-200 px-2.5 py-1 rounded-lg">تنفيذ</span>
              </button>

              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="w-full flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-900 font-bold text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center">
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="text-right">
                    <div>مزامنة البيانات فورياً مع السحابة (Sync to Firestore)</div>
                    <div className="text-[11px] font-normal text-emerald-700">
                      رفع وتأكيد حفظ كافة التعديلات على خوادم Google Cloud Firestore
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-emerald-200 px-2.5 py-1 rounded-lg">مزامنة</span>
              </button>

              <button
                onClick={() => {
                  setShowCloudModal(false);
                  setShowDemoConfirm(true);
                }}
                disabled={isSyncing}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 font-semibold text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div>تحميل بيانات تجريبية (Sample Demo Data)</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      تعبئة بيانات افتراضية لأغراض التجربة والاختبار
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-slate-200 px-2.5 py-1 rounded-lg">تحميل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              مسح القيم الافتراضية وتصفير قاعدة البيانات السحابية؟
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              سيتم مسح كافة سجلات الموظفين والغياب والطلبات والمهام والأصناف التجريبية من قاعدة البيانات السحابية، والبدء بقاعدة بيانات نقية بالكامل.
              <br />
              <strong className="text-slate-800">سيتم الإبقاء حصراً على:</strong>
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-slate-700 font-medium">
                <li>حساب مدير النظام الرئيسي: <strong>محمد قشوط</strong> (64512200)</li>
                <li>فرع المقر الرئيسي بطرابلس</li>
                <li>إعدادات الورديات والأوضاع الوظيفية ومصفوفة الصلاحيات</li>
              </ul>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleClearAll}
                disabled={isSyncing}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                تأكيد مسح القيم الافتراضية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Load Confirmation Modal */}
      {showDemoConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">تحميل بيانات تجريبية للنظام؟</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              سيتم إضافة عينات من الموظفين والفروع والأصناف والطلبات التجريبية لتسهيل استعراض كافة خصائص ومميزات النظام، مع حفظها سحابياً في Firestore.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDemoConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleLoadDemo}
                disabled={isSyncing}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                تحميل البيانات التجريبية
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
