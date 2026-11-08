import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmploymentStatusType, WorkShiftType } from '../../types';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  Calendar,
  Briefcase,
  Hash,
  Shield,
  Phone,
  Mail,
  FileText,
  KeyRound,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import {
  exportEmployeesToExcel,
  downloadEmployeeImportTemplate,
  parseEmployeeExcelFile,
} from '../../utils/exportImport';

export const EmployeeRegistry: React.FC = () => {
  const {
    scopedEmployees,
    branches,
    shifts,
    employmentStatuses,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
    hasPermission,
    canAccessBranch,
    userAssignedBranches,
    isGlobalUser,
    users,
    syncAllToCloud,
    isSyncing,
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formJobId, setFormJobId] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formBirthYear, setFormBirthYear] = useState<number | ''>('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formVacationBalance, setFormVacationBalance] = useState<number>(21);
  const [formBranchId, setFormBranchId] = useState(branches[0]?.id || 'b-jaraba');
  const [formShift, setFormShift] = useState<WorkShiftType | string>('morning');
  const [formStatusId, setFormStatusId] = useState<EmploymentStatusType>('sales_agent');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Operator Account synchronization options
  const [formCreateOperator, setFormCreateOperator] = useState<boolean>(true);
  const [formOperatorUsername, setFormOperatorUsername] = useState<string>('');
  const [formOperatorPassword, setFormOperatorPassword] = useState<string>('123456');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ addedCount: number; updatedCount: number; errors: string[] } | null>(null);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return scopedEmployees.filter(emp => {
      // Search
      const search = searchTerm.trim().toLowerCase();
      if (search) {
        const matchName = emp.nameAr.toLowerCase().includes(search);
        const matchJob = emp.jobId.toLowerCase().includes(search);
        const matchNat = emp.nationalId.includes(search);
        const matchPhone = emp.phone?.includes(search);
        if (!matchName && !matchJob && !matchNat && !matchPhone) return false;
      }

      // Branch filter
      if (branchFilter !== 'all' && emp.branchId !== branchFilter) return false;

      // Shift filter
      if (shiftFilter !== 'all' && emp.shift !== shiftFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && emp.statusId !== statusFilter) return false;

      return true;
    });
  }, [scopedEmployees, searchTerm, branchFilter, shiftFilter, statusFilter]);

  const openAddModal = () => {
    setFormError(null);
    setFormName('');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newJobId = `NRS-${randomNum}`;
    setFormJobId(newJobId);
    setFormNationalId('');
    setFormBirthYear('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormVacationBalance(21);
    setFormBranchId(userAssignedBranches[0]?.id || branches[0]?.id || 'b-jaraba');
    setFormShift('morning');
    setFormStatusId('sales_agent');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
    setFormCreateOperator(true);
    setFormOperatorUsername(`nrs.${randomNum}`);
    setFormOperatorPassword('123456');
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setFormError(null);
    setEditingEmployee(emp);
    setFormName(emp.nameAr);
    setFormJobId(emp.jobId);
    setFormNationalId(emp.nationalId);
    setFormBirthYear(emp.birthYear || '');
    setFormStartDate(emp.startDate);
    setFormVacationBalance(emp.vacationBalance);
    setFormBranchId(emp.branchId);
    setFormShift(emp.shift);
    setFormStatusId(emp.statusId);
    setFormPhone(emp.phone || '');
    setFormEmail(emp.email || '');
    setFormNotes(emp.notes || '');
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formJobId.trim() || !formNationalId.trim()) {
      setFormError('يرجى ملء جميع الحقول الإلزامية (الاسم، الرقم الوظيفي، الرقم الوطني)');
      return;
    }

    if (formNationalId.trim().length < 6) {
      setFormError('الرقم الوطني يجب ألا يقل عن 6 أرقام');
      return;
    }

    if (editingEmployee) {
      const res = updateEmployee(editingEmployee.id, {
        nameAr: formName.trim(),
        jobId: formJobId.trim(),
        nationalId: formNationalId.trim(),
        birthYear: formBirthYear ? Number(formBirthYear) : undefined,
        startDate: formStartDate,
        vacationBalance: Number(formVacationBalance) || 0,
        branchId: formBranchId,
        shift: formShift,
        statusId: formStatusId,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        notes: formNotes.trim(),
      });
      if (!res.success) {
        setFormError(res.error || 'حدث خطأ أثناء تعديل الموظف');
        return;
      }
      setEditingEmployee(null);
      setSuccessToast(`تم حفظ وتحديث بيانات الموظف (${formName}) ومزامنتها بنجاح.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      const res = addEmployee(
        {
          nameAr: formName.trim(),
          jobId: formJobId.trim(),
          nationalId: formNationalId.trim(),
          birthYear: formBirthYear ? Number(formBirthYear) : undefined,
          startDate: formStartDate,
          vacationBalance: Number(formVacationBalance) || 0,
          branchId: formBranchId,
          shift: formShift,
          statusId: formStatusId,
          phone: formPhone.trim(),
          email: formEmail.trim(),
          notes: formNotes.trim(),
        },
        formCreateOperator,
        formCreateOperator
          ? {
              username: formOperatorUsername.trim() || formJobId.trim().toLowerCase(),
              password: formOperatorPassword.trim() || '123456',
            }
          : undefined
      );
      if (!res.success) {
        setFormError(res.error || 'حدث خطأ أثناء إضافة الموظف');
        return;
      }
      setIsAddModalOpen(false);
      setSuccessToast(
        formCreateOperator
          ? `تمت إضافة الموظف (${formName}) وإنشاء حساب مشغل متزامن له بنجاح!`
          : `تمت إضافة الموظف (${formName}) ومزامنة بياناته بنجاح!`
      );
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const parsedEmps = await parseEmployeeExcelFile(file, branches, employmentStatuses, shifts);
      if (parsedEmps.length === 0) {
        setImportResult({ addedCount: 0, updatedCount: 0, errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة'] });
      } else {
        const result = importEmployees(parsedEmps);
        setImportResult(result);
      }
    } catch (err: any) {
      setImportResult({ addedCount: 0, updatedCount: 0, errors: [`فشل تحليل ملف الإكسل: ${err.message || 'تنسيق غير مدعوم'}`] });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/25 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
              الشاشة 2
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">سجل الموظفين (Employee Registry)</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            إدارة الكادر الوظيفي لنورسين، استيراد وتصدير الكشوفات، وتتبع بيانات التعيين والإجازات.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('export_employees') && (
            <button
              onClick={() => exportEmployeesToExcel(filteredEmployees, branches, employmentStatuses, shifts)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-slate-800/80 hover:bg-slate-700 text-cyan-200 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>تصدير إكسل ({filteredEmployees.length})</span>
            </button>
          )}

          {hasPermission('import_employees') && (
            <button
              onClick={() => {
                setImportResult(null);
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-slate-800/80 hover:bg-slate-700 text-cyan-200 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>استيراد جماعي (Excel)</span>
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              const res = await syncAllToCloud();
              if (res.success) {
                setSuccessToast('تمت مزامنة كافة سجلات الموظفين مع قاعدة البيانات السحابية بنجاح!');
                setTimeout(() => setSuccessToast(null), 4000);
              }
            }}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-500/30 bg-slate-800/80 hover:bg-slate-700 text-cyan-200 text-xs font-bold transition shadow-xs cursor-pointer"
            title="مزامنة فورية لكافة الموظفين مع السحابة"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارِ المزامنة...' : 'مزامنة سحابية'}</span>
          </button>

          {hasPermission('create_employee') && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-500 hover:to-cyan-400 text-white text-xs font-bold transition shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Success Alert Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/60 rounded-2xl text-xs font-bold text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white cursor-pointer px-2 py-1">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/25 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، الرقم الوظيفي، أو الوطني..."
              className="w-full pr-9 pl-3 py-2 bg-slate-800/80 border border-cyan-500/30 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 outline-hidden transition"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-cyan-500/30 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-cyan-400 outline-hidden cursor-pointer"
            >
              <option value="all">🏢 جميع الفروع المتاحة</option>
              {branches.filter(b => isGlobalUser || canAccessBranch(b.id)).map(b => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-cyan-500/30 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-cyan-400 outline-hidden cursor-pointer"
            >
              <option value="all">⏰ جميع الورديات والدوام</option>
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-cyan-500/30 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-cyan-400 outline-hidden cursor-pointer"
            >
              <option value="all">💼 كافة الأوضاع الوظيفية</option>
              {employmentStatuses.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            النتائج: <strong className="text-cyan-300">{filteredEmployees.length}</strong> موظف
            {searchTerm && <span> مطابقة لـ "{searchTerm}"</span>}
          </div>
          {(searchTerm || branchFilter !== 'all' || shiftFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setBranchFilter('all');
                setShiftFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/25 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-cyan-500/20 text-cyan-300 text-xs font-bold">
                <th className="py-3 px-4">الموظف والرقم الوظيفي</th>
                <th className="py-3 px-4">الرقم الوطني</th>
                <th className="py-3 px-4 text-center">سنة الميلاد</th>
                <th className="py-3 px-4">الفرع</th>
                <th className="py-3 px-4">الوضع الوظيفي</th>
                <th className="py-3 px-4">الدوام</th>
                <th className="py-3 px-4">تاريخ المباشرة</th>
                <th className="py-3 px-4 text-center">رصيد الإجازات</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">لا يوجد موظفين مسجلين مطابقين للبحث</p>
                    <p className="text-xs text-slate-400 mt-1">تأكد من نطاق الفرع أو جرب إعادة ضبط الفلاتر</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const branch = branches.find(b => b.id === emp.branchId);
                  const shift = shifts.find(s => s.id === emp.shift);
                  const status = employmentStatuses.find(s => s.id === emp.statusId);

                  return (
                    <tr key={emp.id} className="hover:bg-cyan-950/40 border-b border-white/5 transition">
                      
                      {/* Name & Job ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.nameAr.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{emp.nameAr}</div>
                            <div className="text-[11px] font-mono text-cyan-400 font-semibold">{emp.jobId}</div>
                          </div>
                        </div>
                      </td>

                      {/* National ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                        {emp.nationalId}
                      </td>

                      {/* Birth Year (سنة الميلاد) */}
                      <td className="py-3.5 px-4 font-mono font-bold text-center text-cyan-300">
                        {emp.birthYear || '—'}
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                          {branch?.nameAr || emp.branchId}
                        </span>
                      </td>

                      {/* Employment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            status?.color || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {status?.nameAr || emp.statusId}
                        </span>
                      </td>

                      {/* Work Shift */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">
                          {shift?.nameAr.split('(')[0] || emp.shift}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {emp.startDate}
                      </td>

                      {/* Vacation Balance */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                          {emp.vacationBalance} يوم
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* View Detail */}
                          <button
                            onClick={() => setViewingEmployee(emp)}
                            title="عرض التفاصيل"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          {hasPermission('edit_employee') && (
                            <button
                              onClick={() => openEditModal(emp)}
                              title="تعديل الموظف"
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {hasPermission('delete_employee') && (
                            <button
                              onClick={() => setDeleteConfirmId(emp.id)}
                              title="حذف الموظف"
                              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {(isAddModalOpen || editingEmployee) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingEmployee(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد إلى السجل'}
                </h3>
                <p className="text-xs text-slate-500">
                  يرجى التأكد من دقة الرقم الوظيفي والرقم الوطني لضمان عدم التكرار
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Employee Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    اسم الموظف الرباعي <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: محمد عبد الله الفرجاني"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Job ID */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    الرقم الوظيفي (Job ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formJobId}
                    onChange={(e) => setFormJobId(e.target.value)}
                    placeholder="مثال: NRS-105"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    الرقم الوطني (National ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNationalId}
                    onChange={(e) => setFormNationalId(e.target.value)}
                    placeholder="مثال: 119900234567"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Birth Year (سنة الميلاد) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    سنة الميلاد (Birth Year)
                  </label>
                  <input
                    type="number"
                    min="1940"
                    max={new Date().getFullYear() - 14}
                    value={formBirthYear}
                    onChange={(e) => setFormBirthYear(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 1995"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    الفرع <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  >
                    {branches
                      .filter(b => isGlobalUser || canAccessBranch(b.id))
                      .map(b => (
                        <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                          {b.nameAr}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Work Shift */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    الدوام والوردية <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                        {s.nameAr} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employment Status */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    الوضع الوظيفي / القسم <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formStatusId}
                    onChange={(e) => setFormStatusId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  >
                    {employmentStatuses.map(s => (
                      <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                        {s.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vacation Balance */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    رصيد الإجازات (بالأيام)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formVacationBalance}
                    onChange={(e) => setFormVacationBalance(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    تاريخ المباشرة (التعيين)
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="091-XXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-semibold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="employee@norseen.ly"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-semibold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden text-left transition"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-900 mb-1.5">
                    ملاحظات ومهام خاصة
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="أي ملاحظات إدارية أو وظيفية..."
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Operator Account Auto-Creation / Synchronization Toggle */}
                {!editingEmployee && (
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formCreateOperator}
                        onChange={(e) => setFormCreateOperator(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-emerald-600" />
                        <span>إنشاء وتفعيل حساب مشغل بالمنظومة (Operator / User Account) لهذا الموظف</span>
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1 mr-6">
                      يقوم النظام بإنشاء حساب دخول مشغل متزامن بصلاحيات مطابقة للوضع الوظيفي وفرع العمل المحدد.
                    </p>

                    {formCreateOperator && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-emerald-200/60 mr-6">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-900 mb-1">اسم المستخدم للمشغل (Username)</label>
                          <input
                            type="text"
                            value={formOperatorUsername}
                            onChange={(e) => setFormOperatorUsername(e.target.value)}
                            placeholder="مثال: nrs.101"
                            className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 shadow-xs outline-hidden transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-900 mb-1">كلمة المرور الافتراضية</label>
                          <input
                            type="text"
                            value={formOperatorPassword}
                            onChange={(e) => setFormOperatorPassword(e.target.value)}
                            placeholder="123456"
                            className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 shadow-xs outline-hidden transition"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {editingEmployee && (
                  <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-medium">حساب المشغل بالمنظومة:</span>
                    {(() => {
                      const linked = users.find(u => u.employeeId === editingEmployee.id || u.id === editingEmployee.id);
                      if (linked) {
                        return (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            @{linked.username} (مشغل متزامن ومفعل)
                          </span>
                        );
                      }
                      return (
                        <span className="text-slate-400 font-semibold">غير مرتبط بحساب مشغل حالياً</span>
                      );
                    })()}
                  </div>
                )}

              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  {editingEmployee ? 'حفظ التعديلات' : 'تسجيل الموظف'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* View Employee Detail Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => setViewingEmployee(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingEmployee.nameAr}</h3>
                  <p className="text-xs font-mono text-emerald-700 font-bold">{viewingEmployee.jobId}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
                  {viewingEmployee.nameAr.charAt(0)}
                </div>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">الرقم الوطني</span>
                  <span className="font-mono font-bold text-slate-800">{viewingEmployee.nationalId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">سنة الميلاد</span>
                  <span className="font-mono font-bold text-cyan-700">{viewingEmployee.birthYear || 'غير محدد'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الفرع</span>
                  <span className="font-bold text-slate-800">
                    {branches.find(b => b.id === viewingEmployee.branchId)?.nameAr || viewingEmployee.branchId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الوضع الوظيفي</span>
                  <span className="font-bold text-emerald-700">
                    {employmentStatuses.find(s => s.id === viewingEmployee.statusId)?.nameAr || viewingEmployee.statusId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الدوام</span>
                  <span className="font-bold text-slate-800">
                    {shifts.find(s => s.id === viewingEmployee.shift)?.nameAr || viewingEmployee.shift}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">تاريخ المباشرة</span>
                  <span className="font-mono text-slate-800">{viewingEmployee.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">رصيد الإجازات المتبقي</span>
                  <span className="font-bold text-amber-700">{viewingEmployee.vacationBalance} يوم</span>
                </div>
              </div>

              {viewingEmployee.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>الهاتف: {viewingEmployee.phone}</span>
                </div>
              )}

              {viewingEmployee.email && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>البريد: {viewingEmployee.email}</span>
                </div>
              )}

              {viewingEmployee.notes && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-700">
                  <div className="font-bold text-amber-900 mb-1">ملاحظات وظيفية:</div>
                  <p>{viewingEmployee.notes}</p>
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-right">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">حذف ملف الموظف؟</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              هل أنت متأكد من حذف هذا الموظف من المنظومة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  deleteEmployee(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">استيراد الموظفين من ملف إكسل</h3>
                <p className="text-xs text-slate-500">يدعم ملفات .xlsx و .csv</p>
              </div>
            </div>

            <div className="py-5 space-y-4 text-xs">
              
              {/* Step 1: Download Template */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={downloadEmployeeImportTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    تحميل القالب النموذجي (.xlsx)
                  </button>
                  <div className="font-bold text-slate-800">الخطوة 1: تنزيل النموذج المعتمد</div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  قم بتحميل القالب وتعبئة بيانات موظفيك. إذا كان الموظف مسجلاً مسبقاً (بالاسم أو الرقم الوظيفي)، سيتم <strong>تحديث بياناته تلقائياً</strong>.
                </p>
                <div className="mt-2.5 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  💡 <strong>ملاحظة هامة:</strong> في حال وجود أي حقول أو أعمدة فارغة داخل شيت الإكسل، سيتم تجاهلها تلقائياً مع الاحتفاظ بالبيانات السابقة للموظف دون حذف أو استبدال، وتسجيل باقي البيانات بنجاح.
                </div>
              </div>

              {/* Step 2: Upload File */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-slate-800 text-xs">اضغط لاختيار ملف الإكسل من جهازك</p>
                <p className="text-[11px] text-slate-400 mt-1">يدعم صيغ .xlsx / .csv</p>
              </div>

              {importLoading && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جارٍ فحص البيانات وتحديث الموظفين المسجلين وإضافة الجدد...</span>
                </div>
              )}

              {/* Import Results & Errors */}
              {importResult && (
                <div className="space-y-2">
                  {importResult.addedCount > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>تمت إضافة <strong>{importResult.addedCount}</strong> موظف جديد بنجاح إلى قاعدة البيانات!</span>
                    </div>
                  )}

                  {importResult.updatedCount > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 shrink-0 text-blue-600" />
                      <span>تم تحديث بيانات <strong>{importResult.updatedCount}</strong> موظف مسجل مسبقاً بنجاح!</span>
                    </div>
                  )}

                  {importResult.addedCount === 0 && importResult.updatedCount === 0 && importResult.errors.length === 0 && (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
                      لم يتم رصد أي تغييرات جديدة على السجل.
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 max-h-40 overflow-y-auto">
                      <div className="font-bold flex items-center gap-1 mb-1 text-amber-900">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>تنبيهات وملاحظات أثناء الاستيراد ({importResult.errors.length}):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px]">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
