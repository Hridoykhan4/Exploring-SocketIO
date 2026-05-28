import { getCollection } from "../config/database.js";
import {
  calculateTotal,
  createOrderDocument,
  generateOrderId,
  validateOrder,
} from "../utils/helper.js";

export const orderHandler = (io, socket) => {
  console.log("Socket Is Connected", socket.id);
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
      console.log(`Place Order from ${socket.id}`);
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
      // socket.join(`order-${orderId}`) ei room Tar moddhei tw amar event er jk update gula shegula ashbe

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
            statusHistory: [
              {
                status: "cancelled",
                timeStamp: new Date(),
                by: socket.id,
                note: data.reason || "Cancelled by customer",
              },
            ],
          },
        },
      );

      // Order j update holo sheTa amaderk janan dite hbe
      // etwkkhn on kortasilam, ekhn emit kortasi, customer end theke emit korechi, admin end theke she listen korbe
      // Order cancel hoile admin jodi na jane loss
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
    } catch (err) {
      console.error("[ Get Orders Failed ] ", err);
      callback({ success: false, message: err?.message || "Failed to load Orders"});
    }
  });

  // ======================
  // ADMIN EVENTS
  // ======================

  

};


// Jotogula on likhsi er corresponding ekTa kore emit thakbe, ekTa event on hocche mane she event ta emit hocche kothaw, event kew pathabe r kew listen korbe, ei kaj Ta cholte thakbe
// ----- event jodi specific jaygay koraite chaii tahole room er concept Ta lagbe