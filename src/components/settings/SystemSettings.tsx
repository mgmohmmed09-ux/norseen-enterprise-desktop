import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Branch,
  EmploymentStatusConfig,
  ShiftConfig,
  ItemCategory,
  MainSection,
  SubSection,
} from '../../types';
import {
  Settings,
  Building2,
  Clock,
  Briefcase,
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Phone,
  MapPin,
  User,
  UserCheck,
  BadgeCheck,
  AlertCircle,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Database,
  Cloud,
  RefreshCw,
  Monitor,
} from 'lucide-react';
import { DesktopDomainSyncTab } from './DesktopDomainSyncTab';

export const SystemSettings: React.FC = () => {
  const {
    branches,
    employees,
    shifts,
    employmentStatuses,
    categories,
    mainSections,
    subSections,
    addBranch,
    updateBranch,
    toggleBranchStatus,
    addShift,
    updateShift,
    addEmploymentStatus,
    updateEmploymentStatus,
    addCategory,
    updateCategory,
    deleteCategory,
    addMainSection,
    updateMainSection,
    deleteMainSection,
    addSubSection,
    updateSubSection,
    deleteSubSection,
    hasPermission,
    cloudStatus,
    isSyncing,
    lastCloudSync,
    isCleanDatabase,
    cloudStats,
    clearAllDefaultValuesAndResetCloud,
    loadDemoSampleData,
    syncAllToCloud,
  } = useApp();

  const [cloudMsg, setCloudMsg] = useState<string | null>(null);

  // Tab: 'branches' | 'shifts' | 'statuses' | 'catalog_hierarchy' | 'cloud_database' | 'desktop_sync'
  const [activeTab, setActiveTab] = useState<'branches' | 'shifts' | 'statuses' | 'catalog_hierarchy' | 'cloud_database' | 'desktop_sync'>('catalog_hierarchy');

  // Hierarchy Sub-Tab: 'categories' | 'main_sections' | 'sub_sections'
  const [hierarchyTier, setHierarchyTier] = useState<'categories' | 'main_sections' | 'sub_sections'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-it');
  const [selectedMainSectionId, setSelectedMainSectionId] = useState<string>('msec-pos');

  // Branch Modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchManager, setBranchManager] = useState('');
  const [branchManagerId, setBranchManagerId] = useState('');
  const [customManagerMode, setCustomManagerMode] = useState(false);

  // Shift Modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftConfig | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('16:00');
  const [shiftGrace, setShiftGrace] = useState(15);
  const [shiftDesc, setShiftDesc] = useState('');

  // Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusName, setStatusName] = useState('');
  const [statusColor, setStatusColor] = useState('bg-slate-100 text-slate-800 border-slate-300');

  // Hierarchy Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  const [isMainSecModalOpen, setIsMainSecModalOpen] = useState(false);
  const [editingMainSec, setEditingMainSec] = useState<MainSection | null>(null);
  const [msecCategoryId, setMsecCategoryId] = useState(selectedCategoryId);
  const [msecName, setMsecName] = useState('');
  const [msecCode, setMsecCode] = useState('');
  const [msecDesc, setMsecDesc] = useState('');
  const [msecError, setMsecError] = useState<string | null>(null);

  const [isSubSecModalOpen, setIsSubSecModalOpen] = useState(false);
  const [editingSubSec, setEditingSubSec] = useState<SubSection | null>(null);
  const [ssecMainSecId, setSsecMainSecId] = useState(selectedMainSectionId);
  const [ssecName, setSsecName] = useState('');
  const [ssecCode, setSsecCode] = useState('');
  const [ssecDesc, setSsecDesc] = useState('');
  const [ssecError, setSsecError] = useState<string | null>(null);

  // Branch Handlers
  const openAddBranch = () => {
    setEditingBranch(null);
    setBranchCode(`BR-${branches.length + 1 < 10 ? '0' : ''}${branches.length + 1}`);
    setBranchName('');
    setBranchCity('طرابلس');
    setBranchAddress('');
    setBranchPhone('');
    setBranchManager('');
    setBranchManagerId('');
    setCustomManagerMode(false);
    setIsBranchModalOpen(true);
  };

  const openEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setBranchCode(b.code);
    setBranchName(b.nameAr);
    setBranchCity(b.cityAr);
    setBranchAddress(b.addressAr);
    setBranchPhone(b.phone);
    setBranchManager(b.managerName || '');
    
    // Resolve matched employee from registry
    const matched = employees.find(
      (e) => e.id === b.managerEmployeeId || e.nameAr.trim() === b.managerName?.trim()
    );
    setBranchManagerId(matched?.id || b.managerEmployeeId || '');
    setCustomManagerMode(!matched && !!b.managerName);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    let finalManagerName = branchManager.trim();
    if (!customManagerMode && branchManagerId) {
      const selectedEmp = employees.find((emp) => emp.id === branchManagerId);
      if (selectedEmp) {
        finalManagerName = selectedEmp.nameAr;
      }
    }

    if (editingBranch) {
      updateBranch(editingBranch.id, {
        code: branchCode.trim(),
        nameAr: branchName.trim(),
        cityAr: branchCity.trim(),
        addressAr: branchAddress.trim(),
        phone: branchPhone.trim(),
        managerName: finalManagerName,
        managerEmployeeId: branchManagerId || undefined,
      });
    } else {
      addBranch({
        code: branchCode.trim() || `BR-${Date.now()}`,
        nameAr: branchName.trim(),
        cityAr: branchCity.trim(),
        addressAr: branchAddress.trim(),
        phone: branchPhone.trim(),
        managerName: finalManagerName,
        managerEmployeeId: branchManagerId || undefined,
        isActive: true,
      });
    }
    setIsBranchModalOpen(false);
  };

  // Shift Handlers
  const openEditShift = (s: ShiftConfig) => {
    setEditingShift(s);
    setShiftName(s.nameAr);
    setShiftStart(s.startTime);
    setShiftEnd(s.endTime);
    setShiftGrace(s.gracePeriodMinutes);
    setShiftDesc(s.descriptionAr);
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift) {
      updateShift(editingShift.id, {
        nameAr: shiftName.trim(),
        startTime: shiftStart,
        endTime: shiftEnd,
        gracePeriodMinutes: Number(shiftGrace) || 15,
        descriptionAr: shiftDesc.trim(),
      });
      setIsShiftModalOpen(false);
    }
  };

  // Status Handlers
  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusName.trim()) return;

    addEmploymentStatus({
      id: `st-${Date.now()}`,
      nameAr: statusName.trim(),
      color: statusColor,
      isSystem: false,
      isActive: true,
    });
    setStatusName('');
    setIsStatusModalOpen(false);
  };

  // Category Handlers (Tier 1)
  const openAddCategory = () => {
    setCatError(null);
    setEditingCategory(null);
    setCatName('');
    setCatCode(`CAT-${categories.length + 1 < 10 ? '0' : ''}${categories.length + 1}`);
    setCatDesc('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (c: ItemCategory) => {
    setCatError(null);
    setEditingCategory(c);
    setCatName(c.nameAr);
    setCatCode(c.code);
    setCatDesc(c.descriptionAr || '');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!catName.trim() || !catCode.trim()) {
      setCatError('اسم الفئة وكودها مطلوبان');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        nameAr: catName.trim(),
        code: catCode.trim().toUpperCase(),
        descriptionAr: catDesc.trim(),
      });
    } else {
      const res = addCategory({
        nameAr: catName.trim(),
        code: catCode.trim().toUpperCase(),
        descriptionAr: catDesc.trim(),
      });
      if (!res.success) {
        setCatError(res.error || 'فشلت إضافة الفئة');
        return;
      }
    }
    setIsCategoryModalOpen(false);
  };

  // Main Section Handlers (Tier 2)
  const openAddMainSection = (targetCatId?: string) => {
    setMsecError(null);
    setEditingMainSec(null);
    let chosenCatId = '';
    if (targetCatId && targetCatId !== 'all' && categories.some(c => c.id === targetCatId)) {
      chosenCatId = targetCatId;
    } else if (selectedCategoryId && selectedCategoryId !== 'all' && categories.some(c => c.id === selectedCategoryId)) {
      chosenCatId = selectedCategoryId;
    } else if (categories.length > 0) {
      chosenCatId = categories[0].id;
    }
    setMsecCategoryId(chosenCatId);
    setMsecName('');
    setMsecCode(`SEC-${mainSections.length + 1 < 10 ? '0' : ''}${mainSections.length + 1}`);
    setMsecDesc('');
    setIsMainSecModalOpen(true);
  };

  const openEditMainSection = (sec: MainSection) => {
    setMsecError(null);
    setEditingMainSec(sec);
    const validCatId = sec.categoryId && sec.categoryId !== 'all' && categories.some(c => c.id === sec.categoryId)
      ? sec.categoryId
      : (categories[0]?.id || '');
    setMsecCategoryId(validCatId);
    setMsecName(sec.nameAr);
    setMsecCode(sec.code);
    setMsecDesc(sec.descriptionAr || '');
    setIsMainSecModalOpen(true);
  };

  const handleSaveMainSection = (e: React.FormEvent) => {
    e.preventDefault();
    setMsecError(null);
    if (!msecName.trim() || !msecCode.trim()) {
      setMsecError('اسم وكود القسم الرئيسي مطلوبان');
      return;
    }

    let effectiveCatId = msecCategoryId;
    if (!effectiveCatId || effectiveCatId === 'all' || !categories.some(c => c.id === effectiveCatId)) {
      if (categories.length > 0) {
        effectiveCatId = categories[0].id;
      } else {
        setMsecError('يرجى إنشاء فئة رئيسية واحدة على الأقل قبل إضافة قسم رئيسي');
        return;
      }
    }

    if (editingMainSec) {
      updateMainSection(editingMainSec.id, {
        categoryId: effectiveCatId,
        nameAr: msecName.trim(),
        code: msecCode.trim().toUpperCase(),
        descriptionAr: msecDesc.trim(),
      });
    } else {
      const res = addMainSection({
        categoryId: effectiveCatId,
        nameAr: msecName.trim(),
        code: msecCode.trim().toUpperCase(),
        descriptionAr: msecDesc.trim(),
      });
      if (!res.success) {
        setMsecError(res.error || 'فشلت إضافة القسم الرئيسي');
        return;
      }
    }
    setIsMainSecModalOpen(false);
  };

  // Sub Section Handlers (Tier 3)
  const openAddSubSection = (targetMainSecId?: string) => {
    setSsecError(null);
    setEditingSubSec(null);
    let chosenMainSecId = '';
    if (targetMainSecId && targetMainSecId !== 'all' && mainSections.some(m => m.id === targetMainSecId)) {
      chosenMainSecId = targetMainSecId;
    } else if (selectedMainSectionId && selectedMainSectionId !== 'all' && mainSections.some(m => m.id === selectedMainSectionId)) {
      chosenMainSecId = selectedMainSectionId;
    } else if (mainSections.length > 0) {
      chosenMainSecId = mainSections[0].id;
    }
    setSsecMainSecId(chosenMainSecId);
    setSsecName('');
    setSsecCode(`SUB-${subSections.length + 1 < 10 ? '0' : ''}${subSections.length + 1}`);
    setSsecDesc('');
    setIsSubSecModalOpen(true);
  };

  const openEditSubSection = (sub: SubSection) => {
    setSsecError(null);
    setEditingSubSec(sub);
    const validMainSecId = sub.mainSectionId && sub.mainSectionId !== 'all' && mainSections.some(m => m.id === sub.mainSectionId)
      ? sub.mainSectionId
      : (mainSections[0]?.id || '');
    setSsecMainSecId(validMainSecId);
    setSsecName(sub.nameAr);
    setSsecCode(sub.code);
    setSsecDesc(sub.descriptionAr || '');
    setIsSubSecModalOpen(true);
  };

  const handleSaveSubSection = (e: React.FormEvent) => {
    e.preventDefault();
    setSsecError(null);
    if (!ssecName.trim() || !ssecCode.trim()) {
      setSsecError('اسم وكود القسم الفرعي مطلوبان');
      return;
    }

    let effectiveMainSecId = ssecMainSecId;
    if (!effectiveMainSecId || effectiveMainSecId === 'all' || !mainSections.some(m => m.id === effectiveMainSecId)) {
      if (mainSections.length > 0) {
        effectiveMainSecId = mainSections[0].id;
      } else {
        setSsecError('يرجى إنشاء قسم رئيسي واحد على الأقل أولاً');
        return;
      }
    }

    const parentMain = mainSections.find(m => m.id === effectiveMainSecId);
    const categoryId = parentMain && parentMain.categoryId && parentMain.categoryId !== 'all'
      ? parentMain.categoryId
      : (categories[0]?.id || 'cat-it');

    if (editingSubSec) {
      updateSubSection(editingSubSec.id, {
        mainSectionId: effectiveMainSecId,
        categoryId,
        nameAr: ssecName.trim(),
        code: ssecCode.trim().toUpperCase(),
        descriptionAr: ssecDesc.trim(),
      });
    } else {
      const res = addSubSection({
        mainSectionId: effectiveMainSecId,
        categoryId,
        nameAr: ssecName.trim(),
        code: ssecCode.trim().toUpperCase(),
        descriptionAr: ssecDesc.trim(),
      });
      if (!res.success) {
        setSsecError(res.error || 'فشلت إضافة القسم الفرعي');
        return;
      }
    }
    setIsSubSecModalOpen(false);
  };

  const colorPresets = [
    { label: 'أزرق سماوي', value: 'bg-sky-100 text-sky-800 border-sky-300' },
    { label: 'أخضر زمردي', value: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { label: 'بنفسجي', value: 'bg-purple-100 text-purple-800 border-purple-300' },
    { label: 'عنبري / برتقالي', value: 'bg-amber-100 text-amber-800 border-amber-300' },
    { label: 'وردي / أحمر', value: 'bg-rose-100 text-rose-800 border-rose-300' },
    { label: 'نيلي', value: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { label: 'رمادي محايد', value: 'bg-slate-100 text-slate-800 border-slate-300' },
  ];

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-800 border border-slate-200">
              الشاشة 3
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              الإعدادات العامة والبيانات المرجعية (System Settings)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الكتالوج الهرمي ثلاثي المستويات (الفئات ⬅ الأقسام الرئيسية ⬅ الأقسام الفرعية)، الفروع، الورديات، والأوضاع الوظيفية.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('catalog_hierarchy')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog_hierarchy'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <span>الكتالوج الهرمي (3-Tier)</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>الفروع ({branches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shifts'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>الورديات ({shifts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('statuses')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'statuses'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>الأوضاع الوظيفية ({employmentStatuses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud_database')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cloud_database'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>قاعدة البيانات السحابية (Firebase)</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop_sync')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'desktop_sync'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-cyan-600" />
            <span>الربط المكتبي وتحديثات الدومين</span>
          </button>
        </div>
      </div>

      {/* Tab 0: 3-Tier Catalog Hierarchy (NEW FEATURE) */}
      {activeTab === 'catalog_hierarchy' && (
        <div className="space-y-6">
          
          {/* Sub Navigation between Tiers */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">المستوى الهرمي:</span>
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setHierarchyTier('categories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    hierarchyTier === 'categories'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>1. الفئات (Categories)</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">{categories.length}</span>
                </button>

                <button
                  onClick={() => setHierarchyTier('main_sections')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    hierarchyTier === 'main_sections'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>2. الأقسام الرئيسية (Main Sections)</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">{mainSections.length}</span>
                </button>

                <button
                  onClick={() => setHierarchyTier('sub_sections')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    hierarchyTier === 'sub_sections'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>3. الأقسام الفرعية (Sub-Sections)</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">{subSections.length}</span>
                </button>
              </div>
            </div>

            {/* Quick Add Button depending on active tier */}
            {hasPermission('manage_catalog') && (
              <div>
                {hierarchyTier === 'categories' && (
                  <button
                    onClick={openAddCategory}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة فئة رئيسية جديدة (Category)</span>
                  </button>
                )}
                {hierarchyTier === 'main_sections' && (
                  <button
                    onClick={() => openAddMainSection()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قسم رئيسي (Main Section)</span>
                  </button>
                )}
                {hierarchyTier === 'sub_sections' && (
                  <button
                    onClick={() => openAddSubSection()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قسم فرعي (Sub-Section)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tier 1: Categories */}
          {hierarchyTier === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">1. الفئات العليا (Categories)</h3>
                  <p className="text-xs text-slate-500">المستوى الأول من الهيكل التصنيفي للكتالوج</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat) => {
                  const nestedMainCount = mainSections.filter(m => m.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {cat.code}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {nestedMainCount} قسم رئيسي
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 mb-1">{cat.nameAr}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">{cat.descriptionAr || 'لا يوجد وصف'}</p>
                      </div>

                      {hasPermission('manage_catalog') && (
                        <button
                          onClick={() => openAddMainSection(cat.id)}
                          className="w-full mb-3 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ إضافة قسم رئيسي لهذه الفئة</span>
                        </button>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setHierarchyTier('main_sections');
                          }}
                          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>عرض الأقسام</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        {hasPermission('manage_catalog') && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                              title="تعديل الفئة"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const res = deleteCategory(cat.id);
                                if (!res.success) alert(res.error);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="حذف الفئة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tier 2: Main Sections */}
          {hierarchyTier === 'main_sections' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">2. الأقسام الرئيسية (Main Sections)</h3>
                  <p className="text-xs text-slate-500">المستوى الثاني، تابعة مباشرة للفئات العليا</p>
                </div>

                {/* Filter by Category */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">تصفية حسب الفئة:</span>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden"
                  >
                    <option value="all">كافة الفئات</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainSections
                  .filter(m => selectedCategoryId === 'all' || m.categoryId === selectedCategoryId)
                  .map((msec) => {
                    const parentCat = categories.find(c => c.id === msec.categoryId);
                    const nestedSubCount = subSections.filter(s => s.mainSectionId === msec.id).length;

                    return (
                      <div
                        key={msec.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {msec.code}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {nestedSubCount} قسم فرعي
                            </span>
                          </div>

                          <div className="text-[11px] font-bold text-slate-400 mb-1">
                            الفئة: {parentCat?.nameAr || msec.categoryId}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-1">{msec.nameAr}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mb-3">{msec.descriptionAr || 'لا يوجد وصف'}</p>
                        </div>

                        {hasPermission('manage_catalog') && (
                          <button
                            onClick={() => openAddSubSection(msec.id)}
                            className="w-full mb-3 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ إضافة قسم فرعي لهذا القسم</span>
                          </button>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedMainSectionId(msec.id);
                              setHierarchyTier('sub_sections');
                            }}
                            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>عرض الأقسام الفرعية</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          {hasPermission('manage_catalog') && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditMainSection(msec)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                                title="تعديل القسم الرئيسي"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const res = deleteMainSection(msec.id);
                                  if (!res.success) alert(res.error);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="حذف القسم الرئيسي"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Tier 3: Sub Sections */}
          {hierarchyTier === 'sub_sections' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">3. الأقسام الفرعية (Sub-Sections)</h3>
                  <p className="text-xs text-slate-500">المستوى الثالث، تابعة للأقسام الرئيسية ومربوطة بالأصناف مباشرة</p>
                </div>

                {/* Filter by Main Section */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">تصفية حسب القسم الرئيسي:</span>
                  <select
                    value={selectedMainSectionId}
                    onChange={(e) => setSelectedMainSectionId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden"
                  >
                    <option value="all">كافة الأقسام الرئيسية</option>
                    {mainSections.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subSections
                  .filter(s => selectedMainSectionId === 'all' || s.mainSectionId === selectedMainSectionId)
                  .map((ssec) => {
                    const parentMain = mainSections.find(m => m.id === ssec.mainSectionId);
                    const parentCat = categories.find(c => c.id === ssec.categoryId);

                    return (
                      <div
                        key={ssec.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {ssec.code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ssec.id}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 mb-1">
                            {parentCat?.nameAr} ⬅ <strong className="text-slate-700">{parentMain?.nameAr}</strong>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-1">{ssec.nameAr}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mb-4">{ssec.descriptionAr || 'لا يوجد وصف'}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                          {hasPermission('manage_catalog') && (
                            <>
                              <button
                                onClick={() => openEditSubSection(ssec)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                                title="تعديل القسم الفرعي"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const res = deleteSubSection(ssec.id);
                                  if (!res.success) alert(res.error);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="حذف القسم الفرعي"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 1: Branches Management */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">فروع نورسين</h2>
              <p className="text-xs text-slate-500">الفروع المعرفة في النظام وإدارتها الحالية</p>
            </div>
            {hasPermission('manage_branches') && (
              <button
                onClick={openAddBranch}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة فرع جديد</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between ${
                  b.isActive ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 bg-slate-50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {b.code}
                    </span>
                    <button
                      onClick={() => toggleBranchStatus(b.id)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                        b.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {b.isActive ? 'مفعل نشط' : 'معطل'}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">{b.nameAr}</h3>
                  <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.cityAr} - {b.addressAr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{b.phone}</span>
                    </div>
                    {(() => {
                      const matchedEmp = employees.find(
                        (e) => e.id === b.managerEmployeeId || e.nameAr.trim() === b.managerName?.trim()
                      );
                      if (b.managerName) {
                        return (
                          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 text-xs block leading-tight">{b.managerName}</span>
                                <span className="text-[10px] text-slate-400">مدير الفرع المعتمد</span>
                              </div>
                            </div>
                            {matchedEmp && (
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {matchedEmp.jobId}
                              </span>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center justify-between p-2 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-amber-800">
                          <span className="text-[10px] text-amber-700">لم يتم تعيين مدير للفرع</span>
                          {hasPermission('manage_branches') && (
                            <button
                              type="button"
                              onClick={() => openEditBranch(b)}
                              className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              + تعيين من السجل
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">معرف الفرع: {b.id}</span>
                  {hasPermission('manage_branches') && (
                    <button
                      onClick={() => openEditBranch(b)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                      title="تعديل بيانات الفرع"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Shift Settings */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">إعدادات الورديات والدوام</h2>
              <p className="text-xs text-slate-500">توقيتات الحضور والانصراف وفترة السماح المعتمدة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {s.id.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      فترة سماح: {s.gracePeriodMinutes} دقيقة
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{s.nameAr}</h3>
                  <p className="text-xs text-slate-500 mb-4">{s.descriptionAr}</p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">وقت البدء</span>
                      <strong className="text-emerald-700 text-sm">{s.startTime}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">وقت الانتهاء</span>
                      <strong className="text-slate-800 text-sm">{s.endTime}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  {hasPermission('manage_shifts') && (
                    <button
                      onClick={() => openEditShift(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      تعديل الوردية
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Employment Statuses */}
      {activeTab === 'statuses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">الأوضاع الوظيفية والأقسام المعتمدة</h2>
              <p className="text-xs text-slate-500">التصنيفات الوظيفية لموظفي نورسين</p>
            </div>
            {hasPermission('manage_statuses') && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وضع وظيفي جديد</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {employmentStatuses.map((st) => (
              <div
                key={st.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${st.color}`}
                  >
                    {st.nameAr}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{st.id}</div>
                </div>
                {st.isSystem && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                    افتراضي
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Cloud Database Management (Firebase) */}
      {activeTab === 'cloud_database' && (
        <div className="space-y-6">
          {cloudMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{cloudMsg}</span>
              </div>
              <button onClick={() => setCloudMsg(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
            </div>
          )}

          {/* Connection & Configuration Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">قاعدة البيانات السحابية المؤسسية (Firebase Firestore)</h2>
                  <p className="text-xs text-slate-500">حفظ مركزي فوري لكافة السجلات والعمليات والفروع على خوادم Google Cloud</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>متصل سحابياً (Live & Ready)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-1">المشروع السحابي (Project ID)</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{cloudStats.projectId}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-1">معرف قاعدة البيانات (Firestore Database ID)</span>
                <span className="font-mono font-bold text-slate-800 text-xs truncate block">{cloudStats.databaseId}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block mb-1">حالة السجلات والبيانات</span>
                <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${isCleanDatabase ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                  {isCleanDatabase ? '✨ قاعدة بيانات نقية (تم مسح القيم الافتراضية)' : '📦 محملة ببيانات تجريبية'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              إجراءات التهيئة والتصفير والمزامنة السحابية
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wipe and Start Clean Button */}
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center mb-3">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-amber-950 text-sm mb-1">مسح القيم الافتراضية (تصفير شامل)</h4>
                  <p className="text-xs text-amber-800/80 mb-4 leading-relaxed">
                    مسح كافة سجلات الموظفين والغياب والطلبات والأصناف التجريبية وتصفير قاعدة البيانات السحابية مع الإبقاء فقط على حساب المشرف العام محمد قشوط.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const res = await clearAllDefaultValuesAndResetCloud();
                    if (res.success) {
                      setCloudMsg('تم مسح كافة القيم الافتراضية بنجاح وتهيئة قاعدة بيانات سحابية نظيفة!');
                    }
                  }}
                  disabled={isSyncing}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تصفير ومسح القيم الافتراضية</span>
                </button>
              </div>

              {/* Force Cloud Sync Button */}
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center mb-3">
                    <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <h4 className="font-bold text-emerald-950 text-sm mb-1">مزامنة سحابية فورية كاملة</h4>
                  <p className="text-xs text-emerald-800/80 mb-4 leading-relaxed">
                    رفع وتأكيد حفظ كافة السجلات والتعديلات الحالية في المنظومة مباشرة إلى مجموعات Google Cloud Firestore.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const res = await syncAllToCloud();
                    if (res.success) {
                      setCloudMsg('تمت مزامنة كافة المجموعات مع خوادم Firebase السحابية بنجاح!');
                    }
                  }}
                  disabled={isSyncing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Cloud className="w-4 h-4" />
                  <span>مزامنة سحابية الآن</span>
                </button>
              </div>

              {/* Load Demo Data Button */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center mb-3">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">تحميل بيانات تجريبية (Sample Demo)</h4>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    تعبئة نماذج بيانات تجريبية للموظفين والكتالوج والطلبات للاختبار والعرض التوضيحي متى رغبت بذلك.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const res = await loadDemoSampleData();
                    if (res.success) {
                      setCloudMsg('تم تحميل البيانات التجريبية ومزامنتها بنجاح!');
                    }
                  }}
                  disabled={isSyncing}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>تحميل بيانات تجريبية</span>
                </button>
              </div>
            </div>
          </div>

          {/* Collection Inventory Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              حالة وتعداد السجلات في مجموعات Firestore السحابية:
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">الموظفين</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.employees}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">الفروع</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.branches}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">المستخدمين</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.users}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">سجلات الغياب</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.incidents}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">الطلبات</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.requests}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">المهام</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.tasks}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">الفئات (Categories)</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.categories}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">الأقسام الرئيسية</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.mainSections}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">الأقسام الفرعية</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.subSections}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">أصناف الكتالوج</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.catalogItems}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">طلبات التوريد</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.purchaseOrders}</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[11px] block">الورديات</span>
                <strong className="text-lg text-slate-900">{cloudStats.counts.shifts}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Desktop App & Domain Cloud Sync */}
      {activeTab === 'desktop_sync' && <DesktopDomainSyncTab />}

      {/* Category Modal (Tier 1) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'تعديل الفئة الرئيسية (Category)' : 'إضافة فئة رئيسية جديدة (Category)'}
              </h3>
            </div>

            {catError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">كود الفئة (Code) *</label>
                <input
                  type="text"
                  required
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value)}
                  placeholder="مثال: CAT-ELC"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 uppercase focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">اسم الفئة بالعربية *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="مثال: الأجهزة والمعدات التقنية"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">الوصف العام</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="وصف مختصر لمحتويات هذه الفئة..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  {editingCategory ? 'حفظ التعديلات' : 'إضافة الفئة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Section Modal (Tier 2) */}
      {isMainSecModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setIsMainSecModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">
                {editingMainSec ? 'تعديل القسم الرئيسي (Main Section)' : 'إضافة قسم رئيسي (Main Section)'}
              </h3>
            </div>

            {msecError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{msecError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMainSection} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">الفئة الأب (Parent Category) *</label>
                {categories.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-bold">
                    ⚠️ لا توجد أي فئات رئيسية مضافة. يرجى إنشاء فئة رئيسية (Category) أولاً لتتمكن من ربط القسم الرئيسي بها.
                  </div>
                ) : (
                  <>
                    <select
                      value={msecCategoryId}
                      onChange={(e) => setMsecCategoryId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                          🏷️ {c.nameAr} ({c.code})
                        </option>
                      ))}
                    </select>
                    {categories.find(c => c.id === msecCategoryId) && (
                      <div className="mt-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center justify-between font-bold">
                        <span>✓ سيتم ربط هذا القسم تلقائياً بالفئة:</span>
                        <span className="font-extrabold underline">{categories.find(c => c.id === msecCategoryId)?.nameAr}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">كود القسم الرئيسي *</label>
                <input
                  type="text"
                  required
                  value={msecCode}
                  onChange={(e) => setMsecCode(e.target.value)}
                  placeholder="مثال: SEC-POS"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 uppercase focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">اسم القسم الرئيسي بالعربية *</label>
                <input
                  type="text"
                  required
                  value={msecName}
                  onChange={(e) => setMsecName(e.target.value)}
                  placeholder="مثال: أنظمة نقاط البيع والكاشير"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">الوصف</label>
                <textarea
                  rows={2}
                  value={msecDesc}
                  onChange={(e) => setMsecDesc(e.target.value)}
                  placeholder="وصف القسم الرئيسي..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMainSecModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  {editingMainSec ? 'حفظ التعديلات' : 'إضافة القسم الرئيسي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub Section Modal (Tier 3) */}
      {isSubSecModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setIsSubSecModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">
                {editingSubSec ? 'تعديل القسم الفرعي (Sub-Section)' : 'إضافة قسم فرعي (Sub-Section)'}
              </h3>
            </div>

            {ssecError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ssecError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubSection} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">القسم الرئيسي الأب *</label>
                <select
                  value={ssecMainSecId}
                  onChange={(e) => setSsecMainSecId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                >
                  {mainSections.map(m => {
                    const c = categories.find(cat => cat.id === m.categoryId);
                    return (
                      <option key={m.id} value={m.id} className="text-slate-900 bg-white">
                        {c?.nameAr} ⬅ {m.nameAr}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">كود القسم الفرعي *</label>
                <input
                  type="text"
                  required
                  value={ssecCode}
                  onChange={(e) => setSsecCode(e.target.value)}
                  placeholder="مثال: SUB-PRN"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 uppercase focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">اسم القسم الفرعي بالعربية *</label>
                <input
                  type="text"
                  required
                  value={ssecName}
                  onChange={(e) => setSsecName(e.target.value)}
                  placeholder="مثال: طابعات فواتير حرارية"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">الوصف</label>
                <textarea
                  rows={2}
                  value={ssecDesc}
                  onChange={(e) => setSsecDesc(e.target.value)}
                  placeholder="وصف القسم الفرعي..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubSecModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  {editingSubSec ? 'حفظ التعديلات' : 'إضافة القسم الفرعي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setIsBranchModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">
                {editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}
              </h3>
            </div>

            <form onSubmit={handleSaveBranch} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">رمز الفرع (Code)</label>
                <input
                  type="text"
                  required
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">اسم الفرع بالعربية</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="مثال: فرع طبرق - وسط المدينة"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">المدينة</label>
                  <input
                    type="text"
                    required
                    value={branchCity}
                    onChange={(e) => setBranchCity(e.target.value)}
                    placeholder="طرابلس، بنغازي..."
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">رقم الهاتف</label>
                  <input
                    type="text"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    placeholder="021-XXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="الشارع، المعلم، الطابق..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              {/* Branch Manager Selection from Employee Registry */}
              <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>مدير الفرع (اختيار من سجل الموظفين)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomManagerMode(!customManagerMode);
                      if (!customManagerMode) {
                        setBranchManagerId('');
                      }
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 underline font-semibold cursor-pointer"
                  >
                    {customManagerMode ? 'العودة للاختيار من السجل' : 'إدخال اسم يدوي'}
                  </button>
                </div>

                {!customManagerMode ? (
                  <div className="space-y-2">
                    <select
                      value={branchManagerId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setBranchManagerId(selectedId);
                        const emp = employees.find((emp) => emp.id === selectedId);
                        setBranchManager(emp ? emp.nameAr : '');
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer outline-hidden transition"
                    >
                      <option value="" className="text-slate-900 bg-white">-- اختر مدير الفرع من سجل الموظفين المعتمدين --</option>
                      
                      {/* Priority: Employees with role/status "مدير فرع" or "مشرف" */}
                      <optgroup label="مدراء الفروع والمشرفين المعتمدين">
                        {employees
                          .filter(
                            (e) =>
                              e.statusId === 'branch_manager' ||
                              e.statusId === 'supervisor' ||
                              e.statusId === 'branches_director' ||
                              e.statusId === 'supervisor_auditor'
                          )
                          .map((emp) => {
                            const empBranch = branches.find((b) => b.id === emp.branchId);
                            const empStatus = employmentStatuses.find((s) => s.id === emp.statusId);
                            return (
                              <option key={emp.id} value={emp.id} className="text-slate-900 bg-white">
                                👤 {emp.nameAr} | {emp.jobId} ({empStatus?.nameAr || 'مدير فرع'}) {empBranch ? `- ${empBranch.nameAr}` : ''}
                              </option>
                            );
                          })}
                      </optgroup>

                      {/* Other Employees in Registry */}
                      <optgroup label="باقي موظفي المنظومة بالسجل">
                        {employees
                          .filter(
                            (e) =>
                              e.statusId !== 'branch_manager' &&
                              e.statusId !== 'supervisor' &&
                              e.statusId !== 'branches_director' &&
                              e.statusId !== 'supervisor_auditor'
                          )
                          .map((emp) => {
                            const empBranch = branches.find((b) => b.id === emp.branchId);
                            const empStatus = employmentStatuses.find((s) => s.id === emp.statusId);
                            return (
                              <option key={emp.id} value={emp.id} className="text-slate-900 bg-white">
                                👤 {emp.nameAr} | {emp.jobId} ({empStatus?.nameAr || emp.statusId}) {empBranch ? `- ${empBranch.nameAr}` : ''}
                              </option>
                            );
                          })}
                      </optgroup>
                    </select>

                    {/* Manager Live Profile Badge */}
                    {branchManagerId ? (
                      (() => {
                        const selEmp = employees.find((e) => e.id === branchManagerId);
                        if (!selEmp) return null;
                        const selBranch = branches.find((b) => b.id === selEmp.branchId);
                        const selStatus = employmentStatuses.find((s) => s.id === selEmp.statusId);
                        return (
                          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                {selEmp.nameAr.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{selEmp.nameAr}</span>
                                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                    {selEmp.jobId}
                                  </span>
                                </div>
                                <div className="text-slate-500 text-[10px] flex items-center gap-2 mt-0.5">
                                  <span>الوطني: {selEmp.nationalId}</span>
                                  {selEmp.birthYear && <span>| ميلاد: {selEmp.birthYear}</span>}
                                  {selEmp.phone && <span>| هاتف: {selEmp.phone}</span>}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                              {selStatus?.nameAr || 'مدير فرع'}
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-[10px] text-slate-500">
                        يتم جلب أسماء وبيانات مدراء الفروع من سجل الموظفين مباشرة لضمان ترابط الصلاحيات.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={branchManager}
                      onChange={(e) => setBranchManager(e.target.value)}
                      placeholder="أدخل اسم المشرف أو المدير المسؤول يدوياً..."
                      className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      تنبيه: الإدخال اليدوي غير مربوط برقم وظيفي في سجل الموظفين.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  حفظ الفرع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {isShiftModalOpen && editingShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setIsShiftModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">تعديل توقيتات الدوام ({editingShift.nameAr})</h3>
            </div>

            <form onSubmit={handleSaveShift} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">مسمى الوردية</label>
                <input
                  type="text"
                  required
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">وقت البدء</label>
                  <input
                    type="time"
                    required
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">وقت الانتهاء</label>
                  <input
                    type="time"
                    required
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">فترة السماح (بالدقائق قبل احتساب تأخير)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={shiftGrace}
                  onChange={(e) => setShiftGrace(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">وصف الوردية والتعليمات</label>
                <textarea
                  rows={2}
                  value={shiftDesc}
                  onChange={(e) => setShiftDesc(e.target.value)}
                  placeholder="وصف الوردية وتفاصيل الدوام..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  تحديث الوردية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setIsStatusModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">إضافة وضع وظيفي جديد</h3>
            </div>

            <form onSubmit={handleSaveStatus} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">اسم الوضع الوظيفي / القسم</label>
                <input
                  type="text"
                  required
                  value={statusName}
                  onChange={(e) => setStatusName(e.target.value)}
                  placeholder="مثال: الخدمات المساندة"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">لون الشارة</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setStatusColor(preset.value)}
                      className={`p-2 rounded-xl text-right border text-xs cursor-pointer flex items-center justify-between ${
                        preset.value
                      } ${statusColor === preset.value ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                      <span>{preset.label}</span>
                      {statusColor === preset.value && <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
