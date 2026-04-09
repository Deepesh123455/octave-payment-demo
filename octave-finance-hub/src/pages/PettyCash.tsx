import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, FileCheck, Filter, Loader2, Plus, Receipt, XCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { QuickExpenseManagerPanel } from "@/components/QuickExpenseManagerPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DynamicPagination } from "@/components/ui/DynamicPagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/data/sampleData";
import { useCreateRefillRequest, useMarkRead } from "@/hooks/apis/useNotificationQueries";
import { useCreatePettyCash, useApprovePettyCash, usePettyCashRequests, useProcessDirectPayment, useRejectPettyCash } from "@/hooks/apis/usePettyCashQueries";
import { useStores } from "@/hooks/apis/useStoreQueries";
import { useLocation, useNavigate } from "react-router-dom";
import { openQuickExpenseFromNotification, type QuickExpenseNotification } from "@/lib/quickExpenseNotifications";
import { toast } from "sonner";

const categories = ["Store Supplies", "Repairs", "Marketing", "Maintenance", "Courier", "Staff Welfare", "Utility", "Others"];

const getDisplayStatus = (status?: string) => (status === "Paid" ? "Approved" : status || "Pending");

export default function PettyCash() {
  const { user, isAdmin, isStoreManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [managerTab, setManagerTab] = useState("petty_management");
  const [page, setPage] = useState(1);
  const [showAllVisibleRows, setShowAllVisibleRows] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    storeId: "",
    amount: "",
    category: "",
    description: "",
  });
  const [pendingQuickExpenseToOpen, setPendingQuickExpenseToOpen] = useState<QuickExpenseNotification | null>(null);

  const { mutate: markRead } = useMarkRead();
  const { mutateAsync: sendRefillRequest, isPending: isSendingRefillRequest } = useCreateRefillRequest();
  const { mutateAsync: createRequest, isPending: isCreating } = useCreatePettyCash();
  const { mutateAsync: approveRequests } = useApprovePettyCash();
  const { mutateAsync: rejectRequests } = useRejectPettyCash();
  const { mutateAsync: processPayment } = useProcessDirectPayment();

  useEffect(() => {
    markRead({ type: "PETTY_CASH" });
  }, []);

  useEffect(() => {
    const quickExpenseToOpen = (location.state as { quickExpenseToOpen?: QuickExpenseNotification } | null)
      ?.quickExpenseToOpen;

    if (!quickExpenseToOpen) {
      return;
    }

    setManagerTab("petty_management");
    setPendingQuickExpenseToOpen(quickExpenseToOpen);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!pendingQuickExpenseToOpen || managerTab !== "petty_management") {
      return;
    }

    openQuickExpenseFromNotification(pendingQuickExpenseToOpen);
    setPendingQuickExpenseToOpen(null);
  }, [managerTab, pendingQuickExpenseToOpen]);

  const effectiveStoreId = useMemo(() => {
    if (!isStoreManager) {
      return undefined;
    }

    return user?.storeId || "STO001";
  }, [isStoreManager, user]);

  const { data: pettyResponse, isLoading, isError, error } = usePettyCashRequests({
    page,
    limit: 20,
    status: activeTab,
    storeId: effectiveStoreId,
  });
  const { data: storesResponse } = useStores();

  const canManagePettyCashAdmin =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
  const canCreateRequest = isStoreManager || canManagePettyCashAdmin;

  const requests = pettyResponse?.data || [];
  const stores = storesResponse?.data || [];

  const currentStore = useMemo(() => {
    if (!isStoreManager || !user) {
      return null;
    }

    return stores.find((s: any) => s.managerEmail === user.email) || stores.find((s: any) => s.storeId === user.storeId);
  }, [isStoreManager, stores, user]);

  const managerDisplayName = currentStore?.managerName || user?.name || "Store Manager";

  const filteredRecords = useMemo(() => {
    if (isStoreManager) {
      const targetStoreId = currentStore?.storeId || effectiveStoreId;
      if (!targetStoreId) {
        return [];
      }

      return requests.filter((record: any) => record.storeId === targetStoreId);
    }

    return requests;
  }, [currentStore, effectiveStoreId, isStoreManager, requests]);

  const visibleRecords = useMemo(
    () => (showAllVisibleRows ? filteredRecords : filteredRecords.slice(0, 4)),
    [filteredRecords, showAllVisibleRows],
  );

  useEffect(() => {
    setShowAllVisibleRows(false);
  }, [activeTab, page, filteredRecords.length]);

  const toggleSelect = (id: string) => {
    if (!canManagePettyCashAdmin) {
      return;
    }

    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAllInTab = () => {
    if (!canManagePettyCashAdmin) {
      return;
    }

    const selectableIds = filteredRecords
      .filter((record: any) => !["Approved", "Paid", "Auto_Approved"].includes(record.status))
      .map((record: any) => record.id);

    if (selectableIds.length > 0 && selectableIds.every((id: string) => selected.includes(id))) {
      setSelected((prev) => prev.filter((id) => !selectableIds.includes(id)));
      return;
    }

    setSelected((prev) => [...new Set([...prev, ...selectableIds])]);
  };

  const isBulkActionEnabled = useMemo(() => {
    if (selected.length === 0 || !canManagePettyCashAdmin) {
      return false;
    }

    return selected.every((id) => {
      const record = requests.find((request: any) => request.id === id);
      return record && !["Approved", "Paid", "Auto_Approved"].includes(record.status);
    });
  }, [canManagePettyCashAdmin, requests, selected, isAdmin]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
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
    } catch (_error) {
      toast.error("Failed to create request");
    }
  };

  const handleRefillRequest = async () => {
    if (!currentStore) {
      toast.error("Store information not found");
      return;
    }

    try {
      await sendRefillRequest({
        storeId: currentStore.storeId,
        requestedBy: managerDisplayName,
        storeName: currentStore.storeName,
      });
      toast.success("Refill request sent to finance admins");
    } catch (_error) {
      toast.error("Failed to send refill request");
    }
  };

  const handleApprove = async (ids: string | string[]) => {
    const idsToApprove = Array.isArray(ids) ? ids : [ids];
    if (idsToApprove.length === 0 || !canManagePettyCashAdmin) {
      return;
    }

    const toastId = toast.loading(`Approving ${idsToApprove.length} request(s)...`);

    try {
      await approveRequests({ ids: idsToApprove, approvedBy: user?.name || "Admin" });
      toast.success("Requests approved successfully", { id: toastId });
      setSelected([]);
    } catch (_error) {
      toast.error("Failed to approve requests", { id: toastId });
    }
  };

  const handleReject = async (ids: string | string[]) => {
    const idsToReject = Array.isArray(ids) ? ids : [ids];
    if (idsToReject.length === 0 || !canManagePettyCashAdmin) {
      return;
    }

    const toastId = toast.loading(`Rejecting ${idsToReject.length} request(s)...`);

    try {
      await rejectRequests({ ids: idsToReject, rejectedBy: user?.name || "Admin" });
      toast.success("Requests rejected successfully", { id: toastId });
      setSelected([]);
    } catch (_error) {
      toast.error("Failed to reject requests", { id: toastId });
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="page-header">Petty Cash</h1>
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
                  onClick={() => setManagerTab("petty_management")}
                  className={`rounded-xl px-4 py-1.5 transition-all font-bold text-xs uppercase tracking-wider ${managerTab === "petty_management" ? "bg-background shadow-premium text-primary" : "text-muted-foreground"}`}
                >
                  Card & Quick Pay
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManagerTab("view_expenses")}
                  className={`rounded-xl px-4 py-1.5 transition-all font-bold text-xs uppercase tracking-wider ${managerTab === "view_expenses" ? "bg-background shadow-premium text-primary" : "text-muted-foreground"}`}
                >
                  Store Expenses
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

              {!isStoreManager && canCreateRequest && (
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
                            <Select onValueChange={(value) => setNewRequest({ ...newRequest, storeId: value })}>
                              <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Select target store" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {stores.map((store: any) => (
                                  <SelectItem key={store.storeId} value={store.storeId}>{store.storeName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Amount (Rs)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Rs</span>
                              <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                className="pl-10 rounded-xl h-11 font-bold"
                                value={newRequest.amount}
                                onChange={(event) => setNewRequest({ ...newRequest, amount: event.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                            <Select onValueChange={(value) => setNewRequest({ ...newRequest, category: value })}>
                              <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
                            onChange={(event) => setNewRequest({ ...newRequest, description: event.target.value })}
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
          <QuickExpenseManagerPanel
            currentStore={currentStore}
            managerDisplayName={managerDisplayName}
            onRefillRequest={handleRefillRequest}
            isSendingRefillRequest={isSendingRefillRequest}
            processPayment={processPayment}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); setSelected([]); }} className="w-full">
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
                            {canManagePettyCashAdmin && filteredRecords.filter((record: any) => !["Approved", "Paid", "Auto_Approved"].includes(record.status)).length > 0 && (
                              <Checkbox
                                checked={filteredRecords.filter((record: any) => !["Approved", "Paid", "Auto_Approved"].includes(record.status)).every((record: any) => selected.includes(record.id))}
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
                            visibleRecords.map((item: any) => {
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
                                      {["Pending", "Pending_CFO", "Escalated", "Rejected"].includes(item.status) ? (
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
                            })
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

                {!isLoading && !isError && filteredRecords.length > 4 && (
                  <div className="p-4 border-t border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center text-sm font-medium"
                      onClick={() => setShowAllVisibleRows((prev) => !prev)}
                    >
                      {showAllVisibleRows ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                      {showAllVisibleRows ? "Show Less" : `Show ${filteredRecords.length - 4} More`}
                    </Button>
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
