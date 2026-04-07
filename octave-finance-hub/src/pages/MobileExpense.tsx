import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const expenseCategories = [
  "Maintenance",
  "Office Supplies",
  "Minor Repairs",
  "Store Supplies",
  "Courier",
  "Staff Welfare",
  "Utility",
  "Marketing",
  "Others",
];

const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1/";
const backendOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

export default function MobileExpense() {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const storeId = useMemo(() => searchParams.get("storeId") || "store-001", [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`${backendOrigin}/api/expenses/quick-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit expense right now.");
      }

      setCategory("");
      setAmount("");
      setDescription("");
      setStatus({
        type: "success",
        message: "Expense submitted successfully. You can close this page now.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_34%),linear-gradient(180deg,_#f8f5ef_0%,_#f1eee7_100%)] px-4 py-8">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
        <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#1f3a5f_100%)] px-6 py-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Octave Apparels</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Quick Expense Log</h1>
          <p className="mt-2 text-sm text-white/70">Submit a store expense instantly from your phone.</p>
        </div>

        <div className="px-6 pt-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Store: {storeId}
          </div>
        </div>

        <form className="grid gap-5 p-6" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-600">Expense Category</span>
            <select
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              <option value="">Select a category</option>
              {expenseCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-600">Amount</span>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount"
              className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-600">Description</span>
            <input
              type="text"
              maxLength={120}
              placeholder="What was this expense for?"
              className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </label>

          {status && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                status.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-2xl bg-slate-950 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
