import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployeeRequest, RequestStatus, RequestType } from '../../types';
import {
  FileText,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Building2,
  AlertCircle,
  X,
  MessageSquare,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';

export const RequestManagement: React.FC = () => {
  const {
    scopedRequests,
    scopedEmployees,
    employees,
    branches,
    shifts,
    createRequest,
    reviewRequest,
    hasPermission,
    currentUser,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | RequestType>('all');

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reqEmployeeId, setReqEmployeeId] = useState<string>('');
  const [reqType, setReqType] = useState<RequestType>('vacation');
  const [reqStartDate, setReqStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqEndDate, setReqEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqExitTime, setReqExitTime] = useState('13:00');
  const [reqDelayMinutes, setReqDelayMinutes] = useState(30);
  const [reqVacationType, setReqVacationType] = useState<'annual' | 'sick' | 'emergency' | 'unpaid'>('annual');
  const [reqTargetBranchId, setReqTargetBranchId] = useState<string>('');
  const [reqTargetShift, setReqTargetShift] = useState<string>('');
  const [reqReason, setReqReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Review Modal
  const [reviewingReq, setReviewingReq] = useState<EmployeeRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  // Auto-select linked employee if current user is an employee
  const openNewRequestModal = () => {
    setModalError(null);
    let initialEmpId = '';
    if (currentUser?.employeeId) {
      initialEmpId = currentUser.employeeId;
    } else if (scopedEmployees.length > 0) {
      initialEmpId = scopedEmployees[0].id;
    }
    setReqEmployeeId(initialEmpId);

    const initialEmp = scopedEmployees.find(e => e.id === initialEmpId) || employees.find(e => e.id === initialEmpId);
    const otherBranch = branches.find(b => b.id !== initialEmp?.branchId && b.isActive);
    setReqTargetBranchId(otherBranch?.id || '');
    setReqTargetShift('');
    setReqType('vacation');
    setReqStartDate(new Date().toISOString().split('T')[0]);
    setReqEndDate(new Date().toISOString().split('T')[0]);
    setReqExitTime('13:00');
    setReqDelayMinutes(30);
    setReqVacationType('annual');
    setReqReason('');
    setIsModalOpen(true);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!reqEmployeeId) {
      setModalError('يرجى تحديد الموظف صاحب الطلب');
      return;
    }

    if (!reqReason.trim()) {
      setModalError('يرجى ذكر سبب أو مبرر الطلب');
      return;
    }

    const selectedEmp = employees.find(e => e.id === reqEmployeeId);

    if (reqType === 'transfer') {
      if (!reqTargetBranchId) {
        setModalError('يرجى اختيار الفرع المراد النقل إليه');
        return;
      }
      if (selectedEmp && reqTargetBranchId === selectedEmp.branchId) {
        setModalError('الفرع المطلوب النقل إليه هو نفس الفرع الحالي للموظف، يرجى اختيار فرع آخر');
        return;
      }
    }

    if (reqType === 'vacation' && reqVacationType === 'annual' && selectedEmp) {
      const start = new Date(reqStartDate);
      const end = new Date(reqEndDate);
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
      if (days > selectedEmp.vacationBalance) {
        setModalError(`رصيد إجازات الموظف (${selectedEmp.vacationBalance} يوم) غير كافٍ للمدة المطلوبة (${days} أيام)`);
        return;
      }
    }

    const res = createRequest({
      employeeId: reqEmployeeId,
      type: reqType,
      startDate: reqStartDate,
      endDate: reqType === 'vacation' || reqType === 'absence' ? reqEndDate : undefined,
      exitTime: reqType === 'early_departure' ? reqExitTime : undefined,
      delayDurationMinutes: reqType === 'delay' ? Number(reqDelayMinutes) : undefined,
      vacationType: reqType === 'vacation' ? reqVacationType : undefined,
      targetBranchId: reqType === 'transfer' ? reqTargetBranchId : undefined,
      targetShift: reqType === 'transfer' && reqTargetShift ? reqTargetShift : undefined,
      effectiveDate: reqType === 'transfer' ? reqStartDate : undefined,
      reasonAr: reqReason.trim(),
    });

    if (!res.success) {
      setModalError(res.error || 'حدث خطأ أثناء رفع الطلب');
      return;
    }

    setIsModalOpen(false);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingReq) return;

    reviewRequest(reviewingReq.id, reviewAction, reviewNotes.trim() || undefined);
    setReviewingReq(null);
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return scopedRequests.filter(req => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (typeFilter !== 'all' && req.type !== typeFilter) return false;
      return true;
    });
  }, [scopedRequests, statusFilter, typeFilter]);

  // Permission to review: System admin, HR, or granted specific approve_transfer_request permission
  const canUserApproveRequest = (req: EmployeeRequest) => {
    if (req.type === 'transfer') {
      if (currentUser?.role === 'system_admin') return true;
      if (currentUser?.role === 'hr_officer' || currentUser?.role === 'hr') return true;
      if (currentUser?.role === 'branches_director') return true;
      if (hasPermission('approve_transfer_request')) return true;
      return false;
    }
    return hasPermission('approve_request');
  };

  const canUserRejectRequest = (req: EmployeeRequest) => {
    if (req.type === 'transfer') {
      if (currentUser?.role === 'system_admin') return true;
      if (currentUser?.role === 'hr_officer' || currentUser?.role === 'hr') return true;
      if (currentUser?.role === 'branches_director') return true;
      if (hasPermission('approve_transfer_request') || hasPermission('reject_request')) return true;
      return false;
    }
    return hasPermission('reject_request');
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800 border border-blue-200">
              الشاشة 6
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              شاشة الطلبات والخدمة الذاتية (Employee Requests)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تقديم ومتابعة طلبات الإجازات، الغياب المبرر، أذونات التأخير، والخروج المبكر، مع دورة اعتماد مؤتمتة تخصم الإجازات تلقائياً.
          </p>
        </div>

        {hasPermission('create_request') && (
          <button
            onClick={openNewRequestModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تقديم طلب جديد</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({scopedRequests.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-100/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة ({scopedRequests.filter(r => r.status === 'pending').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-100/50'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>المقبولة ({scopedRequests.filter(r => r.status === 'approved').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-100/50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>المرفوضة ({scopedRequests.filter(r => r.status === 'rejected').length})</span>
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">نوع الطلب:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-hidden"
          >
            <option value="all">كافة أنواع الطلبات</option>
            <option value="transfer">طلب نقل بين الفروع</option>
            <option value="vacation">طلب إجازة</option>
            <option value="absence">طلب غياب</option>
            <option value="delay">طلب تأخير</option>
            <option value="early_departure">طلب خروج مبكر</option>
          </select>
        </div>

      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-600">لا توجد طلبات مطابقة</p>
            <p className="text-xs text-slate-400 mt-1">يمكنك تقديم طلب جديد عبر الزر أعلاه</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const branch = branches.find(b => b.id === req.branchId);
            const fromBranchName = req.fromBranchNameAr || (branches.find(b => b.id === req.fromBranchId)?.nameAr || branch?.nameAr || req.branchId);
            const targetBranchName = req.targetBranchNameAr || (branches.find(b => b.id === req.targetBranchId)?.nameAr || req.targetBranchId);
            const targetShiftObj = req.targetShift ? shifts.find(s => s.id === req.targetShift) : undefined;

            const typeLabel = {
              vacation: 'طلب إجازة اعتيادية',
              absence: 'طلب غياب مبرر',
              delay: 'طلب إذن تأخير',
              early_departure: 'طلب خروج مبكر',
              transfer: 'طلب نقل بين الفروع',
            }[req.type];

            const typeColor = {
              vacation: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              absence: 'bg-rose-50 text-rose-800 border-rose-200',
              delay: 'bg-amber-50 text-amber-800 border-amber-200',
              early_departure: 'bg-sky-50 text-sky-800 border-sky-200',
              transfer: 'bg-purple-100/90 text-purple-900 border-purple-300 font-extrabold',
            }[req.type];

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  
                  {/* Top: Type Badge & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeColor} flex items-center gap-1`}>
                      {req.type === 'transfer' && <ArrowRightLeft className="w-3 h-3 text-purple-700" />}
                      <span>{typeLabel}</span>
                    </span>

                    {req.status === 'pending' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        قيد الانتظار
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        معتمد ومقبول
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        مرفوض
                      </span>
                    )}
                  </div>

                  {/* Employee info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs">
                      {req.employeeNameAr.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{req.employeeNameAr}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {req.jobId} | {fromBranchName}
                      </div>
                    </div>
                  </div>

                  {/* Specific Details based on request type */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5 mb-3">
                    {req.type === 'transfer' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">الفرع الحالي:</span>
                          <span className="font-bold text-slate-800">{fromBranchName}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 bg-purple-50 px-2 rounded-lg border border-purple-200">
                          <span className="text-purple-800 font-bold flex items-center gap-1">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                            الفرع المنقول إليه:
                          </span>
                          <span className="font-extrabold text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-300">
                            🏢 {targetBranchName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">تاريخ النقل / السريان:</span>
                          <span className="font-mono font-bold text-slate-800">{req.startDate || req.effectiveDate}</span>
                        </div>
                        {req.targetShift && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">الدوام الجديد:</span>
                            <span className="font-bold text-slate-700">{targetShiftObj?.nameAr || req.targetShift}</span>
                          </div>
                        )}
                      </>
                    )}

                    {req.type === 'vacation' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">نوع الإجازة:</span>
                          <span className="font-bold text-slate-800">
                            {req.vacationType === 'annual' && 'سنوية اعتيادية'}
                            {req.vacationType === 'sick' && 'مرضية'}
                            {req.vacationType === 'emergency' && 'طارئة'}
                            {req.vacationType === 'unpaid' && 'بدون راتب'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">الفترة:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {req.startDate} ⬅ {req.endDate}
                          </span>
                        </div>
                      </>
                    )}

                    {req.type === 'absence' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">تاريخ الغياب:</span>
                        <span className="font-mono font-bold text-slate-800">{req.startDate}</span>
                      </div>
                    )}

                    {req.type === 'delay' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">مدة التأخير المطلوبة:</span>
                        <span className="font-mono font-bold text-amber-700">{req.delayDurationMinutes} دقيقة</span>
                      </div>
                    )}

                    {req.type === 'early_departure' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">وقت الخروج المطلوب:</span>
                        <span className="font-mono font-bold text-sky-700">{req.exitTime}</span>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-slate-200">
                      <span className="text-[11px] text-slate-400 block mb-0.5">سبب ومبرر الطلب:</span>
                      <p className="text-slate-700 text-xs leading-relaxed">{req.reasonAr}</p>
                    </div>
                  </div>

                  {/* Review Audit info if reviewed */}
                  {req.reviewDate && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 mb-3">
                      <div className="font-bold text-slate-800">
                        {req.status === 'approved' ? 'اعتمد بواسطة:' : 'رُفض بواسطة:'} {req.reviewedByName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{req.reviewDate}</div>
                      {req.reviewNotesAr && (
                        <div className="mt-1 text-slate-700 italic">"{req.reviewNotesAr}"</div>
                      )}
                    </div>
                  )}

                </div>

                {/* Bottom: Submission date & Review action buttons for Managers/HR */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    تاريخ الرفع: {req.submissionDate}
                  </span>

                  {req.status === 'pending' && (
                    canUserApproveRequest(req) || canUserRejectRequest(req) ? (
                      <div className="flex items-center gap-1.5">
                        {canUserRejectRequest(req) && (
                          <button
                            onClick={() => {
                              setReviewingReq(req);
                              setReviewAction('rejected');
                              setReviewNotes('');
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            رفض
                          </button>
                        )}
                        {canUserApproveRequest(req) && (
                          <button
                            onClick={() => {
                              setReviewingReq(req);
                              setReviewAction('approved');
                              setReviewNotes('');
                            }}
                            className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>اعتماد</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      req.type === 'transfer' ? (
                        <span className="text-[10px] text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-600" />
                          بانتظار موافقة مدير النظام أو الموارد البشرية أو مسؤول مخول
                        </span>
                      ) : null
                    )
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">تقديم طلب داخلي جديد</h3>
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-4 text-xs">
              
              {/* Employee selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف صاحب الطلب *</label>
                <select
                  value={reqEmployeeId}
                  onChange={(e) => setReqEmployeeId(e.target.value)}
                  disabled={currentUser?.role === 'employee'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  {scopedEmployees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nameAr} ({e.jobId}) - رصيد الإجازات: {e.vacationBalance} يوم
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الطلب *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'vacation', label: 'طلب إجازة (Leave)' },
                    { id: 'absence', label: 'طلب غياب (Absence)' },
                    { id: 'delay', label: 'طلب تأخير (Delay)' },
                    { id: 'early_departure', label: 'خروج مبكر (Early)' },
                    { id: 'transfer', label: 'نقل بين الفروع (Transfer)' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setReqType(t.id as RequestType)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        reqType === t.id
                          ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific fields based on type */}
              {reqType === 'transfer' && (
                <div className="space-y-3 bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80">
                  <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold">الفرع الحالي للموظف:</span>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      🏢 {branches.find(b => b.id === (employees.find(e => e.id === reqEmployeeId)?.branchId))?.nameAr || 'فرع الموظف الحالي'}
                    </span>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-900 mb-1.5">الفرع المطلوب النقل إليه *</label>
                    <select
                      value={reqTargetBranchId}
                      onChange={(e) => setReqTargetBranchId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-purple-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-purple-500/20 shadow-xs outline-hidden transition"
                    >
                      <option value="" className="text-slate-500 bg-white">-- اختر الفرع المراد النقل إليه --</option>
                      {branches
                        .filter(b => b.id !== (employees.find(e => e.id === reqEmployeeId)?.branchId))
                        .map(b => (
                          <option key={b.id} value={b.id} className="text-slate-900 bg-white font-medium">
                            🏢 {b.nameAr} ({b.cityAr})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ النقل / سريان النقل *</label>
                      <input
                        type="date"
                        required
                        value={reqStartDate}
                        onChange={(e) => setReqStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-purple-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-purple-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">الدوام بالفرع الجديد (اختياري)</label>
                      <select
                        value={reqTargetShift}
                        onChange={(e) => setReqTargetShift(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-purple-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-purple-500/20 shadow-xs outline-hidden transition"
                      >
                        <option value="" className="text-slate-900 bg-white font-medium">نفس دوامه الحالي دون تعديل</option>
                        {shifts.map(s => (
                          <option key={s.id} value={s.id} className="text-slate-900 bg-white font-medium">
                            {s.nameAr} ({s.startTime} - {s.endTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 bg-purple-100/80 border border-purple-200 rounded-xl text-[11px] text-purple-950 leading-relaxed font-medium">
                    🛡️ <strong>دورة الاعتماد:</strong> يتطلب هذا الطلب موافقة <strong>مدير النظام</strong>، <strong>الموارد البشرية</strong>، أو أي مسؤول مخول بصلاحية اعتماد طلبات النقل. عند القبول، يتم نقل الموظف وتحديث فرعه وسجلاته تلقائياً.
                  </div>
                </div>
              )}

              {reqType === 'vacation' && (
                <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/60">
                  <div>
                    <label className="block font-extrabold text-slate-900 mb-1.5">نوع الإجازة</label>
                    <select
                      value={reqVacationType}
                      onChange={(e) => setReqVacationType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                    >
                      <option value="annual" className="text-slate-900 bg-white">إجازة سنوية اعتيادية (تُخصم من الرصيد)</option>
                      <option value="sick" className="text-slate-900 bg-white">إجازة مرضية (بتقرير طبي)</option>
                      <option value="emergency" className="text-slate-900 bg-white">إجازة طارئة</option>
                      <option value="unpaid" className="text-slate-900 bg-white">إجازة بدون راتب</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ البداية</label>
                      <input
                        type="date"
                        required
                        value={reqStartDate}
                        onChange={(e) => setReqStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ النهاية</label>
                      <input
                        type="date"
                        required
                        value={reqEndDate}
                        onChange={(e) => setReqEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {reqType === 'absence' && (
                <div className="space-y-3 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">من تاريخ</label>
                      <input
                        type="date"
                        required
                        value={reqStartDate}
                        onChange={(e) => setReqStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">إلى تاريخ</label>
                      <input
                        type="date"
                        required
                        value={reqEndDate}
                        onChange={(e) => setReqEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {reqType === 'delay' && (
                <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ التأخير</label>
                      <input
                        type="date"
                        required
                        value={reqStartDate}
                        onChange={(e) => setReqStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">مدة التأخير المطلوبة</label>
                      <select
                        value={reqDelayMinutes}
                        onChange={(e) => setReqDelayMinutes(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      >
                        <option value={15} className="text-slate-900 bg-white">15 دقيقة</option>
                        <option value={30} className="text-slate-900 bg-white">30 دقيقة</option>
                        <option value={45} className="text-slate-900 bg-white">45 دقيقة</option>
                        <option value={60} className="text-slate-900 bg-white">ساعة واحدة (60 دقيقة)</option>
                        <option value={120} className="text-slate-900 bg-white">ساعتان (120 دقيقة)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {reqType === 'early_departure' && (
                <div className="space-y-3 bg-sky-50/50 p-3.5 rounded-2xl border border-sky-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ الخروج</label>
                      <input
                        type="date"
                        required
                        value={reqStartDate}
                        onChange={(e) => setReqStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">وقت الخروج المطلوب</label>
                      <input
                        type="time"
                        required
                        value={reqExitTime}
                        onChange={(e) => setReqExitTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">سبب أو مبرر الطلب *</label>
                <textarea
                  rows={2}
                  required
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="يرجى توضيح السبب بدقة..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  إرسال الطلب
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setReviewingReq(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">
                {reviewAction === 'approved' ? 'الموافقة واعتماد الطلب' : 'رفض الطلب'}
              </h3>
            </div>

            <div className="py-3 text-xs text-slate-600">
              <div className="font-bold text-slate-900 text-sm mb-1">{reviewingReq.employeeNameAr}</div>
              <p className="text-slate-500 mb-3">{reviewingReq.reasonAr}</p>

              {reviewAction === 'approved' && reviewingReq.type === 'transfer' && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-[11px] mb-3 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>تأكيد اعتماد النقل الإداري:</span>
                  </div>
                  <p className="leading-relaxed">
                    سيتم فوراً نقل الموظف رسمياً من <strong>{reviewingReq.fromBranchNameAr || 'فرعه السابق'}</strong> إلى <strong>{reviewingReq.targetBranchNameAr || 'الفرع الجديد'}</strong> وتحديث فرعه وسجلاته في كافة أنحاء النظام.
                  </p>
                </div>
              )}

              {reviewAction === 'approved' && reviewingReq.type === 'vacation' && reviewingReq.vacationType === 'annual' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] mb-3">
                  <strong>تنبيه النظام:</strong> سيتم خصم أيام الإجازة تلقائياً من رصيد الموظف السنوي فور التأكيد.
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الاعتماد / الرفض</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="ملاحظات توجيهية للموظف..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingReq(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs ${
                    reviewAction === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewAction === 'approved' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
