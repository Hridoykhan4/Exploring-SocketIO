import { getCollection } from "../config/database.js";
import {
  calculateTotal,
  createOrderDocument,
  generateOrderId,
  isValidStatusTransition,
  validateOrder,
} from "../utils/helper.js";

export const orderHandler = (io, socket) => {
  // console.log("Socket Is Connected", socket.id);
  // place order
  // event k on korlam, coz emit diye kew ekjon trigger korbe
  // emit --> trigger --> ON --> Listen
  // listen er por data dibe naile callback throw korbe

  // Socket.on korechi mane kew ekjon trigger korbe , trigger hy frontend theke either web app or apps theke , so okhan theke emit hobe
  //kon event Ta emit hobe jekhan theke ami listen korchi, emit hobe placeorder , ei naam e emit hobe coz ei naam e ami listen korchi or on kore rakhsi

  // ======================
  // CUSTOMER EVENTS
  // ======================
  socket.on("placeOrder", async (data, callback) => {
    try {
      // console.log(`Place Order from ${socket.id}`);
      const validation = validateOrder(data);

      if (!validation.valid) {
        return callback({ success: false, message: validation?.message });
      }

      const total = calculateTotal(data?.items);
      const orderId = generateOrderId();
      const order = createOrderDocument(data, orderId, total);
      const ordersCollection = getCollection("orders");
      await ordersCollection.insertOne(order);
      // Room e jeno join korte pare, tahole baki event gula shee listen korte parbe
      socket.join(`order-${orderId}`);
      socket.join("customers");

      // Amader j order Ta hoise sheTa janate hobe admin k
      // join jeTa likhsi to jeta likhe eTar answer hy
      // Ami jokhon ekhane join likhsi kew ekjon "to" customer bole jaygay jabe & order Id diye track korte parbe

      // to diye  admins diyechi mane kew ekjon likhbe socket.join.admins
      // Emit diyechi mane er biporite kew ekjon listen korbe

      // Admin naam e kono ekTa room thakbe shei room er kacheo amar new order Ta emit hoye jabe, admin jodi on kore new Order she instant order peye jabe
      io.to("admins").emit("newOrder", { order });
      callback({ success: true, order });
      console.log(`Order Created ${orderId}`);
    } catch (err) {
      console.log(err);
      callback({ success: false, message: "Failed to place order" });
    }
  });
  // Track the order
  // Front end theke ekTa order emit kore dibo, order Ta amar track korte hobe tokhon server bolbe o accha ami listen / on  korchi , amra order-${349} ei room e achi
  socket.on("trackOrder", async (data, callback) => {
    try {
      const ordersCollection = getCollection("orders");
      const order = await ordersCollection.findOne({
        orderId: data?.orderId,
      });
      if (!order)
        return callback({ success: false, message: "Order Not Found" });
      // Order thakle join korbo, keno karon amader order er ekTa event ase tw, ei order er event Ta te amra join korbo
      // socket.join(`order-${orderId}`) ei room Tar moddhei tw amar event er j update gula shegula ashbe

      socket.join(`order-${data?.orderId}`);
      callback({ success: true, order });
    } catch (err) {
      console.error("[ Order Tracking Error ] ", err);
      callback({ success: false, message: err?.message });
    }
  });

  // Cancel order korte gele amader status Ta change hobe
  // ETa amader event, eTa amra listen korbo, ei j ami listen korlam , ei listen korar jnne kothaw theke ekTa emit korbo
  socket.on("cancelOrder", async (data, callback) => {
    try {
      const ordersCollection = getCollection("orders");
      const order = await ordersCollection.findOne({
        orderId: data?.orderId,
      });
      if (!order)
        return callback({ success: false, message: "Order Not Found" });
      if (!["pending", "confirmed"].includes(order.status)) {
        return callback({
          success: false,
          message: "Can not cancel the order",
        });
      }
      await ordersCollection.updateOne(
        { orderId: data?.orderId },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: "cancelled",
              timeStamp: new Date(),
              by: socket.id,
              note: data.reason || "Cancelled by customer",
            },
          },
        },
      );

      // Order j update holo sheTa amaderk janan dite hbe
      // etwkkhn on kortasilam, ekhn emit kortasi, customer end theke emit korechi, admin end theke she listen korbe
      // Order cancel hoile admin jodi na jane loss

      // Ei order-er room e jara ache, tader orderCancelled er event pathao.
      io.to(`order-${data?.orderId}`).emit("orderCancelled", {
        orderId: data?.orderId,
      });

      // Admin theke amra aage join korbo admin k, room number o janbe abar Admin o janbe
      io.to("admins").emit("orderCancelled", {
        orderId: data?.orderId,
        customerName: data?.customerName,
        customerPhone: data?.customerPhone,
      });

      callback({ success: true });
    } catch (error) {
      console.error("[ Cancel Order error ] ", error);
      callback({ success: false, message: error?.message });
    }
  });

  //   get my orders
  // Admin er jnne jno easy hoy, admin jokhon jabe, ei event tak listen korle customer er kotogula order ase ki ase na ase sheTa admin dekhte parbe
  socket.on("getMyOrders", async (data, callback) => {
    try {
      const ordersCollection = getCollection("orders");
      const orders = await ordersCollection
        .find({ customerPhone: data?.customerPhone })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      callback({ success: true, orders });
      console.log(orders);
    } catch (err) {
      console.error("[ Get Orders Failed ] ", err);
      callback({
        success: false,
        message: err?.message || "Failed to load Orders",
      });
    }
  });

  // ======================
  // ADMIN EVENTS
  // ======================
  // Admin customer er status update kore dibe, login korbe, customer admin er event gula real time e dekhbe

  socket.on("adminLogin", (data, callback) => {
    try {
      if (data?.password === process.env.ADMIN_PASSWORD) {
        socket.isAdmin = true;
        // Admin er room e join kortasi, jodi kono room er moddhe theke info chai taile oi room er bhitor join koraite hobe
        socket.join("admins");
        console.log(`Admin Logged in: ${socket.id}`);
        callback({ success: true });
      } else {
        callback({ success: false, message: "Invalid Password" });
      }
    } catch (err) {
      callback({ success: false, message: "Login Failed" });
    }
  });

  // Admin order status update korbe, but tar aage admin k shob order paite hobe
  socket.on("getAllOrders", async (data, callback) => {
    try {
      if (!socket.isAdmin)
        return callback({ success: false, message: "Unauthorized" });
      const ordersCollection = getCollection("orders");
      const filter = data?.status ? { status: data?.status } : {};
      const orders = await ordersCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(data?.limit || 50)
        .toArray();
      callback({ success: true, orders });
    } catch (err) {
      console.error("❌ Get all orders error:", err);
      callback({ success: false, message: "Failed to load orders" });
    }
  });

  // Update Order Status
  // Emit hobe client theke
  // On diye listen kore asi
  socket.on("updateOrderStatus", async (data, callback) => {
    try {
      if (!socket.isAdmin) {
        return callback({ success: false, message: "Unauthorized" });
      }
      const ordersCollection = getCollection("orders");
      const order = await ordersCollection.findOne({ orderId: data.orderId });

      if (!order)
        return callback({ success: false, message: `Order Not Found` });

      if (!isValidStatusTransition(order.status, data?.newStatus)) {
        return callback({
          success: false,
          message: "Invalid status transition",
        });
      }

      const result = await ordersCollection.findOneAndUpdate(
        { orderId: data.orderId },
        {
          $set: { status: data.newStatus, updatedAt: new Date() },
          $push: {
            statusHistory: {
              status: data?.newStatus,
              timeStamp: new Date(),
              by: socket.id,
              note: "Status updated by Admin",
            },
          },
        },
        { returnDocument: "after" },
      );

      // Update j hoilo eiTa order-id te paThano lagbe, database theke ami data pull kore nibo na, but ami data oi porjontw poicchaite hbe
      io.to(`order-${data.orderId}`).emit("statusUpdated", {
        orderId: data.orderId,
        status: data?.newStatus,
        order: result,
      });

      // Order Status j change hoise admin k eo tw jante hbe
      // Jehutu admin flow tai socket.io
      /* Io hocche oi server Ta jeTa diye frontend r backend er communication maintain thaktase
      socket.to, jeta internally ase, internally she nijeke janaite partase , eTa server e j admin ase oee jantase, frontend theke kew listen kore nai, frontend er shathe kono connectoner dorkar nai, server e hcche
      
      */
      //  Admin eshe ekhn emit korbe, emit kore admin k janate hbe order status j change hoise
      // eta j ami emit korlam kothaw ekTa ami listen korbo eTak
      socket.to("admins").emit("orderStatusChanged", {
        orderId: data.orderId,
        newStatus: data.newStatus,
      });
      callback({ success: true, order: result });
    } catch (err) {
      console.error("❌ Update status error:", err);
      callback({ success: false, message: "Failed to update status" });
    }
  });

  // Accept Order, estimated time deya, disconnect kora
  socket.on("acceptOrder", async (data, callback) => {
    try {
      if (!socket.isAdmin) {
        return callback({ success: false, message: "Unauthorized" });
      }
      const ordersCollection = getCollection("orders");
      const order = await ordersCollection.findOne({
        orderId: data.orderId,
      });

      if (!order || order.status !== "pending") {
        return callback({
          success: false,
          message: "Cannot accept this order",
        });
      }

      const estimatedTime = data.estimatedTime || 30;
      const result = await ordersCollection.findOneAndUpdate(
        { orderId: data.orderId },
        {
          $set: {
            status: "confirmed",
            estimatedTime,
            updatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: "confirmed",
              timeStamp: new Date(),
              by: socket.id,
              note: `Accepted with ${estimatedTime} min estimated time`,
            },
          },
        },
        { returnDocument: "after" },
      );

      // Order number j room Ta te ase oikhane pathate hbe, room e socket kaj kore dilo
      io.to(`order-${data.orderId}`).emit("orderAccepted", {
        orderId: data.orderId,
        estimatedTime,
      });
      // Admin hishebe jei join kore sheo jeno real time update dekhte pay
      io.to("admins").emit("orderStatusChanged", {
        orderId: data.orderId,
        newStatus: "confirmed",
      });
      callback({ success: true, order: result });
    } catch (error) {
      console.error("❌ Accept order error:", error);
      callback({ success: false, message: "Failed to accept order" });
    }
  });

  // Reject Order
  socket.on("rejectOrder", async (data, callback) => {
    try {
      if (!socket.isAdmin) {
        return callback({ success: false, message: "Unauthorized" });
      }
      const ordersCollection = getCollection("orders");
      const order = await ordersCollection.findOne({
        orderId: data.orderId,
      });

      if (!order || order.status !== "pending") {
        return callback({
          success: false,
          message: "Cannot reject this order",
        });
      }

      await ordersCollection.updateOne(
        { orderId: data.orderId },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: "cancelled",
              timeStamp: new Date(),
              by: socket.id,
              note: `Rejected ${data.reason}`,
            },
          },
        },
      );

      io.to(`order-${data.orderId}`).emit("orderRejected", {
        orderId: data.orderId,
        reason: data.reason,
      });
      io.to("admins").emit("orderStatusChanged", {
        orderId: data.orderId,
        newStatus: "cancelled",
      });
      callback({ success: true });
    } catch (error) {
      console.error("❌ Reject order error:", error);
      callback({ success: false, message: "Failed to reject order" });
    }
  });

  // Order status update hcche kintu live stat gula kibhabe pabo, database e o rakhte hobe and socket diyeo pete hobe
  socket.on("getLiveStats", async (callback) => {
    try {
      if (!socket.isAdmin) {
        return callback({ success: false, message: "Unauthorized" });
      }
      const ordersCollection = getCollection("orders");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        totalToday: await ordersCollection.countDocuments({
          createdAt: { $gte: today },
        }),
        pending: await ordersCollection.countDocuments({ status: "pending" }),
        confirmed: await ordersCollection.countDocuments({
          status: "confirmed",
        }),
        preparing: await ordersCollection.countDocuments({
          status: "preparing",
        }),
        ready: await ordersCollection.countDocuments({ status: "ready" }),
        outForDelivery: await ordersCollection.countDocuments({
          status: "out_for_delivery",
        }),
        delivered: await ordersCollection.countDocuments({
          status: "delivered",
        }),
        cancelled: await ordersCollection.countDocuments({
          status: "cancelled",
        }),
      };

      // stats gula k amar pete hobe, socket diye jodi pete chai, socket.on diye tw ami event k on kore felsi, so ekhane ami emit korte parbo listen korte parbo

      callback({ success: true, stats });
    } catch (error) {
      console.error("❌ Get stats error:", error);
      callback({ success: false, message: "Failed to load stats" });
    }
  });
};

// Jotogula on likhsi er corresponding ekTa kore emit thakbe, ekTa event on hocche mane she event ta emit hocche kothaw, event kew pathabe r kew listen korbe, ei kaj Ta cholte thakbe
// ----- event jodi specific jaygay koraite chaii tahole room er concept Ta lagbe
//
