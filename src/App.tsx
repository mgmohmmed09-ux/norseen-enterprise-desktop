/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { LoginScreen } from './components/auth/LoginScreen';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { EmployeeRegistry } from './components/employees/EmployeeRegistry';
import { SystemSettings } from './components/settings/SystemSettings';
import { UserManagement } from './components/users/UserManagement';
import { AbsenceDelayTracking } from './components/attendance/AbsenceDelayTracking';
import { RequestManagement } from './components/requests/RequestManagement';
import { TaskManagement } from './components/tasks/TaskManagement';
import { ItemRegistryInventory } from './components/inventory/ItemRegistryInventory';
import { PurchasingCatalog } from './components/procurement/PurchasingCatalog';
import { WeeklyBranchReport } from './components/reports/WeeklyBranchReport';
import { CasualLaborRegistry } from './components/casual/CasualLaborRegistry';
import { BranchTransfersScreen } from './components/logistics/BranchTransfersScreen';
import { QuranRadioProvider } from './context/QuranRadioContext';
import { QuranRadioMiniBar } from './components/common/QuranRadioMiniBar';
import { Building2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, activeBranchFilter, branches } = useApp();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Active branch label
  const activeBranchObj = branches.find(b => b.id === activeBranchFilter);

  return (
    <div className="min-h-screen bg-[#041217] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      
      {/* Atmospheric Background Ambient Cyan/Teal Auroras & Beams (matching mockup) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-right ambient radial glow */}
        <div className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[150px]" />
        
        {/* Bottom-left ambient radial glow */}
        <div className="absolute -bottom-40 -left-40 w-[650px] h-[650px] rounded-full bg-teal-500/12 blur-[150px]" />

        {/* Center radiant aura */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-cyan-600/5 blur-[170px]" />

        {/* Diagonal light rays / beams in background */}
        <svg
          viewBox="0 0 1440 900"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M -100 200 L 1600 600"
            stroke="url(#beamGrad1)"
            strokeWidth="35"
            strokeLinecap="round"
            filter="blur(25px)"
          />
          <path
            d="M 1600 100 L -200 800"
            stroke="url(#beamGrad2)"
            strokeWidth="45"
            strokeLinecap="round"
            filter="blur(35px)"
          />
          <defs>
            <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="beamGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto relative z-10">
        
        {/* Right Sidebar in RTL */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Central Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {/* Branch Scope Notice if filtered or restricted */}
          {activeBranchFilter !== 'all' && (
            <div className="mb-5 p-3.5 bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl flex items-center justify-between text-xs text-cyan-200 shadow-lg">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>
                  أنت تتصفح حالياً بيانات فرع: <strong className="text-white font-bold">{activeBranchObj?.nameAr || activeBranchFilter}</strong>
                </span>
              </div>
              <span className="text-[11px] bg-cyan-950/80 text-cyan-300 font-bold px-2.5 py-1 rounded-xl border border-cyan-500/40 font-mono">
                عزل البيانات مفعل
              </span>
            </div>
          )}

          {/* Active Screen Tab */}
          {currentTab === 'dashboard' && <ExecutiveDashboard onNavigate={setCurrentTab} />}
          {currentTab === 'employees' && <EmployeeRegistry />}
          {currentTab === 'casual_workers' && <CasualLaborRegistry />}
          {currentTab === 'weekly_report' && <WeeklyBranchReport />}
          {currentTab === 'logistics_transfer' && <BranchTransfersScreen />}
          {currentTab === 'inventory' && <ItemRegistryInventory />}
          {currentTab === 'procurement' && <PurchasingCatalog />}
          {currentTab === 'settings' && <SystemSettings />}
          {currentTab === 'users' && <UserManagement />}
          {currentTab === 'attendance' && <AbsenceDelayTracking />}
          {currentTab === 'requests' && <RequestManagement />}
          {currentTab === 'tasks' && <TaskManagement />}

        </main>

      </div>

      {/* Bottom Brushed Metal Footer Strip (matching mockup) */}
      <footer className="w-full brushed-metal border-t border-slate-300 text-slate-800 py-2.5 px-6 sm:px-8 text-xs font-bold shadow-2xl relative z-20 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right">
          
          {/* Right: Brand Title with Icon */}
          <div className="flex items-center gap-2 text-slate-900 font-black">
            <Building2 className="w-4 h-4 text-teal-900" />
            <span>نورسين للإدارة المتكاملة</span>
          </div>

          {/* Center: System Edition & Rights */}
          <div className="text-[11px] text-slate-700 font-semibold tracking-wide">
            عرض © نورسين للإدارة المتكاملة - Norseen ®
          </div>

          {/* Left: Copyright info strip */}
          <div className="text-[10px] text-slate-600 font-mono">
            © Copyright info - Norseen Enterprise System
          </div>

        </div>
      </footer>

      {/* Floating Quran Mini Player (active across all screens when navigating away from dashboard) */}
      <QuranRadioMiniBar
        isDashboardActive={currentTab === 'dashboard'}
        onGoToDashboard={() => setCurrentTab('dashboard')}
      />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <QuranRadioProvider>
        <MainLayout />
      </QuranRadioProvider>
    </AppProvider>
  );
}
