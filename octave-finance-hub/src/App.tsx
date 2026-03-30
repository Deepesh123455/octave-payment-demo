import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "./pages/Dashboard";
import StoreManagement from "./pages/StoreManagement";
import StoreDetail from "./pages/StoreDetail";
import RentPayments from "./pages/RentPayments";
import UtilityBillsPage from "./pages/UtilityBillsPage";
import PettyCash from "./pages/PettyCash";
import ApprovalCenter from "./pages/ApprovalCenter";
import Reports from "./pages/Reports";
import LoginPage from "./pages/SendOtpPage";
import AIInsights from "./pages/AIInsights";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./pages/ProtectedRoute"; // ✅ Uncommented this!
import VerifyOtpPage from "./pages/VerifyOtpPage";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* 🔓 PUBLIC ROUTES: Anyone can access these to log in */}
      <Route path="/login" element={<Navigate to="/send-otp" replace />} />
      <Route path="/send-otp" element={<LoginPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      {/* 🔒 PROTECTED ROUTES: Only logged-in users can access these */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stores" element={<StoreManagement />} />
        <Route path="/stores/:id" element={<StoreDetail />} />
        <Route path="/rent" element={<RentPayments />} />
        <Route path="/utilities" element={<UtilityBillsPage />} />
        <Route path="/petty-cash" element={<PettyCash />} />
        <Route path="/approvals" element={<ApprovalCenter />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/ai-insights" element={<AIInsights />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
