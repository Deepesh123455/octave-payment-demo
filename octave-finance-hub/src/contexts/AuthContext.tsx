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

  const isAdmin = user?.role === "FINANCE_ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};