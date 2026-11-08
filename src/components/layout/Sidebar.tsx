import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  ClockAlert,
  FileText,
  CheckSquare,
  Building,
  Package,
  ShoppingCart,
  CalendarDays,
  Briefcase,
  Truck,
  MessageSquareText,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export type NavigationTab = 
  | 'dashboard'
  | 'employees'
  | 'casual_workers'
  | 'weekly_report'
  | 'logistics_transfer'
  | 'inventory'
  | 'procurement'
  | 'attendance'
  | 'requests'
  | 'tasks'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const {
    hasPermission,
    scopedRequests,
    scopedTasks,
    scopedPurchaseOrders,
    scopedCasualEmployees,
    scopedTransfers,
    catalogItems,
  } = useApp();
  const { toggleChat, unreadCount } = useChat();

  // Pending requests count badge
  const pendingRequestsCount = scopedRequests.filter(r => r.status === 'pending').length;

  // Active tasks for user / in scope
  const activeTasksCount = scopedTasks.filter(t => !t.isArchived).length;

  // Pending purchase orders
  const pendingOrdersCount = scopedPurchaseOrders.filter(po => po.status === 'pending').length;

  // Pending casual workforce approvals
  const pendingCasualApprovalsCount = scopedCasualEmployees.filter(
    (w) => w.approvalStatus === 'pending_hr_approval'
  ).length;

  // Active logistics transfers and deficit alerts
  const activeTransfersCount = scopedTransfers.filter(
    (t) => t.status === 'pending_pickup' || t.status === 'in_transit'
  ).length;
  const deficitTransfersCount = scopedTransfers.filter((t) => t.hasDeficit).length;

  const menuItems: Array<{
    id: NavigationTab;
    labelAr: string;
    sublabelAr: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    visible: boolean;
  }> = [
    {
      id: 'dashboard',
      labelAr: 'الرئيسية',
      sublabelAr: 'نظرة عامة ومسارات',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'employees',
      labelAr: 'سجل الموظفين',
      sublabelAr: 'شاشة 2: إدارة الكادر والوظائف',
      icon: Users,
      visible: hasPermission('view_employees'),
    },
    {
      id: 'casual_workers',
      labelAr: 'عمالة عارضة',
      sublabelAr: 'سجل الكوادر المؤقتة واعتماد HR',
      icon: Briefcase,
      badge: pendingCasualApprovalsCount > 0 ? pendingCasualApprovalsCount : undefined,
      badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-500/40',
      visible: hasPermission('view_casual_workers'),
    },
    {
      id: 'weekly_report',
      labelAr: 'التقرير الأسبوعي للفروع',
      sublabelAr: 'دوام الكوادر واعتماد الفرع',
      icon: CalendarDays,
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40',
      visible: hasPermission('view_employees') || hasPermission('approve_weekly_report'),
    },
    {
      id: 'logistics_transfer',
      labelAr: 'النقل',
      sublabelAr: 'حركة الطرود والشحنات بين الفروع',
      icon: Truck,
      badge: activeTransfersCount > 0 ? activeTransfersCount : (deficitTransfersCount > 0 ? deficitTransfersCount : undefined),
      badgeColor: deficitTransfersCount > 0 ? 'bg-rose-950/90 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse' : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40',
      visible: hasPermission('view_logistics') || hasPermission('create_logistics_transfer') || hasPermission('pickup_logistics_transfer'),
    },
    {
      id: 'inventory',
      labelAr: 'الأصناف والمخزون',
      sublabelAr: 'إدارة مخزون الفروع وأكواد SKU',
      icon: Package,
      badge: catalogItems.length,
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40',
      visible: hasPermission('manage_inventory') || hasPermission('manage_catalog'),
    },
    {
      id: 'procurement',
      labelAr: 'المشتريات والطلب',
      sublabelAr: 'كتالوج التوريد وتوريد الفروع',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-teal-950/80 text-teal-300 border border-teal-500/40',
      visible: hasPermission('order_items'),
    },
    {
      id: 'attendance',
      labelAr: 'الغياب والتأخير',
      sublabelAr: 'شاشة 5: رصد الحالات والمتابعة',
      icon: ClockAlert,
      visible: hasPermission('view_attendance') || hasPermission('create_incident'),
    },
    {
      id: 'requests',
      labelAr: 'شاشة الطلبات',
      sublabelAr: 'شاشة 6: الإجازات والخدمة الذاتية',
      icon: FileText,
      badge: pendingRequestsCount,
      badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-500/40',
      visible: hasPermission('view_requests') || hasPermission('create_request'),
    },
    {
      id: 'tasks',
      labelAr: 'شاشة المهام',
      sublabelAr: 'شاشة 7: التكليفات ونسب الإنجاز',
      icon: CheckSquare,
      badge: activeTasksCount,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40',
      visible: hasPermission('view_tasks'),
    },
    {
      id: 'users',
      labelAr: 'المستخدمين والصلاحيات',
      sublabelAr: 'شاشة 4: مصفوفة RBAC والمطابقات',
      icon: ShieldCheck,
      visible: hasPermission('manage_users') || hasPermission('manage_permissions'),
    },
    {
      id: 'settings',
      labelAr: 'الإعدادات العامة',
      sublabelAr: 'شاشة 3: الهيكل الهرمي Tier-3 والفروع',
      icon: Settings,
      visible:
        hasPermission('manage_branches') ||
        hasPermission('manage_shifts') ||
        hasPermission('manage_statuses') ||
        hasPermission('manage_catalog'),
    },
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-[#061822]/80 backdrop-blur-2xl border-l border-cyan-500/20 min-h-[calc(100vh-5rem)] p-4 sm:p-5 flex flex-col justify-between text-white select-none shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-xs font-extrabold text-cyan-300/80 tracking-wide flex items-center justify-between">
          <span>الوحدات والنطاقات الأساسية</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400/60 animate-ping"></span>
        </div>

        {menuItems
          .filter(item => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-right transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-l from-cyan-500/25 via-teal-500/30 to-cyan-600/35 border border-cyan-400 text-white font-black shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-300/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-800/80 text-cyan-400/70 border border-white/5 group-hover:text-cyan-300 group-hover:bg-slate-700/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs leading-snug font-bold">{item.labelAr}</div>
                    <div
                      className={`text-[10px] leading-tight mt-0.5 ${
                        isActive ? 'text-cyan-200/90 font-semibold' : 'text-slate-400 group-hover:text-cyan-200/70'
                      }`}
                    >
                      {item.sublabelAr}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_8px_#22d3ee]'
                        : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>
 
      {/* Quick Internal Chat Launcher in Sidebar */}
      <div className="pt-3 mt-4 border-t border-cyan-500/15">
        <button
          type="button"
          onClick={toggleChat}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-teal-950/80 hover:from-cyan-900/90 hover:to-teal-900/90 border border-cyan-500/30 text-white transition shadow-lg cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 text-cyan-300 border border-cyan-400/40 flex items-center justify-center group-hover:scale-105 transition">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>الدردشة الداخلية</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-[10px] text-cyan-300/70">تواصل مباشر بين الفروع</div>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Corporate Info Footer */}
      <div className="pt-4 border-t border-cyan-500/15 mt-6 text-right">
        <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-cyan-500/20 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-200 mb-1">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>نورسين للإدارة المتكاملة</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            نسخة المؤسسة v2.5 | وحدة المشتريات والمخزون
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-cyan-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            نظام الهيكل الهرمي ثلاثي المستويات مفعل
          </div>
        </div>
      </div>
    </aside>
  );
};
