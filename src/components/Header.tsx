import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  HardHat,
  Factory,
  Wifi,
  WifiOff,
  UserCheck,
  Briefcase,
  AlertCircle,
  RotateCcw,
  LogIn,
  LogOut,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { FairShiftStore } from '../services/store';

interface HeaderProps {
  onOpenQueueModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQueueModal }) => {
  const {
    language,
    setLanguage,
    sector,
    setSector,
    activeRole,
    setActiveRole,
    isOnline,
    toggleSimulateOffline,
    offlineQueueCount,
    currentWorker,
    firebaseUser,
    signInWithGoogle,
    signOutAccount,
  } = useApp();

  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleResetData = () => {
    if (confirm('Reset demo data to initial sample records?')) {
      FairShiftStore.resetDemoData();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-teal-950 text-white shadow-md border-b border-teal-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Sector Tag */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-inner flex-shrink-0 text-white font-bold text-xl tracking-tight border border-teal-400/30">
            FS
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-teal-50 truncate">
                FairShift
              </h1>
              {/* Sector Pill */}
              <button
                onClick={() => setSector(sector === 'construction' ? 'manufacturing' : 'construction')}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-800/80 hover:bg-teal-800 text-teal-200 border border-teal-700 transition"
                title="Click to switch sector"
              >
                {sector === 'construction' ? (
                  <>
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Construction Mode</span>
                  </>
                ) : (
                  <>
                    <Factory className="w-3.5 h-3.5 text-sky-400" />
                    <span>Factory Mode</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] sm:text-xs text-teal-300/90 truncate flex items-center gap-1.5">
              {activeRole === 'worker' ? (
                <>
                  <span className="font-medium text-white">{currentWorker.name}</span> ({currentWorker.workerId})
                  {firebaseUser && (
                    <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-600/50">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>Firebase Verified</span>
                    </span>
                  )}
                </>
              ) : (
                <span className="text-amber-300 font-medium">Administrator View</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls: Language, Network, Auth, Mode Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Sector Switcher Button */}
          <button
            onClick={() => setSector(sector === 'construction' ? 'manufacturing' : 'construction')}
            className="sm:hidden p-2 rounded-lg bg-teal-900 hover:bg-teal-800 text-teal-200 border border-teal-800"
            aria-label="Switch sector"
          >
            {sector === 'construction' ? (
              <HardHat className="w-4 h-4 text-amber-400" />
            ) : (
              <Factory className="w-4 h-4 text-sky-400" />
            )}
          </button>

          {/* Prominent Language Selector */}
          <div className="flex items-center bg-teal-900/90 border border-teal-800 rounded-lg p-0.5">
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                language === 'ta'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-teal-200 hover:text-white'
              }`}
              title="தமிழ் (Tamil)"
            >
              தமிழ்
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition ${
                language === 'en'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-teal-200 hover:text-white'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Online / Offline Status Badge */}
          <button
            onClick={onOpenQueueModal}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
              isOnline
                ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/80 border-amber-600 text-amber-300 hover:bg-amber-900/50'
            }`}
            title="Click to view offline sync queue"
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
            {offlineQueueCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {offlineQueueCount}
              </span>
            )}
          </button>

          {/* Firebase Google Auth Button */}
          {firebaseUser ? (
            <div className="flex items-center gap-1">
              <button
                onClick={signOutAccount}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-900 hover:bg-teal-800 text-teal-200 border border-teal-800 transition"
                title={`Signed in as ${firebaseUser.email}. Click to sign out.`}
              >
                <LogOut className="w-3 h-3 text-teal-400" />
                <span className="max-w-[100px] truncate">{firebaseUser.displayName || 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 shadow-sm transition"
              title="Sign in with Google to sync to your Firebase project"
            >
              <Flame className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">Google Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}

          {/* Role Switcher: Worker / Manager Toggle */}
          <button
            onClick={() => setActiveRole(activeRole === 'worker' ? 'manager' : 'worker')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              activeRole === 'manager'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-teal-900 text-teal-200 border-teal-800 hover:bg-teal-800'
            }`}
          >
            {activeRole === 'worker' ? (
              <>
                <Briefcase className="w-3.5 h-3.5" />
                <span>Manager Mode</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Worker View</span>
              </>
            )}
          </button>

          {/* Mobile Role Switcher */}
          <button
            onClick={() => setActiveRole(activeRole === 'worker' ? 'manager' : 'worker')}
            className={`sm:hidden p-2 rounded-lg text-xs font-bold border transition ${
              activeRole === 'manager'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-teal-900 text-teal-200 border-teal-800'
            }`}
            title="Switch worker / manager view"
          >
            {activeRole === 'worker' ? (
              <Briefcase className="w-4 h-4 text-amber-300" />
            ) : (
              <UserCheck className="w-4 h-4 text-teal-950" />
            )}
          </button>

          {/* Demo Controls Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-teal-900/60"
              title="Demo & Offline Settings"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-3.5 z-50 text-slate-200 text-xs">
                <div className="font-semibold text-slate-100 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Firebase &amp; Offline Controls</span>
                  <span className="text-[10px] text-teal-400 font-mono">v1.1</span>
                </div>

                <div className="py-2.5 space-y-2.5">
                  <div className="p-2 bg-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold text-teal-400 block">
                      Firebase Project
                    </span>
                    <span className="font-mono text-[11px] text-slate-200 block truncate">
                      possible-reserve-x5wls
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Region: asia-south1 &bull; Firestore Enterprise
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Simulate Offline Mode</span>
                    <button
                      onClick={toggleSimulateOffline}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        !isOnline
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {!isOnline ? 'Active (Offline)' : 'Off (Online)'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Test submitting requests without internet. Drafts queue locally and sync to Firebase when reconnected.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <button
                    onClick={handleResetData}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 font-medium"
                  >
                    Reset Demo Seed Data
                  </button>
                  <button
                    onClick={() => setShowDemoMenu(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
