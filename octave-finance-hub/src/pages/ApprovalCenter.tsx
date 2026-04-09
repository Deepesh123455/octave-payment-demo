import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  XCircle,
  CreditCard,
  Search,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Building2,
  Zap,
  IndianRupee,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { DynamicPagination } from "@/components/ui/DynamicPagination";
import { formatCurrency } from "@/data/sampleData";
import {
  useApprovedItems,
  useInitiateApprovalPayment,
  useConfirmApprovalPayment,
  useRejectApprovalItems,
} from "@/hooks/apis/useApprovalQueries";
import { useStores } from "@/hooks/apis/useStoreQueries";
import { useMarkRead } from "@/hooks/apis/useNotificationQueries";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Razorpay type extension
declare global {
  interface Window {
    Razorpay: any;
  }
}

type SourceType = "RENT" | "UTILITY";

export default function ApprovalCenter() {
  const { user } = useAuth();
  const { mutate: markRead } = useMarkRead();

  useEffect(() => {
    markRead({ type: "APPROVAL" });
  }, []);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState<string>("all");
  const [sourceType, setSourceType] = useState<string>("all");
  const [showAllVisibleRows, setShowAllVisibleRows] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; sourceType: SourceType; description: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const isPrivileged =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";

  const { data: response, isLoading, isError, error } = useApprovedItems(
    page, 
    20, 
    storeId === "all" ? undefined : storeId,
    sourceType === "all" ? undefined : sourceType
  );
  const { data: storesResponse } = useStores();
  const { mutateAsync: initiate } = useInitiateApprovalPayment();
  const { mutateAsync: confirm } = useConfirmApprovalPayment();
  const { mutateAsync: reject } = useRejectApprovalItems();



  const items = response?.data || [];

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item: any) => {
      const matchSearch =
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.storeName.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [items, search]);
  const visibleItems = useMemo(
    () => (showAllVisibleRows ? filtered : filtered.slice(0, 4)),
    [filtered, showAllVisibleRows],
  );

  useEffect(() => {
    setShowAllVisibleRows(false);
  }, [filtered.length, page, search, sourceType, storeId]);

  const totals = useMemo(() => ({
    count: response?.meta?.totalRecords || 0,
    amount: filtered.reduce((s: number, i: any) => s + i.amount, 0),
    rent: response?.meta?.counts?.RENT || 0,
    utility: response?.meta?.counts?.UTILITY || 0,
  }), [response, filtered]);

  const toggleSelect = (item: any) => {
    if (!isPrivileged) return;
    const key = `${item.sourceType}-${item.id}`;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (!isPrivileged) return;
    const allSelected = filtered.length > 0 && filtered.every((i: any) => selectedItems.has(`${i.sourceType}-${i.id}`));
    if (allSelected) {
      const newSelected = new Set(selectedItems);
      filtered.forEach((i: any) => newSelected.delete(`${i.sourceType}-${i.id}`));
      setSelectedItems(newSelected);
    } else {
      const newSelected = new Set(selectedItems);
      filtered.forEach((i: any) => newSelected.add(`${i.sourceType}-${i.id}`));
      setSelectedItems(newSelected);
    }
  };

  const selectedData = useMemo(() => {
    return filtered.filter((i: any) => selectedItems.has(`${i.sourceType}-${i.id}`));
  }, [filtered, selectedItems]);

  const handlePay = async (paymentItems: any[]) => {
    if (!isPrivileged) {
      toast.error("You don't have permission to make payments.");
      return;
    }

    if (paymentItems.some((item) => item.sourceType === "PETTY_CASH")) {
      toast.error("Petty cash is settled by the store manager from the petty cash module.");
      return;
    }

    const isBulk = paymentItems.length > 1;
    const toastId = toast.loading(isBulk ? `Initializing bulk payment for ${paymentItems.length} items...` : "Initializing secure payment...");
    
    try {
      const orderResponse = await initiate(paymentItems.map(item => ({ id: item.id, sourceType: item.sourceType })));
      const order = orderResponse.data;
      const actualAmount = Number(order.actualAmount ?? paymentItems.reduce((sum, item) => sum + Number(item.amount || 0), 0));
      const gatewayAmount = Number(order.gatewayAmount ?? order.amount / 100);

      if (order.isDemoCapped) {
        toast.info(
          `Demo checkout will charge ${formatCurrency(gatewayAmount)} while we display and record the actual payable amount of ${formatCurrency(actualAmount)}.`,
          { id: toastId }
        );
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SXMYKIsju0M92G",
        amount: order.amount,
        currency: order.currency,
        name: "Octave Apparels",
        description: order.isDemoCapped
          ? `Demo checkout for ${formatCurrency(actualAmount)} actual payment`
          : isBulk
          ? `Bulk payment for ${paymentItems.length} items`
          : paymentItems[0].description,
        order_id: order.id,
        handler: async (rzpResponse: any) => {
          toast.loading("Verifying payment...", { id: toastId });
          try {
            await confirm({
              razorpay_order_id: rzpResponse.razorpay_order_id,
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_signature: rzpResponse.razorpay_signature,
              items: paymentItems.map(item => ({ id: item.id, sourceType: item.sourceType })),
            });
            
            toast.success(
              order.isDemoCapped
                ? `Demo payment completed. Actual amount recorded: ${formatCurrency(actualAmount)}.`
                : isBulk
                ? "Bulk payment successful!"
                : `${paymentItems[0].sourceType === "RENT" ? "Rent payment" : paymentItems[0].sourceType === "UTILITY" ? "Utility bill" : "Petty cash request"} successful!`,
              { 
              id: toastId,
            });
            setSelectedItems(new Set());
          } catch {
            toast.error("Payment verification failed.", { id: toastId });
          }
        },
        prefill: {
          name: user?.name || "Admin User",
          email: user?.email || "admin@octave.com",
        },
        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      toast.dismiss(toastId);
    } catch {
      toast.error("Failed to initialize payment.", { id: toastId });
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    const toastId = toast.loading("Rejecting and returning to queue...");
    try {
      await reject([{ id: rejectTarget.id, sourceType: rejectTarget.sourceType }]);
      const type = rejectTarget.sourceType;
      toast.success("Item rejected and returned to Pending status.", { 
        id: toastId,
        action: {
          label: `View in ${type === "RENT" ? "Rent" : type === "UTILITY" ? "Utility" : "Petty Cash"}`,
          onClick: () => navigate(type === "RENT" ? "/rent" : type === "UTILITY" ? "/utilities" : "/petty-cash"),
        },
      });
      setRejectTarget(null);
    } catch {
      toast.error("Failed to reject item.", { id: toastId });
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-header">Approval Center</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {response?.meta?.totalRecords || totals.count} items approved globally
            </p>
          </div>
          {/* Summary Pills & Bulk Actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2 text-muted-foreground text-sm italic">
              Totals represent current page matches
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-3 py-1.5 text-xs font-medium">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>{totals.rent} Rent</span>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-3 py-1.5 text-xs font-medium border border-border/50">
                <Zap className="h-3.5 w-3.5 text-accent" />
                <span>{totals.utility} Utility</span>
              </div>
            </div>

            {isPrivileged && selectedItems.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2"
              >
                <div className="text-sm">
                  <span className="font-semibold text-primary">{selectedItems.size}</span>
                  <span className="text-muted-foreground ml-1">items selected · </span>
                  <span className="font-bold">{formatCurrency(selectedData.reduce((s, i) => s + i.amount, 0))}</span>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 shadow-lg shadow-primary/20"
                  onClick={() => handlePay(selectedData)}
                >
                  <CreditCard className="h-3.5 w-3.5 mr-2" />
                  Bulk Pay
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Cancel
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Role Warning Banner */}
        {!isPrivileged && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          >
            <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-destructive">
              <span className="font-semibold">Read-only view.</span> Only Super Admins and Finance Admins can Pay or Reject items.
            </p>
          </motion.div>
        )}

        <Card>
          {/* Filters */}
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter items on this page..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={storeId} onValueChange={(val) => { setStoreId(val); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {storesResponse?.data?.map((s: any) => (
                      <SelectItem key={s.storeId} value={s.storeId}>{s.storeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sourceType} onValueChange={(val) => { setSourceType(val); setPage(1); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="RENT">Rent</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div key="loading" className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Loading approved items...</p>
                </div>
              ) : isError ? (
                <div key="error" className="flex flex-col items-center justify-center py-20 text-destructive text-center">
                  <AlertCircle className="h-8 w-8 mb-4" />
                  <p>Failed to load items: {(error as any)?.message}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div key="empty" className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <IndianRupee className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-base font-semibold">All clear!</h3>
                  <p className="text-sm">No approved items awaiting payment.</p>
                </div>
              ) : (
                <div key="table" className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          {isPrivileged && (
                            <Checkbox
                              checked={filtered.length > 0 && filtered.every((i: any) => selectedItems.has(`${i.sourceType}-${i.id}`))}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Select all on this page"
                            />
                          )}
                        </TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        {isPrivileged && (
                          <TableHead className="text-right w-48">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {visibleItems.map((item: any) => (
                          <motion.tr
                            key={`${item.sourceType}-${item.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`border-b transition-colors hover:bg-muted/50 ${
                              selectedItems.has(`${item.sourceType}-${item.id}`) ? "bg-primary/5" : ""
                            }`}
                          >
                            <TableCell>
                              {isPrivileged && (
                                <Checkbox
                                  checked={selectedItems.has(`${item.sourceType}-${item.id}`)}
                                  onCheckedChange={() => toggleSelect(item)}
                                  aria-label={`Select ${item.description}`}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  item.sourceType === "RENT"
                                    ? "border-primary/40 text-primary bg-primary/5"
                                    : item.sourceType === "UTILITY"
                                    ? "border-accent/40 text-accent bg-accent/5"
                                    : "border-success/40 text-success bg-success/5"
                                }`}
                              >
                                {item.sourceType === "RENT" ? (
                                  <><Building2 className="h-2.5 w-2.5 mr-1" />RENT</>
                                ) : item.sourceType === "UTILITY" ? (
                                  <><Zap className="h-2.5 w-2.5 mr-1" />UTILITY</>
                                ) : (
                                  <><Receipt className="h-2.5 w-2.5 mr-1" />PETTY CASH</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm whitespace-nowrap">
                              {item.storeName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {item.category}
                            </TableCell>
                            <TableCell className="text-sm max-w-52 truncate text-muted-foreground">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-right font-bold whitespace-nowrap">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {new Date(item.dueDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            {isPrivileged && (
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() =>
                                      setRejectTarget({
                                        id: item.id,
                                        sourceType: item.sourceType,
                                        description: item.description,
                                      })
                                    }
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handlePay([item])}
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </AnimatePresence>
            {!isLoading && !isError && filtered.length > 4 && (
              <div className="p-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center text-sm font-medium"
                  onClick={() => setShowAllVisibleRows((prev) => !prev)}
                >
                  {showAllVisibleRows ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  {showAllVisibleRows ? "Show Less" : `Show ${filtered.length - 4} More`}
                </Button>
              </div>
            )}
            {!isLoading && !isError && response?.meta && response.meta.totalPages > 1 && (
              <div className="p-4 border-t">
                <DynamicPagination 
                  currentPage={response.meta.currentPage} 
                  totalPages={response.meta.totalPages} 
                  onPageChange={setPage} 
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject & Return to Queue?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will reject the following item and return it to <strong>Pending</strong> status for re-approval:
              </span>
              <span className="block rounded-md bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground">
                {rejectTarget?.description}
              </span>
              <span className="block text-xs text-muted-foreground">
                The item will reappear in its original module (Rent, Utility, or Petty Cash) and must go through approval again.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRejectConfirm}
            >
              Yes, Reject & Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
