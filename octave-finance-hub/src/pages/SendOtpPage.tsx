// src/pages/LoginPage.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { useSendOtp } from "@/hooks/apis/SendOtp"; // Import our new hook
import { AppRole } from "@/api/api.auth";

const ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin", description: "Full system access" },
  { value: "FINANCE_ADMIN", label: "Finance Admin", description: "Payments & approvals" },
  { value: "EXPENSE_VIEWER", label: "Expense Viewer", description: "View-only access" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole | null>(null);
  const [localError, setLocalError] = useState("");

  // Pull in the TanStack Query mutation
  const { mutate: sendOtp, isPending, error: serverError } = useSendOtp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // 1. Frontend Validation
    if (!email) return setLocalError("Email is required");
    if (!role) return setLocalError("Please select a role");

    // 2. Trigger the API Call
    sendOtp({ email, role });
  };

  // Safely extract the error message from the Axios error object
  const displayError = localError || (serverError as any)?.response?.data?.message || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-[0.25em] uppercase text-foreground">
            OCTAVE
          </h1>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground mt-1">
            Mettle · Finance Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-1">Sign in</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and select your role to receive a one-time passcode
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError("");
                }}
                className="pl-10"
                autoFocus
                disabled={isPending}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Select Role
              </p>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setRole(r.value);
                      setLocalError("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all duration-150 ${
                      role === r.value
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/40"
                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-all ${
                        role === r.value
                          ? "border-foreground bg-foreground"
                          : "border-muted-foreground"
                      }`}
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {r.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {r.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {displayError && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                {displayError}
              </p>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                "Sending..."
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Octave Mettle · Finance Portal
        </p>
      </motion.div>
    </div>
  );
}