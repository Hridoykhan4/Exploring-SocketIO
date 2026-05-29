// routes/orderRoutes.js
// ROUTE layer -- sudhu URL ke controller function er shathe map kore.
// Kono logic ekhane nai; thin wiring rakha hoise jate server.js porishkar thake.

import { Router } from "express";
import {
  getRecentOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = Router();

router.get("/", getRecentOrders); // GET /api/orders
router.get("/:orderId", getOrderById); // GET /api/orders/:orderId

export default router;
