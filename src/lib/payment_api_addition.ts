// ── PAYMENT API ───────────────────────────────────────
// Add this block to the bottom of your src/lib/api.ts

export const paymentApi = {
  // M-Pesa STK Push
  mpesaStkPush: (data: { phone: string; amount: number; order_id: string; order_number?: string }) =>
    api.post('/payments/mpesa/stk-push', data),

  // Query M-Pesa payment status
  queryMpesaStatus: (checkout_request_id: string) =>
    api.get(`/payments/mpesa/status/${checkout_request_id}`),

  // Paystack - initialize payment (returns redirect URL)
  paystackInitialize: (data: { email: string; amount: number; order_id: string; order_number?: string }) =>
    api.post('/payments/paystack/initialize', data),

  // Paystack - verify after redirect
  paystackVerify: (reference: string) =>
    api.get(`/payments/paystack/verify/${reference}`),

  // Validate coupon code
  validateCoupon: (code: string, order_amount: number) =>
    api.post('/coupons/validate', { code, order_amount }),
};
