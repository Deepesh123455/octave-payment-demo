import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { AlertTriangle, FileCheck, Loader2, Receipt, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VirtualCard } from "@/components/VirtualCard";
import { PaymentModal } from "@/components/PaymentModal";
import {
  getQuickExpenseNotifications,
  removeQuickExpenseNotification,
  subscribeToQuickExpenseOpen,
  upsertQuickExpenseNotification,
  type QuickExpenseNotification,
} from "@/lib/quickExpenseNotifications";
import { toast } from "sonner";

const QUICK_EXPENSE_STORE_ID = "store-001";
const quickExpenseUrl = "https://octave-payment-demo.vercel.app/mobile-expense?storeId=store-001";
const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1/";
const backendOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

type PendingExpense = QuickExpenseNotification;

type QuickExpenseManagerPanelProps = {
  currentStore: any;
  managerDisplayName: string;
  onRefillRequest: () => Promise<void>;
  isSendingRefillRequest: boolean;
  processPayment: (payload: {
    storeId: string;
    amount: number;
    category: string;
    description: string;
    requestedBy: string;
    razorpayPaymentId: string;
  }) => Promise<unknown>;
};

const getExpenseIcon = (category: string) => {
  switch (category) {
    case "Maintenance":
    case "Minor Repairs":
    case "Repairs":
      return <AlertTriangle className="h-6 w-6" />;
    case "Office Supplies":
    case "Store Supplies":
      return <FileCheck className="h-6 w-6" />;
    case "Staff Welfare":
      return <Wallet className="h-6 w-6" />;
    default:
      return <Receipt className="h-6 w-6" />;
  }
};

export function QuickExpenseManagerPanel({
  currentStore,
  managerDisplayName,
  onRefillRequest,
  isSendingRefillRequest,
  processPayment,
}: QuickExpenseManagerPanelProps) {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>(() =>
    getQuickExpenseNotifications(),
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PendingExpense | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`${backendOrigin}/api/notifications/stream`);

    eventSource.onmessage = (event) => {
      try {
        const expense = JSON.parse(event.data) as PendingExpense;
        setPendingExpenses((current) =>
          current.some((item) => item.id === expense.id) ? current : [expense, ...current],
        );
        upsertQuickExpenseNotification(expense);
      } catch (error) {
        console.error("Failed to parse quick expense notification", error);
      }
    };

    eventSource.onerror = () => {
      console.error("Quick expense event stream disconnected.");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToQuickExpenseOpen((expense) => {
      setPendingExpenses((current) =>
        current.some((item) => item.id === expense.id) ? current : [expense, ...current],
      );
      openPaymentModal(expense);
    });

    return unsubscribe;
  }, [currentStore]);

  const openPaymentModal = (expense: PendingExpense) => {
    if (!currentStore) {
      toast.error("Store information not found");
      return;
    }

    if (currentStore.pettyCashBalance < expense.amount) {
      toast.error("Insufficient balance in Petty Cash Card");
      return;
    }

    setSelectedExpense(expense);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPay = async () => {
    if (!selectedExpense || !currentStore) {
      throw new Error("Missing store or expense");
    }

    await processPayment({
      storeId: currentStore.storeId,
      amount: selectedExpense.amount,
      category: selectedExpense.category,
      description: selectedExpense.description,
      requestedBy: managerDisplayName,
      razorpayPaymentId: `rzp_mock_${Math.random().toString(36).substring(7)}`,
    });

    setPendingExpenses((current) => current.filter((item) => item.id !== selectedExpense.id));
    removeQuickExpenseNotification(selectedExpense.id);
    toast.success(`Rs ${selectedExpense.amount.toLocaleString("en-IN")} deducted from Petty Cash`);
  };

  return (
    <>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPay={handleConfirmPay}
        amount={selectedExpense?.amount || 0}
        description={selectedExpense?.description || selectedExpense?.category || ""}
        storeName={currentStore?.storeName || "Octave Store"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12">
        <div className="lg:col-span-5 flex flex-col gap-8">
          <Card className="rounded-3xl border border-border/60 bg-card/95 overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-6">
              <div className="space-y-2">
                <Badge variant="outline" className="rounded-md border-primary/20 text-primary bg-primary/5 uppercase font-bold text-[10px]">
                  Quick Expense Scan
                </Badge>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Scan To Log An Expense</h2>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Use this QR on a mobile device to submit an expense for {QUICK_EXPENSE_STORE_ID}.
                  </p>
                </div>
              </div>
              <div className="rounded-[28px] border border-border/60 bg-secondary/20 p-6 flex flex-col items-center gap-4">
                <div className="rounded-[28px] bg-white p-4 shadow-lg shadow-black/5">
                  <QRCodeSVG value={quickExpenseUrl} size={220} includeMargin />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 px-1">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold tracking-tight">Virtual Petty Cash</h2>
                <Badge variant="outline" className="rounded-md border-primary/20 text-primary bg-primary/5 uppercase font-bold text-[10px]">
                  Active
                </Badge>
              </div>
            </div>
            {currentStore ? (
              <div className="space-y-4">
                <VirtualCard
                  balance={currentStore.pettyCashBalance}
                  cardNumber={currentStore.virtualCardNumber}
                  storeName={currentStore.storeName}
                  managerName={managerDisplayName}
                />
                <Button
                  onClick={onRefillRequest}
                  disabled={isSendingRefillRequest}
                  className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 h-11 font-bold text-xs uppercase tracking-widest shadow-lg shadow-black/10 transition-all"
                >
                  {isSendingRefillRequest ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Refill Request
                </Button>
              </div>
            ) : (
              <div className="aspect-[1.586/1] w-full bg-secondary/10 border border-border/50 rounded-2xl flex items-center justify-center animate-pulse">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex justify-between items-end px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Quick Expense Cards</h2>
              <p className="text-xs text-muted-foreground font-medium">New mobile submissions appear here instantly through the live expense stream.</p>
            </div>
            <Badge variant="outline" className="rounded-md border-border/60 uppercase font-bold text-[10px]">
              {pendingExpenses.length} Pending
            </Badge>
          </div>
          <div className="grid gap-4">
            {pendingExpenses.length > 0 ? (
              pendingExpenses.map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="group bg-card border border-border/60 rounded-3xl p-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-secondary/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                      {getExpenseIcon(expense.category)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                          {expense.category}
                        </h3>
                        <Badge variant="secondary" className="text-[9px] h-4 rounded px-1.5 bg-secondary/80 text-muted-foreground font-bold tracking-widest uppercase">
                          {expense.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {expense.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                        Submitted via QR scan • {new Date(expense.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                    <span className="font-black text-2xl tracking-tighter italic">Rs {expense.amount.toLocaleString("en-IN")}</span>
                    <Button
                      size="sm"
                      className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 h-9 px-6 font-bold tracking-widest text-[10px] uppercase shadow-lg group-hover:scale-105 transition-transform"
                      onClick={() => openPaymentModal(expense)}
                    >
                      Settle Expense
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 bg-secondary/20 p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border/50">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-bold tracking-tight">Waiting for scanned expenses</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once a mobile user submits the QR form, the new expense will show up here automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
