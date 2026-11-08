import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, IncidentRecord, IncidentType } from '../../types';
import {
  ClockAlert,
  UserX,
  Clock,
  PlusCircle,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Calendar,
  Building2,
  User,
  Check,
} from 'lucide-react';
import { exportIncidentsToExcel } from '../../utils/exportImport';

export const AbsenceDelayTracking: React.FC = () => {
  const {
    scopedIncidents,
    scopedEmployees,
    branches,
    addIncident,
    deleteIncident,
    hasPermission,
    canAccessBranch,
    isGlobalUser,
  } = useApp();

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'all' | 'absence' | 'delay'>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Incident Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType>('absence');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [delayDuration, setDelayDuration] = useState<number>(30);
  const [arrivalTime, setArrivalTime] = useState<string>('08:30');
  const [reason, setReason] = useState<string>('');
  const [isExcused, setIsExcused] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-complete employee candidates scoped to user access
  const employeeCandidates = useMemo(() => {
    if (!empSearch.trim()) return [];
    const term = empSearch.trim().toLowerCase();
    return scopedEmployees.filter(e =>
      e.nameAr.toLowerCase().includes(term) ||
      e.jobId.toLowerCase().includes(term) ||
      e.nationalId.includes(term)
    ).slice(0, 5);
  }, [scopedEmployees, empSearch]);

  const openAddModal = () => {
    setErrorMsg(null);
    setEmpSearch('');
    setSelectedEmployee(null);
    setIncidentType('absence');
    setIncidentDate(new Date().toISOString().split('T')[0]);
    setDelayDuration(30);
    setArrivalTime('08:30');
    setReason('');
    setIsExcused(false);
    setIsModalOpen(true);
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedEmployee) {
      setErrorMsg('يرجى اختيار الموظف أولاً من قائمة البحث بالاسم أو الرقم الوظيفي');
      return;
    }

    const res = addIncident({
      employeeId: selectedEmployee.id,
      type: incidentType,
      date: incidentDate,
      delayDurationMinutes: incidentType === 'delay' ? Number(delayDuration) || 0 : undefined,
      arrivalTime: incidentType === 'delay' ? arrivalTime : undefined,
      reasonAr: reason.trim() || undefined,
      isExcused,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'حدث خطأ أثناء حفظ السجل');
      return;
    }

    setIsModalOpen(false);
  };

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return scopedIncidents.filter(inc => {
      // Date filter
      if (selectedDate && inc.date !== selectedDate) return false;

      // Type filter
      if (filterType !== 'all' && inc.type !== filterType) return false;

      // Branch filter
      if (filterBranch !== 'all' && inc.branchId !== filterBranch) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchName = inc.employeeNameAr.toLowerCase().includes(term);
        const matchJob = inc.jobId.toLowerCase().includes(term);
        if (!matchName && !matchJob) return false;
      }

      return true;
    });
  }, [scopedIncidents, selectedDate, filterType, filterBranch, searchTerm]);

  // Statistics for selected date
  const todayStats = useMemo(() => {
    const list = scopedIncidents.filter(i => !selectedDate || i.date === selectedDate);
    const absences = list.filter(i => i.type === 'absence').length;
    const delays = list.filter(i => i.type === 'delay').length;
    const excused = list.filter(i => i.isExcused).length;
    const totalDelayMinutes = list
      .filter(i => i.type === 'delay')
      .reduce((sum, cur) => sum + (cur.delayDurationMinutes || 0), 0);
    const avgDelay = delays > 0 ? Math.round(totalDelayMinutes / delays) : 0;

    return { absences, delays, excused, avgDelay };
  }, [scopedIncidents, selectedDate]);

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 border border-amber-200">
              الشاشة 5
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              شاشة الغياب والتأخير (Absence & Delay Tracking)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            رصد حالات الغياب والتأخير اللحظية للموظفين، وتوثيق الأعذار، وحساب مدد التأخير اليومية.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasPermission('export_attendance') && (
            <button
              onClick={() => exportIncidentsToExcel(filteredIncidents, branches)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير السجل ({filteredIncidents.length})</span>
            </button>
          )}

          {hasPermission('create_incident') && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة حالة (Add Incident)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">حالات الغياب</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{todayStats.absences}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {selectedDate ? `بتاريخ: ${selectedDate}` : 'كافة الأيام'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">حالات التأخير</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{todayStats.delays}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            متوسط التأخير: <strong>{todayStats.avgDelay} دقيقة</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">الحالات المعذورة</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{todayStats.excused}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            من إجمالي {todayStats.absences + todayStats.delays} حالة
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">غير معذورة (خصم)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-extrabold text-red-600">
            {(todayStats.absences + todayStats.delays) - todayStats.excused}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تستوجب الخصم أو الإنذار</div>
        </div>

      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ اليوم / العرض</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الحالة</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">جميع الحالات (غياب وتأخير)</option>
              <option value="absence">غياب فقط</option>
              <option value="delay">تأخير فقط</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">الفرع</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">كافة الفروع المتاحة</option>
              {branches.filter(b => isGlobalUser || canAccessBranch(b.id)).map(b => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">بحث بالاسم أو الرقم</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="اسم الموظف أو الرقم الوظيفي..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>الحالات المعروضة: <strong className="text-slate-800">{filteredIncidents.length}</strong> حالة</span>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-emerald-600 hover:underline cursor-pointer"
            >
              عرض سجل كافة الأيام
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold">
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">الموظف</th>
                <th className="py-3 px-4">الفرع</th>
                <th className="py-3 px-4">نوع الحالة</th>
                <th className="py-3 px-4">تفاصيل التأخير</th>
                <th className="py-3 px-4">السبب والملاحظات</th>
                <th className="py-3 px-4">الحالة والاعتماد</th>
                <th className="py-3 px-4">المسجل</th>
                <th className="py-3 px-4 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">لا توجد حالات غياب أو تأخير مسجلة لهذا التاريخ</p>
                    <p className="text-xs text-slate-400 mt-1">جميع الموظفين حاضرون أو تم الالتزام بالمواعيد</p>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const branch = branches.find(b => b.id === inc.branchId);

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {inc.date}
                      </td>

                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inc.employeeNameAr}</div>
                        <div className="text-[11px] font-mono text-emerald-700 font-semibold">{inc.jobId}</div>
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {branch?.nameAr || inc.branchId}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {inc.type === 'absence' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-3 h-3" />
                            غياب كامل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            تأخير عن الدوام
                          </span>
                        )}
                      </td>

                      {/* Delay Details */}
                      <td className="py-3.5 px-4">
                        {inc.type === 'delay' ? (
                          <div>
                            <span className="font-bold text-slate-800 font-mono">
                              {inc.delayDurationMinutes} دقيقة
                            </span>
                            {inc.arrivalTime && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                وصول: {inc.arrivalTime}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs text-slate-600">
                        {inc.reasonAr || 'لا توجد ملاحظات'}
                      </td>

                      {/* Excused Badge */}
                      <td className="py-3.5 px-4">
                        {inc.isExcused ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            معذور / معتمد
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            غير معذور (خصم)
                          </span>
                        )}
                      </td>

                      {/* Recorded By */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {inc.recordedByName}
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-4 text-center">
                        {hasPermission('delete_incident') && (
                          <button
                            onClick={() => deleteIncident(inc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="حذف القيد"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Add Incident" (إضافة حالة) Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">إضافة حالة غياب أو تأخير</h3>
                <p className="text-xs text-slate-500">تسجيل فوري مقيد بنطاق فرعك المعتمد</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveIncident} className="mt-4 space-y-4 text-xs">
              
              {/* Employee Autocomplete Search Box */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  البحث عن الموظف (بالاسم أو الرقم الوظيفي) *
                </label>
                
                {selectedEmployee ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-emerald-950">{selectedEmployee.nameAr}</div>
                      <div className="text-[11px] font-mono text-emerald-700">
                        {selectedEmployee.jobId} | {branches.find(b => b.id === selectedEmployee.branchId)?.nameAr}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(null)}
                      className="px-2.5 py-1 text-xs text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold"
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      placeholder="اكتب اسم الموظف أو رقمه الوظيفي..."
                      className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                    />

                    {/* Dropdown candidates */}
                    {employeeCandidates.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100">
                        {employeeCandidates.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setEmpSearch('');
                            }}
                            className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{emp.nameAr}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {branches.find(b => b.id === emp.branchId)?.nameAr}
                              </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {emp.jobId}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Incident Type Selector */}
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">نوع الحالة *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIncidentType('absence')}
                    className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      incidentType === 'absence'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>غياب (Absence)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncidentType('delay')}
                    className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      incidentType === 'delay'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>تأخير (Delay)</span>
                  </button>
                </div>
              </div>

              {/* If Absence: Date */}
              {incidentType === 'absence' && (
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ الغياب *</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>
              )}

              {/* If Delay: Duration & Arrival Time */}
              {incidentType === 'delay' && (
                <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ التأخير</label>
                      <input
                        type="date"
                        required
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-slate-900 mb-1.5">وقت الحضور الفعلي</label>
                      <input
                        type="time"
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-900 mb-1.5">مدة التأخير</label>
                    <div className="flex gap-2">
                      {[15, 30, 45, 60, 90].map(min => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setDelayDuration(min)}
                          className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold cursor-pointer transition ${
                            delayDuration === min
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-white'
                          }`}
                        >
                          {min} د
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reason / Notes */}
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">السبب أو الملاحظات</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="سبب الغياب أو مبرر التأخير..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              {/* Excused Checkbox */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">اعتماد الحالة كـ (معذور بعذر مقبول)</span>
                  <span className="text-[11px] text-slate-500">في حال عدم التفعيل، تُحسب الحالة كخصم مباشر</span>
                </div>
                <input
                  type="checkbox"
                  checked={isExcused}
                  onChange={(e) => setIsExcused(e.target.checked)}
                  className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Buttons */}
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
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  حفظ الحالة وتسجيلها
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
