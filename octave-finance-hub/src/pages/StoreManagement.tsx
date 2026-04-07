import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  Wallet,
  Plus,
  CheckCircle,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/data/sampleData";
import { useStores, useUpdateStoreBalance } from "@/hooks/apis/useStoreQueries";
import { Store } from "@/api/api.store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function StoreManagement() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUpdatePettyCash =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";

  const { data: storeResponse, isLoading, isError, error } = useStores();
  const { mutateAsync: updateBalance, isPending: isUpdating } =
    useUpdateStoreBalance();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [newBalance, setNewBalance] = useState("");

  const stores: Store[] = storeResponse?.data || [];

  const handleUpdateBalance = async () => {
    if (!canUpdatePettyCash) {
      toast.error("You don't have permission to update petty cash.");
      return;
    }
    if (!selectedStore || !newBalance) return;
    try {
      await updateBalance({
        id: selectedStore.storeId,
        amount: Number(newBalance),
      });
      toast.success(`Balance updated for ${selectedStore.storeName}`);
      setSelectedStore(null);
      setNewBalance("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update balance");
    }
  };

  const cities = [...new Set(stores.map((s) => s.city))];

  const filtered = stores.filter((s) => {
    const matchSearch =
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      s.storeId.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === "all" || s.city === cityFilter;
    return matchSearch && matchCity;
  });

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="page-header">Store Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all Octave Apparels retail locations
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-48">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Fetching stores from Octave Database...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-destructive">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>Failed to load stores: {(error as any)?.message}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Monthly Rent</TableHead>
                    <TableHead className="text-right">
                      Petty Cash Balance
                    </TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right text-sm">
                      Update Petty Cash
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((store) => (
                      <TableRow
                        key={store.id}
                        className="cursor-pointer hover:bg-secondary/50"
                        onClick={() => navigate(`/stores/${store.storeId}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {store.storeId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {store.storeName}
                        </TableCell>
                        <TableCell>{store.city}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(store.monthlyRent)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className="bg-primary/5 text-primary border-primary/20 font-mono"
                          >
                            {formatCurrency(store.pettyCashBalance || 0)}
                          </Badge>
                        </TableCell>
                        <TableCell>{store.managerName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              store.storeStatus === "Active"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              store.storeStatus === "Active"
                                ? "bg-success text-success-foreground"
                                : ""
                            }
                          >
                            {store.storeStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canUpdatePettyCash ? (
                            <Dialog
                              open={
                                !!selectedStore && selectedStore.id === store.id
                              }
                              onOpenChange={(open) =>
                                !open && setSelectedStore(null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStore(store);
                                    setNewBalance(
                                      store.pettyCashBalance.toString(),
                                    );
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent onClick={(e) => e.stopPropagation()}>
                                <DialogHeader>
                                  <DialogTitle>
                                    Update Petty Cash Balance
                                  </DialogTitle>
                                  <DialogDescription>
                                    Set the centralized petty cash amount for{" "}
                                    {store.storeName}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label>
                                      Current Balance:{" "}
                                      {formatCurrency(store.pettyCashBalance)}
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder="Enter new balance"
                                      value={newBalance}
                                      onChange={(e) =>
                                        setNewBalance(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedStore(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleUpdateBalance}
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Update Balance
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-xs text-muted-foreground">View only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No stores found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}
