export const validateOrder = (data) => {
  if (!data.customerName?.trim())
    return { valid: false, message: "Customer name is required" };
  if (!data?.customerPhone?.trim())
    return { valid: false, message: "Customer phone number is required" };
  if (!data?.address?.trim())
    return { valid: false, message: "Customer address is required" };
  if (!Array.isArray(data?.items))
    return { valid: false, message: "Order at least one item !!" };
  return { valid: true };
};

// Order id generator Format -- ORD -- dateStamp-randomNum-001(Ajker koto number order 002) ORD-2026-07-29-001
export const generateOrderId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${year}${month}${day}-${random}`;
};

export const calculateTotal = (items) => {
  const subTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const vat = subTotal * 0.1;
  const deliveryCost = 50;
  const total = subTotal + vat + deliveryCost;
  return {
    subTotal: Math.round(subTotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryCost,
    totalAmount: Math.round(total * 100) / 100,
  };
};


  export const createOrderDocument = (orderData, orderId, total) => {
    return {
      orderId,
      customerName: orderData?.customerName?.trim(),
      customerPhone: orderData?.customerPhone?.trim(),
      address: orderData?.address?.trim()
    };
  }