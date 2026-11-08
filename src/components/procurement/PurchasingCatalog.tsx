import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CatalogItem, PurchaseOrder } from '../../types';
import {
  ShoppingCart,
  Search,
  Filter,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  X,
  Plus,
  Minus,
  Check,
  Package,
  Layers,
  ChevronDown,
  Sparkles,
  Receipt,
  Truck,
} from 'lucide-react';

export const PurchasingCatalog: React.FC = () => {
  const {
    catalogItems,
    categories,
    mainSections,
    subSections,
    branches,
    scopedPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    hasPermission,
    currentUser,
    userAssignedBranches,
    isGlobalUser,
  } = useApp();

  // Active view: 'catalog' | 'orders_history'
  const [activeView, setActiveView] = useState<'catalog' | 'orders_history'>('catalog');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedMainSecId, setSelectedMainSecId] = useState<string>('all');
  const [selectedSubSecId, setSelectedSubSecId] = useState<string>('all');
  const [selectedBrowsingBranch, setSelectedBrowsingBranch] = useState<string>(
    userAssignedBranches[0]?.id || branches[0]?.id || 'b-jaraba'
  );

  // Order Modal
  const [orderingItem, setOrderingItem] = useState<CatalogItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [sourceBranchId, setSourceBranchId] = useState<string>(
    userAssignedBranches[0]?.id || branches[0]?.id || 'b-jaraba'
  );
  const [targetBranchId, setTargetBranchId] = useState<string>(
    userAssignedBranches[0]?.id || branches[0]?.id || 'b-jaraba'
  );
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);

  // Available main sections based on selected category
  const availableMainSections = useMemo(() => {
    if (selectedCatId === 'all') return mainSections;
    return mainSections.filter(m => m.categoryId === selectedCatId);
  }, [mainSections, selectedCatId]);

  // Available sub sections based on selected main section
  const availableSubSections = useMemo(() => {
    if (selectedMainSecId === 'all') {
      if (selectedCatId === 'all') return subSections;
      return subSections.filter(s => s.categoryId === selectedCatId);
    }
    return subSections.filter(s => s.mainSectionId === selectedMainSecId);
  }, [subSections, selectedMainSecId, selectedCatId]);

  // Filter items for storefront
  const displayedItems = useMemo(() => {
    return catalogItems.filter(item => {
      if (!item.isActive) return false;

      // Search
      const search = searchTerm.trim().toLowerCase();
      if (search) {
        const matchName = item.nameAr.toLowerCase().includes(search);
        const matchCode = item.code.toLowerCase().includes(search);
        if (!matchName && !matchCode) return false;
      }

      // Hierarchy
      if (selectedCatId !== 'all' && item.categoryId !== selectedCatId) return false;
      if (selectedMainSecId !== 'all' && item.mainSectionId !== selectedMainSecId) return false;
      if (selectedSubSecId !== 'all' && item.subSectionId !== selectedSubSecId) return false;

      return true;
    });
  }, [catalogItems, searchTerm, selectedCatId, selectedMainSecId, selectedSubSecId]);

  // Open Order Modal for an item
  const openOrderModal = (item: CatalogItem) => {
    setOrderingItem(item);
    setOrderQuantity(1);
    setSourceBranchId(selectedBrowsingBranch);
    setTargetBranchId(userAssignedBranches[0]?.id || branches[0]?.id || 'b-jaraba');
    setOrderNotes('');
    setOrderSuccessMessage(null);
    setOrderErrorMessage(null);
  };

  // Stock for current source branch in modal
  const currentSourceStock = orderingItem ? (orderingItem.branchStock[sourceBranchId] || 0) : 0;
  const isAvailableInSelectedSource = currentSourceStock >= orderQuantity && currentSourceStock > 0;

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderErrorMessage(null);
    setOrderSuccessMessage(null);

    if (!orderingItem) return;

    if (orderQuantity <= 0) {
      setOrderErrorMessage('يرجى تحديد كمية صحيحة أكبر من صفر');
      return;
    }

    if (currentSourceStock < orderQuantity) {
      setOrderErrorMessage(`الكمية المطلوبة (${orderQuantity}) غير متوفرة حالياً في مخزون الفرع المحدد. المتوفر: ${currentSourceStock}`);
      return;
    }

    const res = createPurchaseOrder({
      itemId: orderingItem.id,
      quantity: orderQuantity,
      sourceBranchId,
      targetBranchId,
      notesAr: orderNotes.trim() || undefined,
    });

    if (!res.success) {
      setOrderErrorMessage(res.error || 'فشل إرسال الطلب');
      return;
    }

    setOrderSuccessMessage(`تم إنشاء طلب الشراء والتوريد برقم [${res.orderNumber}] بنجاح، وخُصمت الكمية من رصيد الفرع.`);
    setTimeout(() => {
      setOrderingItem(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              كتالوج المشتريات والطلب
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              شاشة المشتريات والطلب (Storefront & Catalog)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تصفح الكتالوج البصري لمستلزمات وأجهزة نورسين، التحقق اللحظي من توفر المخزون بالفرع، وإصدار طلبات التوريد الفورية.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveView('catalog')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'catalog'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>كتالوج المنتجات ({displayedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveView('orders_history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'orders_history'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>سجل طلبات التوريد ({scopedPurchaseOrders.length})</span>
          </button>
        </div>
      </div>

      {activeView === 'catalog' && (
        <div className="space-y-6">
          
          {/* Top Branch Filter & Search */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Target Branch Selector for availability view */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>الفرع المستهدف للاستعلام عن التوفر:</span>
              </span>
              <select
                value={selectedBrowsingBranch}
                onChange={(e) => setSelectedBrowsingBranch(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    🏢 {b.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم الصنف أو الكود..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

          </div>

          {/* Tier 1 Categories Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setSelectedCatId('all');
                setSelectedMainSecId('all');
                setSelectedSubSecId('all');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                selectedCatId === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              كافة الفئات (All)
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCatId(cat.id);
                  setSelectedMainSecId('all');
                  setSelectedSubSecId('all');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                  selectedCatId === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>

          {/* Tier 2 & Tier 3 Sub Filters */}
          {(selectedCatId !== 'all' || selectedMainSecId !== 'all') && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
              
              {/* Main Sections */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500">القسم الرئيسي:</span>
                <select
                  value={selectedMainSecId}
                  onChange={(e) => {
                    setSelectedMainSecId(e.target.value);
                    setSelectedSubSecId('all');
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 outline-hidden"
                >
                  <option value="all">الكل</option>
                  {availableMainSections.map(m => (
                    <option key={m.id} value={m.id}>{m.nameAr}</option>
                  ))}
                </select>
              </div>

              {/* Sub Sections */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500">القسم الفرعي:</span>
                <select
                  value={selectedSubSecId}
                  onChange={(e) => setSelectedSubSecId(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 outline-hidden"
                >
                  <option value="all">الكل</option>
                  {availableSubSections.map(s => (
                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                  ))}
                </select>
              </div>

              {(selectedMainSecId !== 'all' || selectedSubSecId !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedMainSecId('all');
                    setSelectedSubSecId('all');
                  }}
                  className="text-xs text-red-600 hover:underline cursor-pointer mr-auto"
                >
                  إلغاء التصفية
                </button>
              )}

            </div>
          )}

          {/* Storefront Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedItems.length === 0 ? (
              <div className="col-span-full py-16 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-600">لا توجد أصناف مطابقة للبحث أو التصفية</p>
                <p className="text-xs text-slate-400 mt-1">جرب تغيير الفئة المحددة أو إعادة ضبط كلمات البحث</p>
              </div>
            ) : (
              displayedItems.map((item) => {
                const stockAtBrowsingBranch = item.branchStock[selectedBrowsingBranch] || 0;
                const minAlert = item.minAlertStock || 3;
                const isOutOfStock = stockAtBrowsingBranch === 0;
                const isLowStock = stockAtBrowsingBranch > 0 && stockAtBrowsingBranch <= minAlert;

                const cat = categories.find(c => c.id === item.categoryId);
                const msec = mainSections.find(m => m.id === item.mainSectionId);
                const ssec = subSections.find(s => s.id === item.subSectionId);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      
                      {/* Top Bar: SKU & Hierarchy */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.code}
                        </span>

                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                          {cat?.nameAr}
                        </span>
                      </div>

                      {/* Item Title & Desc */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition mb-1">
                        {item.nameAr}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {item.descriptionAr || 'لا توجد مواصفات إضافية مسجلة.'}
                      </p>

                      {/* 3-Tier Hierarchy Path */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 mb-4">
                        <div className="text-slate-400 text-[10px]">التصنيف الهيكلي:</div>
                        <div className="font-medium truncate">
                          {msec?.nameAr} ⬅ <strong className="text-slate-800">{ssec?.nameAr}</strong>
                        </div>
                      </div>

                      {/* Price & Real-time Branch Stock Availability */}
                      <div className="p-3 rounded-2xl border mb-4 bg-slate-50/70 border-slate-200 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">السعر المعتمد:</span>
                          <span className="text-lg font-black font-mono text-slate-900">
                            {item.basePrice.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">د.ل / {item.unit}</span>
                          </span>
                        </div>

                        {/* Real-time Branch Availability Indicator */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500">حالة التوفر بالفرع:</span>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" />
                              غير متوفر (نافذ)
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              متبقي {stockAtBrowsingBranch} {item.unit} فقط
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              متوفر ({stockAtBrowsingBranch} {item.unit})
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Order Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => openOrderModal(item)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                          isOutOfStock
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>طلب الصنف (Order Item)</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* View 2: Orders History */}
      {activeView === 'orders_history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">سجل طلبات الشراء والتوريد بين الفروع</h2>
              <p className="text-xs text-slate-500">متابعة مسار شحن الطلبات المنشأة من كتالوج المشتريات</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold">
                    <th className="py-3 px-4">رقم الطلب</th>
                    <th className="py-3 px-4">الصنف والكود</th>
                    <th className="py-3 px-4 text-center">الكمية</th>
                    <th className="py-3 px-4">القيمة الإجمالية</th>
                    <th className="py-3 px-4">من فرع (المصدر)</th>
                    <th className="py-3 px-4">إلى فرع (المستلم)</th>
                    <th className="py-3 px-4">طالب الشراء</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {scopedPurchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-600">لا توجد طلبات شراء مسجلة حالياً</p>
                        <p className="text-xs text-slate-400 mt-1">قم بطلب الأصناف من الكتالوج بالأعلى وسيتم إدراجها هنا</p>
                      </td>
                    </tr>
                  ) : (
                    scopedPurchaseOrders.map((order) => {
                      const srcBranch = branches.find(b => b.id === order.sourceBranchId);
                      const tgtBranch = branches.find(b => b.id === order.targetBranchId);

                      const statusBadge = {
                        pending: 'bg-amber-50 text-amber-800 border-amber-200',
                        approved: 'bg-blue-50 text-blue-800 border-blue-200',
                        dispatched: 'bg-purple-50 text-purple-800 border-purple-200',
                        completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                        cancelled: 'bg-red-50 text-red-800 border-red-200',
                      }[order.status];

                      const statusText = {
                        pending: 'قيد المراجعة',
                        approved: 'معتمد للتجهيز',
                        dispatched: 'تم الشحن بالمسار',
                        completed: 'مستلم ومكتمل',
                        cancelled: 'ملغي ومسترد',
                      }[order.status];

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                            {order.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{order.itemNameAr}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{order.itemCode}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-black text-slate-800">
                            {order.quantity}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {order.totalPrice.toLocaleString()} د.ل
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            🏢 {srcBranch?.nameAr.replace('فرع ', '') || order.sourceBranchId}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            🏢 {tgtBranch?.nameAr.replace('فرع ', '') || order.targetBranchId || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{order.requestedByName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{order.requestDate}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {order.status === 'pending' && (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updatePurchaseOrderStatus(order.id, 'approved')}
                                  className="px-2 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                >
                                  اعتماد
                                </button>
                                <button
                                  onClick={() => updatePurchaseOrderStatus(order.id, 'cancelled')}
                                  className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  إلغاء
                                </button>
                              </div>
                            )}
                            {order.status === 'approved' && (
                              <button
                                onClick={() => updatePurchaseOrderStatus(order.id, 'dispatched')}
                                className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                              >
                                تأكيد الشحن
                              </button>
                            )}
                            {order.status === 'dispatched' && (
                              <button
                                onClick={() => updatePurchaseOrderStatus(order.id, 'completed')}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                              >
                                تأكيد الاستلام
                              </button>
                            )}
                            {(order.status === 'completed' || order.status === 'cancelled') && (
                              <span className="text-[11px] text-slate-400">-</span>
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
        </div>
      )}

      {/* Branch Order Action Modal */}
      {orderingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button onClick={() => setOrderingItem(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-base font-bold text-slate-900">طلب وتوريد الصنف (Branch Order)</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{orderingItem.code}</p>
              </div>
            </div>

            {orderErrorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{orderErrorMessage}</span>
              </div>
            )}

            {orderSuccessMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{orderSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleConfirmOrder} className="mt-4 space-y-4 text-xs">
              
              {/* Item Card Overview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{orderingItem.nameAr}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    السعر: {orderingItem.basePrice} د.ل لكل {orderingItem.unit}
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="text-slate-400 text-[10px]">المجموع التقديري:</div>
                  <div className="text-base font-black text-emerald-700">
                    {(orderingItem.basePrice * orderQuantity).toLocaleString()} د.ل
                  </div>
                </div>
              </div>

              {/* Source Branch Selector (الفرع المراد الطلب منه) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الفرع المراد الطلب منه (مصدر البضاعة / المخزون) *
                </label>
                <select
                  value={sourceBranchId}
                  onChange={(e) => setSourceBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  {branches.map(b => {
                    const stock = orderingItem.branchStock[b.id] || 0;
                    return (
                      <option key={b.id} value={b.id}>
                        🏢 {b.nameAr} - (الرصيد المتوفر: {stock} {orderingItem.unit})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Real-time availability indicator badge */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isAvailableInSelectedSource
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2">
                  {isAvailableInSelectedSource ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">
                      {isAvailableInSelectedSource ? 'حالة التوفر: متوفر (Met)' : 'حالة التوفر: غير متوفر (Out of Stock)'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      رصيد هذا الفرع الحالي: <strong>{currentSourceStock}</strong> {orderingItem.unit}
                    </div>
                  </div>
                </div>

                {!isAvailableInSelectedSource && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                    المخزون غير كافٍ
                  </span>
                )}
              </div>

              {/* Target Branch Selector (فرع الاستلام) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الفرع المستلم / الطالب *
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">الكمية المطلوبة *</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(prev => Math.max(1, prev - 1))}
                      className="p-2 text-slate-600 hover:bg-slate-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={currentSourceStock}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center font-mono font-bold text-base bg-white border border-slate-300 rounded-md text-slate-950 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(prev => Math.min(currentSourceStock, prev + 1))}
                      className="p-2 text-slate-600 hover:bg-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-slate-700 font-bold">{orderingItem.unit}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">ملاحظات الطلب أو التبرير</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="سبب الطلب أو موعد الحاجة للتوريد..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!isAvailableInSelectedSource}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  تأكيد وإصدار طلب الشراء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
