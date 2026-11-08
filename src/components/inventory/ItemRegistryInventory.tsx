import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CatalogItem } from '../../types';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Building2,
  Layers,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  SlidersHorizontal,
  DollarSign,
  TrendingDown,
  Warehouse,
  ArrowRightLeft,
  ChevronLeft,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ItemRegistryInventory: React.FC = () => {
  const {
    catalogItems,
    categories,
    mainSections,
    subSections,
    branches,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    updateItemStock,
    hasPermission,
    canAccessBranch,
    isGlobalUser,
    activeBranchFilter,
  } = useApp();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [mainSectionFilter, setMainSectionFilter] = useState('all');
  const [subSectionFilter, setSubSectionFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Add/Edit Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPrice, setFormPrice] = useState<number>(100);
  const [formUnit, setFormUnit] = useState('قطعة');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formMainSecId, setFormMainSecId] = useState('');
  const [formSubSecId, setFormSubSecId] = useState('');
  const [formMinAlert, setFormMinAlert] = useState<number>(3);
  const [formDescription, setFormDescription] = useState('');
  const [formBranchStock, setFormBranchStock] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Stock Adjustment Modal
  const [adjustingItem, setAdjustingItem] = useState<CatalogItem | null>(null);
  const [adjustBranchId, setAdjustBranchId] = useState(branches[0]?.id || 'b-jaraba');
  const [newStockQty, setNewStockQty] = useState<number>(0);

  // Open Add Item
  const openAddItem = () => {
    setFormError(null);
    setEditingItem(null);
    setFormName('');
    setFormCode(`NRS-${Math.floor(100 + Math.random() * 900)}`);
    setFormPrice(150);
    setFormUnit('قطعة');
    const defaultCat = categories[0]?.id || 'cat-it';
    setFormCategoryId(defaultCat);
    const relatedMain = mainSections.find(m => m.categoryId === defaultCat);
    const defaultMain = relatedMain?.id || mainSections[0]?.id || 'msec-pos';
    setFormMainSecId(defaultMain);
    const relatedSub = subSections.find(s => s.mainSectionId === defaultMain);
    setFormSubSecId(relatedSub?.id || subSections[0]?.id || 'ssec-printers');
    setFormMinAlert(3);
    setFormDescription('');
    // Initial stock 0 for all branches
    const initialStocks: Record<string, number> = {};
    branches.forEach(b => { initialStocks[b.id] = 10; });
    setFormBranchStock(initialStocks);
    setIsItemModalOpen(true);
  };

  // Open Edit Item
  const openEditItem = (item: CatalogItem) => {
    setFormError(null);
    setEditingItem(item);
    setFormName(item.nameAr);
    setFormCode(item.code);
    setFormPrice(item.basePrice);
    setFormUnit(item.unit);
    setFormCategoryId(item.categoryId);
    setFormMainSecId(item.mainSectionId);
    setFormSubSecId(item.subSectionId);
    setFormMinAlert(item.minAlertStock || 3);
    setFormDescription(item.descriptionAr || '');
    setFormBranchStock({ ...item.branchStock });
    setIsItemModalOpen(true);
  };

  const handleCategoryChangeInForm = (catId: string) => {
    setFormCategoryId(catId);
    const firstMain = mainSections.find(m => m.categoryId === catId);
    if (firstMain) {
      setFormMainSecId(firstMain.id);
      const firstSub = subSections.find(s => s.mainSectionId === firstMain.id);
      if (firstSub) setFormSubSecId(firstSub.id);
    }
  };

  const handleMainSecChangeInForm = (mainSecId: string) => {
    setFormMainSecId(mainSecId);
    const firstSub = subSections.find(s => s.mainSectionId === mainSecId);
    if (firstSub) setFormSubSecId(firstSub.id);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formCode.trim()) {
      setFormError('اسم الصنف وكود SKU مطلوبان');
      return;
    }

    if (editingItem) {
      const res = updateCatalogItem(editingItem.id, {
        nameAr: formName.trim(),
        code: formCode.trim().toUpperCase(),
        basePrice: Number(formPrice) || 0,
        unit: formUnit.trim() || 'قطعة',
        categoryId: formCategoryId,
        mainSectionId: formMainSecId,
        subSectionId: formSubSecId,
        minAlertStock: Number(formMinAlert) || 0,
        descriptionAr: formDescription.trim(),
        branchStock: formBranchStock,
      });
      if (!res.success) {
        setFormError(res.error || 'فشل تعديل الصنف');
        return;
      }
    } else {
      const res = addCatalogItem({
        nameAr: formName.trim(),
        code: formCode.trim().toUpperCase(),
        basePrice: Number(formPrice) || 0,
        unit: formUnit.trim() || 'قطعة',
        categoryId: formCategoryId,
        mainSectionId: formMainSecId,
        subSectionId: formSubSecId,
        minAlertStock: Number(formMinAlert) || 0,
        descriptionAr: formDescription.trim(),
        branchStock: formBranchStock,
        isActive: true,
      });
      if (!res.success) {
        setFormError(res.error || 'فشلت إضافة الصنف');
        return;
      }
    }

    setIsItemModalOpen(false);
  };

  const openAdjustStock = (item: CatalogItem, defaultBranchId?: string) => {
    setAdjustingItem(item);
    const bId = defaultBranchId || (branchFilter !== 'all' ? branchFilter : branches[0]?.id || 'b-jaraba');
    setAdjustBranchId(bId);
    setNewStockQty(item.branchStock[bId] || 0);
  };

  const handleSaveStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    updateItemStock(adjustingItem.id, adjustBranchId, Number(newStockQty) || 0);
    setAdjustingItem(null);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return catalogItems.filter(item => {
      // Search
      const search = searchTerm.trim().toLowerCase();
      if (search) {
        const matchName = item.nameAr.toLowerCase().includes(search);
        const matchCode = item.code.toLowerCase().includes(search);
        if (!matchName && !matchCode) return false;
      }

      // Hierarchy filters
      if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;
      if (mainSectionFilter !== 'all' && item.mainSectionId !== mainSectionFilter) return false;
      if (subSectionFilter !== 'all' && item.subSectionId !== subSectionFilter) return false;

      // Calculate total stock according to branch filter
      let stockToCheck = 0;
      if (branchFilter !== 'all') {
        stockToCheck = item.branchStock[branchFilter] || 0;
      } else {
        stockToCheck = Object.values(item.branchStock).reduce((a, b) => a + b, 0);
      }

      const minAlert = item.minAlertStock || 3;
      if (stockStatusFilter === 'out_of_stock' && stockToCheck > 0) return false;
      if (stockStatusFilter === 'low_stock' && (stockToCheck === 0 || stockToCheck > minAlert)) return false;
      if (stockStatusFilter === 'in_stock' && stockToCheck <= minAlert) return false;

      return true;
    });
  }, [catalogItems, searchTerm, categoryFilter, mainSectionFilter, subSectionFilter, branchFilter, stockStatusFilter]);

  // Overall Inventory Stats
  const inventoryStats = useMemo(() => {
    let totalItems = catalogItems.length;
    let totalPieces = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    catalogItems.forEach(item => {
      let qty = 0;
      if (branchFilter !== 'all') {
        qty = item.branchStock[branchFilter] || 0;
      } else {
        qty = Object.values(item.branchStock).reduce((a, b) => a + b, 0);
      }
      totalPieces += qty;
      totalValuation += qty * item.basePrice;

      const minAlert = item.minAlertStock || 3;
      if (qty === 0) outOfStockCount++;
      else if (qty <= minAlert) lowStockCount++;
    });

    return { totalItems, totalPieces, totalValuation, lowStockCount, outOfStockCount };
  }, [catalogItems, branchFilter]);

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredItems.map((item, index) => {
      const cat = categories.find(c => c.id === item.categoryId)?.nameAr || item.categoryId;
      const msec = mainSections.find(m => m.id === item.mainSectionId)?.nameAr || item.mainSectionId;
      const ssec = subSections.find(s => s.id === item.subSectionId)?.nameAr || item.subSectionId;

      const row: any = {
        'م': index + 1,
        'كود الصنف (SKU)': item.code,
        'اسم الصنف': item.nameAr,
        'الفئة': cat,
        'القسم الرئيسي': msec,
        'القسم الفرعي': ssec,
        'السعر الأساسي (د.ل)': item.basePrice,
        'الوحدة': item.unit,
        'إجمالي المخزون': Object.values(item.branchStock).reduce((a, b) => a + b, 0),
      };

      branches.forEach(b => {
        row[`فرع ${b.nameAr}`] = item.branchStock[b.id] || 0;
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!views'] = [{ rightToLeft: true }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'مخزون الأصناف بالفروع');
    XLSX.writeFile(wb, 'norseen_inventory_report.xlsx');
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/25 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
              شاشة الأصناف والمخزون
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة الأصناف والمخزون بالفروع (Item Registry & Inventory)
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            تسجيل الأصناف وربطها بالهيكل الهرمي ثلاثي المستويات، وتتبع أرصدة المخزون والتنبيهات لكل فرع من فروع نورسين.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-slate-800/80 hover:bg-slate-700 text-cyan-200 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>تصدير كشف المخزون (Excel)</span>
          </button>

          {hasPermission('manage_inventory') && (
            <button
              onClick={openAddItem}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-300">عدد الأصناف المسجلة</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{inventoryStats.totalItems}</div>
          <div className="text-[11px] text-cyan-200/70 mt-1">
            موزعة على كافة التصنيفات
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/25 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-300">إجمالي القطع المخزنية</span>
            <Warehouse className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono">
            {inventoryStats.totalPieces.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {branchFilter !== 'all' ? `بفرع: ${branches.find(b => b.id === branchFilter)?.nameAr}` : 'كافة فروع الشركة'}
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-teal-500/25 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-300">القيمة التقديرية للمخزون</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300 font-mono">
            {inventoryStats.totalValuation.toLocaleString()} <span className="text-xs text-slate-400 font-sans">د.ل</span>
          </div>
          <div className="text-[11px] text-teal-200/80 mt-1 font-semibold">
            حسب سعر الأساس المعتمد
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-rose-500/25 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium text-slate-300">تنبيهات العجز والنفاذ</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {inventoryStats.lowStockCount + inventoryStats.outOfStockCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ({inventoryStats.outOfStockCount} نافذ | {inventoryStats.lowStockCount} منخفض)
          </div>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative md:col-span-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اسم الصنف أو كود SKU..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Tier 1 Filter: Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setMainSectionFilter('all');
                setSubSectionFilter('all');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">📂 كافة الفئات (Categories)</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nameAr}</option>
              ))}
            </select>
          </div>

          {/* Tier 2 Filter: Main Section */}
          <div>
            <select
              value={mainSectionFilter}
              onChange={(e) => {
                setMainSectionFilter(e.target.value);
                setSubSectionFilter('all');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">📁 الأقسام الرئيسية</option>
              {mainSections
                .filter(m => categoryFilter === 'all' || m.categoryId === categoryFilter)
                .map(m => (
                  <option key={m.id} value={m.id}>{m.nameAr}</option>
                ))}
            </select>
          </div>

          {/* Tier 3 Filter: Sub Section */}
          <div>
            <select
              value={subSectionFilter}
              onChange={(e) => setSubSectionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">📄 الأقسام الفرعية</option>
              {subSections
                .filter(s => mainSectionFilter === 'all' || s.mainSectionId === mainSectionFilter)
                .map(s => (
                  <option key={s.id} value={s.id}>{s.nameAr}</option>
                ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">🏢 مخزون كافة الفروع</option>
              {branches.filter(b => isGlobalUser || canAccessBranch(b.id)).map(b => (
                <option key={b.id} value={b.id}>{b.nameAr}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">حالة التوفر:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'in_stock', label: 'متوفر بكمية جيدة' },
              { id: 'low_stock', label: 'مخزون منخفض (تنبيه)' },
              { id: 'out_of_stock', label: 'نافذ (0)' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStockStatusFilter(pill.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  stockStatusFilter === pill.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="text-slate-500">
            الأصناف المطابقة: <strong className="text-slate-800">{filteredItems.length}</strong> صنف
          </div>
        </div>
      </div>

      {/* Items Table with Multi-Branch Inventory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold">
                <th className="py-3.5 px-4">كود الصنف (SKU)</th>
                <th className="py-3.5 px-4">اسم الصنف والوصف</th>
                <th className="py-3.5 px-4">التصنيف الهرمي (3-Tier)</th>
                <th className="py-3.5 px-4">السعر والوحدة</th>
                {branches.map(b => (
                  <th key={b.id} className="py-3.5 px-3 text-center">
                    {b.nameAr.replace('فرع ', '')}
                  </th>
                ))}
                <th className="py-3.5 px-4 text-center">الإجمالي</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6 + branches.length} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">لا توجد أصناف مطابقة للبحث أو الفلاتر</p>
                    <p className="text-xs text-slate-400 mt-1">تأكد من ضبط الفئات أو أضف أصناف جديدة عبر الزر بالأعلى</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  const msec = mainSections.find(m => m.id === item.mainSectionId);
                  const ssec = subSections.find(s => s.id === item.subSectionId);
                  const totalStock = Object.values(item.branchStock).reduce((a, b) => a + b, 0);
                  const minAlert = item.minAlertStock || 3;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                        {item.code}
                      </td>

                      {/* Name & Desc */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{item.nameAr}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.descriptionAr}</div>
                      </td>

                      {/* 3-Tier Breadcrumbs */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-slate-400 font-medium">{cat?.nameAr}</div>
                          <div className="text-slate-700 font-semibold">{msec?.nameAr}</div>
                          <div className="text-emerald-700 font-bold">{ssec?.nameAr}</div>
                        </div>
                      </td>

                      {/* Price & Unit */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold font-mono text-slate-900 text-sm">
                          {item.basePrice.toLocaleString()} د.ل
                        </span>
                        <div className="text-[10px] text-slate-400">لكل {item.unit}</div>
                      </td>

                      {/* Per-Branch Stocks */}
                      {branches.map(b => {
                        const bStock = item.branchStock[b.id] || 0;
                        const isZero = bStock === 0;
                        const isLow = bStock > 0 && bStock <= minAlert;

                        return (
                          <td key={b.id} className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => openAdjustStock(item, b.id)}
                              title="اضغط لتعديل المخزون بهذا الفرع"
                              className={`px-2 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer border ${
                                isZero
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {bStock}
                            </button>
                          </td>
                        );
                      })}

                      {/* Total Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {totalStock}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openAdjustStock(item)}
                            title="تعديل سريع للمخزون"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {hasPermission('manage_inventory') && (
                            <>
                              <button
                                onClick={() => openEditItem(item)}
                                title="تعديل بيانات الصنف"
                                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCatalogItem(item.id)}
                                title="حذف الصنف"
                                className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Add / Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setIsItemModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'تعديل بيانات الصنف والمخزون' : 'إضافة صنف جديد للكتالوج'}
              </h3>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Item Name */}
                <div className="sm:col-span-2">
                  <label className="block font-extrabold text-slate-900 mb-1.5">اسم الصنف الكامل *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: قارئ باركود ليزري Zebra 2D لاسلكي"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">كود الصنف / SKU الفريد *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="NRS-SCN-01"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 uppercase focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">السعر الأساسي (بالدينار الليبي) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">وحدة القياس / التعبئة</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="قطعة، كرتونة، باقة..."
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

                {/* Min Stock Alert */}
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">حد التنبيه الأدنى للمخزون (Alert Level)</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>

              </div>

              {/* 3-Tier Cascading Dropdowns */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
                  <span>الربط بالتصنيف الهرمي (3-Tier Hierarchy) *</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">تصنيف متسلسل</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">1. الفئة (Category)</label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => handleCategoryChangeInForm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 shadow-xs outline-hidden transition"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="text-slate-900 bg-white">{c.nameAr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Main Section */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">2. القسم الرئيسي (Main)</label>
                    <select
                      value={formMainSecId}
                      onChange={(e) => handleMainSecChangeInForm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 shadow-xs outline-hidden transition"
                    >
                      {mainSections
                        .filter(m => m.categoryId === formCategoryId)
                        .map(m => (
                          <option key={m.id} value={m.id} className="text-slate-900 bg-white">{m.nameAr}</option>
                        ))}
                    </select>
                  </div>

                  {/* Sub Section */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">3. القسم الفرعي (Sub)</label>
                    <select
                      value={formSubSecId}
                      onChange={(e) => setFormSubSecId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 shadow-xs outline-hidden transition"
                    >
                      {subSections
                        .filter(s => s.mainSectionId === formMainSecId)
                        .map(s => (
                          <option key={s.id} value={s.id} className="text-slate-900 bg-white">{s.nameAr}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-Branch Inventory Control */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-extrabold text-slate-900 text-xs">
                  تحديد كمية المخزون لكل فرع (Multi-Branch Inventory)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {branches.map(b => (
                    <div key={b.id} className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[11px] font-extrabold text-slate-800 mb-1 truncate">
                        {b.nameAr.replace('فرع ', '')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formBranchStock[b.id] ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setFormBranchStock(prev => ({ ...prev, [b.id]: val }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-lg text-xs font-mono font-bold text-slate-950 text-center shadow-xs outline-hidden transition"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">وصف الصنف والمواصفات</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="المواصفات الفنية أو شروط التوريد..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-medium text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  {editingItem ? 'حفظ التعديلات' : 'إضافة الصنف'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setAdjustingItem(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">تعديل رصيد المخزون الفعلي</h3>
            </div>

            <div className="py-3 text-xs text-slate-600">
              <div className="font-bold text-slate-900 text-sm">{adjustingItem.nameAr}</div>
              <div className="text-[11px] font-mono text-emerald-700">{adjustingItem.code}</div>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">اختر الفرع المراد ضبط مخزونه</label>
                <select
                  value={adjustBranchId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setAdjustBranchId(bId);
                    setNewStockQty(adjustingItem.branchStock[bId] || 0);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 shadow-xs outline-hidden transition"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                      {b.nameAr} (الرصيد الحالي: {adjustingItem.branchStock[b.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">الكمية الجديدة بالمخزن</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-lg font-black text-slate-950 text-center shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  حفظ الرصيد الجديد
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
