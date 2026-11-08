import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CasualEmployee,
  CasualApprovalStatus,
  CasualDocumentCategory,
  CasualEmployeeDocument,
  EmploymentStatusType,
  WorkShiftType,
} from '../../types';
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  ShieldCheck,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ClockAlert,
  ArrowRightLeft,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Trash2,
  Edit,
  X,
  Upload,
  Calendar,
  Building2,
  DollarSign,
  Phone,
  FileCheck2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';

const CATEGORY_LABELS: Record<CasualDocumentCategory, string> = {
  national_id: 'صورة البطاقة الشخصية / جواز السفر',
  contract: 'عقد التكليف المؤقت',
  health_certificate: 'الشهادة الصحية سارية المفعول',
  receipt_pledge: 'إقرار استلام عهدة ومعدات',
  clearance: 'نموذج إبراء الذمة',
  work_permit: 'تصريح العمل المؤقت',
  other: 'مستندات وشهادات أخرى',
};

const CATEGORY_COLORS: Record<CasualDocumentCategory, string> = {
  national_id: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  contract: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  health_certificate: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  receipt_pledge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  clearance: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  work_permit: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  other: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

export const CasualLaborRegistry: React.FC = () => {
  const {
    scopedCasualEmployees,
    branches,
    shifts,
    employmentStatuses,
    currentUser,
    hasPermission,
    addCasualEmployee,
    approveCasualEmployee,
    rejectCasualEmployee,
    updateCasualEmployee,
    deleteCasualEmployee,
    addCasualEmployeeDocument,
    deleteCasualEmployeeDocument,
    transferCasualToPermanent,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<CasualEmployee | null>(null);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [workerToApprove, setWorkerToApprove] = useState<CasualEmployee | null>(null);
  const [assignedJobIdInput, setAssignedJobIdInput] = useState('');
  const [approvalNotesInput, setApprovalNotesInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [workerToTransfer, setWorkerToTransfer] = useState<CasualEmployee | null>(null);
  const [targetStatusId, setTargetStatusId] = useState<EmploymentStatusType>('active');
  const [targetJobIdInput, setTargetJobIdInput] = useState('');
  const [targetCommencementDate, setTargetCommencementDate] = useState('');
  const [targetVacationDays, setTargetVacationDays] = useState<number>(30);
  const [transferNotesInput, setTransferNotesInput] = useState('');

  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [workerForDocs, setWorkerForDocs] = useState<CasualEmployee | null>(null);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<CasualEmployeeDocument | null>(null);

  // Notification / Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Document Upload in Docs Modal
  const [docTitleInput, setDocTitleInput] = useState('');
  const [docCategoryInput, setDocCategoryInput] = useState<CasualDocumentCategory>('national_id');
  const [docFileBase64, setDocFileBase64] = useState<string>('');
  const [docFileName, setDocFileName] = useState<string>('');
  const [docFileType, setDocFileType] = useState<string>('');
  const [docFileSize, setDocFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add / Edit Form state
  const [formNameAr, setFormNameAr] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formBirthYear, setFormBirthYear] = useState<number | ''>(1995);
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBranchId, setFormBranchId] = useState(branches[0]?.id || 'b-jaraba');
  const [formShift, setFormShift] = useState<WorkShiftType | string>('morning');
  const [formJobTitleAr, setFormJobTitleAr] = useState('');
  const [formDailyWage, setFormDailyWage] = useState<number | ''>(80);
  const [formCommencementDate, setFormCommencementDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDurationDays, setFormDurationDays] = useState<number | ''>(30);
  const [formEndDate, setFormEndDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Initial doc attachments for new worker
  const [initialAttachments, setInitialAttachments] = useState<
    Array<{
      title: string;
      category: CasualDocumentCategory;
      fileName: string;
      fileType: string;
      fileSize: number;
      fileData: string;
    }>
  >([]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return scopedCasualEmployees.filter((w) => {
      // Branch filter
      if (selectedBranchId !== 'all' && w.branchId !== selectedBranchId) {
        return false;
      }
      // Shift filter
      if (selectedShift !== 'all' && w.shift !== selectedShift) {
        return false;
      }
      // Status Tab filter
      if (selectedStatusTab !== 'all' && w.approvalStatus !== selectedStatusTab) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = w.nameAr.toLowerCase().includes(query);
        const matchNatId = w.nationalId.includes(query);
        const matchTempCode = w.tempCode.toLowerCase().includes(query);
        const matchJobId = w.jobId ? w.jobId.toLowerCase().includes(query) : false;
        const matchTitle = w.jobTitleAr.toLowerCase().includes(query);
        const matchPhone = w.phone ? w.phone.includes(query) : false;
        if (!matchName && !matchNatId && !matchTempCode && !matchJobId && !matchTitle && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [scopedCasualEmployees, selectedBranchId, selectedShift, selectedStatusTab, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = scopedCasualEmployees.length;
    const pendingHR = scopedCasualEmployees.filter((w) => w.approvalStatus === 'pending_hr_approval').length;
    const approved = scopedCasualEmployees.filter((w) => w.approvalStatus === 'approved').length;
    const transferred = scopedCasualEmployees.filter((w) => w.approvalStatus === 'transferred_to_permanent').length;
    const rejected = scopedCasualEmployees.filter((w) => w.approvalStatus === 'rejected').length;
    const totalDocs = scopedCasualEmployees.reduce((acc, w) => acc + (w.documents?.length || 0), 0);
    return { total, pendingHR, approved, transferred, rejected, totalDocs };
  }, [scopedCasualEmployees]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormNameAr('');
    setFormNationalId('');
    setFormBirthYear(1996);
    setFormPhone('');
    setFormEmail('');
    setFormBranchId(branches[0]?.id || 'b-jaraba');
    setFormShift('morning');
    setFormJobTitleAr('');
    setFormDailyWage(80);
    setFormCommencementDate(new Date().toISOString().split('T')[0]);
    setFormDurationDays(30);
    // calculate end date default 30 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormEndDate(d.toISOString().split('T')[0]);
    setFormNotes('');
    setInitialAttachments([]);
    setIsAddEditModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (w: CasualEmployee) => {
    setEditingWorker(w);
    setFormNameAr(w.nameAr);
    setFormNationalId(w.nationalId);
    setFormBirthYear(w.birthYear || '');
    setFormPhone(w.phone || '');
    setFormEmail(w.email || '');
    setFormBranchId(w.branchId);
    setFormShift(w.shift);
    setFormJobTitleAr(w.jobTitleAr);
    setFormDailyWage(w.dailyWageRate ?? '');
    setFormCommencementDate(w.commencementDate || w.startDate);
    setFormDurationDays(w.contractDurationDays ?? '');
    setFormEndDate(w.endDate || '');
    setFormNotes(w.notes || '');
    setIsAddEditModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitAddEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameAr.trim()) {
      showFeedback('error', 'يرجى إدخال اسم الموظف بالكامل');
      return;
    }
    if (!formNationalId.trim()) {
      showFeedback('error', 'يرجى إدخال الرقم الوطني للموظف');
      return;
    }
    if (!formJobTitleAr.trim()) {
      showFeedback('error', 'يرجى تحديد المهمة أو المسمى الوظيفي المكلف به');
      return;
    }
    if (!formCommencementDate) {
      showFeedback('error', 'يرجى تحديد تاريخ المباشرة');
      return;
    }

    if (editingWorker) {
      // Update
      const res = updateCasualEmployee(editingWorker.id, {
        nameAr: formNameAr.trim(),
        nationalId: formNationalId.trim(),
        birthYear: formBirthYear ? Number(formBirthYear) : undefined,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        branchId: formBranchId,
        shift: formShift,
        jobTitleAr: formJobTitleAr.trim(),
        dailyWageRate: formDailyWage ? Number(formDailyWage) : undefined,
        commencementDate: formCommencementDate,
        startDate: formCommencementDate,
        contractDurationDays: formDurationDays ? Number(formDurationDays) : undefined,
        endDate: formEndDate || undefined,
        notes: formNotes.trim(),
      });
      if (res.success) {
        showFeedback('success', `تم تحديث بيانات الموظف (${formNameAr}) بنجاح`);
        setIsAddEditModalOpen(false);
      } else {
        showFeedback('error', res.error || 'فشل تحديث البيانات');
      }
    } else {
      // Add
      const res = addCasualEmployee(
        {
          nameAr: formNameAr.trim(),
          nationalId: formNationalId.trim(),
          birthYear: formBirthYear ? Number(formBirthYear) : undefined,
          phone: formPhone.trim(),
          email: formEmail.trim(),
          branchId: formBranchId,
          shift: formShift,
          jobTitleAr: formJobTitleAr.trim(),
          dailyWageRate: formDailyWage ? Number(formDailyWage) : undefined,
          commencementDate: formCommencementDate,
          startDate: formCommencementDate,
          contractDurationDays: formDurationDays ? Number(formDurationDays) : undefined,
          endDate: formEndDate || undefined,
          notes: formNotes.trim(),
        },
        initialAttachments
      );
      if (res.success) {
        showFeedback(
          'success',
          `تم تسجيل موظف العمالة العارضة بنجاح بكود مرجعي مؤقت: ${res.tempCode} وتاريخ مباشرة (${formCommencementDate}). بانتظار مراجعة واعتماد الموارد البشرية لإصدار الرقم الوظيفي.`
        );
        setIsAddEditModalOpen(false);
      } else {
        showFeedback('error', res.error || 'فشل تسجيل الموظف');
      }
    }
  };

  // Open HR Approval Modal
  const handleOpenApprovalModal = (worker: CasualEmployee) => {
    setWorkerToApprove(worker);
    // Suggest sequential Job ID NOR-C-104X
    const num = 1040 + scopedCasualEmployees.length + 1;
    setAssignedJobIdInput(`NOR-C-${num}`);
    setApprovalNotesInput('');
    setRejectionReasonInput('');
    setIsRejecting(false);
    setIsApprovalModalOpen(true);
  };

  // Submit HR Approval
  const handleConfirmApproval = () => {
    if (!workerToApprove) return;
    if (!assignedJobIdInput.trim()) {
      showFeedback('error', 'الرقم الوظيفي إلزامي لاعتماد الموظف من الموارد البشرية');
      return;
    }

    const res = approveCasualEmployee(workerToApprove.id, assignedJobIdInput.trim(), approvalNotesInput.trim());
    if (res.success) {
      showFeedback(
        'success',
        `تم اعتماد الموظف (${workerToApprove.nameAr}) بنجاح وإصدار الرقم الوظيفي الرسمي: ${assignedJobIdInput.trim()}`
      );
      setIsApprovalModalOpen(false);
    } else {
      showFeedback('error', res.error || 'تعذر اعتماد الموظف');
    }
  };

  // Submit HR Rejection
  const handleConfirmRejection = () => {
    if (!workerToApprove) return;
    if (!rejectionReasonInput.trim()) {
      showFeedback('error', 'يرجى كتابة سبب رفض الطلب');
      return;
    }

    const res = rejectCasualEmployee(workerToApprove.id, rejectionReasonInput.trim());
    if (res.success) {
      showFeedback('success', `تم رفض تسجيل الموظف (${workerToApprove.nameAr}) وإشعار الفرع.`);
      setIsApprovalModalOpen(false);
    } else {
      showFeedback('error', res.error || 'تعذر رفض الطلب');
    }
  };

  // Open Transfer to Permanent Modal
  const handleOpenTransferModal = (worker: CasualEmployee) => {
    setWorkerToTransfer(worker);
    setTargetStatusId('active');
    setTargetJobIdInput(worker.jobId || `EMP-${Date.now().toString().slice(-4)}`);
    setTargetCommencementDate(worker.commencementDate || worker.startDate || new Date().toISOString().split('T')[0]);
    setTargetVacationDays(30);
    setTransferNotesInput('تم تثبيت ونقل الموظف بناءً على تقييم الكفاءة والالتزام خلال فترة التكليف المؤقت.');
    setIsTransferModalOpen(true);
  };

  // Submit Transfer to Permanent
  const handleConfirmTransfer = () => {
    if (!workerToTransfer) return;
    if (!targetJobIdInput.trim()) {
      showFeedback('error', 'الرقم الوظيفي للكادر الدائم مطلوب');
      return;
    }

    const finalCommDate = targetCommencementDate.trim() || workerToTransfer.commencementDate || workerToTransfer.startDate;

    const res = transferCasualToPermanent(workerToTransfer.id, {
      statusId: targetStatusId,
      permanentJobId: targetJobIdInput.trim(),
      commencementDate: finalCommDate,
      vacationBalance: targetVacationDays,
      notes: transferNotesInput.trim(),
    });

    if (res.success) {
      showFeedback(
        'success',
        `تم تثبيت ونقل الموظف (${workerToTransfer.nameAr}) بنجاح إلى سجل الموظفين الدائمين برقم وظيفي (${targetJobIdInput.trim()}) وتاريخ مباشرة (${finalCommDate})، واختفى من شاشة العمالة العارضة.`
      );
      setIsTransferModalOpen(false);
    } else {
      showFeedback('error', res.error || 'فشل نقل الموظف إلى الكادر الدائم');
    }
  };

  // Open Docs Vault Modal
  const handleOpenDocsModal = (worker: CasualEmployee) => {
    setWorkerForDocs(worker);
    setDocTitleInput('');
    setDocCategoryInput('national_id');
    setDocFileBase64('');
    setDocFileName('');
    setDocFileType('');
    setDocFileSize(0);
    setIsDocsModalOpen(true);
  };

  // Handle file selection and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'حجم الملف يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    setDocFileName(file.name);
    setDocFileType(file.type);
    setDocFileSize(file.size);
    if (!docTitleInput) {
      // Auto-suggest title based on category
      setDocTitleInput(CATEGORY_LABELS[docCategoryInput]);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDocFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle file drop in Add Modal
  const handleAddModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'حجم الملف يجب ألا يتجاوز 5 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInitialAttachments((prev) => [
          ...prev,
          {
            title: file.name.replace(/\.[^/.]+$/, ''),
            category: 'national_id',
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: reader.result as string,
          },
        ]);
        showFeedback('success', `تم تجهيز المستند (${file.name}) للإرفاق`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Doc in Docs Modal
  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForDocs) return;
    if (!docTitleInput.trim()) {
      showFeedback('error', 'يرجى كتابة عنوان للمستند');
      return;
    }
    if (!docFileBase64) {
      showFeedback('error', 'يرجى اختيار ملف لرفعه');
      return;
    }

    const res = addCasualEmployeeDocument(workerForDocs.id, {
      title: docTitleInput.trim(),
      category: docCategoryInput,
      fileName: docFileName || 'document.pdf',
      fileType: docFileType || 'application/pdf',
      fileSize: docFileSize,
      fileData: docFileBase64,
    });

    if (res.success) {
      showFeedback('success', 'تم رفع المستند بنجاح إلى ملف الموظف');
      // Update local state for workerForDocs
      const updated = scopedCasualEmployees.find((w) => w.id === workerForDocs.id);
      if (updated) {
        setWorkerForDocs(updated);
      }
      // Reset inputs
      setDocTitleInput('');
      setDocFileBase64('');
      setDocFileName('');
      setDocFileType('');
      setDocFileSize(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      showFeedback('error', res.error || 'فشل رفع المستند');
    }
  };

  // Delete Doc
  const handleDeleteDoc = (workerId: string, docId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستند؟')) return;
    const res = deleteCasualEmployeeDocument(workerId, docId);
    if (res.success) {
      showFeedback('success', 'تم حذف المستند بنجاح');
      const updated = scopedCasualEmployees.find((w) => w.id === workerId);
      if (updated) {
        setWorkerForDocs(updated);
      }
    } else {
      showFeedback('error', res.error || 'تعذر حذف المستند');
    }
  };

  // Delete worker
  const handleDeleteWorker = (w: CasualEmployee) => {
    if (!window.confirm(`هل أنت متأكد من حذف سجل الموظف (${w.nameAr}) نهائياً؟`)) return;
    const res = deleteCasualEmployee(w.id);
    if (res.success) {
      showFeedback('success', `تم حذف سجل الموظف (${w.nameAr}) بنجاح`);
    } else {
      showFeedback('error', res.error || 'تعذر حذف السجل');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'الكود المرجعي',
      'الرقم الوظيفي',
      'اسم الموظف',
      'الرقم الوطني',
      'الفرع',
      'المهمة / التكليف',
      'الدوام',
      'الأجر اليومي',
      'تاريخ المباشرة',
      'تاريخ الانتهاء',
      'حالة الاعتماد',
      'المعتمد بواسطة',
      'تاريخ الاعتماد',
      'عدد المستندات',
      'ملاحظات',
    ];

    const rows = filteredWorkers.map((w) => {
      const branchObj = branches.find((b) => b.id === w.branchId);
      const shiftObj = shifts.find((s) => s.id === w.shift);
      let statusLabel = 'بانتظار اعتماد HR';
      if (w.approvalStatus === 'approved') statusLabel = 'معتمد';
      if (w.approvalStatus === 'transferred_to_permanent') statusLabel = 'مثبت بالكادر الدائم';
      if (w.approvalStatus === 'rejected') statusLabel = 'مرفوض';

      return [
        w.tempCode,
        w.jobId || 'غير مسند',
        w.nameAr,
        w.nationalId,
        branchObj?.nameAr || w.branchId,
        w.jobTitleAr,
        shiftObj?.nameAr || w.shift,
        w.dailyWageRate ? `${w.dailyWageRate} د.ل` : '-',
        w.commencementDate || w.startDate,
        w.endDate || '-',
        statusLabel,
        w.approvedByNameAr || '-',
        w.approvedAt || '-',
        (w.documents?.length || 0).toString(),
        w.notes || '',
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `norseen_casual_workers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Permissions check
  const canCreate = hasPermission('create_casual_worker') || currentUser?.role === 'system_admin' || currentUser?.role === 'hr';
  const canApprove = hasPermission('approve_casual_worker') || currentUser?.role === 'system_admin' || currentUser?.role === 'hr' || currentUser?.role === 'hr_officer';
  const canTransfer = hasPermission('transfer_casual_worker') || currentUser?.role === 'system_admin' || currentUser?.role === 'hr';

  return (
    <div className="space-y-6 pb-12 animate-fade-in" dir="rtl">
      {/* Top Header & Title */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-cyan-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-inner">
                <Users className="w-7 h-7" />
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                    سجل العمالة العارضة والكوادر المؤقتة
                  </h1>
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold">
                    إدارة الكوادر المؤقتة
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  إدارة وتسجيل العمالة المؤقتة والموسمية، اعتماد الموارد البشرية وإصدار الأرقام الوظيفية، رفع وتوثيق المستندات، وإمكانية التثبيت والنقل للكادر الدائم.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>تصدير Excel (CSV)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>طباعة الكشف</span>
            </button>

            {canCreate && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>إضافة موظف عمالة عارضة جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold border transition-all animate-slide-down ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Casual */}
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي العمالة العارضة</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.total}</div>
          <div className="text-[11px] text-cyan-400/80 mt-1">كافة الفروع النشطة</div>
        </div>

        {/* Pending HR Approval */}
        <div
          onClick={() => setSelectedStatusTab('pending_hr_approval')}
          className={`p-4 rounded-2xl cursor-pointer transition-all ${
            selectedStatusTab === 'pending_hr_approval'
              ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-slate-900/60 hover:bg-slate-800/60 border-amber-500/30'
          } backdrop-blur-xl border shadow-lg`}
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-bold">بانتظار اعتماد HR</span>
            <ClockAlert className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-300">{metrics.pendingHR}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">تحتاج إصدار رقم وظيفي</div>
        </div>

        {/* Approved */}
        <div
          onClick={() => setSelectedStatusTab('approved')}
          className={`p-4 rounded-2xl cursor-pointer transition-all ${
            selectedStatusTab === 'approved'
              ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/60 hover:bg-slate-800/60 border-emerald-500/30'
          } backdrop-blur-xl border shadow-lg`}
        >
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-bold">معتمد برقم وظيفي</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{metrics.approved}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">جاهز للتثبيت والنقل</div>
        </div>

        {/* Total Documents */}
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 shadow-lg">
          <div className="flex items-center justify-between text-purple-300 mb-2">
            <span className="text-xs font-bold">المستندات والوثائق</span>
            <Paperclip className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{metrics.totalDocs}</div>
          <div className="text-[11px] text-purple-400/80 mt-1">عقود وبطاقات وشهادات</div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setSelectedStatusTab('rejected')}
          className={`p-4 rounded-2xl cursor-pointer transition-all ${
            selectedStatusTab === 'rejected'
              ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-slate-900/60 hover:bg-slate-800/60 border-rose-500/30'
          } backdrop-blur-xl border shadow-lg`}
        >
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-bold">مرفوض من HR</span>
            <X className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">{metrics.rejected}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">طلبات مرفوضة</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-4">
        {/* Row 1: Search & Branch Selector & Shift */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم، الرقم الوطني، الكود المرجعي، الرقم الوظيفي، أو المسمى..."
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="all">كافة الفروع الرسمية (9 فروع)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="all">كافة الورديات / الدوام</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-bold ml-2">تصفية حسب الحالة:</span>
          {[
            { id: 'all', label: 'الكل', count: metrics.total },
            { id: 'pending_hr_approval', label: 'بانتظار اعتماد HR', count: metrics.pendingHR, color: 'text-amber-300' },
            { id: 'approved', label: 'معتمد (يحمل رقم وظيفي)', count: metrics.approved, color: 'text-emerald-300' },
            { id: 'rejected', label: 'مرفوض', count: metrics.rejected, color: 'text-rose-300' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedStatusTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  selectedStatusTab === tab.id ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-300 text-xs font-bold border-b border-slate-800 select-none">
                <th className="p-4 text-center w-12">#</th>
                <th className="p-4">الكود المرجعي / الرقم الوظيفي</th>
                <th className="p-4">الموظف والبيانات الأساسية</th>
                <th className="p-4">الفرع والمهمة</th>
                <th className="p-4">الدوام والأجر اليومي</th>
                <th className="p-4">تاريخ المباشرة والمدة</th>
                <th className="p-4 text-center">حالة الاعتماد</th>
                <th className="p-4 text-center">المستندات</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                        <Users className="w-8 h-8" />
                      </div>
                      <div className="text-base font-bold text-white">لا يوجد موظفو عمالة عارضة يطابقون البحث</div>
                      <p className="text-xs text-slate-400">
                        يمكنك إضافة موظف عمالة عارضة جديد وتوثيق بياناته، أو تعديل خيارات التصفية الحالية.
                      </p>
                      {canCreate && (
                        <button
                          onClick={handleOpenAdd}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>إضافة موظف الآن</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w, index) => {
                  const branchObj = branches.find((b) => b.id === w.branchId);
                  const shiftObj = shifts.find((s) => s.id === w.shift);

                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Index */}
                      <td className="p-4 text-center text-slate-500 font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Job ID & Reference Temp Code */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {w.jobId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/40 text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                {w.jobId}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30 text-xs">
                                {w.tempCode}
                              </span>
                              <span className="text-[10px] text-amber-400 font-semibold">(مؤقت)</span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 font-mono">
                            كود: {w.tempCode}
                          </div>
                        </div>
                      </td>

                      {/* Name & Basic Info */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{w.nameAr}</span>
                            {w.isTransferredToPermanent && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/40 font-bold">
                                مثبت بالكادر
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span className="font-mono">الوطني: {w.nationalId}</span>
                            {w.phone && (
                              <span className="flex items-center gap-1 font-mono text-slate-300">
                                <Phone className="w-3 h-3 text-cyan-400" />
                                {w.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Branch & Task */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{branchObj?.nameAr || w.branchId}</span>
                          </div>
                          <div className="text-xs text-cyan-300/90 font-medium">
                            {w.jobTitleAr}
                          </div>
                        </div>
                      </td>

                      {/* Shift & Daily Wage */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-teal-400" />
                            <span>{shiftObj?.nameAr || w.shift}</span>
                          </div>
                          {w.dailyWageRate ? (
                            <div className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                              <span>{w.dailyWageRate} د.ل / اليوم</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500">أجر مقطوع / شهري</div>
                          )}
                        </div>
                      </td>

                      {/* Commencement Date & Duration */}
                      <td className="p-4 text-xs text-slate-300">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 w-fit shadow-xs">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            <span>مباشرة: {w.commencementDate || w.startDate}</span>
                          </div>
                          {w.contractDurationDays && (
                            <div className="text-[11px] text-slate-300">
                              المدة: <strong className="text-white font-mono">{w.contractDurationDays}</strong> يوم
                            </div>
                          )}
                          {w.endDate && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              حتى: {w.endDate}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="p-4 text-center">
                        {w.approvalStatus === 'pending_hr_approval' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                            <ClockAlert className="w-3.5 h-3.5 animate-pulse" />
                            بانتظار اعتماد HR
                          </span>
                        )}
                        {w.approvalStatus === 'approved' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              معتمد بالرقم الوظيفي
                            </span>
                            {w.approvedByNameAr && (
                              <div className="text-[10px] text-slate-400">
                                بواسطة: {w.approvedByNameAr.split(' ')[0]}
                              </div>
                            )}
                          </div>
                        )}
                        {w.approvalStatus === 'transferred_to_permanent' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              مثبت بالكادر الدائم
                            </span>
                            {w.transferredAt && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {w.transferredAt.split(' ')[0]}
                              </div>
                            )}
                          </div>
                        )}
                        {w.approvalStatus === 'rejected' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                              <X className="w-3.5 h-3.5" />
                              مرفوض من HR
                            </span>
                            {w.rejectionReason && (
                              <div className="text-[10px] text-rose-400 max-w-[120px] truncate mx-auto" title={w.rejectionReason}>
                                {w.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Documents Vault Button */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenDocsModal(w)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow hover:border-cyan-500/40"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{w.documents?.length || 0}</span>
                          <span className="text-[11px] text-slate-400">مستند</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* HR Approval Action */}
                          {w.approvalStatus === 'pending_hr_approval' && canApprove && (
                            <button
                              onClick={() => handleOpenApprovalModal(w)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1"
                              title="اعتماد الموارد البشرية وإصدار الرقم الوظيفي"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>اعتماد HR</span>
                            </button>
                          )}

                          {/* Transfer to Permanent Action */}
                          {w.approvalStatus === 'approved' && !w.isTransferredToPermanent && canTransfer && (
                            <button
                              onClick={() => handleOpenTransferModal(w)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1"
                              title="نقل الموظف إلى سجل الموظفين الدائمين"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span>تثبيت بالكادر</span>
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(w)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="تعديل البيانات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteWorker(w)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 transition-colors"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT CASUAL WORKER */}
      {/* ========================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl my-8 text-right max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className="absolute left-6 top-6 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <UserPlus className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-black text-white">
                  {editingWorker ? 'تعديل بيانات موظف عمالة عارضة' : 'إضافة موظف عمالة عارضة جديد'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingWorker
                    ? 'تعديل تفاصيل المهمة والبيانات الشخصية للموظف المؤقت'
                    : 'تسجيل الكادر المؤقت وإصدار كود مرجعي بانتظار اعتماد الموارد البشرية'}
                </p>
              </div>
            </div>

            {/* Explanatory Policy Notice */}
            {!editingWorker && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-300 mb-1">
                    سياسة اعتماد العمالة العارضة بنظام نورسين:
                  </strong>
                  عند حفظ الموظف، يُسند له كود مرجعي مؤقت تلقائياً. لا يتم منح الموظف رقماً وظيفياً إلا بعد مراجعته واعتماده رسمياً من قبل إدارة الموارد البشرية (HR).
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitAddEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الاسم الرباعي الكامل <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="مثال: سالم مصطفى عبد السلام الورفلي"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الرقم الوطني الليبي (12 خانة) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={formNationalId}
                    onChange={(e) => setFormNationalId(e.target.value)}
                    placeholder="119960432189"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* Birth Year */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">سنة الميلاد</label>
                  <input
                    type="number"
                    min={1950}
                    max={2010}
                    value={formBirthYear}
                    onChange={(e) => setFormBirthYear(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1995"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="091-2345678"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="worker@example.ly"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الفرع المكلف به <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shift */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الدوام / الوردية <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Title / Task */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    المسمى الوظيفي أو طبيعة المهمة المكلف بها <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formJobTitleAr}
                    onChange={(e) => setFormJobTitleAr(e.target.value)}
                    placeholder="مثال: عامل شحن وتفريغ موسمي / فني صيانة طوارئ / مساعد مبيعات معارض"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* Daily Wage */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الأجر اليومي المتفق عليه (دينار ليبي)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={formDailyWage}
                    onChange={(e) => setFormDailyWage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="80"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* Commencement Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>تاريخ المباشرة (بدء العمل الفعلي)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formCommencementDate}
                    onChange={(e) => {
                      setFormCommencementDate(e.target.value);
                      if (formDurationDays && e.target.value) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + Number(formDurationDays));
                        setFormEndDate(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full bg-slate-950/80 border border-cyan-500/40 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    تاريخ مباشرة موظف العمالة العارضة لمهامه الفعلية
                  </p>
                </div>

                {/* Duration in Days */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">مدة التكليف بالأيام</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={formDurationDays}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setFormDurationDays(val);
                      if (val && formCommencementDate) {
                        const d = new Date(formCommencementDate);
                        d.setDate(d.getDate() + Number(val));
                        setFormEndDate(d.toISOString().split('T')[0]);
                      }
                    }}
                    placeholder="30"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تاريخ انتهاء التكليف المتوقع
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ملاحظات التكليف وترشيح الفرع
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="أسباب التكليف المؤقت، الجهة المرشحة، أو أي توصيات إدارية..."
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 shadow-inner resize-none"
                  />
                </div>

                {/* Initial Attachment Upload (Only in Add mode) */}
                {!editingWorker && (
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-cyan-400" />
                        <span>إرفاق مستندات أولية (اختياري - بطاقة / عقد / شهادة)</span>
                      </label>
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all">
                        <Upload className="w-3.5 h-3.5 inline ml-1" />
                        <span>اختر ملفاً</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleAddModalFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {initialAttachments.length > 0 && (
                      <div className="space-y-1.5">
                        {initialAttachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-semibold text-white">{att.fileName}</span>
                              <span className="text-slate-500">({formatFileSize(att.fileSize)})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setInitialAttachments((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-slate-400 hover:text-rose-400 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all"
                >
                  {editingWorker ? 'حفظ التعديلات' : 'تسجيل موظف العمالة العارضة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: HR APPROVAL & JOB ID ISSUANCE */}
      {/* ========================================================= */}
      {isApprovalModalOpen && workerToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 shadow-2xl text-right">
            {/* Close */}
            <button
              onClick={() => setIsApprovalModalOpen(false)}
              className="absolute left-6 top-6 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <ShieldCheck className="w-7 h-7" />
              </span>
              <div>
                <h3 className="text-xl font-black text-white">
                  اعتماد الموارد البشرية وإصدار الرقم الوظيفي
                </h3>
                <p className="text-xs text-amber-300/80">
                  مراجعة بيانات التكليف وتعيين الرقم الوظيفي الرسمي للموظف
                </p>
              </div>
            </div>

            {/* Worker Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-5 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">اسم الموظف:</span>
                <span className="text-white font-bold text-sm">{workerToApprove.nameAr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">الرقم الوطني:</span>
                <span className="text-cyan-300 font-mono font-bold">{workerToApprove.nationalId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">الفرع والمهمة:</span>
                <span className="text-slate-200">
                  {branches.find((b) => b.id === workerToApprove.branchId)?.nameAr || workerToApprove.branchId} -{' '}
                  {workerToApprove.jobTitleAr}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">تاريخ المباشرة:</span>
                <span className="text-cyan-300 font-mono font-bold">
                  {workerToApprove.commencementDate || workerToApprove.startDate}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">الكود المرجعي الحالي:</span>
                <span className="text-amber-300 font-mono">{workerToApprove.tempCode}</span>
              </div>
            </div>

            {!isRejecting ? (
              <div className="space-y-4">
                {/* Job ID Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      الرقم الوظيفي المعتمد (Job ID) <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      مقترح: NOR-C-{1040 + scopedCasualEmployees.length + 1}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={assignedJobIdInput}
                    onChange={(e) => setAssignedJobIdInput(e.target.value)}
                    placeholder="مثال: NOR-C-1045"
                    className="w-full bg-slate-950/90 border border-amber-500/40 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-cyan-300 focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    سيتم منح الموظف هذا الرقم الوظيفي رسمياً وربطه بسجلات الدوام والتكليف.
                  </p>
                </div>

                {/* Approval Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ملاحظات وتوصيات الموارد البشرية
                  </label>
                  <textarea
                    rows={2}
                    value={approvalNotesInput}
                    onChange={(e) => setApprovalNotesInput(e.target.value)}
                    placeholder="تم التدقيق ومطابقة المستندات والموافقة على التكليف المؤقت..."
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400 shadow-inner resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors"
                  >
                    رفض الطلب مع ذكر السبب
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsApprovalModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmApproval}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>اعتماد رسمي وإصدار الرقم</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
                  أنت على وشك رفض هذا الموظف. يرجى توضيح سبب الرفض لحفظه في السجل.
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    سبب الرفض <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="مثال: عدم استيفاء الشروط الصحية / عدم توفر الشاغر المؤقت..."
                    className="w-full bg-slate-950/90 border border-rose-500/40 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400 resize-none shadow-inner"
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    العودة لنموذج الاعتماد
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRejection}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
                  >
                    تأكيد الرفض
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TRANSFER CASUAL WORKER TO PERMANENT REGISTRY */}
      {/* ========================================================= */}
      {isTransferModalOpen && workerToTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 sm:p-8 shadow-2xl text-right">
            {/* Close */}
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute left-6 top-6 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <ArrowRightLeft className="w-7 h-7" />
              </span>
              <div>
                <h3 className="text-xl font-black text-white">
                  نقل وتثبيت في سجل الموظفين الدائمين
                </h3>
                <p className="text-xs text-cyan-300/80">
                  ترقية الكادر ونقله رسمياً إلى سجل الموظفين مع حذفه من العمالة العارضة
                </p>
              </div>
            </div>

            {/* Promotion & Removal Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-950/80 border border-cyan-500/40 mb-5 flex items-start gap-3 text-xs text-cyan-200 shadow-lg">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-white mb-0.5">
                  إجراء التثبيت ونقل الموظف للكادر الدائم:
                </strong>
                عند تأكيد التثبيت، ينتقل الموظف <strong>({workerToTransfer.nameAr})</strong> مباشرةً إلى{' '}
                <span className="text-cyan-300 font-bold">سجل الموظفين الدائمين</span> حاملاً تاريخ مباشرته ورقمه الوظيفي الجديد،{' '}
                <span className="text-amber-300 font-bold">ويختفي نهائياً من سجل العمالة العارضة</span>.
              </div>
            </div>

            <div className="space-y-4">
              {/* Permanent Job ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الرقم الوظيفي في الكادر الدائم <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetJobIdInput}
                  onChange={(e) => setTargetJobIdInput(e.target.value)}
                  placeholder="NOR-0104"
                  className="w-full bg-slate-950/90 border border-cyan-500/40 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
                />
              </div>

              {/* Commencement Date in Permanent Registry */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>تاريخ المباشرة في الكادر الدائم</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={targetCommencementDate}
                  onChange={(e) => setTargetCommencementDate(e.target.value)}
                  className="w-full bg-slate-950/90 border border-cyan-500/40 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  تاريخ مباشرة العمل الفعلي المعتمد في ملف الموظف بالسجل الدائم
                </p>
              </div>

              {/* Status in Permanent Registry */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الوضع الوظيفي المعتمد <span className="text-rose-400">*</span>
                </label>
                <select
                  value={targetStatusId}
                  onChange={(e) => setTargetStatusId(e.target.value as EmploymentStatusType)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  {employmentStatuses.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Vacation Balance */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رصيد الإجازات السنوية الممنوح (بالأيام)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={targetVacationDays}
                  onChange={(e) => setTargetVacationDays(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                />
              </div>

              {/* Transfer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  قرار النقل وملاحظات التثبيت
                </label>
                <textarea
                  rows={2}
                  value={transferNotesInput}
                  onChange={(e) => setTransferNotesInput(e.target.value)}
                  placeholder="بناءً على الكفاءة وموافقة الإدارة العامة..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 shadow-inner resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTransfer}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>تأكيد التثبيت ونقل الموظف</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DOCUMENTS VAULT & UPLOADER */}
      {/* ========================================================= */}
      {isDocsModalOpen && workerForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-purple-500/30 p-6 sm:p-8 shadow-2xl my-8 text-right max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setIsDocsModalOpen(false)}
              className="absolute left-6 top-6 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Paperclip className="w-7 h-7" />
              </span>
              <div>
                <h3 className="text-xl font-black text-white">
                  محفظة المستندات والوثائق الخاصة بالموظف
                </h3>
                <p className="text-xs text-purple-300/80">
                  {workerForDocs.nameAr} | {workerForDocs.jobId ? `الرقم الوظيفي: ${workerForDocs.jobId}` : `الكود: ${workerForDocs.tempCode}`}
                </p>
              </div>
            </div>

            {/* Document Upload Zone Form */}
            <form onSubmit={handleUploadDoc} className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 mb-6 shadow-inner">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>رفع مستند أو وثيقة جديدة</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Document Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    عنوان المستند <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docTitleInput}
                    onChange={(e) => setDocTitleInput(e.target.value)}
                    placeholder="مثال: صورة البطاقة الشخصية / عقد التكليف"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Document Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    تصنيف المستند <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={docCategoryInput}
                    onChange={(e) => {
                      const cat = e.target.value as CasualDocumentCategory;
                      setDocCategoryInput(cat);
                      if (!docTitleInput) setDocTitleInput(CATEGORY_LABELS[cat]);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File input button & info */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اختيار الملف (صور PNG/JPG أو مستند PDF) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      required
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-400 file:mr-0 file:ml-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 file:cursor-pointer"
                    />
                    {docFileSize > 0 && (
                      <span className="text-xs text-slate-400 font-mono shrink-0">
                        {formatFileSize(docFileSize)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!docFileBase64}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع وتوثيق المستند الآن</span>
                </button>
              </div>
            </form>

            {/* List of Attached Documents */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-300 flex items-center justify-between">
                <span>المستندات المرفوعة الحالية ({workerForDocs.documents?.length || 0}):</span>
              </h4>

              {(!workerForDocs.documents || workerForDocs.documents.length === 0) ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs">لم يتم رفع أي مستندات لهذا الموظف حتى الآن.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workerForDocs.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                              CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other
                            }`}
                          >
                            {CATEGORY_LABELS[doc.category] || 'أخرى'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white line-clamp-1" title={doc.title}>
                          {doc.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 font-mono truncate" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{doc.uploadedAt?.split(' ')[0]}</span>
                        <div className="flex items-center gap-1.5">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                            title="معاينة المستند"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Download Button */}
                          <a
                            href={doc.fileData}
                            download={doc.fileName}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
                            title="تحميل الملف"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(workerForDocs.id, doc.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                            title="حذف المستند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: DOCUMENT PREVIEW MODAL */}
      {/* ========================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl flex flex-col text-right">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">{previewDoc.title}</h3>
                <span className="text-xs text-slate-400 font-mono">({previewDoc.fileName})</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileData}
                  download={previewDoc.fileName}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 p-2 flex items-center justify-center min-h-[400px]">
              {previewDoc.fileType.startsWith('image/') || previewDoc.fileData.startsWith('data:image/') ? (
                <img
                  src={previewDoc.fileData}
                  alt={previewDoc.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : previewDoc.fileType === 'application/pdf' || previewDoc.fileName.endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileData}
                  title={previewDoc.title}
                  className="w-full h-[70vh] rounded-xl border border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center text-slate-400 space-y-3">
                  <FileText className="w-16 h-16 mx-auto text-slate-600" />
                  <p className="text-sm">لا يتوفر عرض مباشر لهذا النوع من الملفات.</p>
                  <a
                    href={previewDoc.fileData}
                    download={previewDoc.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل الملف للمعاينة على جهازك</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
