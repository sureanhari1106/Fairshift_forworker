/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { WorkerHome } from './components/WorkerHome';
import { RequestCentre } from './components/RequestCentre';
import { PayslipView } from './components/PayslipView';
import { SafetySection } from './components/SafetySection';
import { AnonymousFeedbackView } from './components/AnonymousFeedbackView';
import { SkillPassportView } from './components/SkillPassportView';
import { AttendanceView } from './components/AttendanceView';
import { ManagerDashboard } from './components/ManagerDashboard';
import {
  Home,
  ClipboardList,
  Receipt,
  ShieldAlert,
  Award,
  MessageSquareOff,
  QrCode,
  PhoneCall,
  HardHat,
  Factory,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeRole, activeTab, setActiveTab, t, sector } = useApp();
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  const desktopNavItems = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'requests', label: t.navRequests, icon: ClipboardList },
    { id: 'payslip', label: t.navPayslip, icon: Receipt },
    { id: 'safety', label: t.navSafety, icon: ShieldAlert },
    { id: 'skills', label: t.navSkills, icon: Award },
    { id: 'attendance', label: t.navAttendance, icon: QrCode },
    { id: 'anonymous', label: t.navAnonymous, icon: MessageSquareOff },
    { id: 'emergency', label: t.navEmergency, icon: PhoneCall },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Global Header */}
      <Header onOpenQueueModal={() => setIsQueueModalOpen(true)} />

      {/* Desktop Secondary Navigation Bar (for Worker View) */}
      {activeRole === 'worker' && (
        <nav className="hidden sm:block bg-teal-900/90 border-b border-teal-800 text-teal-100 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto">
            <div className="flex items-center space-x-1 py-1.5">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-teal-200 hover:text-white hover:bg-teal-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 py-2 sm:py-4">
        {activeRole === 'manager' ? (
          <ManagerDashboard />
        ) : (
          <>
            {activeTab === 'home' && (
              <WorkerHome
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenSpeakRequest={() => setActiveTab('requests')}
              />
            )}
            {activeTab === 'requests' && <RequestCentre />}
            {activeTab === 'payslip' && <PayslipView />}
            {activeTab === 'safety' && <SafetySection />}
            {activeTab === 'skills' && <SkillPassportView />}
            {activeTab === 'anonymous' && <AnonymousFeedbackView />}
            {activeTab === 'attendance' && <AttendanceView />}
            {activeTab === 'emergency' && <SafetySection />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation (Worker View Only) */}
      {activeRole === 'worker' && <BottomNav />}

      {/* Offline Sync Queue Modal */}
      <OfflineQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
