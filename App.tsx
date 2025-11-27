import React, { useState, useEffect } from 'react';
import { WaitlistEntry, Waiter, ViewMode } from './types';
import { 
  fetchData, 
  addEntryToQueue, 
  updateEntryStatus, 
  syncWaiters 
} from './services/storage';
import { PublicView } from './views/PublicView';
import { AdminDashboard } from './views/AdminDashboard';

export default function App() {
  const [mode, setMode] = useState<ViewMode>('admin');
  const [queue, setQueue] = useState<WaitlistEntry[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load data from backend
  const loadData = async () => {
    const data = await fetchData();
    setQueue(data.queue);
    // If backend returns empty waiters (first run), keep defaults if we had them locally, 
    // but usually backend is source of truth.
    if (data.waiters.length > 0 || data.queue.length > 0) {
       setWaiters(data.waiters);
    }
    setIsLoading(false);
  };

  // Initial load + Polling for Real-Time Sync
  useEffect(() => {
    loadData();
    // Poll every 2 seconds to keep Owner and Admin in sync
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAddEntry = async (entryData: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'status'>) => {
    // Optimistic update (optional) or wait for server
    const newEntry = await addEntryToQueue(entryData);
    await loadData(); // Refresh to ensure sync
    return newEntry.id;
  };

  const handleSeatEntry = async (entryId: string, waiterId: string) => {
    // Optimistic UI update for immediate feedback
    setQueue(prev => prev.map(q => q.id === entryId ? { ...q, status: 'seated' } : q));
    
    await updateEntryStatus(entryId, 'seated', waiterId);
    await loadData();
  };

  const handleCancelEntry = async (entryId: string) => {
    setQueue(prev => prev.map(q => q.id === entryId ? { ...q, status: 'cancelled' } : q));
    await updateEntryStatus(entryId, 'cancelled');
    await loadData();
  };

  const handleUpdateWaiters = async (newWaiters: Waiter[]) => {
    setWaiters(newWaiters);
    await syncWaiters(newWaiters);
    await loadData();
  };

  if (isLoading && queue.length === 0 && waiters.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-orange-600">Cargando sistema...</div>;
  }

  return (
    <div>
      {/* Simulation Toggle */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => setMode('public')}
          className={`px-4 py-2 rounded-full shadow-lg text-sm font-bold transition-transform hover:scale-105 ${mode === 'public' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700'}`}
        >
          Vista Cliente
        </button>
        <button 
          onClick={() => setMode('admin')}
          className={`px-4 py-2 rounded-full shadow-lg text-sm font-bold transition-transform hover:scale-105 ${mode === 'admin' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
        >
          Vista Admin
        </button>
      </div>

      {mode === 'public' ? (
        <PublicView 
          onJoin={handleAddEntry} 
          queue={queue}
          onCancel={handleCancelEntry}
        />
      ) : (
        <AdminDashboard 
          queue={queue}
          waiters={waiters}
          onAddEntry={handleAddEntry}
          onSeated={handleSeatEntry}
          onCancel={handleCancelEntry}
          onUpdateWaiters={handleUpdateWaiters}
        />
      )}
    </div>
  );
}