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
import {
  rentRecords,
  utilityBills,
  pettyCashRequests,
  expenseTrendData,
  categoryPieData,
  formatCurrency,
  stores,
} from "@/data/sampleData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const pendingRent = rentRecords
  .filter((r) => r.status !== "paid")
  .reduce((s, r) => s + r.netPayable, 0);
const pendingUtilities = utilityBills
  .filter((u) => u.status !== "paid")
  .reduce((s, u) => s + u.amount, 0);
const pendingPettyCash = pettyCashRequests
  .filter((p) => !["approved", "auto_approved"].includes(p.status))
  .reduce((s, p) => s + p.amount, 0);
const totalPending = pendingRent + pendingUtilities + pendingPettyCash;

const overdueRent = rentRecords.filter((r) => r.status === "overdue");
const overdueUtilities = utilityBills.filter((u) => u.status === "overdue");

const upcomingDues = [
  ...rentRecords.filter((r) => r.status === "pending").map((r) => ({ name: r.storeName, type: "Rent", date: r.dueDate, amount: r.netPayable })),
  ...utilityBills.filter((u) => u.status === "pending").slice(0, 4).map((u) => ({ name: u.storeName, type: u.type.charAt(0).toUpperCase() + u.type.slice(1), date: u.dueDate, amount: u.amount })),
].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

const statCards = [
  { title: "Total Pending Today", value: totalPending, icon: IndianRupee, color: "text-foreground" },
  { title: "Pending Rent", value: pendingRent, icon: Home, color: "text-foreground" },
  { title: "Pending Utilities", value: pendingUtilities, icon: Zap, color: "text-muted-foreground" },
  { title: "Pending Petty Cash", value: pendingPettyCash, icon: Wallet, color: "text-muted-foreground" },
];

import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const userIdentifier = user?.email?.split('@')[0] || "User";

  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="page-header">Welcome back, {userIdentifier}!</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of Octave Apparels finance operations</p>
        </motion.div>


        {/* Stat Cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.title} className="stat-card">
              <CardContent className="p-0 flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.title}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(s.value)}</p>
                </div>
                <div className={`p-2 rounded-lg bg-secondary ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-foreground" /> Expense Trend (6 months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={expenseTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="rent" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1)/.15)" name="Rent" />
                  <Area type="monotone" dataKey="utilities" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3)/.15)" name="Utilities" />
                  <Area type="monotone" dataKey="petty" stackId="1" stroke="hsl(var(--chart-5))" fill="hsl(var(--chart-5)/.15)" name="Petty Cash" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Expense by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {categoryPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Row */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming Dues */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" /> Upcoming Due Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDues.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.type} · Due {d.date}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Overdue Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueRent.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.storeName}</p>
                    <p className="text-xs text-muted-foreground">Rent · {r.month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatCurrency(r.netPayable)}</span>
                    <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                  </div>
                </div>
              ))}
              {overdueUtilities.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{u.storeName}</p>
                    <p className="text-xs text-muted-foreground">{u.type.toUpperCase()} · {u.month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatCurrency(u.amount)}</span>
                    <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                  </div>
                </div>
              ))}
              {overdueRent.length === 0 && overdueUtilities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No overdue items 🎉</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
