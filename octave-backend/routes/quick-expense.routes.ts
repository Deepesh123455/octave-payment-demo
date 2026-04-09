import { randomUUID } from "crypto";
import { Router, Request, Response } from "express";
import { createRedisClient } from "../config/redis";

const router = Router();

const STORE_ID = "store-001";
const QUICK_EXPENSE_CHANNEL = `notify:expenses:${STORE_ID}`;
const redisPub = createRedisClient("octave-quick-expense-pub", { lazyConnect: true });
const redisSub = createRedisClient("octave-quick-expense-sub", { lazyConnect: true });
const sseClients = new Set<Response>();

const categories = [
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

let subscriberReady = false;

redisSub.on("message", (channel, message) => {
  if (channel !== QUICK_EXPENSE_CHANNEL) {
    return;
  }

  for (const client of sseClients) {
    client.write(`data: ${message}\n\n`);
    client.flush?.();
  }
});

const ensureSubscriber = async () => {
  if (subscriberReady) {
    return;
  }

  await redisSub.subscribe(QUICK_EXPENSE_CHANNEL);
  subscriberReady = true;
};

const maybeReleaseSubscriber = async () => {
  if (sseClients.size > 0 || !subscriberReady) {
    return;
  }

  await redisSub.unsubscribe(QUICK_EXPENSE_CHANNEL);
  subscriberReady = false;
};

router.get("/api/notifications/stream", async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();
  res.write("retry: 5000\n\n");

  try {
    await ensureSubscriber();
  } catch (_error) {
    res.write(
      `event: error\ndata: ${JSON.stringify({
        message: "Unable to subscribe to expense notifications.",
      })}\n\n`,
    );
    res.end();
    return;
  }

  sseClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
    res.flush?.();
  }, 15_000);

  res.on("close", async () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    await maybeReleaseSubscriber();
    res.end();
  });
});

router.post("/api/expenses/quick-log", async (req: Request, res: Response) => {
  const { category, amount, description } = req.body ?? {};

  if (!category || !amount || !description) {
    return res.status(400).json({
      status: "fail",
      message: "category, amount, and description are required",
    });
  }

  const expensePayload = {
    id: `quick-expense-${randomUUID()}`,
    storeId: STORE_ID,
    category,
    amount: Number(amount),
    description,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  try {
    await redisPub.publish(QUICK_EXPENSE_CHANNEL, JSON.stringify(expensePayload));
  } catch (error) {
    console.error("[QuickExpense] Failed to publish expense notification", error);
    return res.status(503).json({
      status: "fail",
      message: "Expense service is temporarily unavailable. Please try again.",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Quick expense submitted successfully",
    data: expensePayload,
  });
});

router.get("/mobile-expense", (req: Request, res: Response) => {
  const storeId = typeof req.query.storeId === "string" ? req.query.storeId : STORE_ID;
  const categoryOptions = categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");

  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Octave Apparels | Quick Expense</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f4ee;
        --card: #ffffff;
        --ink: #10231a;
        --muted: #5f6f68;
        --accent: #184d3b;
        --accent-soft: #dce8e2;
        --border: #d8dfdb;
        --success: #1d7a52;
        --error: #9b2f2f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        padding: 24px 16px;
        font-family: "Segoe UI", Arial, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top, rgba(24, 77, 59, 0.14), transparent 38%),
          linear-gradient(180deg, #f4f2eb 0%, var(--bg) 100%);
      }
      .shell {
        width: min(100%, 440px);
        margin: 0 auto;
        overflow: hidden;
        border-radius: 24px;
        border: 1px solid var(--border);
        background: var(--card);
        box-shadow: 0 24px 60px rgba(16, 35, 26, 0.1);
      }
      .hero {
        padding: 24px;
        background: linear-gradient(135deg, #184d3b 0%, #2d6e57 100%);
        color: #ffffff;
      }
      .hero p {
        margin: 0;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.82;
      }
      .hero h1 {
        margin: 10px 0 0;
        font-size: 28px;
        line-height: 1.1;
      }
      .store-pill,
      .message {
        margin: 20px 24px 0;
        padding: 14px 16px;
        border-radius: 16px;
        font-size: 14px;
      }
      .store-pill {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .message {
        display: none;
      }
      .message.visible {
        display: block;
      }
      .message.success {
        background: rgba(29, 122, 82, 0.12);
        color: var(--success);
      }
      .message.error {
        background: rgba(155, 47, 47, 0.12);
        color: var(--error);
      }
      form {
        display: grid;
        gap: 18px;
        padding: 24px;
      }
      label {
        display: grid;
        gap: 8px;
        color: var(--muted);
        font-size: 13px;
        font-weight: 600;
      }
      input, select {
        width: 100%;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--ink);
        font: inherit;
      }
      input:focus, select:focus {
        outline: 2px solid rgba(24, 77, 59, 0.15);
        border-color: var(--accent);
      }
      button {
        border: 0;
        border-radius: 16px;
        padding: 15px 18px;
        background: var(--accent);
        color: #fff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      button:disabled {
        cursor: wait;
        opacity: 0.7;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p>Octave Apparels</p>
        <h1>Quick Expense Log</h1>
      </section>
      <div class="store-pill">Store: <strong>${storeId}</strong></div>
      <div id="status-message" class="message" role="status" aria-live="polite"></div>
      <form id="quick-expense-form">
        <label>
          Expense Category
          <select name="category" required>
            <option value="">Select a category</option>
            ${categoryOptions}
          </select>
        </label>
        <label>
          Amount
          <input type="number" name="amount" min="1" step="0.01" placeholder="Enter amount" required />
        </label>
        <label>
          Description
          <input type="text" name="description" maxlength="120" placeholder="What was this expense for?" required />
        </label>
        <button type="submit">Submit Expense</button>
      </form>
    </main>
    <script>
      const form = document.getElementById("quick-expense-form");
      const submitButton = form.querySelector("button");
      const message = document.getElementById("status-message");

      const setMessage = (text, type) => {
        message.textContent = text;
        message.className = "message visible " + type;
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
        message.className = "message";

        const formData = new FormData(form);
        const payload = {
          category: formData.get("category"),
          amount: Number(formData.get("amount")),
          description: formData.get("description")
        };

        try {
          const response = await fetch("/api/expenses/quick-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error("Unable to submit expense.");
          }

          form.reset();
          setMessage("Expense submitted successfully. You can close this page now.", "success");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
          setMessage(errorMessage, "error");
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = "Submit Expense";
        }
      });
    </script>
  </body>
</html>`);
});

export default router;
