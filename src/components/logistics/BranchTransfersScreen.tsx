import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BranchTransfer, TransferStatus } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ShieldAlert,
  Building2,
  UserCheck,
  Send,
  Boxes,
  X,
  AlertCircle,
  Copy,
  Check,
  Scissors,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const LOGO_STORAGE_KEY = 'norseen_logistics_invoice_logo';

export const BranchTransfersScreen: React.FC = () => {
  const {
    currentUser,
    branches,
    transfers,
    scopedTransfers,
    createTransfer,
    pickupTransfer,
    receiveTransfer,
    updateTransfer,
    hasPermission,
    isGlobalUser,
  } = useApp();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TransferStatus | 'deficit'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected Transfer
  const [selectedTransfer, setSelectedTransfer] = useState<BranchTransfer | null>(null);

  // Form States - Create
  const [formOriginBranchId, setFormOriginBranchId] = useState<string>(() => {
    if (currentUser?.assignedBranchIds && currentUser.assignedBranchIds.length > 0 && currentUser.assignedBranchIds[0] !== '*') {
      return currentUser.assignedBranchIds[0];
    }
    return branches[0]?.id || '';
  });
  const [formDestBranchId, setFormDestBranchId] = useState<string>(() => {
    return branches.length > 1 ? branches[1].id : branches[0]?.id || '';
  });
  const [formSentPackages, setFormSentPackages] = useState<number>(10);
  const [formPackageDesc, setFormPackageDesc] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSenderManager, setFormSenderManager] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Form States - Pickup (مسؤول النقل عند التعبئة)
  const [pickupNotes, setPickupNotes] = useState('');
  const [pickupOfficerName, setPickupOfficerName] = useState('');
  const [pickupOfficerPackages, setPickupOfficerPackages] = useState<number>(0);
  const [pickupError, setPickupError] = useState<string | null>(null);

  // Form States - Receive & Verify (الفرع المستلم)
  const [receivedCount, setReceivedCount] = useState<number>(0);
  const [receiverManagerName, setReceiverManagerName] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiveFeedback, setReceiveFeedback] = useState<{
    show: boolean;
    hasDeficit: boolean;
    deficitCount: number;
    message: string;
  } | null>(null);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  // Copy tracking number feedback
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Custom Logo Upload for Official Invoices
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOGO_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Print Mode: 'two_copies_single_page' | 'single_copy_full' | 'sequential_pages'
  const [printMode, setPrintMode] = useState<'two_copies_single_page' | 'single_copy_full' | 'sequential_pages'>(
    'two_copies_single_page'
  );

  // Editable Signatures inside Print Modal
  const [printSenderManager, setPrintSenderManager] = useState('');
  const [printLogisticsOfficer, setPrintLogisticsOfficer] = useState('');
  const [printReceiverManager, setPrintReceiverManager] = useState('');

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomLogoUrl(result);
      try {
        localStorage.setItem(LOGO_STORAGE_KEY, result);
      } catch (err) {
        console.error('Error saving logo', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setCustomLogoUrl(null);
    try {
      localStorage.removeItem(LOGO_STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTrackingId(code);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  // Next upcoming serial calculation for preview in create modal
  const nextSerialPreview = useMemo(() => {
    let maxSeq = 1000;
    transfers.forEach((t) => {
      const match = t.trackingNumber.match(/TRP-2026-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    return `TRP-2026-${String(maxSeq + 1).padStart(4, '0')}`;
  }, [transfers]);

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    return scopedTransfers.filter((t) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchTracking = t.trackingNumber.toLowerCase().includes(q);
        const matchOrigin = t.originBranchNameAr.toLowerCase().includes(q);
        const matchDest = t.destinationBranchNameAr.toLowerCase().includes(q);
        const matchCreatedBy = t.createdByNameAr.toLowerCase().includes(q);
        const matchSenderManager = t.senderManagerNameAr ? t.senderManagerNameAr.toLowerCase().includes(q) : false;
        const matchReceiverManager = t.receiverManagerNameAr ? t.receiverManagerNameAr.toLowerCase().includes(q) : false;
        const matchPickedUp = t.pickedUpByNameAr ? t.pickedUpByNameAr.toLowerCase().includes(q) : false;
        const matchOfficer = t.logisticsOfficerNameAr ? t.logisticsOfficerNameAr.toLowerCase().includes(q) : false;
        const matchReceived = t.receivedByNameAr ? t.receivedByNameAr.toLowerCase().includes(q) : false;
        const matchDesc = t.packageDescriptionAr ? t.packageDescriptionAr.toLowerCase().includes(q) : false;
        const matchDate = t.createdAt.toLowerCase().includes(q) || (t.pickedUpAt && t.pickedUpAt.toLowerCase().includes(q)) || (t.receivedAt && t.receivedAt.toLowerCase().includes(q));

        if (
          !(
            matchTracking ||
            matchOrigin ||
            matchDest ||
            matchCreatedBy ||
            matchSenderManager ||
            matchReceiverManager ||
            matchPickedUp ||
            matchOfficer ||
            matchReceived ||
            matchDesc ||
            matchDate
          )
        ) {
          return false;
        }
      }

      if (statusFilter === 'deficit') {
        if (!t.hasDeficit) return false;
      } else if (statusFilter !== 'all') {
        if (t.status !== statusFilter) return false;
      }

      if (branchFilter !== 'all') {
        if (t.originBranchId !== branchFilter && t.destinationBranchId !== branchFilter) {
          return false;
        }
      }

      return true;
    });
  }, [scopedTransfers, searchTerm, statusFilter, branchFilter]);

  // Statistics KPI counts
  const kpis = useMemo(() => {
    const total = scopedTransfers.length;
    const pending = scopedTransfers.filter((t) => t.status === 'pending_pickup').length;
    const inTransit = scopedTransfers.filter((t) => t.status === 'in_transit').length;
    const delivered = scopedTransfers.filter((t) => t.status === 'delivered').length;
    const deficits = scopedTransfers.filter((t) => t.hasDeficit).length;
    const totalSent = scopedTransfers.reduce((acc, t) => acc + (t.sentPackages || 0), 0);
    const totalDeficitPackages = scopedTransfers.reduce((acc, t) => acc + (t.deficitPackages || 0), 0);

    return {
      total,
      pending,
      inTransit,
      delivered,
      deficits,
      totalSent,
      totalDeficitPackages,
    };
  }, [scopedTransfers]);

  // Deficit alerts requiring attention by HR / Admin
  const deficitTransfers = useMemo(() => {
    return transfers.filter((t) => t.hasDeficit);
  }, [transfers]);

  const canCreate = hasPermission('create_logistics_transfer') || isGlobalUser;
  const canPickup = hasPermission('pickup_logistics_transfer') || currentUser?.role === 'logistics_transport_officer' || isGlobalUser;
  const canReceive =
    hasPermission('receive_logistics_transfer') ||
    isGlobalUser ||
    currentUser?.role === 'branch_manager' ||
    currentUser?.role === 'assistant_branch_manager';
  const isHrOrAdmin =
    currentUser?.role === 'system_admin' || currentUser?.role === 'hr' || currentUser?.role === 'hr_officer' || isGlobalUser;

  // Handlers
  const handleOpenCreateModal = () => {
    setCreateError(null);
    let orig = branches[0]?.id || '';
    if (currentUser?.assignedBranchIds && currentUser.assignedBranchIds.length > 0 && currentUser.assignedBranchIds[0] !== '*') {
      orig = currentUser.assignedBranchIds[0];
    }
    setFormOriginBranchId(orig);

    const origBranch = branches.find((b) => b.id === orig);
    setFormSenderManager(origBranch?.managerName || currentUser?.fullNameAr || 'مدير الفرع');

    const dest = branches.find((b) => b.id !== orig)?.id || (branches.length > 1 ? branches[1].id : branches[0]?.id || '');
    setFormDestBranchId(dest);
    setFormSentPackages(10);
    setFormPackageDesc('');
    setFormNotes('');
    setIsCreateModalOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (formOriginBranchId === formDestBranchId) {
      setCreateError('لا يمكن أن يكون فرع الإرسال هو نفسه فرع الاستلام. يرجى اختيار فرعين مختلفين.');
      return;
    }

    if (!formSentPackages || formSentPackages <= 0) {
      setCreateError('يرجى تحديد عدد طرود صحيح (طرد واحد على الأقل).');
      return;
    }

    const res = createTransfer({
      originBranchId: formOriginBranchId,
      destinationBranchId: formDestBranchId,
      sentPackages: formSentPackages,
      packageDescriptionAr: formPackageDesc,
      notesAr: formNotes,
      senderManagerNameAr: formSenderManager.trim() || undefined,
    });

    if (!res.success) {
      setCreateError(res.error || 'حدث خطأ أثناء إنشاء إرسالية النقل');
      return;
    }

    setIsCreateModalOpen(false);
  };

  const handleOpenPickupModal = (t: BranchTransfer) => {
    setSelectedTransfer(t);
    setPickupOfficerName(t.logisticsOfficerNameAr || t.pickedUpByNameAr || currentUser?.fullNameAr || 'مسؤول النقل والشحن');
    setPickupOfficerPackages(t.sentPackages);
    setPickupNotes(t.logisticsNotesAr || 'تم استلام الشحنة وتأكيد عدد الطرود عند التعبئة');
    setPickupError(null);
    setIsPickupModalOpen(true);
  };

  const handleSubmitPickup = () => {
    if (!selectedTransfer) return;
    setPickupError(null);

    const res = pickupTransfer(
      selectedTransfer.id,
      pickupNotes,
      pickupOfficerPackages,
      pickupOfficerName
    );

    if (!res.success) {
      setPickupError(res.error || 'فشل استلام النقل');
      return;
    }

    setIsPickupModalOpen(false);
    setSelectedTransfer(null);
  };

  const handleOpenReceiveModal = (t: BranchTransfer) => {
    setSelectedTransfer(t);
    const dest = branches.find((b) => b.id === t.destinationBranchId);
    setReceivedCount(t.sentPackages);
    setReceiverManagerName(t.receiverManagerNameAr || dest?.managerName || currentUser?.fullNameAr || 'مدير الفرع المستلم');
    setReceiptNotes('');
    setReceiveError(null);
    setReceiveFeedback(null);
    setIsReceiveModalOpen(true);
  };

  const handleSubmitReceive = () => {
    if (!selectedTransfer) return;
    setReceiveError(null);

    const res = receiveTransfer(selectedTransfer.id, {
      receivedPackages: receivedCount,
      receiptNotesAr: receiptNotes,
      receiverManagerNameAr: receiverManagerName,
    });

    if (!res.success) {
      setReceiveError(res.error || 'فشل تأكيد الاستلام');
      return;
    }

    setReceiveFeedback({
      show: true,
      hasDeficit: res.hasDeficit,
      deficitCount: res.deficitCount,
      message: res.message,
    });

    setTimeout(() => {
      setIsReceiveModalOpen(false);
      setSelectedTransfer(null);
      setReceiveFeedback(null);
    }, 2500);
  };

  const handleOpenTimelineModal = (t: BranchTransfer) => {
    setSelectedTransfer(t);
    setIsTimelineModalOpen(true);
  };

  const handleOpenPrintModal = (t: BranchTransfer) => {
    setSelectedTransfer(t);
    const origBranch = branches.find((b) => b.id === t.originBranchId);
    const destBranch = branches.find((b) => b.id === t.destinationBranchId);

    setPrintSenderManager(t.senderManagerNameAr || origBranch?.managerName || t.createdByNameAr || 'مدير الفرع المرسل');
    setPrintLogisticsOfficer(t.logisticsOfficerNameAr || t.pickedUpByNameAr || 'مسؤول النقل والشحن');
    setPrintReceiverManager(t.receiverManagerNameAr || destBranch?.managerName || t.receivedByNameAr || 'مدير الفرع المستلم');
    setIsPrintModalOpen(true);
  };

  const handleExecutePrint = () => {
    if (selectedTransfer) {
      updateTransfer(selectedTransfer.id, {
        senderManagerNameAr: printSenderManager,
        logisticsOfficerNameAr: printLogisticsOfficer,
        receiverManagerNameAr: printReceiverManager,
      });
    }

    document.body.classList.add('printing-logistics-invoice');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-logistics-invoice');
      }, 500);
    }, 200);
  };

  // Render a Single Invoice Table matching /public/assets/aistudio/____18108af5.jpg
  const renderSingleInvoiceLayout = (
    transfer: BranchTransfer,
    copyLabel?: string,
    isSecondary = false
  ) => {
    const isMatched = transfer.status === 'delivered' && !transfer.hasDeficit;
    const isDeficit = transfer.status === 'delivered_with_deficit' || transfer.hasDeficit;
    const isInProgress = transfer.status === 'pending_pickup' || transfer.status === 'in_transit';

    // Format Phase Timestamps
    const creationTime = transfer.createdAt || '—';
    const pickupTime = transfer.pickedUpAt || 'قيد انتظار الاستلام';
    const receiptTime = transfer.receivedAt || 'قيد النقل والتسليم';

    const senderMgr = printSenderManager || transfer.senderManagerNameAr || 'مدير الفرع المرسل';
    const officerName = printLogisticsOfficer || transfer.logisticsOfficerNameAr || transfer.pickedUpByNameAr || 'مسؤول النقل';
    const receiverMgr = printReceiverManager || transfer.receiverManagerNameAr || 'مدير الفرع المستلم';

    return (
      <div
        className={`w-full bg-white text-[#0f2844] font-sans rounded-none border-2 border-[#1b4571] overflow-hidden select-none shadow-sm ${
          isSecondary ? 'print:mt-3' : ''
        }`}
        dir="rtl"
      >
        {/* Optional Copy Indicator Ribbon */}
        {copyLabel && (
          <div className="bg-[#1b4571] text-cyan-200 text-[10px] font-bold px-3 py-1 flex items-center justify-between border-b border-[#0f2844]/30">
            <span>{copyLabel}</span>
            <span className="font-mono text-white text-[10px] tracking-widest">
              الرقم التسلسلي: {transfer.trackingNumber}
            </span>
          </div>
        )}

        {/* 1. Header Bar (Dark Blue #1b4571 with White Bold Text) */}
        <div className="grid grid-cols-12 bg-[#1b4571] text-white border-b-2 border-[#1b4571] text-center font-bold items-stretch">
          {/* Right Column: Title (فاتورة نقل بين مخازن نورسين) */}
          <div className="col-span-5 p-3 flex flex-col items-center justify-center border-l-2 border-[#ffffff]/30">
            <h2 className="text-base sm:text-lg font-black tracking-wide leading-tight">
              فاتورة نقل بين مخازن نورسين
            </h2>
            <span className="text-[10px] text-cyan-200 font-mono mt-0.5">
              رقم الإرسالية: {transfer.trackingNumber}
            </span>
          </div>

          {/* Center Column: Logo (الشعار) */}
          <div className="col-span-3 p-2 flex flex-col items-center justify-center border-l-2 border-[#ffffff]/30 bg-[#163a60]">
            {customLogoUrl ? (
              <img
                src={customLogoUrl}
                alt="شعار المنظومة"
                className="max-h-12 max-w-full object-contain filter drop-shadow"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-wider text-white">الشعار</span>
                <span className="text-[9px] text-cyan-200 font-bold">NORSEEN ENTERPRISE</span>
              </div>
            )}
          </div>

          {/* Left Column: Receipt Date / Time (تاريخ الاستلام / الوقت) */}
          <div className="col-span-4 p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-xs sm:text-sm font-black">تاريخ الاستلام / الوقت</span>
            <span className="text-[11px] font-mono font-bold text-cyan-200 mt-0.5">
              {transfer.receivedAt ? transfer.receivedAt : transfer.createdAt}
            </span>
          </div>
        </div>

        {/* 2. Body Grid (6 Rows strictly matching reference image) */}
        <div className="border-b-2 border-[#1b4571] divide-y-2 divide-[#1b4571] text-xs font-bold">
          {/* Row 1: اسم الفرع المنقول منه */}
          <div className="grid grid-cols-12 items-center bg-[#dbe8f6]">
            <div className="col-span-4 bg-[#1b4571] text-white p-2.5 text-right font-black border-l-2 border-[#1b4571]">
              اسم الفرع المنقول منه
            </div>
            <div className="col-span-5 p-2.5 text-center text-[#0f2844] font-black text-sm border-l-2 border-[#1b4571]">
              {transfer.originBranchNameAr}
            </div>
            <div className="col-span-3 p-2 text-center text-[11px] text-slate-700 font-mono">
              إنشاء: {creationTime}
            </div>
          </div>

          {/* Row 2: عدد الطرود المرسله */}
          <div className="grid grid-cols-12 items-center bg-[#dbe8f6]">
            <div className="col-span-4 bg-[#1b4571] text-white p-2.5 text-right font-black border-l-2 border-[#1b4571]">
              عدد الطرود المرسله
            </div>
            <div className="col-span-5 p-2.5 text-center text-[#0f2844] font-black text-base font-mono border-l-2 border-[#1b4571]">
              {transfer.sentPackages} طرد
            </div>
            <div className="col-span-3 p-2 text-center text-[10px] text-slate-700 truncate">
              {transfer.packageDescriptionAr || 'مستلزمات ومطبوعات رسمية'}
            </div>
          </div>

          {/* Row 3: اسم مسؤول النقل */}
          <div className="grid grid-cols-12 items-center bg-[#dbe8f6]">
            <div className="col-span-4 bg-[#1b4571] text-white p-2.5 text-right font-black border-l-2 border-[#1b4571]">
              اسم مسؤول النقل
            </div>
            <div className="col-span-5 p-2.5 text-center text-[#0f2844] font-black text-sm border-l-2 border-[#1b4571]">
              {officerName}
            </div>
            <div className="col-span-3 p-2 text-center text-[11px] text-slate-700 font-mono">
              تعبئة: {pickupTime}
            </div>
          </div>

          {/* Row 4: عدد الطرود المستلمه من الفرع */}
          <div className="grid grid-cols-12 items-center bg-[#dbe8f6]">
            <div className="col-span-4 bg-[#1b4571] text-white p-2.5 text-right font-black border-l-2 border-[#1b4571]">
              عدد الطرود المستلمه من الفرع
            </div>
            <div className="col-span-5 p-2.5 text-center text-[#0f2844] font-black text-base font-mono border-l-2 border-[#1b4571]">
              {transfer.officerReceivedPackages !== undefined
                ? `${transfer.officerReceivedPackages} طرد`
                : `${transfer.sentPackages} طرد`}
            </div>
            <div className="col-span-3 p-2 text-center text-[10px] text-slate-700">
              {transfer.logisticsNotesAr || 'تأكيد التعبئة للشحن'}
            </div>
          </div>

          {/* Row 5: اسم الفرع المرسل اليه */}
          <div className="grid grid-cols-12 items-center bg-[#dbe8f6]">
            <div className="col-span-4 bg-[#1b4571] text-white p-2.5 text-right font-black border-l-2 border-[#1b4571]">
              اسم الفرع المرسل اليه
            </div>
            <div className="col-span-5 p-2.5 text-center text-[#0f2844] font-black text-sm border-l-2 border-[#1b4571]">
              {transfer.destinationBranchNameAr}
            </div>
            <div className="col-span-3 p-2 text-center text-[10px] text-slate-700">
              الوجهة المعتمدة
            </div>
          </div>

          {/* Row 6: عدد الطرود المستلمه */}
          <div className="grid grid-cols-12 items-center bg-[#dbe8f6]">
            <div className="col-span-4 bg-[#1b4571] text-white p-2.5 text-right font-black border-l-2 border-[#1b4571]">
              عدد الطرود المستلمه
            </div>
            <div className="col-span-5 p-2.5 text-center text-[#0f2844] font-black text-base font-mono border-l-2 border-[#1b4571]">
              {transfer.receivedPackages !== undefined ? `${transfer.receivedPackages} طرد` : '— (قيد النقل)'}
            </div>
            <div className="col-span-3 p-2 text-center text-[11px] text-slate-700 font-mono">
              استلام: {receiptTime}
            </div>
          </div>
        </div>

        {/* 3. Footer Section (4 Columns: 3 Signatures + Calculated Status) */}
        <div>
          {/* Footer Header Row (Dark Blue #1b4571, White Text) */}
          <div className="grid grid-cols-4 bg-[#1b4571] text-white border-b-2 border-[#1b4571] text-center font-black text-xs">
            <div className="p-2 border-l-2 border-[#ffffff]/30">توقيع مدير الفرع المرسل</div>
            <div className="p-2 border-l-2 border-[#ffffff]/30">توقيع مسؤول النقل</div>
            <div className="p-2 border-l-2 border-[#ffffff]/30">توقيع مدير الفرع المستلم</div>
            <div className="p-2">الحاله</div>
          </div>

          {/* Footer Content Row (Signatures lines and Auto-calculated Status) */}
          <div className="grid grid-cols-4 bg-[#dbe8f6] divide-x-2 divide-x-reverse divide-[#1b4571] text-xs">
            {/* Col 1: توقيع مدير الفرع المرسل */}
            <div className="p-3 flex flex-col justify-between items-center text-center min-h-[90px]">
              <span className="font-bold text-[#0f2844]">{senderMgr}</span>
              <div className="w-4/5 border-b-2 border-dashed border-[#1b4571] my-2" />
              <span className="text-[10px] text-slate-600 font-medium">الاعتماد والتسليم</span>
            </div>

            {/* Col 2: توقيع مسؤول النقل */}
            <div className="p-3 flex flex-col justify-between items-center text-center min-h-[90px]">
              <span className="font-bold text-[#0f2844]">{officerName}</span>
              <div className="w-4/5 border-b-2 border-dashed border-[#1b4571] my-2" />
              <span className="text-[10px] text-slate-600 font-medium">تأكيد الاستلام والشحن</span>
            </div>

            {/* Col 3: توقيع مدير الفرع المستلم */}
            <div className="p-3 flex flex-col justify-between items-center text-center min-h-[90px]">
              <span className="font-bold text-[#0f2844]">{receiverMgr}</span>
              <div className="w-4/5 border-b-2 border-dashed border-[#1b4571] my-2" />
              <span className="text-[10px] text-slate-600 font-medium">المطابقة والاستلام النهائي</span>
            </div>

            {/* Col 4: الحاله (Auto-Calculated Status: Green "مطابقة" or Red "يوجد عجز") */}
            <div className="p-2.5 flex flex-col justify-center items-center text-center min-h-[90px] bg-white">
              {isMatched && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50 border-2 border-emerald-600 text-emerald-800">
                  <span className="text-base sm:text-lg font-black tracking-wider text-emerald-700">
                    مطابقة
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 mt-0.5">
                    ({transfer.sentPackages} من {transfer.sentPackages} طرد)
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold">تطابق تام ومكتمل</span>
                </div>
              )}

              {isDeficit && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 rounded-lg bg-rose-50 border-2 border-rose-600 text-rose-800">
                  <span className="text-base sm:text-lg font-black tracking-wider text-rose-700 animate-pulse">
                    يوجد عجز
                  </span>
                  <span className="text-[11px] font-black text-rose-800 mt-0.5">
                    فارق العجز: ({transfer.deficitPackages} طرد)
                  </span>
                  <span className="text-[9px] text-rose-600 font-bold">تم إشعار HR والإدارة</span>
                </div>
              )}

              {isInProgress && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 rounded-lg bg-amber-50 border-2 border-amber-500 text-amber-900">
                  <span className="text-sm font-black text-amber-700">
                    {transfer.status === 'in_transit' ? 'جاري النقل' : 'بانتظار الاستلام'}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 mt-0.5">
                    المرسل: {transfer.sentPackages} طرد
                  </span>
                  <span className="text-[9px] text-amber-600">قيد المتابعة</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Hidden File Input for Logo Upload */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 1. Header Banner & Actions */}
      <div className="bg-[#061822]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-5 sm:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-teal-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Truck className="w-7 h-7 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  شاشة النقل والطرود بين الفروع
                </h1>
                <span className="text-xs bg-cyan-950/90 text-cyan-300 font-bold px-3 py-1 rounded-xl border border-cyan-500/40">
                  لوجستيات نورسين
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300/80 mt-1">
                توليد فواتير النقل بالأرقام التسلسلية الأوتوماتيكية، تتبع التواريخ على 3 مراحل، احتساب الحالة تلقائياً (مطابقة/عجز)، والطباعة بنسختين مع اعتماد الأطراف الثلاثة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Logo Settings Quick Button */}
            <button
              onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all shadow-md active:scale-95"
              title="رفع أو تغيير الشعار المعتمد في فواتير النقل الرسمية"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>{customLogoUrl ? 'تغيير شعار الفاتورة' : 'رفع شعار الفاتورة'}</span>
              {customLogoUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="تم تفعيل شعار مخصص" />
              )}
            </button>

            {canCreate && (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء نقل جديد (فاتورة)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Security Alert Banner for Deficits (إشعارات العجز للموارد البشرية ومدير النظام) */}
      {deficitTransfers.length > 0 && isHrOrAdmin && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/80 via-red-950/70 to-slate-950/80 border-2 border-rose-500/50 rounded-3xl shadow-[0_0_30px_rgba(244,63,94,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-300">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-rose-200">
                  بلاغ رقابي عاجل: تم رصد عجز في عدد الطرود المستلمة!
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-slate-950 font-black text-[11px]">
                  {deficitTransfers.length} رحلة مسجلة بنقص
                </span>
              </div>
              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                يوجد نقص في الطرود عند استلام الفرع الوجهة مقارنة بما تم شحنه. تم توثيق المحاضر رسمياً وإشعار الموارد البشرية ومدير النظام لمطابقة العجز والتحقيق الإداري.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setStatusFilter('deficit');
              setSearchTerm('');
            }}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 shrink-0"
          >
            استعراض فواتير العجز فوراً
          </button>
        </div>
      )}

      {/* 3. KPI Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#061822]/80 border border-cyan-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-cyan-300/80">
            <span>إجمالي الفواتير</span>
            <Boxes className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">{kpis.total}</div>
          <span className="text-[10px] text-slate-400 mt-1">مسار شحنات الفروع</span>
        </div>

        <div className="bg-[#061822]/80 border border-amber-500/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-300/80">
            <span>بانتظار النقل</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">{kpis.pending}</div>
          <span className="text-[10px] text-amber-400/70 mt-1">جاهزة للتعبئة والاستلام</span>
        </div>

        <div className="bg-[#061822]/80 border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-cyan-300">
            <span>جاري النقل</span>
            <Truck className="w-4 h-4 text-cyan-400 animate-bounce" />
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">{kpis.inTransit}</div>
          <span className="text-[10px] text-cyan-400/70 mt-1">بالطريق مع السائق</span>
        </div>

        <div className="bg-[#061822]/80 border border-emerald-500/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-300/80">
            <span>مستلم ومطابق</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">{kpis.delivered}</div>
          <span className="text-[10px] text-emerald-400/70 mt-1">تطابق تام بالأخضر</span>
        </div>

        <div
          className={`rounded-2xl p-4 flex flex-col justify-between transition-all ${
            kpis.deficits > 0
              ? 'bg-rose-950/70 border-2 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              : 'bg-[#061822]/80 border border-slate-700/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-300">
            <span>فواتير بعجز طرود</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-mono">{kpis.deficits}</div>
          <span className="text-[10px] text-rose-400 mt-1">
            {kpis.totalDeficitPackages > 0
              ? `نقص إجمالي ${kpis.totalDeficitPackages} طرد بالأحمر`
              : 'لا يوجد عجز مسجل'}
          </span>
        </div>

        <div className="bg-[#061822]/80 border border-teal-500/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-teal-300/80">
            <span>إجمالي الطرود</span>
            <Package className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">{kpis.totalSent}</div>
          <span className="text-[10px] text-teal-400/70 mt-1">طرد منقول بالمنظومة</span>
        </div>
      </div>

      {/* 4. Controls & Search Filter Bar */}
      <div className="bg-[#061822]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-lg">
        {/* Instant Search Bar */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث فوري برقم الفاتورة (مثال: TRP-2026-0001) أو الفرع أو السائق..."
            className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl pr-10 pl-9 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            الكل ({kpis.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending_pickup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'pending_pickup'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900/60 text-amber-300 hover:bg-slate-800'
            }`}
          >
            بانتظار الاستلام ({kpis.pending})
          </button>
          <button
            onClick={() => setStatusFilter('in_transit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'in_transit'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900/60 text-cyan-300 hover:bg-slate-800'
            }`}
          >
            جاري النقل ({kpis.inTransit})
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'delivered'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900/60 text-emerald-300 hover:bg-slate-800'
            }`}
          >
            مكتمل ومطابق ({kpis.delivered})
          </button>
          <button
            onClick={() => setStatusFilter('deficit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'deficit'
                ? 'bg-rose-600 text-white font-black shadow-md'
                : 'bg-slate-900/60 text-rose-300 hover:bg-slate-800'
            }`}
          >
            عجز طرود ({kpis.deficits})
          </button>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-slate-900/90 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">كافة الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Main Transfers Table */}
      <div className="bg-[#061822]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-slate-900/80 via-cyan-950/20 to-slate-900/80">
          <div className="flex items-center gap-3">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              سجل فواتير النقل وشحنات الفروع ({filteredTransfers.length})
            </h2>
          </div>
          <span className="text-[11px] text-cyan-300 font-mono">
            نظام التتبع على 3 مراحل (إنشاء، سائق، استلام فرع)
          </span>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Truck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">لا توجد فواتير نقل مطابقة للبحث</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              يمكنك تغيير فلاتر البحث أو إنشاء فاتورة نقل جديدة بين الفروع لتتبع دورة الاستلام على 3 مراحل وتوليد الفاتورة الرسمية.
            </p>
            {canCreate && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء فاتورة الآن</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-cyan-500/20 text-cyan-300 font-extrabold">
                  <th className="p-4">الرقم التسلسلي للفاتورة</th>
                  <th className="p-4">مسار النقل (المصدر ➔ الوجهة)</th>
                  <th className="p-4 text-center">الطرود والمطابقة</th>
                  <th className="p-4 text-center">الحالة المحتسبة</th>
                  <th className="p-4">تتبع التواريخ على 3 مراحل</th>
                  <th className="p-4 text-center">الإجراءات والطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filteredTransfers.map((t) => {
                  const isPending = t.status === 'pending_pickup';
                  const isInTransit = t.status === 'in_transit';
                  const isDelivered = t.status === 'delivered';
                  const isDeficit = t.status === 'delivered_with_deficit' || t.hasDeficit;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-cyan-950/20 transition-colors ${
                        isDeficit ? 'bg-rose-950/20 border-l-4 border-l-rose-500' : ''
                      }`}
                    >
                      {/* Serial Number & Creation By */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-cyan-300 tracking-wider">
                            {t.trackingNumber}
                          </span>
                          <button
                            onClick={() => handleCopyTracking(t.trackingNumber)}
                            title="نسخ الرقم التسلسلي"
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-all"
                          >
                            {copiedTrackingId === t.trackingNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          المنشئ: {t.createdByNameAr}
                        </div>
                        {t.senderManagerNameAr && (
                          <div className="text-[10px] text-cyan-400/80">
                            مدير المصدر: {t.senderManagerNameAr}
                          </div>
                        )}
                      </td>

                      {/* Origin & Destination Route */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-200">
                            {t.originBranchNameAr}
                          </span>
                          <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-teal-500/30 text-teal-200">
                            {t.destinationBranchNameAr}
                          </span>
                        </div>
                        {t.packageDescriptionAr && (
                          <div className="text-[11px] text-slate-300/80 mt-1.5 truncate max-w-xs">
                            {t.packageDescriptionAr}
                          </div>
                        )}
                      </td>

                      {/* Packages count & Match/Deficit calculation */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 text-xs font-black">
                              المرسل: {t.sentPackages}
                            </span>
                            {t.receivedPackages !== undefined && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-xs font-black ${
                                  isDeficit
                                    ? 'bg-rose-950 border border-rose-500 text-rose-300'
                                    : 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                                }`}
                              >
                                المستلم: {t.receivedPackages}
                              </span>
                            )}
                          </div>

                          {/* Live Badges */}
                          {isPending && (
                            <span className="text-[10px] text-amber-300 font-semibold">
                              بانتظار استلام السائق
                            </span>
                          )}
                          {isInTransit && (
                            <span className="text-[10px] text-cyan-300 font-semibold">
                              بالطريق مع السائق
                            </span>
                          )}
                          {isDelivered && (
                            <span className="text-[10px] text-emerald-300 font-black inline-flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> مطابقة تامة
                            </span>
                          )}
                          {isDeficit && (
                            <span className="text-[10px] text-rose-300 font-black inline-flex items-center gap-1 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/40 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-rose-400" /> يوجد عجز ({t.deficitPackages} طرد)!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[11px] font-black">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            بانتظار الاستلام
                          </span>
                        )}
                        {isInTransit && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[11px] font-black">
                            <Truck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            جاري النقل
                          </span>
                        )}
                        {isDelivered && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            مطابقة (أخضر)
                          </span>
                        )}
                        {isDeficit && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/90 text-rose-300 border border-rose-500/60 text-[11px] font-black shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            يوجد عجز (أحمر)
                          </span>
                        )}
                      </td>

                      {/* 3-Phase Dates Tracking */}
                      <td className="p-4 font-mono text-[11px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[9px] font-bold">1</span>
                            <span>إنشاء: {t.createdAt}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-300/90">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-bold">2</span>
                            <span>السائق: {t.pickedUpAt || 'قيد الانتظار'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-teal-300/90">
                            <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-[9px] font-bold">3</span>
                            <span>الفرع: {t.receivedAt || 'قيد النقل'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions & Print */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending && canPickup && (
                            <button
                              onClick={() => handleOpenPickupModal(t)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition-all shadow-md active:scale-95 inline-flex items-center gap-1"
                              title="استلام مسؤول النقل (السائق) وتغيير الحالة إلى جاري النقل"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>استلام السائق</span>
                            </button>
                          )}

                          {isInTransit && canReceive && (
                            <button
                              onClick={() => handleOpenReceiveModal(t)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-[11px] transition-all shadow-md active:scale-95 inline-flex items-center gap-1"
                              title="تأكيد استلام الفرع ومطابقة الطرود آلياً"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>استلام ومطابقة</span>
                            </button>
                          )}

                          {/* Timeline / 3-Phases Modal */}
                          <button
                            onClick={() => handleOpenTimelineModal(t)}
                            className="p-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105"
                            title="عرض تتبع المراحل الثلاث الكامل"
                          >
                            <Clock className="w-4 h-4" />
                          </button>

                          {/* Print Official Invoice */}
                          <button
                            onClick={() => handleOpenPrintModal(t)}
                            className="p-2 rounded-xl bg-slate-900/80 hover:bg-teal-950 text-teal-300 border border-teal-500/30 transition-all hover:scale-105"
                            title="طباعة فاتورة نقل بين مخازن نورسين"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: CREATE NEW TRANSFER / INVOICE               */}
      {/* ==================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#061822] border-2 border-cyan-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-scaleUp">
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <Send className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">إنشاء فاتورة نقل جديدة بين الفروع</h3>
                  <div className="text-xs text-cyan-300 flex items-center gap-2 mt-0.5">
                    <span>الرقم التسلسلي الأوتوماتيكي:</span>
                    <span className="font-mono font-black text-white bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
                      {nextSerialPreview}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
              {createError && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Origin Branch Selection */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                  الفرع المنقول منه (فرع المصدر) *
                </label>
                <select
                  value={formOriginBranchId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormOriginBranchId(id);
                    const b = branches.find((item) => item.id === id);
                    if (b?.managerName) setFormSenderManager(b.managerName);
                  }}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameAr} ({b.cityAr}) - المدير: {b.managerName || 'غير محدد'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sender Branch Manager Name for Signature */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                  اسم مدير الفرع المرسل (لاعتماد وتوقيع الفاتورة) *
                </label>
                <input
                  type="text"
                  value={formSenderManager}
                  onChange={(e) => setFormSenderManager(e.target.value)}
                  placeholder="اسم مدير الفرع المرسل"
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Destination Branch Selection */}
              <div>
                <label className="block text-xs font-bold text-teal-300 mb-1.5">
                  الفرع المنقول له (فرع الوجهة) *
                </label>
                <select
                  value={formDestBranchId}
                  onChange={(e) => setFormDestBranchId(e.target.value)}
                  className="w-full bg-slate-900 border border-teal-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-400"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === formOriginBranchId}>
                      {b.nameAr} ({b.cityAr}) {b.id === formOriginBranchId ? '- (نفس فرع المصدر)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sent Packages Count */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                  عدد الطرود المرسلة *
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    value={formSentPackages}
                    onChange={(e) => setFormSentPackages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  وصف محتويات الطرود والشحنة
                </label>
                <input
                  type="text"
                  value={formPackageDesc}
                  onChange={(e) => setFormPackageDesc(e.target.value)}
                  placeholder="مثال: صناديق مستلزمات طباعة، فواتير دورية، دفاتر تسليم، معدات..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* General Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ملاحظات وتوجيهات الشحن (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="تعليمات خاصة بالتسليم، ساعات الوردية المفضلة، عهدة خاصة..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg active:scale-95"
                >
                  إصدار الفاتورة وتوليد الرقم التسلسلي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: LOGISTICS OFFICER / DRIVER PICKUP           */}
      {/* ==================================================== */}
      {isPickupModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#061822] border-2 border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.25)] animate-scaleUp">
            <div className="p-5 border-b border-amber-500/20 flex items-center justify-between bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">استلام السائق ومسؤول النقل عند التعبئة</h3>
                  <p className="text-xs text-amber-300/80">
                    توثيق استلام الشحنة من الفرع وتحويل الحالة إلى [جاري النقل]
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPickupModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {pickupError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300">
                  {pickupError}
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">الرقم التسلسلي للفاتورة:</span>
                  <span className="font-mono font-black text-amber-300 text-sm">
                    {selectedTransfer.trackingNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">المسار:</span>
                  <span className="font-bold text-white">
                    {selectedTransfer.originBranchNameAr} ➔ {selectedTransfer.destinationBranchNameAr}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">عدد الطرود المرسلة من الفرع:</span>
                  <span className="font-black text-amber-300 font-mono text-sm">
                    {selectedTransfer.sentPackages} طرد
                  </span>
                </div>
              </div>

              {/* Officer / Driver Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم السائق / مسؤول النقل المعتمد (لتوقيع الفاتورة) *
                </label>
                <input
                  type="text"
                  value={pickupOfficerName}
                  onChange={(e) => setPickupOfficerName(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Count of parcels received by officer */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  عدد الطرود المستلمة من الفرع بواسطة مسؤول النقل (المسجلة في الفاتورة)
                </label>
                <input
                  type="number"
                  min={1}
                  value={pickupOfficerPackages}
                  onChange={(e) => setPickupOfficerPackages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Officer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ملاحظات الشحن ورقم المركبة
                </label>
                <input
                  type="text"
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="مثال: تم الاستلام والتعبئة بشاحنة نورسين رقم 104"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPickupModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmitPickup}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg active:scale-95"
                >
                  تأكيد استلام السائق ➔ جاري النقل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: DESTINATION RECEIVE & AUTO VERIFICATION     */}
      {/* ==================================================== */}
      {isReceiveModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#061822] border-2 border-cyan-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-scaleUp">
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">الاستلام النهائي ومطابقة الطرود</h3>
                  <p className="text-xs text-teal-300/80">
                    فرع الاستلام: {selectedTransfer.destinationBranchNameAr}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!receiveFeedback?.show) setIsReceiveModalOpen(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {receiveError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300">
                  {receiveError}
                </div>
              )}

              {/* Feedback Success / Deficit Notification */}
              {receiveFeedback && receiveFeedback.show && (
                <div
                  className={`p-4 rounded-2xl border ${
                    receiveFeedback.hasDeficit
                      ? 'bg-rose-950 border-rose-500 text-rose-200'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-200'
                  } space-y-2 animate-scaleUp`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {receiveFeedback.hasDeficit ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    <span>
                      {receiveFeedback.hasDeficit
                        ? 'تم تسجيل عجز وإشعار الموارد البشرية ومدير النظام!'
                        : 'استلام مطابق ومكتمل بالأخضر!'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{receiveFeedback.message}</p>
                </div>
              )}

              {/* Sent Summary */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">الرقم التسلسلي للفاتورة:</span>
                  <span className="font-mono font-black text-cyan-300">
                    {selectedTransfer.trackingNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">من فرع:</span>
                  <span className="font-bold text-white">{selectedTransfer.originBranchNameAr}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">عدد الطرود المرسلة وفق الفاتورة:</span>
                  <span className="font-mono font-black text-cyan-300 text-base">
                    {selectedTransfer.sentPackages} طرد
                  </span>
                </div>
              </div>

              {/* Parcels Count Input for Reception */}
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  أدخل عدد الطرود المستلمة فعلياً في الفرع *
                </label>
                <div className="relative">
                  <Boxes className="w-5 h-5 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={0}
                    value={receivedCount}
                    onChange={(e) => setReceivedCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border-2 border-cyan-500/40 rounded-xl pr-12 pl-4 py-3 text-lg font-mono font-black text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              {/* Dynamic live match / deficit preview */}
              {receivedCount === selectedTransfer.sentPackages ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    تطابق تام (أخضر): عدد الطرود المستلمة مطابق تماماً للطرود المرسلة ({receivedCount} من{' '}
                    {selectedTransfer.sentPackages}).
                  </span>
                </div>
              ) : receivedCount < selectedTransfer.sentPackages ? (
                <div className="p-3.5 bg-rose-950/80 border-2 border-rose-500/60 rounded-2xl space-y-1.5 text-rose-200">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                    <span>
                      تنبيه عجز (أحمر): يوجد نقص بمقدار ({selectedTransfer.sentPackages - receivedCount}) طرد!
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    المرسل: {selectedTransfer.sentPackages} طرد | المستلم: {receivedCount} طرد. سيتم
                    احتساب الحالة تلقائياً وتلوينها بالأحمر مع إشعار الموارد البشرية والإدارة.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-xs text-amber-300 font-bold">
                  ملاحظة: عدد الطرود المستلمة ({receivedCount}) أكبر من المرسل ({selectedTransfer.sentPackages}).
                </div>
              )}

              {/* Receiver Branch Manager Name for Approval */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم مدير الفرع المستلم (لتوقيع واعتماد الفاتورة) *
                </label>
                <input
                  type="text"
                  value={receiverManagerName}
                  onChange={(e) => setReceiverManagerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Notes on reception */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  محضر الفحص وملاحظات الاستلام
                </label>
                <textarea
                  rows={2}
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="تدوين أي ملاحظات على حالة الطرود أو سبب العجز في حال وجوده..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmitReceive}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg active:scale-95"
                >
                  اعتماد استلام الفرع والمطابقة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: TIMELINE & 3-PHASE AUDIT (تتبع المراحل الثلاث) */}
      {/* ==================================================== */}
      {isTimelineModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#061822] border-2 border-cyan-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(6,182,212,0.35)] animate-scaleUp">
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    تتبع التواريخ على 3 مراحل: {selectedTransfer.trackingNumber}
                  </h3>
                  <p className="text-xs text-cyan-300/80">
                    {selectedTransfer.originBranchNameAr} ➔ {selectedTransfer.destinationBranchNameAr}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTimelineModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Trip General Info Card */}
              <div className="bg-slate-900/80 border border-cyan-500/25 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">الرقم التسلسلي</span>
                  <span className="font-mono font-black text-cyan-300 text-sm">{selectedTransfer.trackingNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الطرود المرسلة</span>
                  <span className="font-mono font-black text-white text-sm">{selectedTransfer.sentPackages} طرد</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الطرود المستلمة</span>
                  <span className="font-mono font-black text-teal-300 text-sm">
                    {selectedTransfer.receivedPackages !== undefined
                      ? `${selectedTransfer.receivedPackages} طرد`
                      : 'قيد النقل'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الحالة المحتسبة</span>
                  <span
                    className={`font-black text-xs ${
                      selectedTransfer.hasDeficit
                        ? 'text-rose-400'
                        : selectedTransfer.status === 'delivered'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {selectedTransfer.hasDeficit
                      ? `عجز (${selectedTransfer.deficitPackages} طرد)`
                      : selectedTransfer.status === 'delivered'
                      ? 'مطابقة تامة'
                      : 'قيد المتابعة'}
                  </span>
                </div>
              </div>

              {/* Vertical Audit Timeline (3 Stages) */}
              <div className="relative border-r-2 border-cyan-500/30 pr-6 mr-3 space-y-6">
                {/* Stage 1: Origin Branch Creation */}
                <div className="relative">
                  <span className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[#061822] shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-cyan-300 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        المرحلة 1: إنشاء الفرع المرسل وإصدار الفاتورة
                      </span>
                      <span className="font-mono text-cyan-400 font-bold text-[11px]">{selectedTransfer.createdAt}</span>
                    </div>
                    <div className="text-xs text-white">
                      فرع الإرسال: <strong>{selectedTransfer.originBranchNameAr}</strong> | القائم بالإنشاء: <strong>{selectedTransfer.createdByNameAr}</strong>
                    </div>
                    {selectedTransfer.senderManagerNameAr && (
                      <div className="text-xs text-cyan-200">
                        توقيع واعتماد مدير الفرع: <strong>{selectedTransfer.senderManagerNameAr}</strong>
                      </div>
                    )}
                    <div className="text-xs text-slate-300">
                      تم تسجيل عدد <strong>{selectedTransfer.sentPackages} طرد</strong> وتجهيزها للتعبئة.
                    </div>
                  </div>
                </div>

                {/* Stage 2: Driver / Logistics Officer Pickup */}
                <div className="relative">
                  <span
                    className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-4 border-[#061822] ${
                      selectedTransfer.pickedUpAt
                        ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                        : 'bg-slate-700'
                    }`}
                  />
                  <div
                    className={`rounded-2xl p-4 space-y-1.5 border ${
                      selectedTransfer.pickedUpAt ? 'bg-slate-900/60 border-amber-500/30' : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-amber-300 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        المرحلة 2: استلام السائق ومسؤول النقل عند التعبئة
                      </span>
                      <span className="font-mono text-amber-400 font-bold text-[11px]">
                        {selectedTransfer.pickedUpAt || 'بانتظار استلام السائق'}
                      </span>
                    </div>
                    {selectedTransfer.pickedUpAt ? (
                      <>
                        <div className="text-xs text-white">
                          السائق المستلم: <strong>{selectedTransfer.logisticsOfficerNameAr || selectedTransfer.pickedUpByNameAr}</strong>
                        </div>
                        <div className="text-xs text-amber-200">
                          الطرود المستلمة عند التعبئة: <strong>{selectedTransfer.officerReceivedPackages || selectedTransfer.sentPackages} طرد</strong>
                        </div>
                        <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg">
                          ملاحظات الشحن: {selectedTransfer.logisticsNotesAr || 'تم استلام الشحنة وتأكيد الطرود بنجاح'}
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        لم يقم مسؤول النقل والشحن بتأكيد الاستلام بعد، الشحنة جاهزة للتعبئة في الفرع المصدر.
                      </p>
                    )}
                  </div>
                </div>

                {/* Stage 3: Final Destination Branch Receipt */}
                <div className="relative">
                  <span
                    className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-4 border-[#061822] ${
                      selectedTransfer.receivedAt
                        ? selectedTransfer.hasDeficit
                          ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                          : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                        : 'bg-slate-700'
                    }`}
                  />
                  <div
                    className={`rounded-2xl p-4 space-y-1.5 border ${
                      selectedTransfer.receivedAt
                        ? selectedTransfer.hasDeficit
                          ? 'bg-rose-950/40 border-rose-500/50'
                          : 'bg-slate-900/60 border-emerald-500/30'
                        : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-black flex items-center gap-1.5 ${
                          selectedTransfer.hasDeficit ? 'text-rose-300' : 'text-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        المرحلة 3: الاستلام النهائي للفرع المستلم ومطابقة الطرود
                      </span>
                      <span className="font-mono text-slate-300 font-bold text-[11px]">
                        {selectedTransfer.receivedAt || 'قيد النقل والتسليم'}
                      </span>
                    </div>
                    {selectedTransfer.receivedAt ? (
                      <>
                        <div className="text-xs text-white">
                          الفرع المستلم: <strong>{selectedTransfer.destinationBranchNameAr}</strong> | الموظف المستلم: <strong>{selectedTransfer.receivedByNameAr}</strong>
                        </div>
                        {selectedTransfer.receiverManagerNameAr && (
                          <div className="text-xs text-teal-200">
                            توقيع مدير الفرع المستلم: <strong>{selectedTransfer.receiverManagerNameAr}</strong>
                          </div>
                        )}
                        <div className="text-xs">
                          عدد الطرود المستلمة فعلياً:{' '}
                          <strong className="font-mono text-cyan-300">{selectedTransfer.receivedPackages} طرد</strong>{' '}
                          (المرسل: {selectedTransfer.sentPackages})
                        </div>
                        {selectedTransfer.receiptNotesAr && (
                          <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg">
                            محضر الجرد: {selectedTransfer.receiptNotesAr}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        الشحنة لم تصل إلى الفرع المستلم بعد أو بانتظار الجرد والمطابقة.
                      </p>
                    )}
                  </div>
                </div>

                {/* Deficit Alert Warning */}
                {selectedTransfer.hasDeficit && selectedTransfer.deficitAlertDetails && (
                  <div className="relative">
                    <span className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-rose-500 border-4 border-[#061822] shadow-[0_0_12px_rgba(244,63,94,1)] animate-ping" />
                    <div className="bg-rose-950/70 border-2 border-rose-500/70 rounded-2xl p-4 space-y-2 text-rose-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-rose-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          محضر إشعار العجز (الموارد البشرية + مدير النظام)
                        </span>
                        <span className="font-mono text-rose-300 text-[11px]">
                          {selectedTransfer.deficitAlertDetails.reportedAt}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {selectedTransfer.deficitAlertDetails.alertMessageAr}
                      </p>
                      <div className="text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-rose-500/30 flex items-center justify-between">
                        <span>
                          رقم البلاغ: <strong className="font-mono">{selectedTransfer.deficitAlertDetails.alertId}</strong>
                        </span>
                        <span className="text-rose-400 font-bold">
                          عجز بمقدار {selectedTransfer.deficitPackages} طرد
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                <button
                  onClick={() => handleOpenPrintModal(selectedTransfer)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فاتورة النقل الرسمية</span>
                </button>
                <button
                  onClick={() => setIsTimelineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: PRINT TRANSFER INVOICE (فاتورة نقل بين مخازن) */}
      {/* ==================================================== */}
      {isPrintModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Top Toolbar / Configuration Bar */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    معاينة وطباعة: فاتورة نقل بين مخازن نورسين
                  </h3>
                  <span className="text-[11px] text-cyan-300 font-mono">
                    الرقم التسلسلي: {selectedTransfer.trackingNumber}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecutePrint}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Settings Options (Print mode, custom logo, 3 signatures) */}
            <div className="p-4 bg-slate-950/80 border-b border-cyan-500/15 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Option 1: Print Mode Selector */}
              <div>
                <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                  تنسيق الطباعة المعتمد:
                </label>
                <select
                  value={printMode}
                  onChange={(e: any) => setPrintMode(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="two_copies_single_page">
                    نسختين في ورقة واحدة (A4 مقسومة: أصل + صورة)
                  </option>
                  <option value="single_copy_full">نسخة واحدة كاملة (صفحة كاملة)</option>
                  <option value="sequential_pages">صفحات متتالية (صفحة أصل + صفحة صورة)</option>
                </select>
              </div>

              {/* Option 2: Dynamic Logo Upload / Change */}
              <div>
                <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                  شعار الفاتورة (رفع / تغيير الشعار أوتوماتيكياً):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{customLogoUrl ? 'تغيير الشعار' : 'رفع شعار جديد'}</span>
                  </button>
                  {customLogoUrl && (
                    <button
                      onClick={handleResetLogo}
                      title="استعادة الشعار الافتراضي"
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 3: 3-Party Signatures Quick Edit */}
              <div>
                <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                  تعديل أسماء الموقعين الثلاثة:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    value={printSenderManager}
                    onChange={(e) => setPrintSenderManager(e.target.value)}
                    placeholder="مدير المرسل"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white"
                    title="اسم مدير الفرع المرسل"
                  />
                  <input
                    type="text"
                    value={printLogisticsOfficer}
                    onChange={(e) => setPrintLogisticsOfficer(e.target.value)}
                    placeholder="السائق / مسؤول النقل"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white"
                    title="اسم مسؤول النقل"
                  />
                  <input
                    type="text"
                    value={printReceiverManager}
                    onChange={(e) => setPrintReceiverManager(e.target.value)}
                    placeholder="مدير المستلم"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white"
                    title="اسم مدير الفرع المستلم"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Printable Document Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-800/40">
              <div
                id="norseen-logistics-print-area"
                className="max-w-[780px] mx-auto bg-white p-4 sm:p-6 shadow-2xl rounded-xl space-y-4 text-slate-950"
              >
                {/* MODE 1: Two Copies on a Single A4 Page (Divided by a Scissor Cut Line) */}
                {printMode === 'two_copies_single_page' && (
                  <div className="space-y-4">
                    {/* Copy 1: Original for Sending Branch */}
                    {renderSingleInvoiceLayout(
                      selectedTransfer,
                      'نسخة (1): أصل الفرع المنقول منه (المصدر)'
                    )}

                    {/* Perforated Cut Line */}
                    <div className="relative py-2 flex items-center justify-center">
                      <div className="w-full border-t-2 border-dashed border-[#1b4571]/60" />
                      <div className="absolute bg-white px-3 text-[11px] font-bold text-[#1b4571] flex items-center gap-1.5 border border-[#1b4571]/30 rounded-full shadow-sm">
                        <Scissors className="w-3.5 h-3.5 text-[#1b4571]" />
                        <span>خط القص المعتمد (قص الورقة إلى نسختين متطابقتين)</span>
                      </div>
                    </div>

                    {/* Copy 2: Duplicate for Receiving Branch */}
                    {renderSingleInvoiceLayout(
                      selectedTransfer,
                      'نسخة (2): صورة الفرع المنقول له (المستلم)',
                      true
                    )}
                  </div>
                )}

                {/* MODE 2: Single Full Size Copy */}
                {printMode === 'single_copy_full' && (
                  <div className="py-2">
                    {renderSingleInvoiceLayout(
                      selectedTransfer,
                      'النسخة الرسمية المعتمدة - منظومة نورسين'
                    )}
                  </div>
                )}

                {/* MODE 3: Sequential Pages (Copy 1 on Page 1, Copy 2 on Page 2) */}
                {printMode === 'sequential_pages' && (
                  <div className="space-y-6">
                    <div className="print-page-break">
                      {renderSingleInvoiceLayout(
                        selectedTransfer,
                        'الصفحة 1: أصل الفرع المنقول منه (المصدر)'
                      )}
                    </div>
                    <div>
                      {renderSingleInvoiceLayout(
                        selectedTransfer,
                        'الصفحة 2: صورة الفرع المنقول له (المستلم)',
                        true
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
