export const validateOrder = (data) => {
  if (!data.customerName?.trim())
    return { valid: false, message: "Customer name is required" };
  if (!data?.customerPhone?.trim())
    return { valid: false, message: "Customer phone number is required" };
  if (!data?.customerAddress?.trim())
    return { valid: false, message: "Customer address is required" };
  if (!Array.isArray(data?.items) || data?.items?.length === 0)
    return { valid: false, message: "Order at least one item !!" };

  for (let i = 0; i < data?.items.length; i++) {
    const item = data.items[i];
    if (!item.name || !item.quantity || !item.price) {
      return { valid: false, message: `Item ${i + 1} is incomplete` };
    }
    if (item.quantity <= 0 || item.price <= 0) {
      return { valid: false, message: `Item ${i + 1} has invalid values` };
    }
  }

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
  const tax = subTotal * 0.1;
  const deliveryCost = 10;
  const total = subTotal + tax + deliveryCost;
  const info = {
    subTotal: Math.round(subTotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryFee: deliveryCost,
    totalAmount: Math.round(total * 100) / 100,
  };
  return info;
};

export const createOrderDocument = (orderData, orderId, total) => {
  return {
    orderId,
    customerName: orderData?.customerName?.trim(),
    customerPhone: orderData?.customerPhone?.trim(),
    customerAddress: orderData?.customerAddress?.trim(),
    items: orderData?.items,
    subTotal: total?.subTotal,
    tax: total?.tax,
    deliveryFee: total?.deliveryFee,
    totalAmount: total?.totalAmount,
    notes: orderData?.notes,
    paymentMethod: orderData?.paymentMethod,
    paymentStatus: "pending",
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        timeStamp: new Date(),
        by: `Ordered by: ${orderData?.customerName?.trim() || 'Customer'}`,
        note: "Order Placed",
      },
    ],
    estimatedTime: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Ei function Ta amder status er j transition hocche sheTa valid kina
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};
