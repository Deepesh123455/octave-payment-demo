import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Send,
  Bot,
  User,
  BarChart3,
  Zap,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  stores,
  rentRecords,
  utilityBills,
  pettyCashRequests,
  expenseTrendData,
  formatCurrency,
} from "@/data/sampleData";

// --- Derived AI Insights from sample data ---

const totalRent = rentRecords.reduce((s, r) => s + r.netPayable, 0);
const totalUtilities = utilityBills.reduce((s, u) => s + u.amount, 0);
const totalPetty = pettyCashRequests.reduce((s, p) => s + p.amount, 0);
const grandTotal = totalRent + totalUtilities + totalPetty;

const storeExpenses = stores.map((store) => {
  const rent = rentRecords.filter((r) => r.storeId === store.id).reduce((s, r) => s + r.netPayable, 0);
  const util = utilityBills.filter((u) => u.storeId === store.id).reduce((s, u) => s + u.amount, 0);
  const petty = pettyCashRequests.filter((p) => p.storeId === store.id).reduce((s, p) => s + p.amount, 0);
  return { ...store, rent, util, petty, total: rent + util + petty, perSqft: (rent + util + petty) / store.sqft };
});

const highestCostStore = storeExpenses.sort((a, b) => b.perSqft - a.perSqft)[0];
const lowestCostStore = storeExpenses.sort((a, b) => a.perSqft - b.perSqft)[0];

const electricityBills = utilityBills.filter((u) => u.type === "electricity");
const avgElectricity = electricityBills.reduce((s, u) => s + u.amount, 0) / (electricityBills.length || 1);
const highElecBill = electricityBills.find((u) => u.amount > avgElectricity * 1.15);

const overdueCount = rentRecords.filter((r) => r.status === "overdue").length + utilityBills.filter((u) => u.status === "overdue").length;
const escalatedPetty = pettyCashRequests.filter((p) => p.status === "escalated");

const lastMonth = expenseTrendData[expenseTrendData.length - 1];
const prevMonth = expenseTrendData[expenseTrendData.length - 2];
const utilityTrend = lastMonth && prevMonth ? ((lastMonth.utilities - prevMonth.utilities) / prevMonth.utilities * 100).toFixed(1) : "0";
const pettyTrend = lastMonth && prevMonth ? ((lastMonth.petty - prevMonth.petty) / prevMonth.petty * 100).toFixed(1) : "0";

type Insight = {
  type: "anomaly" | "forecast" | "recommendation" | "observation";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  icon: typeof AlertTriangle;
};

const insights: Insight[] = [
  ...(highElecBill ? [{
    type: "anomaly" as const,
    severity: "high" as const,
    title: "Electricity Spike Detected",
    detail: `${highElecBill.storeName}'s electricity bill of ${formatCurrency(highElecBill.amount)} is ${((highElecBill.amount / avgElectricity - 1) * 100).toFixed(0)}% above the average (${formatCurrency(avgElectricity)}). Recommend an energy audit.`,
    icon: Zap,
  }] : []),
  {
    type: "observation",
    severity: "medium",
    title: "Highest Cost per Sq.Ft.",
    detail: `${highestCostStore.name} has the highest operating cost at ${formatCurrency(Math.round(highestCostStore.perSqft))}/sq.ft. compared to ${lowestCostStore.name} at ${formatCurrency(Math.round(lowestCostStore.perSqft))}/sq.ft.`,
    icon: BarChart3,
  },
  {
    type: "forecast",
    severity: "low",
    title: "Utility Costs Trending " + (Number(utilityTrend) > 0 ? "Up" : "Down"),
    detail: `Utility expenses changed by ${utilityTrend}% month-over-month. At this rate, next quarter's utility costs are projected at ${formatCurrency(Math.round((lastMonth?.utilities ?? 0) * 3 * (1 + Number(utilityTrend) / 100)))}.`,
    icon: Number(utilityTrend) > 0 ? TrendingUp : TrendingDown,
  },
  {
    type: "forecast",
    severity: Number(pettyTrend) > 20 ? "high" as const : "low" as const,
    title: "Petty Cash " + (Number(pettyTrend) > 0 ? "Increasing" : "Stable"),
    detail: `Petty cash requests changed by ${pettyTrend}% this month. ${Number(pettyTrend) > 20 ? "This is a significant jump — consider reviewing approval thresholds." : "Spending is within normal range."}`,
    icon: Number(pettyTrend) > 0 ? TrendingUp : TrendingDown,
  },
  ...(overdueCount > 0 ? [{
    type: "anomaly" as const,
    severity: "high" as const,
    title: `${overdueCount} Overdue Payment${overdueCount > 1 ? "s" : ""}`,
    detail: `There are ${overdueCount} overdue payments across rent and utilities. Immediate attention required to avoid penalties and late fees.`,
    icon: AlertTriangle,
  }] : []),
  ...(escalatedPetty.length > 0 ? [{
    type: "recommendation" as const,
    severity: "medium" as const,
    title: "Escalated Petty Cash Requests",
    detail: `${escalatedPetty.length} petty cash request(s) have been escalated. Review and resolve to maintain store operations.`,
    icon: Lightbulb,
  }] : []),
  {
    type: "recommendation",
    severity: "low",
    title: "Lease Renewal Planning",
    detail: `${stores[0].name}'s lease expires on ${stores[0].leaseEnd}. Start renegotiation 6 months in advance for better terms.`,
    icon: Lightbulb,
  },
];

const severityColor = (s: string) => {
  if (s === "high") return "bg-destructive/10 text-destructive border-destructive/20";
  if (s === "medium") return "bg-warning/10 text-warning border-warning/20";
  return "bg-muted text-muted-foreground border-border";
};

const typeLabel = (t: string) => {
  if (t === "anomaly") return "Anomaly";
  if (t === "forecast") return "Forecast";
  if (t === "recommendation") return "Tip";
  return "Insight";
};

// --- Simple Q&A chatbot using sample data ---
type ChatMsg = { role: "user" | "assistant"; content: string };

function generateAnswer(q: string): string {
  const lower = q.toLowerCase();

  if (lower.includes("total") && (lower.includes("spend") || lower.includes("expense") || lower.includes("cost")))
    return `Total expenses across all stores: **${formatCurrency(grandTotal)}** — Rent: ${formatCurrency(totalRent)}, Utilities: ${formatCurrency(totalUtilities)}, Petty Cash: ${formatCurrency(totalPetty)}.`;

  if (lower.includes("overdue"))
    return overdueCount > 0
      ? `There are **${overdueCount} overdue items**:\n${rentRecords.filter((r) => r.status === "overdue").map((r) => `• ${r.storeName} — Rent ${formatCurrency(r.netPayable)}`).join("\n")}\n${utilityBills.filter((u) => u.status === "overdue").map((u) => `• ${u.storeName} — ${u.type} ${formatCurrency(u.amount)}`).join("\n")}`
      : "Great news — there are **no overdue payments** right now! 🎉";

  if (lower.includes("rent") && (lower.includes("highest") || lower.includes("most") || lower.includes("expensive")))
    return `**${stores[1].name}** has the highest monthly rent at **${formatCurrency(stores[1].monthlyRent)}**, followed by ${stores[0].name} at ${formatCurrency(stores[0].monthlyRent)}.`;

  if (lower.includes("store") && (lower.includes("how many") || lower.includes("count") || lower.includes("list")))
    return `There are **${stores.length} active stores**:\n${stores.map((s) => `• **${s.name}** — ${s.city}, ${formatCurrency(s.monthlyRent)}/month, ${s.sqft} sq.ft.`).join("\n")}`;

  if (lower.includes("petty") && lower.includes("cash"))
    return `Petty cash summary: **${formatCurrency(totalPetty)}** total across ${pettyCashRequests.length} requests. ${escalatedPetty.length} escalated, ${pettyCashRequests.filter((p) => p.status === "pending_cfo").length} pending CFO approval.`;

  if (lower.includes("electricity") || lower.includes("electric"))
    return `Average electricity bill: **${formatCurrency(Math.round(avgElectricity))}**. ${highElecBill ? `⚠️ ${highElecBill.storeName} has an elevated bill at ${formatCurrency(highElecBill.amount)}.` : "All bills are within normal range."}`;

  if (lower.includes("forecast") || lower.includes("predict") || lower.includes("next month"))
    return `Based on 6-month trends:\n• **Rent**: ${formatCurrency(570000)} (fixed)\n• **Utilities**: ~${formatCurrency(Math.round((lastMonth?.utilities ?? 0) * (1 + Number(utilityTrend) / 100)))} (${utilityTrend}% trend)\n• **Petty Cash**: ~${formatCurrency(Math.round((lastMonth?.petty ?? 0) * (1 + Number(pettyTrend) / 100)))} (${pettyTrend}% trend)\n\nProjected total: **${formatCurrency(570000 + Math.round((lastMonth?.utilities ?? 0) * (1 + Number(utilityTrend) / 100)) + Math.round((lastMonth?.petty ?? 0) * (1 + Number(pettyTrend) / 100)))}**`;

  if (lower.includes("cost") && lower.includes("sq"))
    return storeExpenses.map((s) => `• **${s.name}**: ${formatCurrency(Math.round(s.perSqft))}/sq.ft.`).join("\n") + `\n\nHighest: ${highestCostStore.name}. Lowest: ${lowestCostStore.name}.`;

  if (lower.includes("save") || lower.includes("reduce") || lower.includes("cut"))
    return `Cost reduction suggestions:\n1. **Energy audit** at ${highestCostStore.name} — highest cost/sq.ft.\n2. **Negotiate DG charges** — these vary significantly across stores\n3. **Consolidate internet providers** — standardize across locations for volume discounts\n4. **Review petty cash thresholds** — ${Number(pettyTrend) > 0 ? "spending is trending up" : "currently stable"}`;

  return `I can help with questions about:\n• **Total expenses** and breakdowns\n• **Overdue payments**\n• **Store comparisons** and cost/sq.ft.\n• **Forecasts** and trends\n• **Cost reduction** ideas\n• **Electricity** and utility analysis\n• **Petty cash** status\n\nTry asking something specific!`;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function AIInsights() {
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    setChat((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const answer = generateAnswer(userMsg.content);
      setChat((prev) => [...prev, { role: "assistant", content: answer }]);
      setTyping(false);
    }, 600 + Math.random() * 400);
  };

  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-foreground" />
            <h1 className="page-header">AI Insights</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Intelligent analysis of your finance data — anomalies, forecasts & recommendations
          </p>
        </motion.div>

        {/* Insight Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => (
            <Card key={i} className={`border ${severityColor(insight.severity).split(" ").slice(2).join(" ")}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${severityColor(insight.severity).split(" ").slice(0, 2).join(" ")}`}>
                    <insight.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {typeLabel(insight.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* AI Chat */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4" /> Ask the Finance Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="h-64 overflow-y-auto border border-border rounded-lg p-4 mb-3 space-y-3 bg-secondary/20">
                {chat.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Ask me about expenses, overdue payments, forecasts, or cost-saving tips
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 justify-center">
                      {["What are total expenses?", "Show overdue items", "Forecast next month"].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setInput(q); }}
                          className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors text-muted-foreground"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chat.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3 w-3 text-background" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-foreground text-background"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {msg.content.split("**").map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {typing && (
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center shrink-0">
                      <Bot className="h-3 w-3 text-background" />
                    </div>
                    <div className="bg-secondary rounded-lg px-3 py-2 text-sm text-muted-foreground">
                      Analyzing...
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about expenses, overdue items, forecasts..."
                  disabled={typing}
                />
                <Button type="submit" disabled={typing || !input.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
