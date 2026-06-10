'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, MapPin, Clock, Check, Truck, Home } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG, cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';

const TRACKING_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'pending', label: 'Order Placed', icon: <Package size={16} /> },
  { status: 'confirmed', label: 'Confirmed', icon: <Check size={16} /> },
  { status: 'processing', label: 'Processing', icon: <Clock size={16} /> },
  { status: 'shipped', label: 'Shipped', icon: <Truck size={16} /> },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: <MapPin size={16} /> },
  { status: 'delivered', label: 'Delivered', icon: <Home size={16} /> },
];

const STATUS_ORDER: OrderStatus[] = ['pending','confirmed','processing','shipped','out_for_delivery','delivered'];

function OrderCard({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const cfg = ORDER_STATUS_CONFIG[order.status];
  const stepIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
            <Package size={18} className="text-accent" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-800">#{order.order_number}</p>
            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-bold text-right">{formatCurrency(order.total)}</p>
            <p className="text-xs text-gray-500 text-right">{(order.items as any[])?.length || 0} item(s)</p>
          </div>
          <span className={cn('badge', cfg.bgColor, cfg.color)}>{cfg.label}</span>
          <ChevronRight size={16} className={cn('text-gray-400 transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-6">
          {/* Tracking Progress */}
          {!isCancelled && (
            <div>
              <p className="text-sm font-semibold mb-4">Order Progress</p>
              <div className="relative">
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
                <div className="absolute top-5 left-5 h-0.5 bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(stepIdx / (TRACKING_STEPS.length - 1) * 100, 100)}%`, right: 'auto', maxWidth: 'calc(100% - 40px)' }} />
                <div className="flex justify-between relative">
                  {TRACKING_STEPS.map((step, i) => {
                    const done = i <= stepIdx;
                    const active = i === stepIdx;
                    return (
                      <div key={step.status} className="flex flex-col items-center gap-2 z-10">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-all',
                          done ? 'border-accent bg-accent text-white' : 'border-gray-200 text-gray-400',
                          active && 'ring-4 ring-accent/20')}>
                          {step.icon}
                        </div>
                        <p className={cn('text-[9px] font-medium text-center max-w-[56px] leading-tight',
                          done ? 'text-accent' : 'text-gray-400')}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.tracking_number && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  🚚 Tracking: <strong>{order.tracking_number}</strong>
                  {order.tracking_url && (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">Track online →</a>
                  )}
                </div>
              )}
              {order.estimated_delivery && (
                <p className="mt-2 text-xs text-emerald-600 font-medium">
                  📅 Estimated delivery: {formatDate(order.estimated_delivery)}
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-sm font-semibold mb-3">Items Ordered</p>
            <div className="space-y-2">
              {(order.items as any[])?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-bold text-accent">{formatCurrency(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shipping_amount === 0 ? 'Free' : formatCurrency(order.shipping_amount)}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatCurrency(order.discount_amount)}</span></div>}
            <div className="flex justify-between font-bold pt-2 border-t border-gray-200"><span>Total</span><span className="text-accent">{formatCurrency(order.total)}</span></div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div>
              <p className="text-sm font-semibold mb-2">Shipping To</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                <p className="font-medium text-gray-800">{(order.shipping_address as any).full_name}</p>
                <p>{(order.shipping_address as any).address_line1}</p>
                <p>{(order.shipping_address as any).city}, {(order.shipping_address as any).county}</p>
                <p>{(order.shipping_address as any).phone}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => orderApi.getAll({ status: statusFilter || undefined }),
    enabled: isAuthenticated,
    select: d => d.data.data,
  });

  if (!isAuthenticated) {
    return (
      <div className="container-pad py-20 text-center">
        <p className="mb-4">Please sign in to view your orders.</p>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="container-pad py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.length || 0} orders total</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input py-2 text-sm w-auto">
          <option value="">All Status</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : data?.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-semibold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-sm text-gray-500 mb-6">Your orders will appear here once you make a purchase.</p>
          <Link href="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.map((order: Order) => (
            <OrderCard key={order.id} order={order}
              expanded={expandedOrder === order.id}
              onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
