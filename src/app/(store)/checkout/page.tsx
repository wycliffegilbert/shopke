'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  MapPin, User, Phone, CreditCard, Smartphone,
  ChevronRight, ChevronLeft, Tag, Loader2,
  CheckCircle, Shield, Truck, Package,
  Bike, Building2, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { orderApi, paymentApi } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/store';
import { formatCurrency, cn } from '@/lib/utils';

const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi','Kitale',
  'Machakos','Meru','Nyeri','Kakamega','Kericho','Embu','Migori','Kisii',
  'Kilifi','Garissa','Bungoma','Busia','Homa Bay','Kwale','Lamu','Mandera',
  'Marsabit',"Murang'a",'Nandi','Narok','Samburu','Siaya','Taita Taveta',
  'Tana River','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
  'Bomet','Baringo','Elgeyo Marakwet','Isiolo','Kajiado','Laikipia','Makueni',
  'Nyandarua','Nyamira','Tharaka Nithi','Kirinyaga',
];

const DELIVERY_OPTIONS = [
  { id: 'cbd', label: 'Within CBD', desc: 'Nairobi Central Business District', price: 100, icon: <Building2 size={17} className="text-accent" />, eta: 'Same day' },
  { id: 'nairobi', label: 'Within Nairobi', desc: 'All estates & suburbs', price: 300, icon: <Bike size={17} className="text-blue-500" />, eta: '1–2 days' },
  { id: 'outside', label: 'Outside Nairobi', desc: 'Countrywide courier delivery', price: 350, icon: <Globe size={17} className="text-emerald-500" />, eta: '2–5 days' },
];

type PaymentMethod = 'mpesa' | 'paystack' | 'pod';
type Step = 'details' | 'payment' | 'processing';

interface ShippingForm {
  full_name: string; email: string; phone: string;
  address_line1: string; address_line2: string;
  city: string; county: string; notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items: cartItems, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [delivery, setDelivery] = useState(DELIVERY_OPTIONS[1]);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState<{ checkout_request_id: string; attempts: number; polling: boolean } | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || '');

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ShippingForm>({
    defaultValues: { full_name: user?.name || '', email: user?.email || '', phone: user?.phone || '', county: 'Nairobi' }
  });

  useEffect(() => { if (cartItems.length === 0) router.push('/products'); }, [cartItems]);

  const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.price?.toString() || '0') * i.quantity), 0);
  const discount = couponData?.calculated_discount || 0;
  const total = Math.max(0, subtotal - discount + delivery.price);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await paymentApi.validateCoupon(couponCode, subtotal);
      setCouponData(res.data.data);
      toast.success(`Coupon applied! Save ${formatCurrency(res.data.data.calculated_discount)}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Invalid coupon');
      setCouponData(null);
    } finally { setCouponLoading(false); }
  };

  const createOrderMutation = useMutation({
    mutationFn: (formData: ShippingForm) => orderApi.create({
      items: cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      shipping_address: {
        full_name: formData.full_name, email: formData.email, phone: formData.phone,
        address_line1: formData.address_line1, address_line2: formData.address_line2,
        city: formData.city, county: formData.county,
      },
      payment_method: paymentMethod,
      shipping_amount: delivery.price,
      coupon_code: couponData?.code || undefined,
      notes: [formData.notes, `Delivery: ${delivery.label} (KES ${delivery.price})`].filter(Boolean).join(' | '),
    }),
    onSuccess: (res) => {
      const order = res.data.data;
      setOrderId(order.id);
      setOrderNumber(order.order_number);
      if (paymentMethod === 'pod') {
        clearCart();
        toast.success('Order placed! Pay on delivery.');
        router.push(`/order-success?order_id=${order.id}`);
      } else {
        setStep('payment');
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create order'),
  });

  const mpesaMutation = useMutation({
    mutationFn: () => paymentApi.mpesaStkPush({ phone: mpesaPhone, amount: total, order_id: orderId, order_number: orderNumber }),
    onSuccess: (res) => {
      const { checkout_request_id } = res.data.data;
      toast.success('Check your phone for M-Pesa prompt!');
      setStep('processing');
      setMpesaStatus({ checkout_request_id, attempts: 0, polling: true });
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        setMpesaStatus(prev => prev ? { ...prev, attempts } : null);
        try {
          const r = await paymentApi.queryMpesaStatus(checkout_request_id);
          const { status } = r.data.data;
          if (status === 'completed') { clearInterval(interval); clearCart(); router.push(`/order-success?order_id=${orderId}`); }
          else if (status === 'failed' || status === 'cancelled') { clearInterval(interval); setMpesaStatus(null); toast.error('Payment not completed.'); setStep('payment'); }
        } catch {}
        if (attempts >= 20) { clearInterval(interval); setMpesaStatus(prev => prev ? { ...prev, polling: false } : null); setStep('payment'); }
      }, 3000);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'M-Pesa request failed'),
  });

  const paystackMutation = useMutation({
    mutationFn: () => paymentApi.paystackInitialize({ email: getValues('email') || user?.email || '', amount: total, order_id: orderId, order_number: orderNumber }),
    onSuccess: (res) => { clearCart(); window.location.href = res.data.data.authorization_url; },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Paystack failed'),
  });

  const onSubmit = handleSubmit((data) => createOrderMutation.mutate(data));

  if (step === 'details') return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-pad max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-primary-900 mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-5">
            {/* Delivery details */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2"><MapPin size={18} className="text-accent"/>Delivery Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                  <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input {...register('full_name',{required:'Required'})} className="input pl-9" placeholder="John Kamau"/>
                  </div>
                  {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email *</label>
                  <input {...register('email',{required:'Required',pattern:{value:/^\S+@\S+$/,message:'Invalid'}})} className="input" placeholder="you@email.com" type="email"/>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone *</label>
                  <div className="relative"><Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input {...register('phone',{required:'Required'})} className="input pl-9" placeholder="07XX XXX XXX"/>
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Street Address *</label>
                  <input {...register('address_line1',{required:'Required'})} className="input" placeholder="House No., Street, Area"/>
                  {errors.address_line1 && <p className="text-xs text-red-500 mt-1">{errors.address_line1.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Apartment / Building <span className="text-gray-400">(optional)</span></label>
                  <input {...register('address_line2')} className="input" placeholder="Apt, Floor, Building"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">City *</label>
                  <input {...register('city',{required:'Required'})} className="input" placeholder="Nairobi"/>
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">County *</label>
                  <select {...register('county',{required:'Required'})} className="input">
                    <option value="">Select county</option>
                    {Array.from(new Set(COUNTIES)).sort().map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.county && <p className="text-xs text-red-500 mt-1">{errors.county.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Notes <span className="text-gray-400">(optional)</span></label>
                  <textarea {...register('notes')} className="input resize-none" rows={2} placeholder="Special delivery instructions…"/>
                </div>
              </div>
            </div>

            {/* Delivery options */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Truck size={18} className="text-accent"/>Delivery Option</h2>
              <div className="space-y-3">
                {DELIVERY_OPTIONS.map(opt => (
                  <label key={opt.id} onClick={() => setDelivery(opt)}
                    className={cn('flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                      delivery.id===opt.id?'border-accent bg-orange-50':'border-gray-200 hover:border-gray-300')}>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      delivery.id===opt.id?'border-accent':'border-gray-300')}>
                      {delivery.id===opt.id && <div className="w-2.5 h-2.5 rounded-full bg-accent"/>}
                    </div>
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{opt.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc} · {opt.eta}</p>
                    </div>
                    <p className="font-bold text-gray-800">{formatCurrency(opt.price)}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-accent"/>Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id:'mpesa', label:'M-Pesa', desc:'Lipa Na M-Pesa STK Push', icon:<Smartphone size={18} className="text-white"/>, color:'bg-green-500' },
                  { id:'paystack', label:'Card / Bank', desc:'Visa, Mastercard, Bank Transfer', icon:<CreditCard size={18} className="text-white"/>, color:'bg-blue-600' },
                  { id:'pod', label:'Pay on Delivery', desc:'Pay cash when order arrives', icon:<Package size={18} className="text-white"/>, color:'bg-gray-600' },
                ].map(pm => (
                  <label key={pm.id} onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={cn('flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                      paymentMethod===pm.id?'border-accent bg-orange-50':'border-gray-200 hover:border-gray-300')}>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      paymentMethod===pm.id?'border-accent':'border-gray-300')}>
                      {paymentMethod===pm.id && <div className="w-2.5 h-2.5 rounded-full bg-accent"/>}
                    </div>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',pm.color)}>{pm.icon}</div>
                    <div className="flex-1"><p className="font-semibold text-gray-800">{pm.label}</p><p className="text-xs text-gray-500">{pm.desc}</p></div>
                    {paymentMethod===pm.id && <CheckCircle size={18} className="text-accent flex-shrink-0"/>}
                  </label>
                ))}
              </div>
              {paymentMethod==='mpesa' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <label className="block text-sm font-semibold text-green-800 mb-2">M-Pesa Phone Number</label>
                  <input value={mpesaPhone} onChange={e=>setMpesaPhone(e.target.value)} className="input bg-white" placeholder="07XX XXX XXX"/>
                  <p className="text-xs text-green-700 mt-2">💡 You'll receive a payment prompt on this number.</p>
                </div>
              )}
              {paymentMethod==='pod' && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  💵 Have exact cash ready. Our delivery agent will collect payment on arrival.
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="card p-5 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/> : <Package size={16} className="text-gray-300 m-auto mt-3.5"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(parseFloat(item.price?.toString()||'0')*item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e=>e.key==='Enter'&&applyCoupon()}
                    placeholder="COUPON CODE" className="input pl-8 py-2.5 text-sm font-mono uppercase"/>
                </div>
                <button onClick={applyCoupon} disabled={couponLoading}
                  className="px-4 py-2.5 bg-primary-900 text-white text-sm font-semibold rounded-xl hover:bg-accent transition-colors disabled:opacity-50">
                  {couponLoading?'…':'Apply'}
                </button>
              </div>
              {couponData && <p className="text-xs text-green-600 mb-3 font-medium flex items-center gap-1"><CheckCircle size={11}/>{couponData.code} — Save {formatCurrency(couponData.calculated_discount)}</p>}

              {/* Totals */}
              <div className="space-y-2 py-4 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {discount>0 && <div className="flex justify-between text-green-600 font-medium"><span>Discount ({couponData?.code})</span><span>−{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">{delivery.icon} {delivery.label}</span>
                  <span className="font-medium">{formatCurrency(delivery.price)}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 mb-5">
                <span>Total</span><span className="text-accent font-display">{formatCurrency(total)}</span>
              </div>

              <button onClick={onSubmit} disabled={createOrderMutation.isPending}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50">
                {createOrderMutation.isPending
                  ? <><Loader2 size={18} className="animate-spin"/>Processing…</>
                  : <>Continue to Payment <ChevronRight size={18}/></>}
              </button>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Shield size={11}/>Secure</span>
                <span className="flex items-center gap-1"><Truck size={11}/>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 'payment') return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-pad max-w-lg">
        <button onClick={()=>setStep('details')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft size={16}/>Back to Details
        </button>
        <div className="card p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">Order <span className="font-bold text-accent">#{orderNumber}</span></p>
            <p className="font-display text-3xl font-bold text-primary-900">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-400 mt-1">Incl. {delivery.label} delivery ({formatCurrency(delivery.price)})</p>
          </div>

          {paymentMethod==='mpesa' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0"><Smartphone size={24} className="text-white"/></div>
                <div><p className="font-bold text-green-800">Lipa Na M-Pesa</p><p className="text-xs text-green-600">STK Push to your phone</p></div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">M-Pesa Phone Number</label>
                <input value={mpesaPhone} onChange={e=>setMpesaPhone(e.target.value)} className="input text-lg font-mono" placeholder="07XX XXX XXX"/>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
                <p className="font-semibold text-gray-700 mb-1">How it works:</p>
                <p>1️⃣ Click Pay below</p><p>2️⃣ M-Pesa prompt appears on your phone</p>
                <p>3️⃣ Enter your M-Pesa PIN</p><p>4️⃣ Confirmation SMS received</p>
              </div>
              <button onClick={()=>mpesaMutation.mutate()} disabled={mpesaMutation.isPending||!mpesaPhone}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-3">
                {mpesaMutation.isPending?<><Loader2 size={20} className="animate-spin"/>Sending…</>:<><Smartphone size={20}/>Pay {formatCurrency(total)} via M-Pesa</>}
              </button>
            </div>
          )}

          {paymentMethod==='paystack' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0"><CreditCard size={24} className="text-white"/></div>
                <div><p className="font-bold text-blue-800">Secure Card Payment</p><p className="text-xs text-blue-600">Powered by Paystack</p></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                <p>💳 Visa & Mastercard</p><p>🏦 Bank transfer</p><p>🔒 256-bit SSL encrypted</p>
              </div>
              <button onClick={()=>paystackMutation.mutate()} disabled={paystackMutation.isPending}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-3">
                {paystackMutation.isPending?<><Loader2 size={20} className="animate-spin"/>Redirecting…</>:<><CreditCard size={20}/>Pay {formatCurrency(total)} with Card</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-pad max-w-lg">
        <div className="card p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {mpesaStatus?.polling ? <Loader2 size={36} className="text-green-500 animate-spin"/> : <Smartphone size={36} className="text-green-500"/>}
          </div>
          <h2 className="font-display text-2xl font-bold text-primary-900 mb-2">Waiting for Payment…</h2>
          <p className="text-gray-500 mb-6">Check your phone ({mpesaPhone}) and enter your M-Pesa PIN.</p>
          {mpesaStatus?.polling && (
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <div className="flex justify-center gap-1 mb-3">
                {[...Array(5)].map((_:any,i:number)=>(
                  <div key={i} className={cn('w-2 h-2 rounded-full transition-all',
                    i<Math.min(Math.ceil(((mpesaStatus?.attempts||0)/20)*5),5)?'bg-green-500':'bg-gray-200')}/>
                ))}
              </div>
              <p className="text-xs text-gray-400">Checking payment ({mpesaStatus?.attempts}/20)…</p>
            </div>
          )}
          {!mpesaStatus?.polling && (
            <button onClick={()=>{setStep('payment');setMpesaStatus(null);}} className="btn-primary">Try Again</button>
          )}
        </div>
      </div>
    </div>
  );
}
