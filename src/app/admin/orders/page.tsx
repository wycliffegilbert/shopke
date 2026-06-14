'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Eye, Package, Truck, Check, Clock, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_CONFIG, cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'pending',          label: 'Pending',          icon: <Clock size={14} /> },
  { value: 'confirmed',        label: 'Confirmed',        icon: <Check size={14} /> },
  { value: 'processing',       label: 'Processing',       icon: <RefreshCw size={14} /> },
  { value: 'shipped',          label: 'Shipped',          icon: <Truck size={14} /> },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: <Truck size={14} /> },
  { value: 'delivered',        label: 'Delivered',        icon: <Package size={14} /> },
  { value: 'cancelled',        label: 'Cancelled',        icon: <XCircle size={14} /> },
  { value: 'refunded',         label: 'Refunded',         icon: <RefreshCw size={14} /> },
];

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [tracking, setTracking] = useState(order.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || '');
  const [tab, setTab] = useState<'details' | 'update'>('details');

  const mutation = useMutation({
    mutationFn: () => adminApi.updateOrderStatus(order.id, {
      status,
      tracking_number: tracking || undefined,
      tracking_url: trackingUrl || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated!');
      onClose();
    },
    onError: () => toast.error('Failed to update order'),
  });

  const cfg = ORDER_STATUS_CONFIG[order.status];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
            <p className="text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('badge', cfg.bgColor, cfg.color)}>{cfg.label}</span>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {[['details', 'Order Details'], ['update', 'Update Status']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={cn('px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === id ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {tab === 'details' && (
            <div className="space-y-5">
              {/* Customer */}
              <div className="card p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
                <p className="font-semibold">{(order as any).customer?.name || 'Guest'}</p>
                <p className="text-sm text-gray-500">{(order as any).customer?.email}</p>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items</p>
                <div className="space-y-2">
                  {(order.items || []).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-bold">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>{order.shipping_amount === 0 ? 'Free' : formatCurrency(order.shipping_amount)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                    <span>−{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment Method</p>
                  <p className="font-semibold capitalize">{order.payment_method}</p>
                  <span className={cn('badge text-[10px] mt-1',
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                    {order.payment_status}
                  </span>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Shipping Address</p>
                  {order.shipping_address && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-800">{(order.shipping_address as any).full_name}</p>
                      <p>{(order.shipping_address as any).city}, {(order.shipping_address as any).county}</p>
                      <p>{(order.shipping_address as any).phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {order.tracking_number && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Tracking</p>
                  <p className="font-mono text-sm font-bold text-blue-800">{order.tracking_number}</p>
                  {order.tracking_url && (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block">Track shipment →</a>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'update' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setStatus(opt.value)}
                      className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left',
                        status === opt.value
                          ? `border-accent bg-orange-50 text-accent`
                          : 'border-gray-200 text-gray-700 hover:border-gray-300')}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Tracking Number</label>
                <input value={tracking} onChange={e => setTracking(e.target.value)}
                  className="input" placeholder="e.g. KE1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tracking URL <span className="text-gray-400">(optional)</span></label>
                <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)}
                  className="input" placeholder="https://track.example.com/..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-50">
                  {mutation.isPending ? 'Saving…' : 'Update Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, page],
    queryFn: () => adminApi.getOrders({ search: search || undefined, status: statusFilter || undefined, page, limit: 20 }),
    select: d => d.data,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  const statusCounts = orders.reduce((acc: Record<string, number>, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination?.total || 0} orders total</p>
        </div>
      </div>

      {/* Quick status filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => { setStatusFilter(''); setPage(1); }}
          className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border-2 transition-all',
            !statusFilter ? 'border-accent bg-accent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
          All Orders
        </button>
        {STATUS_OPTIONS.slice(0, 6).map(s => (
          <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border-2 transition-all flex items-center gap-1.5',
              statusFilter === s.value ? 'border-accent bg-accent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order #, customer name or email…"
            className="input pl-9 py-2.5 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                </td></tr>
              )) : orders.map((order: any) => {
                const cfg = ORDER_STATUS_CONFIG[order.status as OrderStatus];
                return (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-accent">#{order.order_number}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-800">{order.customer?.name || 'Guest'}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{order.customer?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{order.item_count} item(s)</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold">{formatCurrency(order.total)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 capitalize">{order.payment_method}</span>
                        <span className={cn('badge text-[10px]',
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('badge text-[10px]', cfg?.bgColor, cfg?.color)}>{cfg?.label}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-4">
                      <button onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                        className="p-1.5 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-gray-400">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No orders found</p>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
