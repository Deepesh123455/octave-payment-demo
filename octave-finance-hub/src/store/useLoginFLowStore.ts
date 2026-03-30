// src/store/useLoginFlowStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppRole } from './useAuthStore'; 

interface LoginFlowState {
  pendingEmail: string | null;
  pendingRole: AppRole | null;
  setPendingAuth: (email: string, role: AppRole) => void;
  clearFlow: () => void;
}

export const useLoginFlowStore = create<LoginFlowState>()(
  persist(
    (set) => ({
      pendingEmail: null,
      pendingRole: null,
      setPendingAuth: (email, role) => set({ pendingEmail: email, pendingRole: role }),
      clearFlow: () => set({ pendingEmail: null, pendingRole: null }),
    }),
    {
      name: 'octave-login-flow', 
      storage: createJSONStorage(() => sessionStorage), // DESTROYED when tab closes
    }
  )
);