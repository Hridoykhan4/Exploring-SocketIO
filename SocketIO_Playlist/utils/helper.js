export const validateOrder = (data) => {
  if (!data.customerName?.trim()) {
    return { valid: false, message: "Customer name is required" };
  }
  if (!data?.customerPhone?.trim()) {
    return { valid: false, message: "Customer phone number is required" };
  }
  if (!data?.address?.trim()) {
    return { valid: false, message: "Customer address is required" };
  }
  if(!Array.isArray(data?.items)) {
    return {valid: false, message: 'Order at least one item !!'}
  }
  return {valid: true}
};

// Order id generator Format -- ORD-dateStamp-randomNum-001(Ajker koto number order 002)
export const generateOrderId = () => {
    const now = new Date()
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDay() + 1).padStart(2, "0");
}
