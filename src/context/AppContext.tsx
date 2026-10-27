import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, translations, Translations } from '../i18n/translations';
import { Sector, UserRole } from '../types';
import { FairShiftStore } from '../services/store';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  db,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  sector: Sector;
  setSector: (sector: Sector) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulateOffline: () => void;
  offlineQueueCount: number;
  syncOfflineQueue: () => Promise<void>;
  currentWorker: {
    id: string;
    name: string;
    trade: string;
    workerId: string;
    site: string;
  };
  openRequestModalWithContext?: (data: { category?: string; title?: string; relatedRecordId?: string }) => void;
  prefilledRequestData: { category?: string; title?: string; relatedRecordId?: string } | null;
  clearPrefilledRequestData: () => void;
  firebaseUser: User | null;
  isFirebaseLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('fairshift_language') as Language) || 'ta';
  });

  const [sector, setSectorState] = useState<Sector>(() => {
    return FairShiftStore.getActiveSector();
  });

  const [activeRole, setActiveRole] = useState<UserRole>('worker');
  const [activeTab, setActiveTab] = useState<string>('home');

  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(() => {
    return FairShiftStore.isSimulatedOffline();
  });

  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [prefilledRequestData, setPrefilledRequestData] = useState<{
    category?: string;
    title?: string;
    relatedRecordId?: string;
  } | null>(null);

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);

  // Compute effective online state
  const isOnline = isBrowserOnline && !isSimulatedOffline;

  const updateQueueCount = useCallback(() => {
    const queue = FairShiftStore.getOfflineQueue();
    setOfflineQueueCount(queue.length);
  }, []);

  useEffect(() => {
    updateQueueCount();
  }, [updateQueueCount]);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsFirebaseLoading(false);

      if (user) {
        // Ensure user profile document exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const snapshot = await getDoc(userDocRef);
          const isBootstrappedAdmin = user.email === 'sureanhari1106@gmail.com';
          if (!snapshot.exists()) {
            await setDoc(userDocRef, {
              id: user.uid,
              organizationId: 'org-metro-infra-01',
              name: user.displayName || (isBootstrappedAdmin ? 'Administrator' : 'Worker'),
              role: isBootstrappedAdmin ? 'admin' : 'worker',
              sector,
              preferredLanguage: language,
              trade: isBootstrappedAdmin ? 'Site Administration & HSE Lead' : 'General Construction & Assembly',
              workerId: isBootstrappedAdmin ? 'ADMIN-01' : `W-${user.uid.slice(0, 6).toUpperCase()}`,
            });
          }

          // Automatically seed base worksites, organization, and emergency contacts to Firestore
          FairShiftStore.seedInitialDataToFirestore();
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [sector, language]);

  const signInWithGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const signOutAccount = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fairshift_language', lang);
  };

  const setSector = (s: Sector) => {
    setSectorState(s);
    FairShiftStore.setActiveSector(s);
  };

  const toggleSimulateOffline = () => {
    const nextVal = !isSimulatedOffline;
    setIsSimulatedOfflineState(nextVal);
    FairShiftStore.setSimulatedOffline(nextVal);
  };

  // Sync offline queue items to the store and to Firestore if authenticated
  const syncOfflineQueue = useCallback(async () => {
    const queue = FairShiftStore.getOfflineQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      if (item.type === 'request') {
        const req = {
          ...item.data,
          status: 'submitted',
          updatedAt: new Date().toISOString(),
        };
        FairShiftStore.addRequest(req);

        // Sync to Firestore if user is authenticated
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'workerRequests', req.id), req);
          } catch (e) {
            console.warn('Could not sync request to Firestore:', e);
          }
        }
      } else if (item.type === 'safety') {
        const rep = {
          ...item.data,
          status: 'reported',
        };
        FairShiftStore.addSafetyReport(rep);
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'safetyReports', rep.id), rep);
          } catch (e) {
            console.warn('Could not sync safety report to Firestore:', e);
          }
        }
      } else if (item.type === 'feedback') {
        FairShiftStore.addAnonymousFeedback(item.data);
        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'anonymousFeedback', item.data.id), item.data);
          } catch (e) {
            console.warn('Could not sync anonymous feedback to Firestore:', e);
          }
        }
      }
      FairShiftStore.removeFromOfflineQueue(item.id);
    }
    updateQueueCount();
  }, [updateQueueCount]);

  // When coming back online, auto-sync queued items
  useEffect(() => {
    if (isOnline && offlineQueueCount > 0) {
      syncOfflineQueue();
    }
  }, [isOnline, offlineQueueCount, syncOfflineQueue]);

  // Current worker profile based on authenticated user or sector demo profile
  const currentWorker = firebaseUser
    ? {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Authorized Worker',
        trade: sector === 'construction' ? 'Scaffolding & Rigging Crew' : 'Hydraulic Stamping & Tooling',
        workerId: `W-${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
        site:
          sector === 'construction'
            ? 'Metro Viaduct Pier 14 (Level 3)'
            : 'Unit 3 Stamping Floor (Line B)',
      }
    : sector === 'construction'
    ? {
        id: 'worker-karthik',
        name: 'Karthik Raja',
        trade: 'Scaffolding & Rigging Crew',
        workerId: 'CW-8492',
        site: 'Metro Viaduct Pier 14 (Level 3)',
      }
    : {
        id: 'worker-priya',
        name: 'Priya Sundaram',
        trade: 'Hydraulic Stamping & Tooling',
        workerId: 'FW-3109',
        site: 'Unit 3 Stamping Floor (Line B)',
      };

  const openRequestModalWithContext = (data: { category?: string; title?: string; relatedRecordId?: string }) => {
    setPrefilledRequestData(data);
    setActiveTab('requests');
  };

  const clearPrefilledRequestData = () => {
    setPrefilledRequestData(null);
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        sector,
        setSector,
        activeRole,
        setActiveRole,
        activeTab,
        setActiveTab,
        isOnline,
        isSimulatedOffline,
        toggleSimulateOffline,
        offlineQueueCount,
        syncOfflineQueue,
        currentWorker,
        openRequestModalWithContext,
        prefilledRequestData,
        clearPrefilledRequestData,
        firebaseUser,
        isFirebaseLoading,
        signInWithGoogle,
        signOutAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
