import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../layout/Sidebar';
import {
  Users,
  ClockAlert,
  FileText,
  CheckSquare,
  Building2,
  TrendingUp,
  Clock,
  ChevronLeft,
  Calendar,
  AlertCircle,
  PlusCircle,
  MapPin,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Truck,
} from 'lucide-react';
import { USER_ROLES } from '../../data/initialData';

// High-fidelity image assets generated for the dashboard
import gearsImg from '../../assets/images/clockwork_gears_mechanism_1792231511291.jpg';
import { QuranRadioWidget } from './QuranRadioWidget';

interface ExecutiveDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigate }) => {
  const {
    currentUser,
    scopedEmployees,
    scopedCasualEmployees,
    scopedTransfers,
    scopedIncidents,
    scopedRequests,
    scopedTasks,
    branches,
    hasPermission,
    userAssignedBranches,
    isGlobalUser,
  } = useApp();

  const pendingCasualCount = scopedCasualEmployees.filter(
    (w) => w.approvalStatus === 'pending_hr_approval'
  ).length;

  const activeTransfersCount = scopedTransfers.filter(
    (t) => t.status === 'pending_pickup' || t.status === 'in_transit'
  ).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayIncidents = scopedIncidents.filter((i) => i.date === todayStr);
  const todayAbsences = todayIncidents.filter((i) => i.type === 'absence').length;
  const todayDelays = todayIncidents.filter((i) => i.type === 'delay').length;

  const pendingRequests = scopedRequests.filter((r) => r.status === 'pending');
  const activeTasks = scopedTasks.filter((t) => !t.isArchived);

  // Calculate task completion percentage
  const completedTasksCount = scopedTasks.filter((t) => t.isArchived || (t.targets && t.targets.length > 0 && t.targets.every(tgt => tgt.isCompleted))).length;
  const totalTasksCount = Math.max(scopedTasks.length, 1);
  const taskProgressPct = Math.round((completedTasksCount / totalTasksCount) * 100);

  return (
    <div className="space-y-6 text-right select-none font-sans">
      
      {/* 1. Large Frosted Hero Banner with Golden-Cyan Perimeter Glow */}
      <div className="relative overflow-hidden rounded-[28px] p-7 sm:p-9 text-white bg-gradient-to-r from-[#061922]/90 via-[#0a2735]/85 to-[#04141c]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15),0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
        
        {/* Subtle Ambient Aurora Light */}
        <div className="absolute top-0 right-1/4 -translate-y-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Right Text Block */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>نظام نورسين للإدارة المؤسسية | Norseen Enterprise</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              أهلاً بك، {currentUser?.fullNameAr} 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              {isGlobalUser
                ? 'لديك وصول كامل لكافة فروع نورسين وإداراتها التنفيذية. تابع المؤشرات اللحظية أدناه.'
                : `أنت تعمل حالياً ضمن نطاق الفروع المخصصة لك: ${userAssignedBranches.map((b) => b.nameAr).join('، ')}.`}
            </p>
          </div>

          {/* Left Action Buttons (Metallic Glass Capsules) */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {hasPermission('view_employees') && (
              <button
                onClick={() => onNavigate('weekly_report')}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600/90 to-teal-600/90 hover:from-cyan-500 hover:to-teal-500 text-white border border-cyan-400/50 rounded-2xl text-xs font-black transition-all backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Calendar className="w-4 h-4 text-cyan-200" />
                <span>التقرير الأسبوعي للفروع</span>
              </button>
            )}

            {hasPermission('create_incident') && (
              <button
                onClick={() => onNavigate('attendance')}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-white/15 rounded-2xl text-xs font-bold transition-all backdrop-blur-md shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <ClockAlert className="w-4 h-4 text-cyan-400" />
                <span>رصد غياب / تأخير</span>
              </button>
            )}

            {hasPermission('create_request') && (
              <button
                onClick={() => onNavigate('requests')}
                className="px-4 py-2.5 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-400/50 rounded-2xl text-xs font-bold transition-all backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <FileText className="w-4 h-4 text-cyan-300" />
                <span>تقديم طلب</span>
              </button>
            )}

            {hasPermission('view_casual_workers') && (
              <button
                onClick={() => onNavigate('casual_workers')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black border border-amber-400/50 rounded-2xl text-xs transition-all backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Briefcase className="w-4 h-4 text-slate-950" />
                <span>عمالة عارضة</span>
                {pendingCasualCount > 0 && (
                  <span className="bg-slate-950 text-amber-300 font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-amber-400/40">
                    {pendingCasualCount}
                  </span>
                )}
              </button>
            )}

            {(hasPermission('view_logistics') || hasPermission('create_logistics_transfer') || hasPermission('pickup_logistics_transfer')) && (
              <button
                onClick={() => onNavigate('logistics_transfer')}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-600/80 to-cyan-600/80 hover:from-teal-500 hover:to-cyan-500 text-slate-950 font-black border border-cyan-400/50 rounded-2xl text-xs transition-all backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Truck className="w-4 h-4 text-slate-950" />
                <span>النقل والطرود</span>
                {activeTransfersCount > 0 && (
                  <span className="bg-slate-950 text-cyan-300 font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-cyan-400/40 font-mono">
                    {activeTransfersCount}
                  </span>
                )}
              </button>
            )}

            {hasPermission('create_employee') && (
              <button
                onClick={() => onNavigate('employees')}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-white/15 rounded-2xl text-xs font-bold transition-all backdrop-blur-md shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>إضافة موظف</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Four Elevated 3D Glass Prism Metric / KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1 (Far Right in RTL): Cyan 3D Prism - إجمالي الموظفين في النطاق */}
        <div
          onClick={() => onNavigate('employees')}
          className="relative overflow-hidden rounded-[24px] p-5 glass-cube-cyan transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(6,182,212,0.35)] cursor-pointer group flex flex-col justify-between min-h-[175px]"
        >
          <div>
            {/* Top row with 3D prism cube icon */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-100">إجمالي الموظفين في النطاق</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition border border-white/20">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Metric Value & Visual Bars */}
            <div className="flex items-baseline justify-between mt-3">
              <div className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {scopedEmployees.length}
              </div>

              {/* Mini Neon Cyan Bar Chart */}
              <div className="flex items-end gap-1 h-8 opacity-80 group-hover:opacity-100 transition">
                <div className="w-1.5 h-3 bg-cyan-400/50 rounded-t"></div>
                <div className="w-1.5 h-5 bg-cyan-400/70 rounded-t"></div>
                <div className="w-1.5 h-4 bg-cyan-400/60 rounded-t"></div>
                <div className="w-1.5 h-7 bg-cyan-300 rounded-t shadow-[0_0_6px_#22d3ee]"></div>
                <div className="w-1.5 h-6 bg-cyan-400/80 rounded-t"></div>
              </div>
            </div>
          </div>

          {/* Subtext and link indicator */}
          <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-cyan-200/80">
            <span>موزعون على الفروع المصرحة</span>
            <ChevronLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-1 transition" />
          </div>
        </div>

        {/* Card 2: Blue 3D Prism - طلبات بانتظار اليوم (الغياب والتأخير) */}
        <div
          onClick={() => onNavigate('attendance')}
          className="relative overflow-hidden rounded-[24px] p-5 glass-cube-blue transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] cursor-pointer group flex flex-col justify-between min-h-[175px]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-100">طلبات بانتظار اليوم</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition border border-white/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {todayIncidents.length}
              </div>
              <span className="text-[11px] text-blue-200 font-bold bg-blue-950/60 border border-blue-400/30 px-2 py-0.5 rounded-lg">
                ({todayAbsences} غياب | {todayDelays} تأخير)
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-500/20 flex items-center justify-between text-[11px] text-blue-200/80">
            <span className="font-mono">تاريخ اليوم: {todayStr}</span>
            <ChevronLeft className="w-3.5 h-3.5 text-blue-400 group-hover:-translate-x-1 transition" />
          </div>
        </div>

        {/* Card 3: Amber/Gold 3D Prism - طلبات بانتظار الاعتماد */}
        <div
          onClick={() => onNavigate('requests')}
          className="relative overflow-hidden rounded-[24px] p-5 glass-cube-amber transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] cursor-pointer group flex flex-col justify-between min-h-[175px]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-100">طلبات بانتظار الاعتماد</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-105 transition border border-white/20">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {pendingRequests.length}
              </div>
              <span className="text-[11px] text-amber-200 font-bold bg-amber-950/60 border border-amber-400/30 px-2.5 py-0.5 rounded-lg">
                إجازات وخروج متأخر
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-200/80">
            <span>تتطلب اعتماد الإدارة</span>
            <ChevronLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-1 transition" />
          </div>
        </div>

        {/* Card 4 (Far Left in RTL): Emerald 3D Prism - المهام التنفيذية النشطة */}
        <div
          onClick={() => onNavigate('tasks')}
          className="relative overflow-hidden rounded-[24px] p-5 glass-cube-emerald transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] cursor-pointer group flex flex-col justify-between min-h-[175px]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-100">إجمالي المهام النشطة</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition border border-white/20">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {activeTasks.length}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-400/30 px-2 py-0.5 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>مسندة لمدراء الفروع</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-200/80">
            <span>متابعة نسب الإنجاز اللحظية</span>
            <ChevronLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition" />
          </div>
        </div>

      </div>

      {/* 3. Lower Row with Two Main Showcase Widgets (matching the mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Widget: "إذاعة القرآن الكريم - بث مباشر" */}
        <QuranRadioWidget />

        {/* Right Widget: "متابعة إنجاز المهام بالفروع" (Steampunk Clockwork Gears Mechanism & Milestone Track) */}
        <div className="relative rounded-[28px] p-6 text-white bg-[#061822]/85 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.15)] flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>متابعة إنجاز المهام بالفروع</span>
              </h2>
              <p className="text-xs text-cyan-200/80 font-medium">نسبة التزام مدراء ومساعدين الفروع بالمهام الموكلة</p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-500/40"
            >
              <span>عرض كافة المهام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Middle: Steampunk Clockwork Gears & Multi-Stage Task Progress System */}
          <div className="my-5 flex flex-col sm:flex-row items-center gap-6">
            
            {/* Clockwork Gears Graphic with Golden Seal (matching mockup) */}
            <div className="relative w-36 h-36 shrink-0 rounded-2xl overflow-hidden border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] group">
              <img
                src={gearsImg}
                alt="Clockwork Gears Mechanism"
                className="w-full h-full object-cover transition duration-700 group-hover:rotate-12 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-radial from-transparent via-cyan-950/20 to-black/60 pointer-events-none"></div>
              <div className="absolute bottom-1 right-1 left-1 text-center bg-black/70 backdrop-blur-xs py-0.5 rounded text-[9px] font-mono text-cyan-300 font-bold">
                {taskProgressPct}% منجز
              </div>
            </div>

            {/* Multi-Stage Task Milestone Progression Bars (Phases 1, 2, 3, 4) */}
            <div className="flex-1 w-full space-y-3">
              
              {/* Stage 1: التخطيط والجدولة */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_8px_#fbbf24]">
                  1
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 mb-1">
                    <span>التخطيط والجدولة الأسبوعية</span>
                    <span className="font-mono text-amber-300">100%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full w-full"></div>
                  </div>
                </div>
              </div>

              {/* Stage 2: التنفيذ الميداني بالفروع */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_8px_#22d3ee]">
                  2
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 mb-1">
                    <span>التنفيذ الميداني بالفروع</span>
                    <span className="font-mono text-cyan-300">75%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Stage 3: مراجعة الجودة والمطابقة */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-[0_0_8px_#3b82f6]">
                  3
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 mb-1">
                    <span>مراجعة الجودة والمطابقة</span>
                    <span className="font-mono text-blue-300">40%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-2/5"></div>
                  </div>
                </div>
              </div>

              {/* Stage 4: الاعتماد والإغلاق النهائي */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-black flex items-center justify-center shrink-0 border border-slate-600">
                  4
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span>الاعتماد والإغلاق النهائي</span>
                    <span className="font-mono text-slate-400">20%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div className="h-full bg-gradient-to-r from-slate-600 to-slate-400 rounded-full w-1/5"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-cyan-200/70">
            <span>المعدل الإجمالي لإنجاز التكليفات: {taskProgressPct}%</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              جاهزية تشغيلية ممتازة
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
