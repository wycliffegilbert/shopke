'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, ArrowRight, Clock, MapPin } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG, cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOne(orderId!),
    enabled: !!orderId,
    select: (d): Order => d.data.data as Order,
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-20 w-20 bg-gray-100 rounded-full mx-auto" />
        <div className="h-6 bg-gray-100 rounded w-48 mx-auto" />
        <div className="h-4 bg-gray-100 rounded w-64 mx-auto" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const status = order?.status as OrderStatus | undefined;
  const statusCfg = status ? ORDER_STATUS_CONFIG[status] : null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="font-display text-3xl font-bold text-primary-900 mb-2">
          Order Confirmed! 🎉
        </h1>
        <p className="text-gray-500">Thank you for shopping with ShopKE</p>
        {order && (
          <p className="text-sm text-gray-400 mt-1">
            Order <span className="font-bold text-accent">#{order.order_number}</span> · {formatDate(order.created_at)}
          </p>
        )}
      </div>

      {order && (
        <div className="card p-6 mb-6">
          {/* Status + Total */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order Status</p>
              {statusCfg && (
                <span className={cn('badge', statusCfg.bgColor, statusCfg.color)}>
                  {statusCfg.label}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Paid</p>
              <p className="font-display text-xl font-bold text-accent">{formatCurrency(order.total)}</p>
            </div>
          </div>

          {/* Order breakdown */}
          <div className="space-y-1.5 mb-5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={order.shipping_amount === 0 ? 'text-green-600 font-medium' : ''}>
                {order.shipping_amount === 0 ? 'Free 🎉' : formatCurrency(order.shipping_amount)}
              </span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                <span>−{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
          </div>

          {/* Items */}
          {(order.items || []).length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items Ordered</p>
              <div className="space-y-2">
                {(order.items as any[]).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-700">{formatCurrency(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery address */}
          {order.shipping_address && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MapPin size={11} /> Delivering to
              </p>
              <p className="text-sm font-medium text-gray-800">{(order.shipping_address as any).full_name}</p>
              <p className="text-sm text-gray-500">{(order.shipping_address as any).address_line1}</p>
              <p className="text-sm text-gray-500">{(order.shipping_address as any).city}, {(order.shipping_address as any).county}</p>
              <p className="text-sm text-gray-400">{(order.shipping_address as any).phone}</p>
            </div>
          )}
        </div>
      )}

      {/* Next steps */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Clock size={15} /> What happens next?
        </p>
        <div className="space-y-2">
          {[
            { icon: '📧', text: 'Confirmation email sent to your inbox' },
            { icon: '🔄', text: "We'll process and pack your order" },
            { icon: '🚚', text: "You'll get a tracking number once shipped" },
            { icon: '📦', text: 'Delivery within 1–3 business days in Nairobi' },
          ].map(s => (
            <p key={s.text} className="text-sm text-blue-700 flex items-start gap-2">
              <span>{s.icon}</span> {s.text}
            </p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/account/orders" className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5">
          <Package size={16} /> Track My Order
        </Link>
        <Link href="/products" className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3.5">
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="container-pad py-12">
      <Suspense fallback={
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 animate-pulse" />
          <div className="h-5 bg-gray-100 rounded w-48 mx-auto" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
