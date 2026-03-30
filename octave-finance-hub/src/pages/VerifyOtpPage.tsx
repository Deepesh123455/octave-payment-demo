// src/pages/VerifyOtpPage.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useLoginFlowStore } from "@/store/useLoginFLowStore";
import { useVerifyOtp } from "@/hooks/apis/useAuthMutation";
import { useSendOtp } from "@/hooks/apis/SendOtp";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const pendingEmail = useLoginFlowStore((state) => state.pendingEmail);
  const pendingRole = useLoginFlowStore((state) => state.pendingRole);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [localError, setLocalError] = useState("");

  const { mutate: verifyOtp, isPending, error: verifyError } = useVerifyOtp();
  const { mutate: resendOtp, isPending: isResending, error: resendError } = useSendOtp();

  const [countdown, setCountdown] = useState(60);

  // 60s Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    if (countdown === 0 && pendingEmail && pendingRole) {
      resendOtp({ email: pendingEmail, role: pendingRole });
      setCountdown(60);
    }
  };

  // Security Check: If they refresh the page and lose state, kick them back to login
  useEffect(() => {
    // If the user already has a token, don't kick them out (handles the transition to dashboard)
    const hasToken = !!localStorage.getItem("octave_token");
    if (!hasToken && (!pendingEmail || !pendingRole)) {
      navigate("/send-otp");
    }
  }, [pendingEmail, pendingRole, navigate]);

  // Handle individual keystrokes in the boxes
  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return; // Only allow numbers
    
    setLocalError("");
    const newOtp = [...otp];
    // Take only the last character in case they type fast
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to go to the previous box
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle users pasting a 6-digit code from their email
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus the next empty box, or the last box if full
    const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[nextEmptyIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      return setLocalError("Please enter all 6 digits");
    }

    if (pendingEmail && pendingRole) {
      verifyOtp({ email: pendingEmail, role: pendingRole, otp: otpString });
    }
  };

  const displayError = localError || (verifyError as any)?.response?.data?.message || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center relative overflow-hidden">
          
          {/* Back Button */}
          <button
            onClick={() => navigate("/send-otp")}
            className="absolute left-6 top-6 p-1 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Back to login"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="mx-auto w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="h-6 w-6 text-foreground" />
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Verify your identity
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            We've sent a 6-digit secure passcode to <br />
            <span className="font-medium text-foreground">{pendingEmail}</span>
          </p>

          {/* Demo Account Hint */}
          {pendingEmail === "democfo@gmail.com" && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-8 p-3 bg-secondary/50 border border-border rounded-lg text-left"
            >
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold">!</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Demo System Bypass</p>
                  <p className="text-sm text-foreground">For this evaluation account, enter magic code <span className="font-bold border-b border-foreground/30">000000</span></p>
                </div>
              </div>
            </motion.div>
          )}


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* The 6-Box OTP UI */}
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  disabled={isPending}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold bg-background border border-border rounded-md focus:border-foreground focus:ring-1 focus:ring-foreground transition-all outline-none disabled:opacity-50"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {displayError && (
              <p className="text-sm text-destructive bg-destructive/10 py-2 px-3 rounded-md border border-destructive/20">
                {displayError}
              </p>
            )}

            <Button type="submit" className="w-full h-11" disabled={isPending}>
              {isPending ? (
                "Verifying..."
              ) : (
                <>
                  Authenticate <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          {/* Resend Logic */}
          <div className="mt-8 pt-6 border-t border-border">
            {resendError && (
              <p className="text-xs text-destructive mb-3">
                {(resendError as any)?.response?.data?.message || "Failed to resend OTP"}
              </p>
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Did not receive a code?
            </p>
            <button
              type="button"
              disabled={countdown > 0 || isResending}
              onClick={handleResend}
              className={`text-xs font-semibold transition-all ${
                countdown > 0 || isResending
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-foreground hover:underline cursor-pointer"
              }`}
            >
              {isResending 
                ? "Sending..." 
                : countdown > 0 
                  ? `Resend in ${countdown}s` 
                  : "Resend Code Now"}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}