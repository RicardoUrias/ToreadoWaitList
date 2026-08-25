import { Waiter, WaitlistEntry } from '../types';

// Cloudflare Pages / Vite: only call a remote API when VITE_API_URL is set.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const KEYS = {
  WAITERS: 'tacoqueue_waiters',
  QUEUE: 'tacoqueue_queue'
};

const getLocalWaiters = (): Waiter[] => {
  try { return JSON.parse(localStorage.getItem(KEYS.WAITERS) || '[]'); } catch { return []; }
};
const getLocalQueue = (): WaitlistEntry[] => {
  try { return JSON.parse(localStorage.getItem(KEYS.QUEUE) || '[]'); } catch { return []; }
};

const readLocalData = () => ({
  queue: getLocalQueue(),
  waiters: getLocalWaiters()
});

export const fetchData = async (): Promise<{ queue: WaitlistEntry[], waiters: Waiter[] }> => {
  if (!API_URL) {
    return readLocalData();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${API_URL}/data`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return { queue: data.queue, waiters: data.waiters };
  } catch (error) {
    console.warn("Backend not connected or slow, using LocalStorage fallback.");
    return readLocalData();
  }
};

export const addEntryToQueue = async (entry: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'status'>): Promise<WaitlistEntry> => {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      if (!res.ok) throw new Error('Failed to add');
      return await res.json();
    } catch (error) {
      console.warn("Backend not connected, adding entry locally.");
    }
  }

  const newEntry: WaitlistEntry = {
    ...entry,
    id: Math.random().toString(36).substr(2, 9),
    joinedAt: Date.now(),
    status: 'waiting'
  };
  const updatedQ = [...getLocalQueue(), newEntry];
  localStorage.setItem(KEYS.QUEUE, JSON.stringify(updatedQ));
  return newEntry;
};

export const updateEntryStatus = async (entryId: string, status: string, waiterId?: string): Promise<void> => {
  if (API_URL) {
    try {
      await fetch(`${API_URL}/queue/${entryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, waiterId })
      });
      return;
    } catch (error) {
      console.warn("Backend not connected, updating entry locally.");
    }
  }

  const updatedQ = getLocalQueue().map(q =>
    q.id === entryId ? { ...q, status: status as WaitlistEntry['status'], assignedWaiterId: waiterId } : q
  );
  localStorage.setItem(KEYS.QUEUE, JSON.stringify(updatedQ));

  if (status === 'seated' && waiterId) {
    const updatedWaiters = getLocalWaiters().map(w =>
      w.id === waiterId ? { ...w, tablesServed: w.tablesServed + 1 } : w
    );
    localStorage.setItem(KEYS.WAITERS, JSON.stringify(updatedWaiters));
  }
};

export const syncWaiters = async (waiters: Waiter[]): Promise<void> => {
  if (API_URL) {
    try {
      await fetch(`${API_URL}/waiters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waiters)
      });
      return;
    } catch (error) {
      console.warn("Backend not connected, saving waiters locally.");
    }
  }

  localStorage.setItem(KEYS.WAITERS, JSON.stringify(waiters));
};

export const recommendWaiter = (waiters: Waiter[]): Waiter | null => {
  const activeWaiters = waiters.filter(w => w.isActive);
  if (activeWaiters.length === 0) return null;
  return activeWaiters.reduce((prev, current) =>
    (prev.tablesServed < current.tablesServed) ? prev : current
  );
};
