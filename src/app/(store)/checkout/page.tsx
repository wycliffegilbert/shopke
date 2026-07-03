'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  MapPin, User, Phone, CreditCard, Smartphone,
  ChevronRight, ChevronLeft, Tag, Loader2,
  CheckCircle, Shield, Truck, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { orderApi, cartApi, paymentApi } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/store';
import { formatCurrency, cn } from '@/lib/utils';

const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi','Kitale',
  'Machakos','Meru','Nyeri','Kakamega','Kericho','Embu','Migori','Kisii',
  'Kilifi','Garissa','Bungoma','Busia','Homa Bay','Kwale','Lamu','Mandera',
  'Marsabit','Moyale','Murang\'a','Nandi','Narok','Samburu','Siaya','Taita Taveta',
  'Tana River','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
  'Bomet','Baringo','Elgeyo Marakwet','Isiolo','Kajiado','Laikipia','Makueni','Nyandarua',
  'Nyamira','Tharaka Nithi','Kirinyaga'
];

type PaymentMethod = 'mpesa' | 'paystack';
type Step = 'details' | 'payment' | 'processing';

interface ShippingForm {
  full_name: string; email: string; phone: string;
  address_line1: string; address_line2: string;
  city: string; county: string; notes: string;
}

interface MpesaStatus {
  checkout_request_id: string;
  polling: boolean;
  attempts: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items: cartItems, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ShippingForm>({
    defaultValues: {
      full_name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      county: 'Nairobi',
    }
  });

  // Redirect if cart empty
  useEffect(() => {
    if (cartItems.length === 0) router.push('/products');
  }, [cartItems]);

  // Cart totals
  const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.price?.toString() || '0') * i.quantity), 0);
  const discount = couponData?.calculated_discount || 0;
  const shipping = (subtotal - discount) >= 3000 ? 0 : 300;
  const total = Math.max(0, subtotal - discount + shipping);

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await paymentApi.validateCoupon(couponCode, subtotal);
      setCouponData(res.data.data);
      toast.success(`Coupon applied! You save ${formatCurrency(res.data.data.calculated_discount)}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Invalid coupon');
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Create order
  const createOrderMutation = useMutation({
    mutationFn: (formData: ShippingForm) => orderApi.create({
      items: cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      shipping_address: {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2,
        city: formData.city,
        county: formData.county,
      },
      payment_method: paymentMethod,
      coupon_code: couponData?.code || undefined,
      notes: formData.notes || undefined,
    }),
    onSuccess: (res) => {
      const order = res.data.data;
      setOrderId(order.id);
      setOrderNumber(order.order_number);
      setStep('payment');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create order'),
  });

  // M-Pesa STK Push
  const mpesaMutation = useMutation({
    mutationFn: () => paymentApi.mpesaStkPush({
      phone: mpesaPhone,
      amount: total,
      order_id: orderId,
      order_number: orderNumber,
    }),
    onSuccess: (res) => {
      const { checkout_request_id } = res.data.data;
      toast.success('Check your phone — M-Pesa prompt sent!');
      setStep('processing');
      setMpesaStatus({ checkout_request_id, polling: true, attempts: 0 });
      pollMpesaStatus(checkout_request_id);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'M-Pesa request failed'),
  });

  // Poll M-Pesa status
  const pollMpesaStatus = (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 60 seconds

    const interval = setInterval(async () => {
      attempts++;
      setMpesaStatus(prev => prev ? { ...prev, attempts } : null);

      try {
        const res = await paymentApi.queryMpesaStatus(checkoutRequestId);
        const { status } = res.data.data;

        if (status === 'completed') {
          clearInterval(interval);
          clearCart();
          toast.success('Payment successful! 🎉');
          router.push(`/order-success?order_id=${orderId}`);
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(interval);
          setMpesaStatus(prev => prev ? { ...prev, polling: false } : null);
          toast.error('Payment was not completed. Please try again.');
          setStep('payment');
        }
      } catch {}

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setMpesaStatus(prev => prev ? { ...prev, polling: false } : null);
        toast.error('Payment timed out. Check your M-Pesa messages and contact us if charged.');
        setStep('payment');
      }
    }, 3000);
  };

  // Paystack
  const paystackMutation = useMutation({
    mutationFn: () => paymentApi.paystackInitialize({
      email: getValues('email') || user?.email || '',
      amount: total,
      order_id: orderId,
      order_number: orderNumber,
    }),
    onSuccess: (res) => {
      const { authorization_url } = res.data.data;
      clearCart();
      window.location.href = authorization_url;
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Paystack initialization failed'),
  });

  const onSubmitDetails = handleSubmit((data) => {
    createOrderMutation.mutate(data);
  });

  // ── STEP: DETAILS ────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-pad max-w-5xl">
          <h1 className="font-display text-2xl font-bold text-primary-900 mb-6">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Left: Form */}
            <div className="space-y-5">
              {/* Delivery details */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <MapPin size={18} className="text-accent" /> Delivery Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input {...register('full_name', { required: 'Full name is required' })}
                        className="input pl-9" placeholder="John Kamau" />
                    </div>
                    {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email *</label>
                    <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
                      className="input" placeholder="john@email.com" type="email" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input {...register('phone', { required: 'Phone is required' })}
                        className="input pl-9" placeholder="0712 345 678" />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Street Address *</label>
                    <input {...register('address_line1', { required: 'Address is required' })}
                      className="input" placeholder="House No., Street, Area" />
                    {errors.address_line1 && <p className="text-xs text-red-500 mt-1">{errors.address_line1.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Apartment / Building <span className="text-gray-400">(optional)</span></label>
                    <input {...register('address_line2')} className="input" placeholder="Apt, Floor, Building name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City / Town *</label>
                    <input {...register('city', { required: 'City is required' })}
                      className="input" placeholder="Nairobi" />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">County *</label>
                    <select {...register('county', { required: 'County is required' })} className="input">
                      <option value="">Select county</option>
                      {Array.from(new Set(COUNTIES)).sort().map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.county && <p className="text-xs text-red-500 mt-1">{errors.county.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Order Notes <span className="text-gray-400">(optional)</span></label>
                    <textarea {...register('notes')} className="input resize-none" rows={2}
                      placeholder="Any special instructions for delivery…" />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-accent" /> Payment Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* M-Pesa */}
                  <button type="button" onClick={() => setPaymentMethod('mpesa')}
                    className={cn('flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                      paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300')}>
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Smartphone size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">M-Pesa</p>
                      <p className="text-xs text-gray-500">Lipa Na M-Pesa · STK Push</p>
                    </div>
                    {paymentMethod === 'mpesa' && (
                      <CheckCircle size={18} className="text-green-500 ml-auto flex-shrink-0" />
                    )}
                  </button>

                  {/* Paystack */}
                  <button type="button" onClick={() => setPaymentMethod('paystack')}
                    className={cn('flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                      paymentMethod === 'paystack' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300')}>
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Card / Bank</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard, Bank Transfer</p>
                    </div>
                    {paymentMethod === 'paystack' && (
                      <CheckCircle size={18} className="text-blue-500 ml-auto flex-shrink-0" />
                    )}
                  </button>
                </div>

                {/* M-Pesa phone */}
                {paymentMethod === 'mpesa' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <label className="block text-sm font-semibold text-green-800 mb-2">
                      <Smartphone size={14} className="inline mr-1.5" />
                      M-Pesa Phone Number
                    </label>
                    <input
                      value={mpesaPhone}
                      onChange={e => setMpesaPhone(e.target.value)}
                      className="input bg-white"
                      placeholder="07XX XXX XXX"
                    />
                    <p className="text-xs text-green-700 mt-2">
                      💡 You'll receive an STK push prompt on this number. Enter your M-Pesa PIN to complete payment.
                    </p>
                  </div>
                )}

                {paymentMethod === 'paystack' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <Shield size={15} />
                      You'll be redirected to Paystack's secure payment page to complete your payment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-4">
              <div className="card p-5 sticky top-4">
                <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>

                {/* Items */}
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <Package size={16} className="text-gray-300 m-auto mt-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {formatCurrency(parseFloat(item.price?.toString() || '0') * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        placeholder="COUPON CODE" className="input pl-8 py-2.5 text-sm font-mono uppercase" />
                    </div>
                    <button onClick={applyCoupon} disabled={couponLoading}
                      className="px-4 py-2.5 bg-primary-900 text-white text-sm font-semibold rounded-xl hover:bg-accent transition-colors disabled:opacity-50">
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponData && (
                    <p className="text-xs text-green-600 mt-1.5 font-medium flex items-center gap-1">
                      <CheckCircle size={11} /> {couponData.description || `${couponData.code} applied`}
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 py-4 border-t border-gray-100 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({couponData?.code})</span><span>−{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1"><Truck size={13} /> Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                      {shipping === 0 ? 'Free 🎉' : formatCurrency(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-400">Free delivery on orders above KES 3,000</p>
                  )}
                </div>

                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mb-5">
                  <span>Total</span>
                  <span className="text-accent font-display">{formatCurrency(total)}</span>
                </div>

                <button onClick={onSubmitDetails} disabled={createOrderMutation.isPending}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50">
                  {createOrderMutation.isPending
                    ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
                    : <>Continue to Payment <ChevronRight size={18} /></>}
                </button>

                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Shield size={11} /> Secure Checkout</span>
                  <span className="flex items-center gap-1"><Truck size={11} /> Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: PAYMENT ────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container-pad max-w-lg">
          <button onClick={() => setStep('details')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ChevronLeft size={16} /> Back to Details
          </button>

          <div className="card p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Order <span className="font-bold text-accent">#{orderNumber}</span></p>
              <p className="font-display text-3xl font-bold text-primary-900">{formatCurrency(total)}</p>
            </div>

            {paymentMethod === 'mpesa' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Smartphone size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800">Lipa Na M-Pesa</p>
                    <p className="text-xs text-green-600">STK Push to your phone</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">M-Pesa Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={mpesaPhone}
                      onChange={e => setMpesaPhone(e.target.value)}
                      className="input pl-9 text-lg font-mono"
                      placeholder="07XX XXX XXX"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
                  <p className="font-semibold text-gray-700 mb-2">How it works:</p>
                  <p>1️⃣ Click "Pay with M-Pesa" below</p>
                  <p>2️⃣ A prompt will appear on your phone</p>
                  <p>3️⃣ Enter your M-Pesa PIN to confirm</p>
                  <p>4️⃣ You'll get a confirmation SMS from M-Pesa</p>
                </div>

                <button
                  onClick={() => mpesaMutation.mutate()}
                  disabled={mpesaMutation.isPending || !mpesaPhone}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-3">
                  {mpesaMutation.isPending
                    ? <><Loader2 size={20} className="animate-spin" /> Sending prompt…</>
                    : <><Smartphone size={20} /> Pay {formatCurrency(total)} with M-Pesa</>}
                </button>
              </div>
            )}

            {paymentMethod === 'paystack' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-800">Card / Bank Transfer</p>
                    <p className="text-xs text-blue-600">Powered by Paystack — Secure & Encrypted</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
                  <p className="font-semibold text-gray-700 mb-2">Accepted payment options:</p>
                  <p>💳 Visa & Mastercard (debit/credit)</p>
                  <p>🏦 Bank transfer</p>
                  <p>📱 Mobile money</p>
                  <p>🔒 All transactions are 256-bit SSL encrypted</p>
                </div>

                <button
                  onClick={() => paystackMutation.mutate()}
                  disabled={paystackMutation.isPending}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-3">
                  {paystackMutation.isPending
                    ? <><Loader2 size={20} className="animate-spin" /> Redirecting…</>
                    : <><CreditCard size={20} /> Pay {formatCurrency(total)} with Card</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: PROCESSING ─────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-pad max-w-lg">
        <div className="card p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {mpesaStatus?.polling
              ? <Loader2 size={36} className="text-green-500 animate-spin" />
              : <Smartphone size={36} className="text-green-500" />}
          </div>

          <h2 className="font-display text-2xl font-bold text-primary-900 mb-2">
            {mpesaStatus?.polling ? 'Waiting for Payment…' : 'Payment Timed Out'}
          </h2>

          <p className="text-gray-500 mb-6">
            {mpesaStatus?.polling
              ? `Check your phone (${mpesaPhone}) and enter your M-Pesa PIN to complete the payment.`
              : 'The payment verification timed out. Please check your M-Pesa messages.'}
          </p>

          {mpesaStatus?.polling && (
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <div className="flex justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={cn('w-2 h-2 rounded-full transition-all',
                    i < Math.min(Math.ceil((mpesaStatus.attempts / 20) * 5), 5)
                      ? 'bg-green-500' : 'bg-gray-200')} />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Checking payment status ({mpesaStatus.attempts}/20)…
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!mpesaStatus?.polling && (
              <button onClick={() => { setStep('payment'); setMpesaStatus(null); }}
                className="btn-primary">
                Try Again
              </button>
            )}
            <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center gap-2">
              Contact Support on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
