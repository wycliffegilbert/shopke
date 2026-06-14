'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, ArrowRight, Download } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG } from '@/lib/utils';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOne(orderId!),
    enabled: !!orderId,
    select: d => d.data.data,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48 mx-auto" />
        <div className="h-4 bg-gray-100 rounded w-64 mx-auto" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-500" />
      </div>

      <h1 className="font-display text-3xl font-bold text-primary-900 mb-2">Order Confirmed! 🎉</h1>
      <p className="text-gray-500 mb-2">Thank you for shopping with ShopKE.</p>
      {order && (
        <p className="text-sm text-gray-400 mb-8">
          Order <span className="font-bold text-accent">#{order.order_number}</span> placed on {formatDate(order.created_at)}
        </p>
      )}

      {order && (
        <div className="card p-6 text-left mb-6">
          {/* Status */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order Status</p>
              <span className={`badge ${ORDER_STATUS_CONFIG[order.status]?.bgColor} ${ORDER_STATUS_CONFIG[order.status]?.color}`}>
                {ORDER_STATUS_CONFIG[order.status]?.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Paid</p>
              <p className="font-display text-xl font-bold text-accent">{formatCurrency(order.total)}</p>
            </div>
          </div>

          {/* Items */}
          <p className="text-sm font-semibold mb-3">Items Ordered</p>
          <div className="space-y-2 mb-5">
            {(order.items || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">📦</div>
                  <span className="text-gray-700 truncate max-w-[200px]">{item.product_name}</span>
                  <span className="text-gray-400">×{item.quantity}</span>
                </div>
                <span className="font-semibold text-gray-800">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
          </div>

          {/* Delivery info */}
          {order.shipping_address && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivering to</p>
              <p className="text-sm font-medium text-gray-800">{(order.shipping_address as any).full_name}</p>
              <p className="text-sm text-gray-500">{(order.shipping_address as any).address_line1}, {(order.shipping_address as any).city}</p>
              <p className="text-sm text-gray-500">{(order.shipping_address as any).county}</p>
            </div>
          )}
        </div>
      )}

      {/* Next steps */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-left mb-6">
        <p className="text-sm font-semibold text-blue-800 mb-3">What happens next?</p>
        <div className="space-y-2">
          {[
            '📧 Confirmation email sent to your inbox',
            '🔄 We\'ll process and pack your order',
            '🚚 You\'ll get a tracking number once shipped',
            '📦 Delivery within 1–3 business days in Nairobi',
          ].map(step => (
            <p key={step} className="text-sm text-blue-700">{step}</p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/account/orders" className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5">
          <Package size={16} /> Track Order
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
    <div className="container-pad py-16">
      <Suspense fallback={
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-gray-100 rounded w-48 mx-auto" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
