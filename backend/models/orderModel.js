// models/orderModel.js
// MODEL layer (MVC er "M") -- ekmatro jayga jekhane "orders" collection er shathe
// database level e kotha hoy. Controller (REST) ar socket handler ekhane direct
// collection na chuye, ei function gula call kore. Tahole data-access logic ek jaygay,
// reuse + test kora shoja, ar business logic theke alada thake.

import { getCollection } from "../config/database.js";

// Choto helper -- protibar getCollection("orders") na likhe ekTa jaygay
const orders = () => getCollection("orders");

// Notun order insert kore, insert kora document Ta return kore
export const insertOrder = async (order) => {
  await orders().insertOne(order);
  return order;
};

// Ekta order khoja orderId diye
export const findOrderById = (orderId) => orders().findOne({ orderId });

// Ekjon customer er shob order (phone number diye), notun gula age
export const findOrdersByPhone = (customerPhone, limit = 50) =>
  orders()
    .find({ customerPhone })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

// General list (admin/REST) -- filter na dile shob, notun gula age
export const findOrders = (filter = {}, limit = 50) =>
  orders().find(filter).sort({ createdAt: -1 }).limit(limit).toArray();

// Status change + ekTa notun statusHistory entry push kore, UPDATED document return kore.
// extraFields diye status er pashapashi onno field o set kora jay (e.g. estimatedTime).
export const updateOrderStatus = (orderId, status, historyEntry, extraFields = {}) =>
  orders().findOneAndUpdate(
    { orderId },
    {
      $set: { status, updatedAt: new Date(), ...extraFields },
      $push: { statusHistory: historyEntry },
    },
    { returnDocument: "after" },
  );

// Status na palTeo sudhu kichu field update korar jnne (e.g. estimated time).
// historyEntry optional -- dile timeline e ekTa note jog hoy.
export const updateOrderFields = (orderId, fields, historyEntry = null) => {
  const update = { $set: { ...fields, updatedAt: new Date() } };
  if (historyEntry) update.$push = { statusHistory: historyEntry };
  return orders().findOneAndUpdate({ orderId }, update, {
    returnDocument: "after",
  });
};

// Live stats er jnne ekTa kore count -- date based ar status based
export const countSince = (since) =>
  orders().countDocuments({ createdAt: { $gte: since } });

export const countByStatus = (status) =>
  orders().countDocuments({ status });
