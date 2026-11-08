import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, WeeklyEvaluationRating } from '../../types';
import {
  Building2,
  Calendar,
  Users,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  Award,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  FileDown,
  Loader2,
  ArrowRightLeft,
  ShieldCheck,
  Sparkles,
  Search,
  Check,
  X,
  MessageSquare,
  Lock,
  UserCheck,
} from 'lucide-react';
import { exportWeeklyBranchReportToExcel } from '../../utils/exportImport';
import { exportElementToPdf } from '../../utils/pdfExport';

// Helper to compute ISO week string: "YYYY-Www"
const getIsoWeekString = (date: Date): { yearWeek: string; startFormatted: string; endFormatted: string; weekNum: number; year: number } => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();

  // Compute start of week (Saturday in Libyan work culture)
  const curr = new Date(date);
  const currentDay = curr.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const diffToSaturday = (currentDay + 1) % 7;
  const saturday = new Date(curr);
  saturday.setDate(curr.getDate() - diffToSaturday);

  const thursday = new Date(saturday);
  thursday.setDate(saturday.getDate() + 5);

  const startFormatted = saturday.toISOString().split('T')[0];
  const endFormatted = thursday.toISOString().split('T')[0];

  return {
    yearWeek: `${year}-W${weekNo < 10 ? '0' : ''}${weekNo}`,
    weekNum: weekNo,
    year,
    startFormatted,
    endFormatted,
  };
};

export const WeeklyBranchReport: React.FC = () => {
  const {
    currentUser,
    branches,
    employees,
    employmentStatuses,
    shifts,
    requests,
    weeklyReports,
    updateEmployee,
    approveWeeklyReport,
    updateWeeklyEvaluation,
    unapproveWeeklyReport,
    hasPermission,
    userAssignedBranches,
    isGlobalUser,
  } = useApp();

  // Date & Week State (defaults to current date/week)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const currentWeekInfo = useMemo(() => getIsoWeekString(selectedDate), [selectedDate]);

  // Available branches according to RBAC
  const availableBranches = useMemo(() => {
    if (isGlobalUser) return branches.filter((b) => b.isActive);
    return userAssignedBranches.length > 0 ? userAssignedBranches : branches.filter((b) => b.isActive);
  }, [branches, userAssignedBranches, isGlobalUser]);

  // Selected branch: default to user's branch or first available
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (availableBranches.length > 0) return availableBranches[0].id;
    return 'b-jaraba';
  });

  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId) || availableBranches[0] || branches[0];
  }, [branches, selectedBranchId, availableBranches]);

  // Modals state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftTargetEmployeeId, setShiftTargetEmployeeId] = useState<string>('');
  const [shiftNewValue, setShiftNewValue] = useState<string>('morning');

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const [evaluationModalEmp, setEvaluationModalEmp] = useState<Employee | null>(null);
  const [evalRating, setEvalRating] = useState<WeeklyEvaluationRating>('excellent');
  const [evalNote, setEvalNote] = useState('');

  // PDF Export Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Weekly report record for current branch and week
  const reportRecord = useMemo(() => {
    return weeklyReports.find(
      (r) => r.branchId === activeBranch?.id && r.yearWeek === currentWeekInfo.yearWeek
    );
  }, [weeklyReports, activeBranch?.id, currentWeekInfo.yearWeek]);

  // Branch Employees
  const branchEmployees = useMemo(() => {
    if (!activeBranch) return [];
    return employees.filter((e) => e.branchId === activeBranch.id);
  }, [employees, activeBranch]);

  // Group Employees into 3 Shifts (Morning, Evening, Full Time)
  const morningEmployees = useMemo(() => {
    return branchEmployees.filter((e) => e.shift === 'morning');
  }, [branchEmployees]);

  const eveningEmployees = useMemo(() => {
    return branchEmployees.filter((e) => e.shift === 'evening');
  }, [branchEmployees]);

  const fullTimeEmployees = useMemo(() => {
    return branchEmployees.filter((e) => e.shift === 'full_time' || (e.shift !== 'morning' && e.shift !== 'evening'));
  }, [branchEmployees]);

  // Map of employees on approved leave during this week
  const employeeLeaveMap = useMemo(() => {
    const map = new Map<string, string>();
    const weekStart = new Date(currentWeekInfo.startFormatted);
    const weekEnd = new Date(currentWeekInfo.endFormatted);

    requests.forEach((req) => {
      if (req.status === 'approved' && req.type === 'vacation' && req.startDate) {
        const reqStart = new Date(req.startDate);
        const reqEnd = req.endDate ? new Date(req.endDate) : reqStart;
        if (reqStart <= weekEnd && reqEnd >= weekStart) {
          map.set(req.employeeId, 'في إجازة معتمدة');
        }
      }
    });
    return map;
  }, [requests, currentWeekInfo]);

  // Counts
  const totalEmployeesCount = branchEmployees.length;
  const morningCount = morningEmployees.length;
  const eveningCount = eveningEmployees.length;
  const fullTimeCount = fullTimeEmployees.length;
  const onLeaveCount = branchEmployees.filter((e) => employeeLeaveMap.has(e.id)).length;
  const onDutyCount = Math.max(0, totalEmployeesCount - onLeaveCount);

  // Permissions
  const isBranchManager =
    currentUser?.role === 'branch_manager' &&
    (currentUser.assignedBranchIds.includes(activeBranch?.id) || currentUser.assignedBranchIds.includes('*'));

  const canApprove =
    currentUser?.role === 'system_admin' ||
    currentUser?.role === 'branches_director' ||
    currentUser?.role === 'hr_officer' ||
    currentUser?.role === 'hr' ||
    isBranchManager ||
    hasPermission('approve_weekly_report');

  const canEvaluate =
    canApprove ||
    currentUser?.role === 'supervisor' ||
    currentUser?.role === 'supervisor_auditor';

  // Navigate weeks
  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    setSelectedDate(next);
  };

  const handleCurrentWeek = () => {
    setSelectedDate(new Date());
  };

  // Open shift modal
  const openShiftChangeModal = (empId?: string) => {
    const targetId = empId || (branchEmployees[0]?.id || '');
    setShiftTargetEmployeeId(targetId);
    const emp = employees.find((e) => e.id === targetId);
    setShiftNewValue(emp?.shift || 'morning');
    setIsShiftModalOpen(true);
  };

  const handleSaveShiftModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftTargetEmployeeId) return;
    const emp = employees.find((e) => e.id === shiftTargetEmployeeId);
    if (!emp) return;

    updateEmployee(emp.id, { shift: shiftNewValue });
    setIsShiftModalOpen(false);
    const label = shiftNewValue === 'morning' ? 'صباحي' : shiftNewValue === 'evening' ? 'مسائي' : 'دوام كامل';
    showToast(`تم تغيير وردية ${emp.nameAr} إلى ${label} بنجاح`);
  };

  // Open Evaluation Modal
  const openEvaluationModal = (emp: Employee) => {
    if (!canEvaluate) return;
    setEvaluationModalEmp(emp);
    const existing = reportRecord?.evaluations?.[emp.id];
    setEvalRating(existing?.rating || 'excellent');
    setEvalNote(existing?.note || '');
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluationModalEmp || !activeBranch) return;

    updateWeeklyEvaluation(
      activeBranch.id,
      currentWeekInfo.yearWeek,
      evaluationModalEmp.id,
      evalRating,
      evalNote.trim() || undefined
    );

    setEvaluationModalEmp(null);
    showToast(`تم حفظ تقييم الموظف ${evaluationModalEmp.nameAr} للأسبوع ${currentWeekInfo.yearWeek}`);
  };

  // Approve Report
  const handleOpenApproveModal = () => {
    if (!canApprove) return;
    setApprovalNotes(reportRecord?.approvalNotesAr || '');
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranch) return;

    approveWeeklyReport({
      branchId: activeBranch.id,
      branchNameAr: activeBranch.nameAr,
      yearWeek: currentWeekInfo.yearWeek,
      weekStartDate: currentWeekInfo.startFormatted,
      weekEndDate: currentWeekInfo.endFormatted,
      approvalNotesAr: approvalNotes.trim() || undefined,
    });

    setIsApprovalModalOpen(false);
    showToast(`تم اعتماد وتوثيق التقرير الأسبوعي لـ (${activeBranch.nameAr}) بنجاح`);
  };

  // Unapprove Report
  const handleUnapprove = () => {
    if (!reportRecord || !canApprove) return;
    if (confirm('هل أنت متأكد من إلغاء اعتماد التقرير لهذا الأسبوع وإعادته لوضع المراجعة؟')) {
      unapproveWeeklyReport(reportRecord.id);
      showToast('تم إلغاء اعتماد التقرير وإعادته لحالة المراجعة');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!activeBranch) return;
    exportWeeklyBranchReportToExcel(
      activeBranch,
      branchEmployees,
      employmentStatuses,
      shifts,
      employeeLeaveMap,
      reportRecord
    );
    showToast('تم تصدير كشف التقرير الأسبوعي إلى Excel بنجاح');
  };

  // Isolated A4 Print
  const handlePrint = () => {
    document.body.classList.add('printing-weekly-report');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-weekly-report');
      }, 500);
    }, 200);
  };

  // Export to PDF
  const handleExportPdf = async () => {
    if (!activeBranch) return;
    setIsGeneratingPdf(true);
    showToast('جاري إنشاء وتنسيق ملف PDF للتقرير الأسبوعي على ورقة A4...');

    try {
      const success = await exportElementToPdf('norseen-weekly-report-container', {
        branchName: activeBranch.nameAr,
        weekStr: currentWeekInfo.yearWeek,
        reportTitle: `التقرير الأسبوعي - فرع ${activeBranch.nameAr}`,
        backgroundColor: '#ffffff',
      });

      if (success) {
        showToast('تم تصدير التقرير الأسبوعي بصيغة PDF بنجاح 📄');
      } else {
        showToast('جاري فتح نافذة الطباعة والحفظ كـ PDF...');
        handlePrint();
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('جاري فتح نافذة الطباعة والحفظ كـ PDF...');
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Rating labels helper
  const evaluationLabels: Record<WeeklyEvaluationRating, { label: string; colorClass: string }> = {
    excellent: { label: 'ممتاز', colorClass: 'text-emerald-800 bg-emerald-100 border-emerald-400' },
    very_good: { label: 'جيد جداً', colorClass: 'text-cyan-800 bg-cyan-100 border-cyan-400' },
    good: { label: 'جيد', colorClass: 'text-blue-800 bg-blue-100 border-blue-400' },
    needs_improvement: { label: 'يحتاج تحسين', colorClass: 'text-amber-800 bg-amber-100 border-amber-400' },
  };

  // Render Section Table for a Shift (Matching /public/assets/aistudio/159_64e2fb03.jpg)
  const renderShiftSection = (
    shiftTitle: string,
    totalLabel: string,
    empList: Employee[],
    minRows = 3
  ) => {
    const rowsCount = Math.max(empList.length, minRows);
    const rows = Array.from({ length: rowsCount }, (_, i) => empList[i] || null);

    return (
      <div className="w-full border-2 border-[#1b4571] overflow-hidden select-none mb-4 last:mb-0">
        {/* Section Header Bar (Dark Blue #1b4571, White Bold Text) */}
        <div className="grid grid-cols-2 bg-[#1b4571] text-white border-b-2 border-[#1b4571] font-bold text-sm sm:text-base">
          <div className="p-2.5 text-center border-l-2 border-[#ffffff]/30 font-black tracking-wide">
            {shiftTitle}
          </div>
          <div className="p-2.5 text-center font-black tracking-wide">
            {totalLabel}: {empList.length}
          </div>
        </div>

        {/* Column Headers (Dark Blue #1b4571, White Text) */}
        <div className="grid grid-cols-12 bg-[#1b4571] text-white border-b-2 border-[#1b4571] text-center font-black text-xs sm:text-sm">
          <div className="col-span-1 p-2 border-l-2 border-[#ffffff]/30">ترتيب</div>
          <div className="col-span-4 p-2 border-l-2 border-[#ffffff]/30">الاسم</div>
          <div className="col-span-3 p-2 border-l-2 border-[#ffffff]/30">الرقم الوظيفي</div>
          <div className="col-span-2 p-2 border-l-2 border-[#ffffff]/30">الصفه</div>
          <div className="col-span-2 p-2">التقيم</div>
        </div>

        {/* Data Rows (Light Ice Blue #dbe8f6, Dark Blue #1b4571 Grid Lines) */}
        <div className="divide-y-2 divide-[#1b4571] text-xs font-bold bg-[#dbe8f6] text-[#0f2844]">
          {rows.map((emp, idx) => {
            if (!emp) {
              // Empty placeholder row to match the visual ledger layout
              return (
                <div key={`empty-${shiftTitle}-${idx}`} className="grid grid-cols-12 items-center min-h-[36px] bg-[#dbe8f6]">
                  <div className="col-span-1 p-2 text-center font-mono border-l-2 border-[#1b4571]">
                    {idx + 1}
                  </div>
                  <div className="col-span-4 p-2 border-l-2 border-[#1b4571] text-slate-400">
                    —
                  </div>
                  <div className="col-span-3 p-2 text-center font-mono border-l-2 border-[#1b4571] text-slate-400">
                    —
                  </div>
                  <div className="col-span-2 p-2 text-center border-l-2 border-[#1b4571] text-slate-400">
                    —
                  </div>
                  <div className="col-span-2 p-2 text-center text-slate-400">
                    —
                  </div>
                </div>
              );
            }

            const statusObj = employmentStatuses.find((s) => s.id === emp.statusId);
            const roleNameAr = statusObj?.nameAr || emp.statusId;
            const evalRecord = reportRecord?.evaluations?.[emp.id];
            const evalInfo = evalRecord ? evaluationLabels[evalRecord.rating] : null;

            return (
              <div
                key={emp.id}
                className="grid grid-cols-12 items-center min-h-[38px] bg-[#dbe8f6] hover:bg-[#c9ddf2] transition-colors"
              >
                {/* 1. Index (ترتيب) */}
                <div className="col-span-1 p-2 text-center font-mono font-black border-l-2 border-[#1b4571]">
                  {idx + 1}
                </div>

                {/* 2. Employee Name (الاسم) */}
                <div className="col-span-4 p-2 text-right font-black border-l-2 border-[#1b4571] text-sm">
                  {emp.nameAr}
                </div>

                {/* 3. Job ID (الرقم الوظيفي) */}
                <div className="col-span-3 p-2 text-center font-mono font-black border-l-2 border-[#1b4571] tracking-wider">
                  {emp.jobId}
                </div>

                {/* 4. Designation / Role (الصفه) */}
                <div className="col-span-2 p-2 text-center font-bold border-l-2 border-[#1b4571] truncate">
                  {roleNameAr}
                </div>

                {/* 5. Weekly Evaluation (التقيم) */}
                <div className="col-span-2 p-1.5 text-center">
                  {canEvaluate ? (
                    <button
                      onClick={() => openEvaluationModal(emp)}
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-black cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xs ${
                        evalInfo
                          ? evalInfo.colorClass
                          : 'bg-white/80 text-slate-700 border-dashed border-[#1b4571]/40 hover:bg-white'
                      }`}
                      title="انقر لتعديل التقييم الأسبوعي"
                    >
                      {evalInfo ? evalInfo.label : 'تقييم +'}
                    </button>
                  ) : (
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-black ${
                        evalInfo ? evalInfo.colorClass : 'text-slate-500'
                      }`}
                    >
                      {evalInfo ? evalInfo.label : '—'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-right select-none font-sans animate-fadeIn">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 text-emerald-200 border border-emerald-400/50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Interactive Control Toolbar (No-Print) */}
      <div className="no-print bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-5 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>التقرير الأسبوعي للفروع</span>
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold border border-white/10">
              {currentWeekInfo.yearWeek}
            </span>
            {reportRecord?.isApproved ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>معتمد رسمياً</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/40">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>بانتظار الاعتماد</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5">
            كشف التقرير الأسبوعي للفرع وتوزيع الورديات (A4)
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            تعبئة تلقائية لكوادر الفرع مقسمة إلى الفترة الصباحية، الفترة المسائية، ودوام كامل وفق النموذج الرسمي المعتمد.
          </p>
        </div>

        {/* Controls: Branch Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 rounded-2xl border border-cyan-500/30">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-950 text-white font-medium">
                  {b.nameAr} ({b.cityAr})
                </option>
              ))}
            </select>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-gradient-to-r from-rose-950 to-red-950 hover:from-rose-900 hover:to-red-900 text-rose-200 border border-rose-500/40 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            title="تصدير كشف التقرير بصيغة PDF على ورقة A4"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 text-rose-300 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 text-rose-300" />
            )}
            <span>تصدير PDF (A4)</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-2xl text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
            title="طباعة التقرير فورياً على ورقة A4"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة فورية</span>
          </button>

          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-2xl border border-emerald-500/30 text-xs font-bold transition"
            title="تصدير إكسل"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Shift Switcher Action */}
          <button
            onClick={() => openShiftChangeModal()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-2xl border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1"
            title="تغيير وردية موظف"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>تغيير الوردية</span>
          </button>

          {/* Approve Report Button */}
          {reportRecord?.isApproved ? (
            <div className="flex items-center gap-1">
              <span className="px-3 py-2 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-black text-xs inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>معتمد</span>
              </span>
              {canApprove && (
                <button
                  onClick={handleUnapprove}
                  className="p-2 rounded-2xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 text-xs"
                  title="إلغاء الاعتماد"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            canApprove && (
              <button
                onClick={handleOpenApproveModal}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>اعتماد التقرير</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. Week Navigation Sub-Bar (No-Print) */}
      <div className="no-print bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">الفترة الزمنية للتقرير:</span>
          <div className="bg-slate-950 border border-cyan-500/30 px-3 py-1 rounded-xl font-mono text-cyan-300 font-bold">
            {currentWeekInfo.startFormatted} ⬅ {currentWeekInfo.endFormatted} ({currentWeekInfo.yearWeek})
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition"
            title="الأسبوع السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleCurrentWeek}
            className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold"
          >
            الأسبوع الحالي
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition"
            title="الأسبوع التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          NORSEEN OFFICIAL WEEKLY REPORT A4 SHEET (Exact match to 159_64e2fb03.jpg)
          ===================================================================== */}
      <div className="flex justify-center">
        <div
          id="norseen-weekly-report-container"
          className="w-full max-w-[840px] bg-white text-slate-900 p-4 sm:p-6 shadow-2xl rounded-none border border-slate-300 select-none print:m-0 print:p-4 print:w-full print:border-none print:shadow-none"
          dir="rtl"
        >
          {/* Main Top Header Bar (Matching /public/assets/aistudio/159_64e2fb03.jpg) */}
          <div className="grid grid-cols-2 bg-[#1b4571] text-white border-2 border-[#1b4571] font-black text-base sm:text-lg mb-4">
            {/* Right: التقرير الأسبوعي */}
            <div className="p-3 text-center border-l-2 border-[#ffffff]/30 flex flex-col items-center justify-center">
              <span>التقرير الأسبوعي</span>
              <span className="text-[11px] font-mono text-cyan-200 font-bold mt-0.5">
                {currentWeekInfo.yearWeek} ({currentWeekInfo.startFormatted} إلى {currentWeekInfo.endFormatted})
              </span>
            </div>

            {/* Left: اسم الفرع */}
            <div className="p-3 text-center flex flex-col items-center justify-center">
              <span>اسم الفرع: {activeBranch?.nameAr}</span>
              <span className="text-[11px] text-cyan-200 font-bold mt-0.5">
                مدينة: {activeBranch?.cityAr} {activeBranch?.managerName ? `• مدير الفرع: ${activeBranch.managerName}` : ''}
              </span>
            </div>
          </div>

          {/* Section 1: الفتره الصباحية (Morning Shift) */}
          {renderShiftSection(
            'الفتره الصباحية',
            'اجمالي الموضفين التفرة الصباحية',
            morningEmployees,
            3
          )}

          {/* Section 2: الفتره المسائية (Evening Shift) */}
          {renderShiftSection(
            'الفتره المسائية',
            'اجمالي الموضفين التفرة المسائية',
            eveningEmployees,
            4
          )}

          {/* Section 3: دوام كامل (Full Time Shift) */}
          {renderShiftSection(
            'دوام كامل',
            'اجمالي الموضفين التفرة دوام كامل',
            fullTimeEmployees,
            6
          )}

          {/* Official A4 Footer & Approval Stamp Line */}
          <div className="mt-4 pt-3 border-t-2 border-[#1b4571] text-xs text-[#0f2844] flex flex-col sm:flex-row items-center justify-between gap-3 font-bold">
            <div>
              <span>إجمالي كوادر الفرع: </span>
              <strong className="font-mono text-sm text-[#1b4571]">{totalEmployeesCount} موظف</strong>
              <span className="mx-2 text-slate-400">|</span>
              <span>على رأس العمل: </span>
              <strong className="text-emerald-700">{onDutyCount}</strong>
              {onLeaveCount > 0 && (
                <>
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="text-amber-800">إجازات: {onLeaveCount}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-center">
              <div>
                <span className="block text-[10px] text-slate-500">اعتماد مدير الفرع:</span>
                <span className="font-bold underline text-[#1b4571]">
                  {activeBranch?.managerName || reportRecord?.approvedByNameAr || 'إدارة الفرع'}
                </span>
              </div>
              {reportRecord?.isApproved && (
                <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-600 rounded text-emerald-800 text-[10px] font-mono">
                  {reportRecord.digitalStampCode || 'NORSEEN-VERIFIED'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Shift Change Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#071924] border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <span>تغيير وردية دوام الموظف</span>
              </h3>
            </div>

            <form onSubmit={handleSaveShiftModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">اختر الموظف *</label>
                <select
                  value={shiftTargetEmployeeId}
                  onChange={(e) => {
                    setShiftTargetEmployeeId(e.target.value);
                    const emp = employees.find((x) => x.id === e.target.value);
                    if (emp) setShiftNewValue(emp.shift);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl font-bold text-xs text-white"
                >
                  {branchEmployees.map((e) => (
                    <option key={e.id} value={e.id} className="bg-slate-950 text-white">
                      {e.nameAr} ({e.jobId}) - حالياً:{' '}
                      {e.shift === 'morning' ? 'صباحي ☀️' : e.shift === 'evening' ? 'مسائي 🌙' : 'دوام كامل'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">الوردية الجديدة *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftNewValue('morning')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      shiftNewValue === 'morning'
                        ? 'bg-amber-950 text-amber-200 border-amber-400 shadow-md'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>صباحي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftNewValue('evening')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      shiftNewValue === 'evening'
                        ? 'bg-purple-950 text-purple-200 border-purple-400 shadow-md'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-purple-400" />
                    <span>مسائي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftNewValue('full_time')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      shiftNewValue === 'full_time'
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-md'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>دوام كامل</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-xl shadow-md transition"
                >
                  حفظ تغيير الوردية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Approve Report Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#071924] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>اعتماد التقرير الأسبوعي رسمياً</span>
              </h3>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-[11px] leading-relaxed text-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-300">ملخص التقرير المعتمد:</div>
                <div>الفرع: <strong>{activeBranch?.nameAr}</strong></div>
                <div>الفترة: <strong>{currentWeekInfo.startFormatted} ⬅ {currentWeekInfo.endFormatted} ({currentWeekInfo.yearWeek})</strong></div>
                <div>
                  إجمالي الموظفين: <strong>{totalEmployeesCount} موظف ({morningCount} صباحي / {eveningCount} مسائي / {fullTimeCount} دوام كامل)</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  ملاحظات وتوجيهات مدير الفرع (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="اكتب أي ملاحظات تتعلق بأداء الأسبوع، الانضباط في الورديات، أو التوصيات للإدارة العليا..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl text-xs text-white placeholder:text-slate-500 outline-hidden transition"
                />
              </div>

              <div className="p-2.5 bg-slate-900/70 border border-white/10 rounded-xl text-[11px] text-slate-400">
                🔒 سيتم وضع الختم الرقمي باسم <strong className="text-white">{currentUser?.fullNameAr}</strong> ({currentUser?.role}) وتسجيل الاعتماد في سجلات النظام وسحابة نورسين.
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-black text-white rounded-xl shadow-lg transition"
                >
                  تأكيد الاعتماد والختم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Performance Evaluation Modal */}
      {evaluationModalEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#071924] border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                onClick={() => setEvaluationModalEmp(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>التقييم الأسبوعي للموظف</span>
              </h3>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-white/10">
                <div className="font-bold text-white text-sm">{evaluationModalEmp.nameAr}</div>
                <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                  {evaluationModalEmp.jobId} • {activeBranch?.nameAr}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-2">
                  درجة التقييم للأسبوع {currentWeekInfo.yearWeek} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['excellent', 'very_good', 'good', 'needs_improvement'] as WeeklyEvaluationRating[]).map((rating) => {
                    const cfg = evaluationLabels[rating];
                    const isSelected = evalRating === rating;
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setEvalRating(rating)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-md ring-2 ring-cyan-500/30'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">ملاحظات التقييم</label>
                <textarea
                  rows={2}
                  value={evalNote}
                  onChange={(e) => setEvalNote(e.target.value)}
                  placeholder="ملاحظات حول الإنتاجية، الالتزام بمواعيد الوردية، أو المبادرة..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder:text-slate-500 outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEvaluationModalEmp(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-xl shadow-md transition"
                >
                  حفظ التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
