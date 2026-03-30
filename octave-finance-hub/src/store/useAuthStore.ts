// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppRole = "SUPER_ADMIN" | "FINANCE_ADMIN" | "EXPENSE_VIEWER";

interface AuthState {
  isAuthenticated: boolean;
  userRole: AppRole | null;
  setAuthenticated: (role: AppRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userRole: null,
      setAuthenticated: (role) => set({ isAuthenticated: true, userRole: role }),
      logout: () => set({ isAuthenticated: false, userRole: null }),
    }),
    {
      name: 'octave-auth-session',
      storage: createJSONStorage(() => localStorage), // PERSISTS across browser restarts
    }
  )
);