import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Loader2, AlertCircle, Filter, FileCheck, XCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/data/sampleData";
import { useRentPayments, useApprovePayments, useRejectRentPayments } from "@/hooks/apis/useRentQueries";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function RentPayments() {
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const { user } = useAuth();
  
  const { data: rentResponse, isLoading, isError, error } = useRentPayments();
  const { mutateAsync: approve } = useApprovePayments();
  const { mutateAsync: reject } = useRejectRentPayments();

  const rentRecords = rentResponse?.data || [];

  // Enhanced records with GST calculation fallback
  const processRecords = useMemo(() => {
    return rentRecords.map((r: any) => {
      const calculatedGst = r.gst || Math.round(r.amount * 0.18);
      const isCalculated = r.gst === 0;
      const netPayable = isCalculated ? (r.amount + calculatedGst - r.tdsDeducted) : r.netPayable;
      
      return {
        ...r,
        gst: calculatedGst,
        netPayable: netPayable,
        isGstEstimated: isCalculated
      };
    });
  }, [rentRecords]);

  const filteredRecords = useMemo(() => {
    if (activeTab === "All") return processRecords;
    return processRecords.filter((r: any) => r.status === activeTab);
  }, [processRecords, activeTab]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAllInTab = () => {
    const selectable = filteredRecords.filter((r: any) => {
      return !["Approved", "Paid"].includes(r.status);
    });
    
    const selectableIds = selectable.map((r: any) => r.id);
    
    if (selectableIds.length > 0 && selectableIds.every(id => selected.includes(id))) {
      setSelected(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...selectableIds])]);
    }
  };

  const handleApprove = async (ids: string | string[]) => {
    const idsToApprove = Array.isArray(ids) ? ids : [ids];
    if (idsToApprove.length === 0) return;
    
    // Safety check: ensure only Pending/Overdue/Pending_Approval are being approved
    const toApprove = processRecords.filter(r => idsToApprove.includes(r.id));
    const invalid = toApprove.filter(r => 
      r.status !== "Pending" && 
      r.status !== "Overdue" && 
      r.status !== "Pending_Approval" &&
      r.status !== "Rejected"
    );

    if (invalid.length > 0) {
      toast.error("Some records cannot be approved in their current state.");
      return;
    }

    const toastId = toast.loading(`Approving ${idsToApprove.length} payment(s)...`);
    try {
      await approve(idsToApprove);
      toast.success("Payments approved successfully", { id: toastId });
      setSelected([]);
    } catch (err) {
      toast.error("Failed to approve payments", { id: toastId });
    }
  };

  const handleReject = async (ids: string | string[]) => {
    const idsToReject = Array.isArray(ids) ? ids : [ids];
    if (idsToReject.length === 0) return;
    
    const toReject = processRecords.filter(r => idsToReject.includes(r.id));
    const invalid = toReject.filter(r => 
      r.status !== "Pending" && 
      r.status !== "Overdue" && 
      r.status !== "Pending_Approval" &&
      r.status !== "Rejected"
    );

    if (invalid.length > 0) {
      toast.error("Some records cannot be rejected in their current state.");
      return;
    }

    const toastId = toast.loading(`Rejecting ${idsToReject.length} payment(s)...`);
    try {
      await reject(idsToReject);
      toast.success("Payments rejected successfully", { id: toastId });
      setSelected([]);
    } catch (err) {
      toast.error("Failed to reject payments", { id: toastId });
    }
  };

  // Both approve and reject are enabled for any actionable status
  const isBulkActionEnabled = useMemo(() => {
    if (selected.length === 0) return false;
    return selected.every(id => {
      const rec = processRecords.find(r => r.id === id);
      return rec && !["Approved", "Paid"].includes(rec.status);
    });
  }, [selected, processRecords]);

  // Reject is only for non-rejected (already rejected can't be rejected again)
  const isBulkRejectEnabled = useMemo(() => {
    if (selected.length === 0) return false;
    return selected.every(id => {
      const rec = processRecords.find(r => r.id === id);
      return rec?.status === "Pending" || rec?.status === "Overdue" || rec?.status === "Pending_Approval";
    });
  }, [selected, processRecords]);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Rent Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">Monthly rent obligations across all stores</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled={!isBulkRejectEnabled} 
              onClick={() => handleReject(selected)}
            >
              <XCircle className="h-4 w-4 mr-2" /> Reject Selected {selected.length > 0 && `(${selected.length})`}
            </Button>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!isBulkActionEnabled} 
              onClick={() => handleApprove(selected)}
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Approve Selected {selected.length > 0 && `(${selected.length})`}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelected([]); }} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-secondary/50 p-1 flex-wrap">
              <TabsTrigger value="All" className="px-6">All</TabsTrigger>
              <TabsTrigger value="Pending" className="px-6">Pending</TabsTrigger>
              <TabsTrigger value="Overdue" className="px-6 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Overdue</TabsTrigger>
              <TabsTrigger value="Pending_Approval" className="px-6">Pending Approval</TabsTrigger>
              <TabsTrigger value="Approved" className="px-6">Approved</TabsTrigger>
              <TabsTrigger value="Paid" className="px-6 text-success data-[state=active]:bg-success data-[state=active]:text-success-foreground">Paid</TabsTrigger>
              <TabsTrigger value="Rejected" className="px-6 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Rejected</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
              <Filter className="h-3 w-3" />
              <span>{filteredRecords.length} records in this view</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Loading payments from DB...</p>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-20 text-destructive text-center">
                  <AlertCircle className="h-8 w-8 mb-4" />
                  <p>Failed to load rent records: {(error as any)?.message}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-center">
                          <Checkbox 
                            checked={filteredRecords.length > 0 && 
                              filteredRecords.filter(r => !["Approved", "Paid"].includes(r.status)).length > 0 && 
                              filteredRecords.filter(r => !["Approved", "Paid"].includes(r.status)).every(r => selected.includes(r.id))}
                            onCheckedChange={toggleAllInTab}
                          />

                        </TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Landlord</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Rent</TableHead>
                        <TableHead className="text-right">GST (18%)</TableHead>
                        <TableHead className="text-right">TDS (10%)</TableHead>
                        <TableHead className="text-right">Net Payable</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredRecords.length > 0 ? (
                          filteredRecords.map((r: any) => (
                            <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b transition-colors hover:bg-muted/50">
                              <TableCell className="text-center">
                                {!["Approved", "Paid"].includes(r.status) && (
                                  <Checkbox 
                                    checked={selected.includes(r.id)} 
                                    onCheckedChange={() => toggleSelect(r.id)} 
                                  />
                                )}
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">{r.store?.storeName}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">{r.landlord?.companyName}</TableCell>
                              <TableCell className="whitespace-nowrap">{r.paymentMonth}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.amount)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {formatCurrency(r.gst)}
                                {r.isGstEstimated && <span className="text-[8px] block text-accent font-bold uppercase tracking-widest leading-tight">Estimated</span>}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.tdsDeducted)}</TableCell>
                              <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(r.netPayable)}</TableCell>
                              <TableCell className="whitespace-nowrap">{new Date(r.dueDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge className={`text-[10px] whitespace-nowrap ${r.status === "Paid" ? "status-paid" : r.status === "Overdue" ? "status-overdue" : r.status === "Approved" ? "status-success" : "status-pending"}`}>
                                  {r.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {(r.status === "Pending" || r.status === "Overdue" || r.status === "Pending_Approval" || r.status === "Rejected") ? (
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
                                  <span className="text-[10px] text-muted-foreground italic px-2">Processed</span>
                                )}
                              </TableCell>
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={11} className="text-center py-20 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                                  <Filter className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                                <p>No {activeTab.toLowerCase().replace("_", " ")} records found in the database.</p>
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
