// controllers/orderController.js
// CONTROLLER layer (MVC er "C") for the REST API.
// Kaj: HTTP request newa -> model ke data jonno bola -> response sajano.
// Database query ekhane nai (oTa model er kaj) -- controller sudhu orchestrate kore.

import { findOrders, findOrderById } from "../models/orderModel.js";

// GET /api/orders -- shesh 20 Ta order (notun gula age)
export const getRecentOrders = async (req, res) => {
  try {
    const orders = await findOrders({}, 20);
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:orderId -- ekTa nirdishTo order
export const getOrderById = async (req, res) => {
  try {
    const order = await findOrderById(req.params.orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
