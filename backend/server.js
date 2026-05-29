// server.js
// Bootstrap file -- Express + Socket.IO + MongoDB ke ek shathe joge ar server chalu kore.
// Business logic ekhane nai: REST -> routes/controllers, real-time -> socket/orderHandler.

import dotenv from "dotenv";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
// I have imported it
import http from "http";
import { connectDB, closeDB } from "./config/database.js";
import { orderHandler } from "./socket/orderHandler.js";
import orderRoutes from "./routes/orderRoutes.js";

// Load environment variables
dotenv.config();

// Production e sudhu nijeder frontend allow korbo, dev e shob (*)
const ALLOWED_ORIGIN = process.env.CLIENT_URL || "*";

// // Create Express app
const app = express();

// Server created of socketIO
const server = http.createServer(app);

// // Middleware -- routes / socket er aage boshano dorkar
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialization
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN, methods: ["GET", "POST"] },
});

// Socket er connection ON korlam
io.on("connection", (socket) => {
  // console.log("User connected", socket.id);
  // Socket trigger hoise
  // Eta server theke oi specific connected client ke event pathay.
  socket.emit("connected", {
    message: `User ${socket.id} is successfully ☑️ Connected`,
  });
  // For handling the Orders
  orderHandler(io, socket);
});

// // ==========================================
// // REST API ROUTES
// // ==========================================

// // Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// // Order related REST routes (controller/model e logic ase)
app.use("/api/orders", orderRoutes);

// // 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// // ==========================================
// // ERROR HANDLING
// // ==========================================

// uncaughtException -> process broken state e, log kore exit kora nirapod
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

// unhandledRejection -> sudhu log kori; ekTa promise miss korle puro server na maral
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});

// // Graceful shutdown
const shutdown = async () => {
  console.log("\n👋 Shutting down gracefully...");
  await closeDB();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// // ==========================================
// // START SERVER
// // ==========================================

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🚀 Server Running                     ║
║  📡 Port: ${PORT}                         ║
║  🌐 http://localhost:${PORT}              ║
║  📊 MongoDB: Connected                 ║
╚════════════════════════════════════════╝
    `);
      // console.log("📝 API Endpoints:");
      // console.log(`   GET  /health`);
      // console.log(`   GET  /api/orders`);
      // console.log(`   GET  /api/orders/:orderId`);
      console.log("\n✨ Ready! time to explore Socket.IO \n");
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });
