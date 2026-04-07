import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  Home,
  Zap,
  Wallet,
  AlertTriangle,
  Clock,
  TrendingUp,
  Loader2,
  Receipt,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency } from "@/data/sampleData";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/apis/useTransactionQueries";
import { useStores } from "@/hooks/apis/useStoreQueries";
import { useRentPayments } from "@/hooks/apis/useRentQueries";
import { useUtilityBills } from "@/hooks/apis/useUtilityQueries";
import { usePettyCashRequests } from "@/hooks/apis/usePettyCashQueries";
import { useApprovedItems } from "@/hooks/apis/useApprovalQueries";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const TYPE_ICONS: Record<string, any> = {
  RENT: Home,
  UTILITY: Zap,
  PETTY_CASH: Wallet,
};

const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--warning))",
];

const isAdminPendingRent = (status?: string) =>
  ["Pending", "Overdue", "Pending_Approval", "Approved"].includes(status || "");

const isAdminPendingUtility = (status?: string) =>
  ["Pending", "Overdue", "Pending_Approval", "Approved"].includes(status || "");

const isPendingPettyReview = (status?: string) =>
  ["Pending", "Pending_CFO", "Escalated"].includes(status || "");

export default function Dashboard() {
  const { user, isStoreManager } = useAuth();
  const userName = user?.role || user?.email?.split("@")[0] || "User";

  const storeId = isStoreManager ? user?.storeId || "STO001" : undefined;
  const { data: txnResponse, isLoading: txnLoading } = useTransactions(1, 50, storeId);
  const { data: storesResponse } = useStores();
  const { data: rentResponse, isLoading: rentLoading, isError: rentError } = useRentPayments(1, 500);
  const { data: utilityResponse, isLoading: utilityLoading, isError: utilityError } = useUtilityBills(1, 500);
  const { data: pettyResponse, isLoading: pettyLoading, isError: pettyError } = usePettyCashRequests({
    page: 1,
    limit: 500,
    status: "All",
  });
  const { data: approvalResponse, isLoading: approvalLoading, isError: approvalError } = useApprovedItems(1, 500);
  const { data: allTxnResponse, isLoading: allTxnLoading, isError: allTxnError } = useTransactions(1, 500);

  const stores = storesResponse?.data || [];
  const currentStore = isStoreManager
    ? stores.find((s: any) => s.managerEmail === user?.email) || stores.find((s: any) => s.storeId === storeId)
    : null;

  const transactions: any[] = txnResponse?.data || [];

  if (isStoreManager) {
    if (txnLoading) {
      return (
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      );
    }

    const rentTxns = transactions.filter((t) => t.sourceType === "RENT");
    const utilityTxns = transactions.filter((t) => t.sourceType === "UTILITY");
    const pettyTxns = transactions.filter((t) => t.sourceType === "PETTY_CASH");

    const totalSpend = transactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const rentSpend = rentTxns.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const utilitySpend = utilityTxns.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const pettySpend = pettyTxns.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    const statCards = [
      { title: "Total Expenses", value: totalSpend, icon: IndianRupee },
      { title: "Rent Payments", value: rentSpend, icon: Home },
      { title: "Utility Bills", value: utilitySpend, icon: Zap },
      { title: "Petty Cash Spent", value: pettySpend, icon: Wallet },
    ];

    const pieData = [
      { name: "Rent", value: rentSpend, fill: "hsl(var(--chart-1))" },
      { name: "Utilities", value: utilitySpend, fill: "hsl(var(--chart-3))" },
      { name: "Petty Cash", value: pettySpend, fill: "hsl(var(--chart-5))" },
    ].filter((entry) => entry.value > 0);

    const recentTxns = [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 5);

    return (
      <AppLayout>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item}>
            <h1 className="page-header">Welcome back, {userName}!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {currentStore ? `Managing ${currentStore.storeName}` : "Store Manager Dashboard"}
            </p>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.title} className="stat-card">
                <CardContent className="p-0 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(stat.value)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary text-foreground">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-foreground" /> Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTxns.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                    No expense data yet. Settle expenses to see them here.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={[
                        { name: "Rent", value: rentSpend },
                        { name: "Utility", value: utilitySpend },
                        { name: "Petty Cash", value: pettySpend },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1)/.15)" name="Amount" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Expense by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm text-center">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" /> Recent Expense History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTxns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>
                ) : (
                  recentTxns.map((transaction: any, index: number) => {
                    const Icon = TYPE_ICONS[transaction.sourceType] || Receipt;
                    return (
                      <div key={transaction.id || index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-secondary">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{transaction.description || transaction.category}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.sourceType} · {transaction.date ? new Date(transaction.date).toLocaleDateString("en-IN") : "—"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(Number(transaction.amount || 0))}</span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AppLayout>
    );
  }

  const adminLoading = rentLoading || utilityLoading || pettyLoading || approvalLoading || allTxnLoading;
  const adminError = rentError || utilityError || pettyError || approvalError || allTxnError;

  const rentPayments = rentResponse?.data || [];
  const utilityBills = utilityResponse?.data || [];
  const pettyCashRequests = pettyResponse?.data || [];
  const allTransactions = allTxnResponse?.data || [];

  const pendingRent = rentPayments
    .filter((rent: any) => isAdminPendingRent(rent.status))
    .reduce((sum: number, rent: any) => sum + Number(rent.netPayable || rent.amount || 0), 0);
  const pendingUtilities = utilityBills
    .filter((utility: any) => isAdminPendingUtility(utility.status))
    .reduce((sum: number, utility: any) => sum + Number(utility.billAmount || 0), 0);
  const pendingPettyCash = pettyCashRequests
    .filter((request: any) => isPendingPettyReview(request.status))
    .reduce((sum: number, request: any) => sum + Number(request.amount || 0), 0);
  const totalPending = pendingRent + pendingUtilities + pendingPettyCash;

  const pendingItems = [
    ...rentPayments
      .filter((rent: any) => isAdminPendingRent(rent.status))
      .map((rent: any) => ({
        id: `rent-${rent.id}`,
        name: rent.store?.storeName || "Unknown Store",
        subtitle: `Rent · ${rent.paymentMonth}`,
        amount: Number(rent.netPayable || rent.amount || 0),
      })),
    ...utilityBills
      .filter((utility: any) => isAdminPendingUtility(utility.status))
      .map((utility: any) => ({
        id: `utility-${utility.id}`,
        name: utility.store?.storeName || "Unknown Store",
        subtitle: `${utility.utilityType} · ${utility.billMonth}`,
        amount: Number(utility.billAmount || 0),
      })),
  ].slice(0, 8);

  const upcomingDues = [
    ...rentPayments
      .filter((rent: any) => isAdminPendingRent(rent.status))
      .map((rent: any) => ({
        name: rent.store?.storeName || "Unknown Store",
        type: "Rent",
        date: rent.dueDate,
        amount: Number(rent.netPayable || rent.amount || 0),
      })),
    ...utilityBills
      .filter((utility: any) => isAdminPendingUtility(utility.status))
      .map((utility: any) => ({
        name: utility.store?.storeName || "Unknown Store",
        type: utility.utilityType,
        date: utility.dueDate,
        amount: Number(utility.billAmount || 0),
      })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const expenseTrendData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleDateString("en-IN", { month: "short" }),
        rent: 0,
        utilities: 0,
        petty: 0,
      };
    });

    const byMonth = new Map(months.map((entry) => [entry.key, entry]));
    allTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const target = byMonth.get(key);
      if (!target) return;

      const amount = Number(transaction.amount || 0);
      if (transaction.sourceType === "RENT") target.rent += amount;
      if (transaction.sourceType === "UTILITY") target.utilities += amount;
      if (transaction.sourceType === "PETTY_CASH") target.petty += amount;
    });

    return months;
  }, [allTransactions]);

  const categoryPieData = useMemo(() => {
    const totals = new Map<string, number>();

    allTransactions.forEach((transaction: any) => {
      const category = transaction.category || transaction.sourceType;
      totals.set(category, (totals.get(category) || 0) + Number(transaction.amount || 0));
    });

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }));
  }, [allTransactions]);

  if (adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (adminError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Unable to load dashboard data right now.
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    { title: "Total Pending Today", value: totalPending, icon: IndianRupee, color: "text-foreground" },
    { title: "Pending Rent", value: pendingRent, icon: Home, color: "text-foreground" },
    { title: "Pending Utilities", value: pendingUtilities, icon: Zap, color: "text-muted-foreground" },
    { title: "Pending Petty Cash", value: pendingPettyCash, icon: Wallet, color: "text-muted-foreground" },
  ];

  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="page-header">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of Octave Apparels finance operations across {stores.length} stores
          </p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="stat-card">
              <CardContent className="p-0 flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stat.value)}</p>
                </div>
                <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-foreground" /> Expense Trend (6 months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseTrendData.every((entry) => entry.rent === 0 && entry.utilities === 0 && entry.petty === 0) ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No settled transactions yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={expenseTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="rent" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1)/.15)" name="Rent" />
                    <Area type="monotone" dataKey="utilities" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3)/.15)" name="Utilities" />
                    <Area type="monotone" dataKey="petty" stackId="1" stroke="hsl(var(--chart-5))" fill="hsl(var(--chart-5)/.15)" name="Petty Cash" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Expense by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryPieData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No paid category mix available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryPieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {categoryPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" /> Upcoming Due Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDues.length > 0 ? (
                upcomingDues.map((due, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{due.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {due.type} · Due {new Date(due.date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(due.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming dues right now.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Pending Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                    <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                  </div>
                </div>
              ))}
              {pendingItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No pending items.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" /> Live Approval Queue Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Awaiting Payment</p>
                <p className="text-2xl font-bold mt-1">{approvalResponse?.meta?.totalRecords || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Approved rent and utility items currently in the queue.</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Petty Requests</p>
                <p className="text-2xl font-bold mt-1">
                  {pettyCashRequests.filter((request: any) => isPendingPettyReview(request.status)).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Requests that still need admin review before store settlement.</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Settled Transactions</p>
                <p className="text-2xl font-bold mt-1">{allTransactions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Recorded paid rent, utility, and petty cash transactions.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
