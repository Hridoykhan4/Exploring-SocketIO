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

// Order id generator
