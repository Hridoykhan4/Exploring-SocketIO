import { validateOrder } from "../utils/helper.js";


export const orderHandler = (io, socket) => {
    console.log('Socket Is Connected', socket.id);
    // place order
    // event k on korlam, coz emit diye kew ekjon trigger korbe 
    // emit --> trigger --> ON --> Listen
    // listen er por data dibe naile callback throw korbe
    socket.on('placeOrder', async(data, callback) => {
        try {
            console.log(`Place Order from ${socket.id}`);
            const validation = validateOrder(data)   

            if(!validation.valid){
                return callback({success: false, message: validation?.message})
            }

        }   
        catch(err) {
            console.log(err);
        }
    })
};

    