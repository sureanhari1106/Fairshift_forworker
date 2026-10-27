import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import {
  Wifi,
  WifiOff,
  CloudUpload,
  Trash2,
  RefreshCw,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { OfflineQueueItem } from '../types';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, isSimulatedOffline, toggleSimulateOffline, syncOfflineQueue } = useApp();
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => FairShiftStore.getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setQueue(FairShiftStore.getOfflineQueue());
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this unsent draft? This cannot be recovered.')) {
      FairShiftStore.removeFromOfflineQueue(id);
      refreshList();
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      setStatusMessage('Device is currently offline. Connect to internet or turn off Simulated Offline.');
      return;
    }
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      await syncOfflineQueue();
      refreshList();
      setStatusMessage('All queued items synchronized successfully with the server.');
    } catch (err: any) {
      setStatusMessage('Sync encountered an error: ' + (err?.message || 'Check connection'));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-teal-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isOnline ? 'bg-emerald-600/30 text-emerald-400' : 'bg-amber-600/30 text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Offline Sync Queue &amp; State</h2>
              <p className="text-xs text-teal-200">
                {isOnline ? 'Connected to FairShift Server' : 'Working Offline (Local Storage Active)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="p-4 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-700">Network Simulation:</span>
              <button
                onClick={toggleSimulateOffline}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  isSimulatedOffline
                    ? 'bg-amber-500 text-slate-950 border-amber-600'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                }`}
              >
                {isSimulatedOffline ? 'Simulated Offline Mode Active' : 'Normal Network Mode'}
              </button>
            </div>

            {queue.length > 0 && isOnline && (
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync All ({queue.length})</span>
              </button>
            )}
          </div>

          {statusMessage && (
            <div className="mt-2.5 p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Queue Items */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {queue.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm text-stone-800">Queue is completely synchronized</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                All worker requests, safety incident reports, and feedback have been confirmed by the server.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-teal-300 transition shadow-xs flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                      {item.type}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Saved locally &bull; Waiting to send</span>
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-stone-900 truncate">
                    {item.data?.title || item.data?.category || 'Queued Item'}
                  </h4>
                  <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                    {item.data?.description || item.data?.feedbackText || 'Draft payload'}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Queued: {new Date(item.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-1 text-[11px] text-stone-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Drafts remain on this device until synced.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
