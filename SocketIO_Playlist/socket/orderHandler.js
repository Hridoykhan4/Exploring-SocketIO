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
        callback({success: false, message: err?.message })
      }
    });


    // Cancel order korte gele amader status Ta change hobe
    socket.on('cancelOrder', async(data, callback) => {
        try{
           const ordersCollection = getCollection("orders");
           const order = await ordersCollection.findOne({
             orderId: data?.orderId,
           });
            if (!order)
              return callback({ success: false, message: "Order Not Found" });
            if(!['pending', 'confirmed']){
                
            }
        }
        catch(error){
            console.log(error);
        }
    })

  });
};
