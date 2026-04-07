import React, { createContext, useContext, useState, ReactNode } from "react";

// Create the context
const AuthContext = createContext<any>(null);

// Export the hook so TopBar can use it
export const useAuth = () => useContext(AuthContext);

// Provider to wrap your app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Demo sync with localStorage
  const [user, setUser] = useState(() => {
    const storedAdmin = localStorage.getItem("octave_admin");
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  });

  // Local-only transaction notification counter (resets on Transactions page visit)
  const [txnNotifCount, setTxnNotifCount] = useState<number>(() => {
    const stored = localStorage.getItem("octave_txn_notif");
    return stored ? parseInt(stored, 10) : 0;
  });

  const incrementTxnNotif = () => {
    setTxnNotifCount(prev => {
      const next = prev + 1;
      localStorage.setItem("octave_txn_notif", String(next));
      return next;
    });
  };

  const clearTxnNotif = () => {
    setTxnNotifCount(0);
    localStorage.removeItem("octave_txn_notif");
  };

  const login = (token: string, admin: any) => {
    localStorage.setItem("octave_token", token);
    localStorage.setItem("octave_admin", JSON.stringify(admin));
    setUser(admin);
  };

  const logout = () => {
    localStorage.removeItem("octave_token");
    localStorage.removeItem("octave_admin");
    setUser(null);
    window.location.href = "/send-otp";
  };

  const isAdmin = user?.role === "FINANCE_ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "EXPENSE_VIEWER";
  const isStoreManager = user?.role === "STORE_MANAGER";

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAdmin, isStoreManager, txnNotifCount, incrementTxnNotif, clearTxnNotif }}>
      {children}
    </AuthContext.Provider>
  );
};