export interface Waiter {
  id: string;
  name: string;
  isActive: boolean;
  tablesServed: number;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  partySize: number;
  phoneNumber?: string;
  joinedAt: number; // Timestamp
  status: 'waiting' | 'seated' | 'cancelled';
  assignedWaiterId?: string;
}

export type ViewMode = 'public' | 'admin' | 'settings';

export interface AppState {
  waiters: Waiter[];
  queue: WaitlistEntry[];
}