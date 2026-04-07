import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Receipt, CheckCircle, AlertTriangle, Plus, Loader2, Filter, FileCheck, XCircle, AlertCircle, Wallet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { DynamicPagination } from "@/components/ui/DynamicPagination";
import { formatCurrency } from "@/data/sampleData";
import { usePettyCashRequests, useCreatePettyCash, useApprovePettyCash, useRejectPettyCash, useProcessDirectPayment } from "@/hooks/apis/usePettyCashQueries";
import { useMarkRead } from "@/hooks/apis/useNotificationQueries";
import { useStores } from "@/hooks/apis/useStoreQueries";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { VirtualCard } from "@/components/VirtualCard";
import { PaymentModal } from "@/components/PaymentModal";
import { QuickExpenseManagerPanel } from "@/components/QuickExpenseManagerPanel";

const categories = ["Store Supplies", "Repairs", "Marketing", "Maintenance", "Courier", "Staff Welfare", "Utility", "Others"];
const specialExpenses: any[] = [];

type PendingExpense = {
  id: string;
  storeId: string;
  category: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
};

const getDisplayStatus = (status?: string) => (status === "Paid" ? "Approved" : status || "Pending");

export default function PettyCash() {
  const { user, isAdmin, isStoreManager } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [managerTab, setManagerTab] = useState("petty_management");
  const [page, setPage] = useState(1);
  const { mutate: markRead } = useMarkRead();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PendingExpense | null>(null);

  useEffect(() => {
    markRead({ type: "PETTY_CASH" });
  }, []);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    storeId: "",
    amount: "",
    category: "",
    description: "",
  });

  const effectiveStoreId = useMemo(() => {
    if (!isStoreManager) return undefined;
    return user?.storeId || "STO001";
  }, [isStoreManager, user]);

  const { data: pettyResponse, isLoading, isError, error } = usePettyCashRequests({ 
    page, 
    limit: 20, 
    status: activeTab,
    storeId: effectiveStoreId
  });
  const { data: storesResponse } = useStores();
  const { mutateAsync: createRequest, isPending: isCreating } = useCreatePettyCash();
  const { mutateAsync: approveRequests } = useApprovePettyCash();
  const { mutateAsync: rejectRequests } = useRejectPettyCash();
  const { mutateAsync: processPayment } = useProcessDirectPayment();
  const canManagePettyCashAdmin =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
  const canCreateRequest = isStoreManager || canManagePettyCashAdmin;

  const requests = pettyResponse?.data || [];
  const stores = storesResponse?.data || [];

  const currentStore = useMemo(() => {
    if (!isStoreManager || !user) return null;
    
    // Prioritize email mapping for demo consistency, then fallback to stored storeId
    return stores.find((s: any) => s.managerEmail === user.email) || stores.find((s: any) => s.storeId === user.storeId);
  }, [isStoreManager, user, stores]);

  const managerDisplayName = currentStore?.managerName || user?.name || "Store Manager";

  const filteredRecords = useMemo(() => {
    if (isStoreManager) {
      const targetStoreId = currentStore?.storeId || effectiveStoreId;
      if (!targetStoreId) return [];
      return requests.filter((r: any) => r.storeId === targetStoreId);
    }
    return requests;
  }, [requests, isStoreManager, currentStore, effectiveStoreId]);

  const toggleSelect = (id: string) => {
    if (!canManagePettyCashAdmin) return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAllInTab = () => {
    if (!canManagePettyCashAdmin) return;
    const selectable = filteredRecords.filter((r: any) => {
      return !["Approved", "Paid", "Auto_Approved"].includes(r.status);
    });
    
    const selectableIds = selectable.map((r: any) => r.id);
    
    if (selectableIds.length > 0 && selectableIds.every((id: string) => selected.includes(id))) {
      setSelected(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...selectableIds])]);
    }
  };

  const isBulkActionEnabled = useMemo(() => {
    if (selected.length === 0 || !canManagePettyCashAdmin) return false;
    return selected.every(id => {
      const rec = requests.find((r: any) => r.id === id);
      return rec && !["Approved", "Paid", "Auto_Approved"].includes(rec.status);
    });
  }, [selected, requests, isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const storeIdToUse = isStoreManager && currentStore ? currentStore.storeId : newRequest.storeId;
    
    if (!storeIdToUse || !newRequest.amount || !newRequest.category || !newRequest.description) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await createRequest({
        ...newRequest,
        storeId: storeIdToUse,
        amount: Number(newRequest.amount),
        requestedBy: managerDisplayName,
      });
      toast.success("Request submitted successfully");
      setIsCreateOpen(false);
      setNewRequest({ storeId: "", amount: "", category: "", description: "" });
    } catch (error) {
      toast.error("Failed to create request");
    }
  };

  const handleApprove = async (ids: string | string[]) => {
    const idsToApprove = Array.isArray(ids) ? ids : [ids];
    if (idsToApprove.length === 0 || !canManagePettyCashAdmin) return;
    
    const toastId = toast.loading(`Approving ${idsToApprove.length} request(s)...`);
    try {
      await approveRequests({ ids: idsToApprove, approvedBy: user?.name || "Admin" });
      toast.success("Requests approved successfully", { id: toastId });
      setSelected([]);
    } catch (err) {
      toast.error("Failed to approve requests", { id: toastId });
    }
  };

  const handleReject = async (ids: string | string[]) => {
    const idsToReject = Array.isArray(ids) ? ids : [ids];
    if (idsToReject.length === 0 || !canManagePettyCashAdmin) return;
    
    const toastId = toast.loading(`Rejecting ${idsToReject.length} request(s)...`);
    try {
      await rejectRequests({ ids: idsToReject, rejectedBy: user?.name || "Admin" });
      toast.success("Requests rejected successfully", { id: toastId });
      setSelected([]);
    } catch (err) {
      toast.error("Failed to reject requests", { id: toastId });
    }
  };

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
    if (!selectedExpense || !currentStore) throw new Error("Missing store or expense");
    await processPayment({
      storeId: currentStore.storeId,
      amount: selectedExpense.amount,
      category: selectedExpense.category,
      description: selectedExpense.description,
      requestedBy: managerDisplayName,
      razorpayPaymentId: `rzp_mock_${Math.random().toString(36).substring(7)}`
    });
    toast.success(`₹${selectedExpense.amount.toLocaleString('en-IN')} deducted from Petty Cash`);
  };

  return (
    <AppLayout>
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPay={handleConfirmPay}
        amount={selectedExpense?.amount || 0}
        description={selectedExpense?.description || selectedExpense?.category || ""}
        storeName={currentStore?.storeName || "Octave Store"}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tightest uppercase italic">
                Petty <span className="text-primary not-italic">Cash</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {isStoreManager ? (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Managing {currentStore?.storeName || "your store"}
                  </span>
              ) : "Store-level petty cash requests and approvals"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isStoreManager && (
                <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border/50">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setManagerTab("view_expenses")}
                        className={`rounded-xl px-4 py-1.5 transition-all font-bold text-xs uppercase tracking-wider ${managerTab === "view_expenses" ? "bg-background shadow-premium text-primary" : "text-muted-foreground"}`}
                    >
                        Store Expenses
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setManagerTab("petty_management")}
                        className={`rounded-xl px-4 py-1.5 transition-all font-bold text-xs uppercase tracking-wider ${managerTab === "petty_management" ? "bg-background shadow-premium text-primary" : "text-muted-foreground"}`}
                    >
                        Card & Quick Pay
                    </Button>
                </div>
            )}

            <div className="flex items-center gap-2">
                {canManagePettyCashAdmin && (
                <>
                    <Button 
                    variant="outline"
                    className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground font-bold text-xs uppercase tracking-widest px-4 h-10 transition-all"
                    disabled={!isBulkActionEnabled} 
                    onClick={() => handleReject(selected)}
                    >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    <Button 
                    className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-widest px-4 h-10 shadow-lg shadow-primary/20 transition-all"
                    disabled={!isBulkActionEnabled} 
                    onClick={() => handleApprove(selected)}
                    >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </Button>
                </>
                )}

                {canCreateRequest && (
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                    <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-widest px-6 h-10 shadow-lg shadow-black/10 transition-all">
                    <Plus className="h-4 w-4 mr-2" /> New Request
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <form onSubmit={handleCreate}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">New Expense Request</DialogTitle>
                        <DialogDescription>Submit a new petty cash expense for central approval.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        {!isStoreManager && (
                            <div className="grid gap-2">
                                <Label htmlFor="store" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Store Selection</Label>
                                <Select onValueChange={(v) => setNewRequest({ ...newRequest, storeId: v })}>
                                    <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Select target store" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                    {stores.map((s: any) => (
                                        <SelectItem key={s.storeId} value={s.storeId}>{s.storeName}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Amount (₹)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="pl-7 rounded-xl h-11 font-bold"
                                    value={newRequest.amount}
                                    onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                            <Select onValueChange={(v) => setNewRequest({ ...newRequest, category: v })}>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {categories.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Purpose & Description</Label>
                        <Textarea 
                            id="description" 
                            placeholder="What is this expense for?" 
                            className="rounded-xl min-h-[100px] resize-none"
                            value={newRequest.description}
                            onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                        />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20">
                        {isCreating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />} 
                        Submit for Approval
                        </Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
                </Dialog>
                )}
            </div>
          </div>
        </div>

        {isStoreManager && managerTab === "petty_management" ? (
             <>
                <QuickExpenseManagerPanel
                    currentStore={currentStore}
                    managerDisplayName={managerDisplayName}
                    processPayment={processPayment}
                />
                <div className="lg:col-span-5 flex flex-col gap-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-end px-1">
                            <h2 className="text-xl font-bold tracking-tight">Virtual Petty Cash</h2>
                            <Badge variant="outline" className="rounded-md border-primary/20 text-primary bg-primary/5 uppercase font-bold text-[10px]">Active</Badge>
                        </div>
                        {currentStore ? (
                            <VirtualCard 
                                balance={currentStore.pettyCashBalance} 
                                cardNumber={currentStore.virtualCardNumber} 
                                storeName={currentStore.storeName} 
                                managerName={managerDisplayName} 
                            />
                        ) : (
                            <div className="aspect-[1.586/1] w-full bg-secondary/10 border border-border/50 rounded-2xl flex items-center justify-center animate-pulse">
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                            </div>
                        )}
                    </div>
                    
                    <Card className="rounded-3xl bg-secondary/20 border-none shadow-none overflow-hidden group">
                        <CardContent className="p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base tracking-tight">Smart Thresholds</h3>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Policy</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-4 p-3 bg-background/50 rounded-2xl border border-border/50">
                                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed">Expenses <span className="font-bold text-primary italic">under ₹1,500</span> are auto-approved for immediate settlement.</p>
                                </div>
                                <div className="flex items-start gap-4 p-3 bg-background/50 rounded-2xl border border-border/50">
                                    <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed">Amounts <span className="font-bold text-primary italic">above ₹1,500</span> require central admin review.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="flex justify-between items-end px-1">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Quick Expense Cards</h2>
                            <p className="text-xs text-muted-foreground font-medium">Click to settle common store items instantly</p>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {specialExpenses.map((expense, idx) => (
                            <motion.div 
                                key={expense.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-card border border-border/60 rounded-3xl p-5 flex items-center justify-between hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-2xl bg-secondary/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                                        {expense.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{expense.title}</h3>
                                            <Badge variant="secondary" className="text-[9px] h-4 rounded px-1.5 bg-secondary/80 text-muted-foreground font-bold tracking-widest uppercase">
                                                {expense.category}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{expense.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3 shrink-0">
                                    <span className="font-black text-2xl tracking-tighter italic">₹{expense.amount.toLocaleString('en-IN')}</span>
                                    <Button 
                                        size="sm" 
                                        className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 h-9 px-6 font-bold tracking-widest text-[10px] uppercase shadow-lg group-hover:scale-105 transition-transform"
                                        onClick={() => openPaymentModal(expense)}
                                    >
                                        Settle Expense
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
             </>
        ) : (
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); setSelected([]); }} className="w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    <TabsList className="bg-secondary/50 p-1 inline-flex w-max">
                        <TabsTrigger value="All" className="px-5">All</TabsTrigger>
                        <TabsTrigger value="Pending" className="px-5">Pending</TabsTrigger>
                        <TabsTrigger value="Auto_Approved" className="px-5">Auto Approved</TabsTrigger>
                        <TabsTrigger value="Approved" className="px-5">Approved</TabsTrigger>
                        <TabsTrigger value="Rejected" className="px-5 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Rejected</TabsTrigger>
                    </TabsList>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full whitespace-nowrap self-start md:self-auto">
                    <Filter className="h-3 w-3" />
                    <span>{pettyResponse?.meta?.totalRecords || filteredRecords.length} records</span>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p>Loading petty cash requests...</p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-20 text-destructive text-center">
                            <AlertCircle className="h-8 w-8 mb-4" />
                            <p>Failed to load requests: {(error as any)?.message}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 text-center">
                                            {canManagePettyCashAdmin && filteredRecords.filter((r: any) => !["Approved", "Paid", "Auto_Approved"].includes(r.status)).length > 0 && (
                                                <Checkbox 
                                                    checked={filteredRecords.filter((r: any) => !["Approved", "Paid", "Auto_Approved"].includes(r.status)).every((r: any) => selected.includes(r.id))}
                                                    onCheckedChange={toggleAllInTab}
                                                />
                                            )}
                                        </TableHead>
                                        <TableHead>Store</TableHead>
                                        <TableHead>Requested By</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        {canManagePettyCashAdmin && <TableHead className="text-right">Action</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredRecords.length > 0 ? (
                                            filteredRecords.map((item: any) => (
                                                (() => {
                                                    const displayStatus = getDisplayStatus(item.status);
                                                    return (
                                                <motion.tr 
                                                    key={item.id} 
                                                    initial={{ opacity: 0 }} 
                                                    animate={{ opacity: 1 }} 
                                                    exit={{ opacity: 0 }} 
                                                    className="border-b transition-colors hover:bg-muted/50"
                                                >
                                                    <TableCell className="text-center">
                                                        {canManagePettyCashAdmin && !["Approved", "Paid", "Auto_Approved"].includes(item.status) && (
                                                            <Checkbox 
                                                                checked={selected.includes(item.id)} 
                                                                onCheckedChange={() => toggleSelect(item.id)} 
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium whitespace-nowrap">{item.store?.storeName || "Octave General"}</TableCell>
                                                    <TableCell className="text-sm shadow-none whitespace-nowrap">{item.requestedBy}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{item.category}</TableCell>
                                                    <TableCell className="text-sm truncate max-w-xs">{item.description}</TableCell>
                                                    <TableCell className="text-right font-bold whitespace-nowrap font-mono">{formatCurrency(item.amount)}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{new Date(item.requestDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge className={`text-[10px] whitespace-nowrap ${displayStatus === "Approved" || displayStatus === "Auto_Approved" ? "status-success" : displayStatus === "Rejected" || displayStatus === "Escalated" ? "status-overdue" : "status-pending"}`}>
                                                            {displayStatus.replace("_", " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    {canManagePettyCashAdmin && (
                                                        <TableCell className="text-right">
                                                            {(item.status === "Pending" || item.status === "Pending_CFO" || item.status === "Escalated" || item.status === "Rejected") ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                                                                        onClick={() => handleApprove(item.id)}
                                                                    >
                                                                        <FileCheck className="h-4 w-4" />
                                                                    </Button>
                                                                    {item.status !== "Rejected" && (
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="ghost" 
                                                                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => handleReject(item.id)}
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md italic">
                                                                    {displayStatus === "Approved" || displayStatus === "Auto_Approved" ? "Approved" : "Rejected"}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                </motion.tr>
                                                    );
                                                })()
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={canManagePettyCashAdmin ? 9 : 8} className="text-center py-20 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                                                            <Receipt className="h-6 w-6 text-muted-foreground/50" />
                                                        </div>
                                                        <p>No {activeTab.toLowerCase().replace("_", " ")} requests found.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {!isLoading && !isError && pettyResponse?.meta && pettyResponse.meta.totalPages > 1 && (
                        <div className="p-4 border-t">
                            <DynamicPagination 
                                currentPage={pettyResponse.meta.currentPage} 
                                totalPages={pettyResponse.meta.totalPages} 
                                onPageChange={setPage} 
                            />
                        </div>
                    )}
                </CardContent>
              </Card>
            </Tabs>
        )}
      </motion.div>
    </AppLayout>
  );
}
