import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, User, Phone, Calendar, Ruler, Building2, Loader2, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { rentRecords, utilityBills, pettyCashRequests, formatCurrency } from "@/data/sampleData";
import { useStoreDetail } from "@/hooks/apis/useStoreQueries";

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: storeResponse, isLoading, isError, error } = useStoreDetail(id);
  const store = storeResponse?.data;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading Store Details from database...</p>
        </div>
      </AppLayout>
    );
  }

  if (isError || !store) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-destructive text-center px-4">
          <AlertCircle className="h-8 w-8 mb-4" />
          <h2 className="text-lg font-semibold mb-1">Store Not Found</h2>
          <p className="text-sm text-muted-foreground">{(error as any)?.message || "Could not retrieve store information."}</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/stores")}>Back to Store Management</Button>
        </div>
      </AppLayout>
    );
  }

  // Use real data from the store object
  const storeRent = store.rentPayments || [];
  const storeUtilities = store.utilityBills || [];
  const storePetty = store.pettyCashRequests || [];

  const details = [
    { 
      icon: MapPin, 
      label: "Location", 
      value: `${store.mallOrMarket}, ${store.city}, ${store.state}` 
    },
    { 
      icon: User, 
      label: "Manager", 
      value: store.managerName 
    },
    { 
      icon: Phone, 
      label: "Contact", 
      value: store.managerPhone 
    },
    { 
      icon: Building2, 
      label: "Landlord", 
      value: store.landlord?.companyName || "N/A" 
    },
    { 
      icon: Calendar, 
      label: "Lease Period", 
      value: `${new Date(store.leaseStartDate).toLocaleDateString()} to ${new Date(store.leaseEndDate).toLocaleDateString()}` 
    },
    { 
      icon: Ruler, 
      label: "Area", 
      value: `${store.squareFeet.toLocaleString()} sq.ft.` 
    },
  ];

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/stores")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="page-header">{store.storeName}</h1>
            <p className="text-muted-foreground text-sm tracking-tight">{store.storeId} · {store.city} · {store.region} Region</p>
          </div>
          <Badge className={`ml-auto ${store.storeStatus === "Active" ? "bg-success text-success-foreground" : ""}`}>
            {store.storeStatus}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {details.map((d) => (
            <Card key={d.label} className="stat-card">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <d.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-medium">{d.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Financial Overview: {formatCurrency(store.monthlyRent)} / Month</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border mb-4">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Security Deposit</p>
                <p className="text-lg font-bold">{formatCurrency(store.securityDeposit)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Rent Due Day</p>
                <p className="text-lg font-bold">Every {store.rentDueDay}th</p>
              </div>
            </div>

            {storeRent.length > 0 ? (
              storeRent.map((r: any) => (
                <div key={r.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.paymentMonth}</p>
                    <p className="text-xs text-muted-foreground">Net Payable: {formatCurrency(r.netPayable)}</p>
                  </div>
                  <Badge className={r.status === "Paid" ? "status-paid" : r.status === "Overdue" ? "status-overdue" : "status-pending"}>{r.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent rent records found in DB.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Utility Bills</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {storeUtilities.length > 0 ? (
                storeUtilities.map((u: any) => (
                  <div key={u.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{u.utilityType.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{u.providerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(u.billAmount)}</p>
                      <Badge className={`text-[10px] ${u.status === "Paid" ? "status-paid" : u.status === "Overdue" ? "status-overdue" : "status-pending"}`}>{u.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No utility records found.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Petty Cash Requests</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {storePetty.length > 0 ? (
                storePetty.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.description}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · {new Date(p.requestDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                      <Badge className={`text-[10px] ${p.status === "Auto_Approved" || p.status === "Approved" ? "status-paid" : p.status === "Escalated" ? "status-overdue" : "status-pending"}`}>
                        {p.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No petty cash records found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
}
