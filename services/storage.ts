import { Waiter, WaitlistEntry } from '../types';

// Use environment variable for production URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const KEYS = {
  WAITERS: 'tacoqueue_waiters',
  QUEUE: 'tacoqueue_queue'
};

// --- Local Storage Fallbacks (Offline Mode) ---
const getLocalWaiters = (): Waiter[] => {
  try { return JSON.parse(localStorage.getItem(KEYS.WAITERS) || '[]'); } catch { return []; }
};
const getLocalQueue = (): WaitlistEntry[] => {
  try { return JSON.parse(localStorage.getItem(KEYS.QUEUE) || '[]'); } catch { return []; }
};

// --- Async API Methods ---

export const fetchData = async (): Promise<{ queue: WaitlistEntry[], waiters: Waiter[] }> => {
  try {
    // Add timeout to prevent hanging if server is sleeping (common in free tiers)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${API_URL}/data`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return { queue: data.queue, waiters: data.waiters };
  } catch (error) {
    console.warn("Backend not connected or slow, using LocalStorage fallback.");
    return { queue: getLocalQueue(), waiters: getLocalWaiters() };
  }
};

export const addEntryToQueue = async (entry: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'status'>): Promise<WaitlistEntry> => {
  try {
    const res = await fetch(`${API_URL}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to add');
    return await res.json();
  } catch (error) {
    // Local fallback
    const newEntry: WaitlistEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      joinedAt: Date.now(),
      status: 'waiting'
    };
    const currentQ = getLocalQueue();
    const updatedQ = [...currentQ, newEntry];
    localStorage.setItem(KEYS.QUEUE, JSON.stringify(updatedQ));
    return newEntry;
  }
};

export const updateEntryStatus = async (entryId: string, status: string, waiterId?: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/queue/${entryId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, waiterId })
    });
  } catch (error) {
    // Local fallback
    const currentQ = getLocalQueue();
    const updatedQ = currentQ.map(q => q.id === entryId ? { ...q, status: status as any, assignedWaiterId: waiterId } : q);
    localStorage.setItem(KEYS.QUEUE, JSON.stringify(updatedQ));
    
    if (status === 'seated' && waiterId) {
      const waiters = getLocalWaiters();
      const updatedWaiters = waiters.map(w => w.id === waiterId ? { ...w, tablesServed: w.tablesServed + 1 } : w);
      localStorage.setItem(KEYS.WAITERS, JSON.stringify(updatedWaiters));
    }
  }
};

export const syncWaiters = async (waiters: Waiter[]): Promise<void> => {
  try {
    await fetch(`${API_URL}/waiters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiters)
    });
  } catch (error) {
    localStorage.setItem(KEYS.WAITERS, JSON.stringify(waiters));
  }
};

export const recommendWaiter = (waiters: Waiter[]): Waiter | null => {
  const activeWaiters = waiters.filter(w => w.isActive);
  if (activeWaiters.length === 0) return null;
  return activeWaiters.reduce((prev, current) => 
    (prev.tablesServed < current.tablesServed) ? prev : current
  );
};