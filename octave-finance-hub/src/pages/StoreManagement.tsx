import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MapPin, Loader2, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/data/sampleData";
import { useStores } from "@/hooks/apis/useStoreQueries";
import { Store } from "@/api/api.store";

export default function StoreManagement() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const navigate = useNavigate();

  const { data: storeResponse, isLoading, isError, error } = useStores();
  const stores: Store[] = storeResponse?.data || [];

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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header">Store Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all Octave Apparels retail locations</p>
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
                    <SelectItem key={c} value={c}>{c}</SelectItem>
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
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
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
                        <TableCell className="font-mono text-sm">{store.storeId}</TableCell>
                        <TableCell className="font-medium">{store.storeName}</TableCell>
                        <TableCell>{store.city}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(store.monthlyRent)}</TableCell>
                        <TableCell>{store.managerName}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={store.storeStatus === "Active" ? "default" : "secondary"} 
                            className={store.storeStatus === "Active" ? "bg-success text-success-foreground" : ""}
                          >
                            {store.storeStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
