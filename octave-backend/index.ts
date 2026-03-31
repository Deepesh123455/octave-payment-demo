// src/index.ts
import "dotenv/config"; // Ensure environment variables are loaded first
import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// ── Local Imports ─────────────────────────────────────────────────────────
import { prisma } from "./config/db";
import redisClient from "./config/redis";
import { apiLimiter } from "./middleware/ratelimiter";
import { apiSpeedLimiter } from "./middleware/speedlimiter";
import authRoutes from "./routes/auth.routes";
import storeRoutes from "./routes/store.routes";
import rentRoutes from "./routes/rent.routes";
import utilityRoutes from "./routes/utility.routes";
import approvalRoutes from "./routes/approval.routes";
import pettyCashRoutes from "./routes/petty-cash.routes";
import transactionRoutes from "./routes/transaction.routes";
import notificationRoutes from "./routes/notification.routes";
import { ApiError } from "./utils/AppError";
import { globalErrorHandler } from "./middleware/errormiddleware";

// ── Initialize Express App ────────────────────────────────────────────────
const app: Application = express();
const PORT = process.env.PORT || 5000;

// ── 1. Global Security & Utility Middlewares ──────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── 2. Logging ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ── 3. Global API Protection ──────────────────────────────────────────────
// app.use("/api", apiSpeedLimiter);
// app.use("/api", apiLimiter);

// ── 4. Routes ─────────────────────────────────────────────────────────────
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", message: "Octave Secure Portal API is running." });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/rent", rentRoutes);
app.use("/api/v1/utility", utilityRoutes);
app.use("/api/v1/approval", approvalRoutes);
app.use("/api/v1/petty-cash", pettyCashRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// ── 5. 404 Handler ────────────────────────────────────────────────────────
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(`Route ${req.originalUrl} not found`, 404));
});

// ── 6. Global Error Handler ───────────────────────────────────────────────
app.use(globalErrorHandler);

// ── 7. Infrastructure Bootstrap & Server Start ────────────────────────────
const bootstrap = async () => {
  try {
    // Test DB
    await prisma.$connect();
    console.log("[DB] ✅ Successfully connected to PostgreSQL via Prisma.");

    // Test Redis (with a small retry loop to allow for async connection setup)
    let pong = "";
    for (let i = 0; i < 5; i++) {
      try {
        pong = await redisClient.ping();
        if (pong === "PONG") break;
      } catch (e) {
        console.warn(`[Redis] ⏳ Waiting for connection (Attempt ${i + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (pong === "PONG") {
      console.log("[Redis] ✅ Successfully connected to Redis instance.");
    } else {
      console.warn("[Redis] ⚠️  Started without immediate Redis connection (will retry in background).");
    }

    // Start Express
    const server = app.listen(PORT, () => {
      console.log(`[Server] 🚀 Server is running on http://localhost:${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] 🛑 Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log("[Server] HTTP server closed.");
        try {
          await prisma.$disconnect();
          console.log("[DB] PostgreSQL disconnected.");
          await redisClient.quit();
          console.log("[Redis] Redis disconnected.");
          process.exit(0);
        } catch (err) {
          console.error("[Server] Error during shutdown:", err);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("[Server] ⚠️ Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("[Server] ❌ Failed to start application:", error);
    process.exit(1);
  }
};

// ── 8. Uncaught Exception Handlers ────────────────────────────────────────
process.on("uncaughtException", (err: Error) => {
  console.error("[Uncaught Exception] 💥 Shutting down...", err);
  process.exit(1);
});

process.on("unhandledRejection", (err: Error) => {
  console.error("[Unhandled Rejection] 💥 Shutting down...", err);
  process.exit(1);
});

// Boot the app
bootstrap();