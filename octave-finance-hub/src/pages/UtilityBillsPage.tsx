import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Wifi, Droplets, Building, Cog, Loader2, AlertCircle, CheckCircle, Filter, FileCheck, XCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { DynamicPagination } from "@/components/ui/DynamicPagination";
import { formatCurrency } from "@/data/sampleData";
import { useUtilityBills, useApproveUtilities, useRejectUtilities } from "@/hooks/apis/useUtilityQueries";
import { useMarkRead } from "@/hooks/apis/useNotificationQueries";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const typeIcons: Record<string, React.ElementType> = {
  Electricity: Zap,
  Internet: Wifi,
  Water: Droplets,
  CAM: Building,
  DG: Cog,
};

const typeLabels: Record<string, string> = {
  Electricity: "Electricity",
  Internet: "Internet",
  Water: "Water",
  CAM: "CAM Charges",
  DG: "DG Charges",
};

export default function UtilityBills() {
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);
  const { mutate: markRead } = useMarkRead();
  const {user} = useAuth();
 const isPrivileged =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
  useEffect(() => {
    markRead({ type: "UTILITY_DUE" });
  }, []);
  
  const { data: utilityResponse, isLoading, isError, error } = useUtilityBills(page, 20, activeTab);
  const { mutateAsync: approve } = useApproveUtilities();
  const { mutateAsync: reject } = useRejectUtilities();



  const rawBills = utilityResponse?.data || [];
  const filteredBills = rawBills;

  // Group filtered bills by store
  const groupedByStore = useMemo(() => {
    const stores: Record<string, { storeName: string, bills: any[] }> = {};
    filteredBills.forEach((bill: any) => {
      if (!stores[bill.storeId]) {
        stores[bill.storeId] = { storeName: bill.store?.storeName || "Unknown Store", bills: [] };
      }
      stores[bill.storeId].bills.push(bill);
    });
    return Object.entries(stores).map(([id, data]) => ({ storeId: id, ...data }));
  }, [filteredBills]);

  const toggleSelect = (id: string) => {
    if (!isPrivileged) return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleApprove = async (ids: string | string[]) => {
    const idsToApprove = Array.isArray(ids) ? ids : [ids];
    if (idsToApprove.length === 0) return;

    const toastId = toast.loading(`Approving ${idsToApprove.length} utility bill(s)...`);
    try {
      await approve(idsToApprove);
      toast.success("Utility bills approved successfully", { id: toastId });
      setSelected([]);
    } catch (err) {
      toast.error("Failed to approve utility bills", { id: toastId });
    }
  };

  const handleReject = async (ids: string | string[]) => {
    const idsToReject = Array.isArray(ids) ? ids : [ids];
    if (idsToReject.length === 0) return;

    const toastId = toast.loading(`Rejecting ${idsToReject.length} utility bill(s)...`);
    try {
      await reject(idsToReject);
      toast.success("Utility bills rejected successfully", { id: toastId });
      setSelected([]);
    } catch (err) {
      toast.error("Failed to reject utility bills", { id: toastId });
    }
  };

  const isBulkApproveEnabled = useMemo(() => {
    if (selected.length === 0) return false;
    return selected.every(id => {
      const bill = rawBills.find((b: any) => b.id === id);
      return bill?.status === "Pending" || bill?.status === "Overdue" || bill?.status === "Pending_Approval" || bill?.status === "Rejected";
    });
  }, [selected, rawBills]);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Utility Bills</h1>
            <p className="text-muted-foreground text-sm mt-1">Electricity, internet, water, CAM & DG charges</p>
          </div>
          <div className="flex gap-2">
            {
              isPrivileged && <Button 
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={!isBulkApproveEnabled}
              onClick={() => handleReject(selected)}
            >
              <XCircle className="h-4 w-4 mr-2" /> Reject Selected {selected.length > 0 && `(${selected.length})`}
            </Button>
            }
            {
              isPrivileged && <Button 
              disabled={!isBulkApproveEnabled}
              onClick={() => handleApprove(selected)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Approve Selected {selected.length > 0 && `(${selected.length})`}
            </Button>
            }
            
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); setSelected([]); }} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-secondary/50 p-1">
              <TabsTrigger value="All" className="px-6">All</TabsTrigger>
              <TabsTrigger value="Pending" className="px-6">Pending</TabsTrigger>
              <TabsTrigger value="Overdue" className="px-6 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Overdue</TabsTrigger>
              <TabsTrigger value="Approved" className="px-6">Approved</TabsTrigger>
              <TabsTrigger value="Paid" className="px-6 text-success data-[state=active]:bg-success data-[state=active]:text-success-foreground">Paid</TabsTrigger>
              <TabsTrigger value="Rejected" className="px-6 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Rejected</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
              <Filter className="h-3 w-3" />
              <span>{utilityResponse?.meta?.totalRecords || filteredBills.length} bills in this view</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <div key="loading" className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading utility bills from DB...</p>
              </div>
            ) : isError ? (
              <div key="error" className="flex flex-col items-center justify-center py-20 text-destructive text-center">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>Failed to load utility bills: {(error as any)?.message}</p>
              </div>
            ) : groupedByStore.length > 0 ? (
              <div key="content" className="space-y-6">
                {groupedByStore.map(({ storeId, storeName, bills }) => {
                  const pendingTotal = bills.filter((b) => b.status !== "Paid").reduce((s, b) => s + b.billAmount, 0);
                  return (
                    <Card key={storeId} className="overflow-hidden border-none shadow-sm bg-card/50">
                      <CardHeader className="pb-3 border-b bg-secondary/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {isPrivileged && bills.filter((b: any) => !["Approved", "Paid"].includes(b.status)).length > 0 && (
                              <Checkbox 
                                checked={bills.filter((b: any) => !["Approved", "Paid"].includes(b.status)).every((b: any) => selected.includes(b.id))}
                                onCheckedChange={(checked) => {
                                  const actionableIds = bills.filter((b: any) => !["Approved", "Paid"].includes(b.status)).map((b: any) => b.id);
                                  if (checked) {
                                    setSelected(prev => [...new Set([...prev, ...actionableIds])]);
                                  } else {
                                    setSelected(prev => prev.filter(id => !actionableIds.includes(id)));
                                  }
                                }}
                              />
                            )}
                            <CardTitle className="text-base font-bold">{storeName}</CardTitle>
                          </div>
                          {pendingTotal > 0 && (
                            <span className="text-sm font-semibold text-accent">Pending: {formatCurrency(pendingTotal)}</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          {bills.map((bill: any) => {
                            const Icon = typeIcons[bill.utilityType] || Zap;
                            const canApprove = !["Approved", "Paid"].includes(bill.status);
                            
                            return (
                              <div key={bill.id} className={`relative rounded-xl border p-4 space-y-3 transition-all ${selected.includes(bill.id) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
                                {isPrivileged && canApprove && (
                                  <div className="absolute top-3 right-3">
                                    <Checkbox 
                                      checked={selected.includes(bill.id)} 
                                      onCheckedChange={() => toggleSelect(bill.id)} 
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-secondary/50">
                                    <Icon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block truncate">{typeLabels[bill.utilityType]}</span>
                                    <p className="text-lg font-bold leading-none mt-1">{formatCurrency(bill.billAmount)}</p>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground truncate">{bill.providerName}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">Due {new Date(bill.dueDate).toLocaleDateString()}</span>
                                    <Badge className={`text-[9px] px-1.5 py-0 h-4 leading-none uppercase font-bold ${bill.status === "Paid" ? "status-paid" : bill.status === "Overdue" ? "status-overdue" : bill.status === "Approved" ? "status-success" : "status-pending"}`}>
                                      {bill.status.replace("_", " ")}
                                    </Badge>
                                  </div>
                                </div>
                                {canApprove && isPrivileged ? (
                                  <div className="flex gap-1 mt-2">
                                    {
                                      isPrivileged && <Button 
                                      size="sm" 
                                      variant="secondary" 
                                      className="flex-1 h-8 text-[11px] font-bold"
                                      onClick={() => handleApprove(bill.id)}
                                    >
                                      <FileCheck className="h-3.5 w-3.5 mr-1.5" /> Approve
                                    </Button>
                                    }
                                    
                                    {bill.status !== "Rejected" && isPrivileged && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1 h-8 text-[11px] font-bold border-destructive/20 text-destructive hover:bg-destructive/5"
                                        onClick={() => handleReject(bill.id)}
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-2 text-center">
                                    <span className="text-[10px] text-muted-foreground italic px-2 py-1 bg-secondary/20 rounded-md block">
                                      {bill.status === "Paid" ? "Paid" : bill.status === "Approved" ? "Approved" : "Rejected"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div key="empty" className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Filter className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold">No bills found</h3>
                <p>There are no utility bills in the "{activeTab.replace("_", " ")}" category.</p>
              </div>
            )}
          </AnimatePresence>
          {!isLoading && !isError && utilityResponse?.meta && utilityResponse.meta.totalPages > 1 && (
            <div className="p-4 mt-6 border-t pt-8">
              <DynamicPagination 
                currentPage={utilityResponse.meta.currentPage} 
                totalPages={utilityResponse.meta.totalPages} 
                onPageChange={setPage} 
              />
            </div>
          )}
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
