import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { expenseTrendData, categoryPieData, stores, formatCurrency, rentRecords, utilityBills, pettyCashRequests } from "@/data/sampleData";

const storeExpenses = stores.map((store) => {
  const rent = rentRecords.filter((r) => r.storeId === store.id && r.month === "March 2026").reduce((s, r) => s + r.netPayable, 0);
  const util = utilityBills.filter((u) => u.storeId === store.id).reduce((s, u) => s + u.amount, 0);
  const petty = pettyCashRequests.filter((p) => p.storeId === store.id).reduce((s, p) => s + p.amount, 0);
  return { name: store.name.replace("Octave ", ""), rent, utilities: util, petty, total: rent + util + petty };
});

const monthlyTotals = expenseTrendData.map((d) => ({
  ...d,
  total: d.rent + d.utilities + d.petty,
}));

export default function Reports() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="page-header">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial analytics across all stores</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Expense by Store (March 2026)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storeExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="rent" name="Rent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilities" name="Utilities" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="petty" name="Petty Cash" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Expense Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
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

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Total Expense Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend iconSize={8} />
                  <Line type="monotone" dataKey="total" name="Total Expenses" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="rent" name="Rent" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
}
