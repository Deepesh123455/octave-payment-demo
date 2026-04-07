import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2, ShieldCheck, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPay: () => Promise<void>;
  amount: number;
  description: string;
  storeName: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirmPay, 
  amount, 
  description, 
  storeName 
}) => {
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");
  const [error, setError] = useState("");

  const handleStartPayment = async () => {
    setStep("processing");
    setError("");
    try {
      await onConfirmPay();
      setStep("success");
    } catch (e) {
      setError("Payment failed. Please try again.");
      setStep("confirm");
    }
  };

  const handleComplete = () => {
    onClose();
    setTimeout(() => {
      setStep("confirm");
      setError("");
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold tracking-tight text-lg">Secure Check</span>
                </div>
                {step !== "processing" && (
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {step === "confirm" && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-secondary/30 rounded-2xl border border-border/50">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-4xl font-bold tracking-tighter">₹{amount.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm py-2 border-b border-border/50 font-medium">
                      <span className="text-muted-foreground">Store</span>
                      <span className="text-foreground">{storeName}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-border/50 font-medium">
                      <span className="text-muted-foreground">Description</span>
                      <span className="text-foreground">{description}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-border/50 font-medium">
                      <span className="text-muted-foreground">Method</span>
                      <span className="text-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Petty Cash Card
                      </span>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">{error}</p>
                  )}

                  <Button className="w-full h-14 rounded-2xl group relative overflow-hidden" onClick={handleStartPayment}>
                    <span className="relative z-10 flex items-center justify-center gap-2 font-bold text-lg">
                      Confirm & Pay Now <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </div>
              )}

              {step === "processing" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 bg-primary/20 rounded-full animate-ping" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Processing Payment</h3>
                    <p className="text-muted-foreground text-sm">Updating your petty cash balance...</p>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 animate-in zoom-in slide-in-from-bottom-4 duration-500">
                  <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">Payment Approved</h3>
                    <p className="text-muted-foreground max-w-[240px] text-sm font-medium">
                        ₹{amount.toLocaleString('en-IN')} deducted from your petty cash balance.
                    </p>
                  </div>
                  <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleComplete}>
                    Return to Portal
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-secondary/50 p-4 border-t border-border/10 flex items-center justify-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground tracking-tighter uppercase">Secured by Octave Octane Pay</span>
                <div className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                <span className="text-[10px] font-bold text-muted-foreground tracking-tighter uppercase">256-bit Encryption</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
