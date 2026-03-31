import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Receipt, CheckCircle, Clock, AlertTriangle, Plus, Loader2, Filter, FileCheck, XCircle, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency, getStatusLabel } from "@/data/sampleData";
import { usePettyCashRequests, useCreatePettyCash, useApprovePettyCash, useRejectPettyCash } from "@/hooks/apis/usePettyCashQueries";
import { useMarkRead } from "@/hooks/apis/useNotificationQueries";
import { useStores } from "@/hooks/apis/useStoreQueries";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categories = ["Store Supplies", "Repairs", "Marketing", "Maintenance", "Courier", "Staff Welfare", "Utility", "Others"];

export default function PettyCash() {
  const { user, isAdmin } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Pending_CFO");
  const { mutate: markRead } = useMarkRead();

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

  const { data: pettyResponse, isLoading, isError, error } = usePettyCashRequests();
  const { data: storesResponse } = useStores();
  const { mutateAsync: createRequest, isPending: isCreating } = useCreatePettyCash();
  const { mutateAsync: approveRequests } = useApprovePettyCash();
  const { mutateAsync: rejectRequests } = useRejectPettyCash();



  const requests = pettyResponse?.data || [];
  const stores = storesResponse?.data || [];

  const filteredRecords = useMemo(() => {
    if (activeTab === "All") return requests;
    return requests.filter((r: any) => r.status === activeTab);
  }, [requests, activeTab]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAllInTab = () => {
    const selectable = filteredRecords.filter((r: any) => {
      return !["Approved", "Paid", "Auto_Approved", "Rejected"].includes(r.status);
    });
    
    const selectableIds = selectable.map((r: any) => r.id);
    
    if (selectableIds.length > 0 && selectableIds.every((id: string) => selected.includes(id))) {
      setSelected(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...selectableIds])]);
    }
  };

  const isBulkActionEnabled = useMemo(() => {
    if (selected.length === 0 || !isAdmin) return false;
    return selected.every(id => {
      const rec = requests.find((r: any) => r.id === id);
      return rec && !["Approved", "Paid", "Auto_Approved", "Rejected"].includes(rec.status);
    });
  }, [selected, requests, isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.storeId || !newRequest.amount || !newRequest.category || !newRequest.description) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await createRequest({
        ...newRequest,
        amount: Number(newRequest.amount),
        requestedBy: user?.name || "Unknown Manager",
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
    if (idsToApprove.length === 0 || !isAdmin) return;
    
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
    if (idsToReject.length === 0 || !isAdmin) return;
    
    const toastId = toast.loading(`Rejecting ${idsToReject.length} request(s)...`);
    try {
      await rejectRequests({ ids: idsToReject, rejectedBy: user?.name || "Admin" });
      toast.success("Requests rejected successfully", { id: toastId });
      setSelected([]);
    } catch (err) {
      toast.error("Failed to reject requests", { id: toastId });
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Petty Cash</h1>
            <p className="text-muted-foreground text-sm mt-1">Store-level petty cash requests and approvals</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {isAdmin && (
              <>
                <Button 
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground whitespace-nowrap"
                  disabled={!isBulkActionEnabled} 
                  onClick={() => handleReject(selected)}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject Selected {selected.length > 0 && `(${selected.length})`}
                </Button>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                  disabled={!isBulkActionEnabled} 
                  onClick={() => handleApprove(selected)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve Selected {selected.length > 0 && `(${selected.length})`}
                </Button>
              </>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 whitespace-nowrap">
                  <Plus className="h-4 w-4 mr-2" /> New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>New Petty Cash Request</DialogTitle>
                    <DialogDescription>Submit a new expense for approval. threshold logic will apply.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="store">Store</Label>
                      <Select onValueChange={(v) => setNewRequest({ ...newRequest, storeId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((s: any) => (
                            <SelectItem key={s.storeId} value={s.storeId}>{s.storeName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input 
                          id="amount" 
                          type="number" 
                          placeholder="0.00" 
                          value={newRequest.amount}
                          onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={(v) => setNewRequest({ ...newRequest, category: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Purpose of expense..." 
                        value={newRequest.description}
                        onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating} className="w-full">
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />} 
                      Submit Request
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelected([]); }} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              <TabsList className="bg-secondary/50 p-1 inline-flex w-max">
                <TabsTrigger value="All" className="px-5">All</TabsTrigger>
                <TabsTrigger value="Pending_CFO" className="px-5">Pending CFO</TabsTrigger>
                <TabsTrigger value="Escalated" className="px-5 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Escalated</TabsTrigger>
                <TabsTrigger value="Auto_Approved" className="px-5">Auto Approved</TabsTrigger>
                <TabsTrigger value="Approved" className="px-5">Approved</TabsTrigger>
                <TabsTrigger value="Paid" className="px-5 text-success data-[state=active]:bg-success data-[state=active]:text-success-foreground">Paid</TabsTrigger>
                <TabsTrigger value="Rejected" className="px-5 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Rejected</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full whitespace-nowrap self-start md:self-auto">
              <Filter className="h-3 w-3" />
              <span>{filteredRecords.length} records</span>
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
                          {isAdmin && (
                            <Checkbox 
                              checked={filteredRecords.length > 0 && 
                                filteredRecords.filter((r: any) => !["Approved", "Paid", "Auto_Approved", "Rejected"].includes(r.status)).length > 0 && 
                                filteredRecords.filter((r: any) => !["Approved", "Paid", "Auto_Approved", "Rejected"].includes(r.status)).every((r: any) => selected.includes(r.id))}
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
                        {isAdmin && <TableHead className="text-right">Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((r: any) => (
                            <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b transition-colors hover:bg-muted/50">
                              <TableCell className="text-center">
                                {isAdmin && !["Approved", "Paid", "Auto_Approved", "Rejected"].includes(r.status) && (
                                  <Checkbox 
                                    checked={selected.includes(r.id)} 
                                    onCheckedChange={() => toggleSelect(r.id)} 
                                  />
                                )}
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">{r.storeName}</TableCell>
                              <TableCell className="text-sm shadow-none whitespace-nowrap">{r.requestedBy}</TableCell>
                              <TableCell className="whitespace-nowrap">{r.category}</TableCell>
                              <TableCell className="text-sm truncate max-w-xs">{r.description}</TableCell>
                              <TableCell className="text-right font-bold whitespace-nowrap font-mono">{formatCurrency(r.amount)}</TableCell>
                              <TableCell className="whitespace-nowrap">{new Date(r.requestDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge className={`text-[10px] whitespace-nowrap ${r.status === "Paid" || r.status === "Approved" || r.status === "Auto_Approved" ? "status-success" : r.status === "Rejected" || r.status === "Escalated" ? "status-overdue" : "status-pending"}`}>
                                  {r.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="text-right">
                                  {r.status !== "Paid" ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                                        onClick={() => handleApprove(r.id)}
                                      >
                                        <FileCheck className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleReject(r.id)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md italic">Paid</span>
                                  )}
                                </TableCell>
                              )}
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-20 text-muted-foreground">
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
            </CardContent>
          </Card>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
