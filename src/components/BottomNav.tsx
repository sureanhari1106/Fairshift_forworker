import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, ClipboardList, Receipt, ShieldAlert, Award } from 'lucide-react';
import { FairShiftStore } from '../services/store';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t, currentWorker } = useApp();

  const requests = FairShiftStore.getRequests();
  const openRequestsCount = requests.filter(
    (r) => r.workerId === currentWorker.id && (r.status === 'under_review' || r.status === 'more_info_requested')
  ).length;

  const navItems = [
    { id: 'home', label: t.navHome, icon: Home },
    {
      id: 'requests',
      label: t.navRequests,
      icon: ClipboardList,
      badge: openRequestsCount > 0 ? openRequestsCount : undefined,
    },
    { id: 'payslip', label: t.navPayslip, icon: Receipt },
    { id: 'safety', label: t.navSafety, icon: ShieldAlert },
    { id: 'skills', label: t.navSkills, icon: Award },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-teal-950/95 backdrop-blur-md border-t border-teal-900 shadow-2xl safe-area-bottom">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 transition-colors select-none ${
                isActive ? 'text-teal-300 font-semibold' : 'text-teal-400/70 hover:text-teal-200'
              }`}
              style={{ minHeight: '48px' }}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-teal-300' : 'text-teal-400/80'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[9px] shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[64px] ${isActive ? 'text-teal-200' : 'text-teal-400/70'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-teal-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
