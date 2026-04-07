import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertCircle, History, Building2, Zap, Receipt, Download, FilterX } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/data/sampleData";
import { useQuery } from "@tanstack/react-query";
import { useTransactions } from "@/hooks/apis/useTransactionQueries";
import { DynamicPagination } from "@/components/ui/DynamicPagination";
import { useMarkRead } from "@/hooks/apis/useNotificationQueries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStores } from "@/hooks/apis/useStoreQueries";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function TransactionsPage() {
  const { user, isStoreManager, clearTxnNotif } = useAuth();
  const [page, setPage] = useState(1);
  const [sourceType, setSourceType] = useState<string>("all");
  
  // Use a fallback storeId for the demo or when it's missing from user object
  const effectiveStoreId = useMemo(() => {
    if (!isStoreManager) return "all";
    return user?.storeId || "STO001"; // Fallback to STO001 for demo resilience
  }, [isStoreManager, user]);

  const [storeId, setStoreId] = useState<string>(effectiveStoreId);

  // Sync state if user loads late
  useEffect(() => {
    if (isStoreManager && user?.storeId) {
      setStoreId(user.storeId);
    }
  }, [user, isStoreManager]);

  // Clear the transaction notification counter when this page is visited
  useEffect(() => {
    if (isStoreManager) {
      clearTxnNotif();
    }
  }, []);

  const { data: response, isLoading, isError, error } = useTransactions(
    page, 
    20, 
    storeId, 
    sourceType === "all" ? undefined : sourceType
  );
  const { data: storesResponse } = useStores();
  const [search, setSearch] = useState("");
  const { mutate: markRead } = useMarkRead();

  useEffect(() => {
    markRead({ type: "TRANSACTION" });
  }, []);

  const transactions = response?.data || [];

  const filtered = useMemo(() => {
    return transactions.filter((t) =>
      t.storeName.toLowerCase().includes(search.toLowerCase()) ||
      t.storeId.toLowerCase().includes(search.toLowerCase()) ||
      t.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [transactions, search]);

  const handleClearFilters = () => {
    setSearch("");
    if (!isStoreManager) setStoreId("all");
    setSourceType("all");
    setPage(1);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["Date", "Store ID", "Owner / Vendor", "Type", "Description", "Transaction ID", "Amount"];
    const csvRows = filtered.map((t) => {
      const date = new Date(t.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      return [
        date,
        t.storeId,
        `"${t.ownerName.replace(/"/g, '""')}"`,
        t.sourceType,
        `"${t.description.replace(/"/g, '""')}"`,
        t.transactionId,
        t.amount
      ].join(",");
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `octave_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Transactions exported successfully");
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-header">Transaction History</h1>
            <p className="text-muted-foreground text-sm mt-1">Audit trail of all processed payments</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isStoreManager && (
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
                )}

                <Select value={sourceType} onValueChange={(val) => { setSourceType(val); setPage(1); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="RENT">Rent</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="PETTY_CASH">Petty Cash</SelectItem>
                  </SelectContent>
                </Select>

                {(search || storeId !== "all" || sourceType !== "all") && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
                    <FilterX className="h-4 w-4 mr-2" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading transaction records...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-destructive text-center">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>Failed to load transactions: {(error as any)?.message}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                <History className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-semibold">No transactions found</h3>
                <p className="text-sm">We couldn't find any paid items matching your search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Store ID</TableHead>
                      <TableHead>Owner / Vendor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow key={t.id} className="hover:bg-secondary/30 transition-colors">
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(t.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{t.storeId}</TableCell>
                        <TableCell className="font-medium">{t.ownerName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              t.sourceType === "RENT"
                                ? "border-primary/40 text-primary bg-primary/5"
                                : t.sourceType === "UTILITY"
                                ? "border-accent/40 text-accent bg-accent/5"
                                : "border-success/40 text-success bg-success/5"
                            }`}
                          >
                            {t.sourceType === "RENT" ? (
                              <><Building2 className="h-2.5 w-2.5 mr-1" />RENT</>
                            ) : t.sourceType === "UTILITY" ? (
                              <><Zap className="h-2.5 w-2.5 mr-1" />UTILITY</>
                            ) : (
                              <><Receipt className="h-2.5 w-2.5 mr-1" />PETTY CASH</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-48 truncate text-muted-foreground">
                          {t.description}
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-bold">
                            {t.transactionId}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-bold whitespace-nowrap">
                          {formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {response?.meta && response.meta.totalPages > 1 && (
              <div className="pt-4 mt-6 border-t border-border/50 px-4">
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
    </AppLayout>
  );
}
