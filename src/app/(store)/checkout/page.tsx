'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, ChevronRight, Tag, X, Check, Smartphone, CreditCard, Wallet } from 'lucide-react';
import { cartApi, orderApi, paymentApi, couponApi } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/store';
import { formatCurrency, validatePhone, cn } from '@/lib/utils';

const addressSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  phone: z.string().min(9, 'Valid phone required'),
  address_line1: z.string().min(5, 'Address required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City required'),
  county: z.string().min(2, 'County required'),
  postal_code: z.string().optional(),
});
type AddressForm = z.infer<typeof addressSchema>;

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Machakos','Kajiado','Kiambu','Muranga','Nyeri','Meru','Embu','Kilifi','Kwale','Taita Taveta','Lamu','Tana River','Garissa','Wajir','Mandera','Marsabit','Isiolo','Samburu','Turkana','West Pokot','Trans Nzoia','Elgeyo Marakwet','Nandi','Baringo','Laikipia','Nyahururu','Nyandarua','Kirinyaga','Murang\'a','Kakamega','Vihiga','Bungoma','Busia','Siaya','Kisumu','Homa Bay','Migori','Kisii','Nyamira','Narok','Kericho','Bomet','Nandi','Kakamega'];

type PaymentMethod = 'mpesa' | 'stripe' | 'paypal';

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { items, subtotal, shipping, discount, total, clearCart } = useCartStore();

  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [mpesaPolling, setMpesaPolling] = useState(false);
  const [addressData, setAddressData] = useState<AddressForm | null>(null);

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
    enabled: isAuthenticated,
    select: d => d.data.data,
  });

  const cartItems = isAuthenticated ? (cartData?.items || []) : items;
  const cartSubtotal = isAuthenticated ? (cartData?.summary?.subtotal || 0) : subtotal;
  const cartShipping = isAuthenticated ? (cartData?.summary?.shipping || 0) : shipping;
  const appliedDiscount = couponData?.calculated_discount || discount;
  const orderTotal = cartSubtotal + cartShipping - appliedDiscount;

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { full_name: user?.name || '', phone: user?.phone || '' },
  });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponApi.validate(couponCode, cartSubtotal);
      setCouponData(res.data.data);
      toast.success(`Coupon applied! Saving ${formatCurrency(res.data.data.calculated_discount)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally { setCouponLoading(false); }
  };

  const createOrderMutation = useMutation({
    mutationFn: (addr: AddressForm) => orderApi.create({
      items: cartItems.map((i: any) => ({ product_id: i.product_id, quantity: i.quantity, variant_id: i.variant_id })),
      shipping_address: addr,
      payment_method: paymentMethod,
      coupon_code: couponData?.code || null,
    }),
    onSuccess: (res) => {
      setCreatedOrderId(res.data.data.id);
      setStep('payment');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create order'),
  });

  const handleAddressSubmit = (data: AddressForm) => {
    setAddressData(data);
    createOrderMutation.mutate(data);
  };

  const handleMpesaPayment = async () => {
    if (!createdOrderId) return;
    if (!validatePhone(mpesaPhone)) { toast.error('Enter a valid Kenyan phone number (e.g. 0712345678)'); return; }
    try {
      const res = await paymentApi.stkPush(createdOrderId, mpesaPhone);
      setCheckoutRequestId(res.data.data.checkoutRequestId);
      setMpesaPolling(true);
      toast.success('Check your phone for the M-Pesa prompt!');

      // Poll for payment status
      const poll = setInterval(async () => {
        try {
          const statusRes = await paymentApi.mpesaStatus(res.data.data.checkoutRequestId);
          const payment = statusRes.data.data?.payment;
          if (payment?.status === 'completed') {
            clearInterval(poll);
            setMpesaPolling(false);
            clearCart();
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Payment successful! 🎉');
            router.push(`/account/orders/${createdOrderId}`);
          } else if (payment?.status === 'failed') {
            clearInterval(poll);
            setMpesaPolling(false);
            toast.error('Payment failed. Please try again.');
          }
        } catch {}
      }, 3000);
      setTimeout(() => { clearInterval(poll); setMpesaPolling(false); }, 120000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'M-Pesa request failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-pad py-20 text-center max-w-md mx-auto">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-3">Sign in to Checkout</h2>
        <p className="text-gray-500 text-sm mb-6">Please sign in or create an account to complete your purchase.</p>
        <div className="flex flex-col gap-3">
          <Link href="/auth/login?redirect=/checkout" className="btn-primary text-center">Sign In</Link>
          <Link href="/auth/register" className="btn-secondary text-center">Create Account</Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && step === 'address') {
    return (
      <div className="container-pad py-20 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold mb-3">Your cart is empty</h2>
        <Link href="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-pad py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/" className="font-display text-xl font-bold text-primary-900">Shop<span className="text-accent">KE</span></Link>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-8">
        <Link href="/cart" className="hover:text-accent">Cart</Link>
        <ChevronRight size={12} />
        <span className={cn(step === 'address' ? 'text-accent font-semibold' : '')}>Shipping</span>
        <ChevronRight size={12} />
        <span className={cn(step === 'payment' ? 'text-accent font-semibold' : '')}>Payment</span>
        <ChevronRight size={12} />
        <span className={cn(step === 'confirm' ? 'text-accent font-semibold' : '')}>Confirm</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        {/* Left */}
        <div>
          {/* STEP 1: Address */}
          {step === 'address' && (
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold mb-6">Shipping Address</h2>
              <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Full Name</label>
                    <input {...register('full_name')} className="input" placeholder="Wanjiru Kamau" />
                    {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                    <input {...register('phone')} className="input" placeholder="0712 345 678" />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Address Line 1</label>
                  <input {...register('address_line1')} className="input" placeholder="House/Apartment No, Street Name" />
                  {errors.address_line1 && <p className="text-xs text-red-500 mt-1">{errors.address_line1.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Address Line 2 <span className="text-gray-400">(optional)</span></label>
                  <input {...register('address_line2')} className="input" placeholder="Apartment, suite, estate, etc." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City / Town</label>
                    <input {...register('city')} className="input" placeholder="Nairobi" />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">County</label>
                    <select {...register('county')} className="input">
                      <option value="">Select county</option>
                      {Array.from(new Set(COUNTIES)).sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.county && <p className="text-xs text-red-500 mt-1">{errors.county.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Postal Code <span className="text-gray-400">(opt.)</span></label>
                    <input {...register('postal_code')} className="input" placeholder="00100" />
                  </div>
                </div>
                <button type="submit" disabled={createOrderMutation.isPending} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2">
                  {createOrderMutation.isPending ? 'Processing…' : 'Continue to Payment →'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep('address')} className="text-accent text-sm hover:underline">← Back</button>
                <h2 className="font-display text-xl font-bold">Payment Method</h2>
              </div>

              <div className="space-y-3 mb-8">
                {/* M-Pesa */}
                <label className={cn('flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all',
                  paymentMethod === 'mpesa' ? 'border-accent bg-orange-50' : 'border-gray-200 hover:border-gray-300')}>
                  <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'}
                    onChange={() => setPaymentMethod('mpesa')} className="hidden" />
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    paymentMethod === 'mpesa' ? 'border-accent' : 'border-gray-300')}>
                    {paymentMethod === 'mpesa' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                  </div>
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">M-Pesa</p>
                    <p className="text-xs text-gray-500">Pay via Safaricom M-Pesa STK Push</p>
                  </div>
                  <span className="ml-auto badge bg-green-100 text-green-700 text-[10px]">Recommended</span>
                </label>

                {/* Card (Stripe) */}
                <label className={cn('flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all',
                  paymentMethod === 'stripe' ? 'border-accent bg-orange-50' : 'border-gray-200 hover:border-gray-300')}>
                  <input type="radio" name="payment" value="stripe" checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')} className="hidden" />
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    paymentMethod === 'stripe' ? 'border-accent' : 'border-gray-300')}>
                    {paymentMethod === 'stripe' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                  </div>
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Debit / Credit Card</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard via Stripe (USD)</p>
                  </div>
                </label>

                {/* PayPal */}
                <label className={cn('flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all',
                  paymentMethod === 'paypal' ? 'border-accent bg-orange-50' : 'border-gray-200 hover:border-gray-300')}>
                  <input type="radio" name="payment" value="paypal" checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')} className="hidden" />
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    paymentMethod === 'paypal' ? 'border-accent' : 'border-gray-300')}>
                    {paymentMethod === 'paypal' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">PayPal</p>
                    <p className="text-xs text-gray-500">Pay securely with your PayPal account</p>
                  </div>
                </label>
              </div>

              {/* M-Pesa Phone Input */}
              {paymentMethod === 'mpesa' && (
                <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl">
                  <p className="text-sm font-semibold text-green-800 mb-3">Enter M-Pesa Phone Number</p>
                  <input value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="e.g. 0712 345 678" className="input bg-white" />
                  <p className="text-xs text-green-700 mt-2">You'll receive a payment prompt on this number. Amount: <strong>{formatCurrency(orderTotal)}</strong></p>

                  {checkoutRequestId && mpesaPolling && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      Waiting for payment confirmation…
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={paymentMethod === 'mpesa' ? handleMpesaPayment : undefined}
                disabled={mpesaPolling}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                <Lock size={16} />
                {mpesaPolling ? 'Waiting for payment…' : `Pay ${formatCurrency(orderTotal)}`}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <Lock size={12} /> 256-bit SSL encrypted & secure
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-sm mb-4">Order Summary ({cartItems.length} items)</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <span className="text-xl flex items-center justify-center w-full h-full">📦</span>}
                    <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                    {item.variant_value && <p className="text-[10px] text-gray-400">{item.variant_value}</p>}
                    <p className="text-xs font-bold text-accent mt-1">{formatCurrency(item.effective_price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium mb-2">Promo Code</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME20" className="input pl-8 py-2.5 text-sm" />
                </div>
                <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode}
                  className="px-4 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50">
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {couponData && (
                <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <Check size={12} /> {couponData.description} — saving {formatCurrency(couponData.calculated_discount)}
                  <button onClick={() => setCouponData(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={cartShipping === 0 ? 'text-green-600 font-medium' : ''}>{cartShipping === 0 ? 'Free 🎉' : formatCurrency(cartShipping)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>−{formatCurrency(appliedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span className="text-accent text-lg">{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>

          {/* Trust */}
          <div className="card p-5">
            <div className="space-y-3 text-xs text-gray-500">
              {['🔒 SSL encrypted checkout', '✅ Genuine products guaranteed', '🚚 Fast delivery across Kenya', '↩️ Easy 30-day returns'].map(t => (
                <div key={t}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
