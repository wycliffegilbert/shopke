'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ChevronDown, Eye, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG, cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import Link from 'next/link';

const STATUS_OPTIONS: OrderStatus[] = ['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','refunded'];

function UpdateStatusModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || '');

  const mutation = useMutation({
    mutationFn: () => adminApi.updateOrderStatus(order.id, { status, tracking_number: tracking || undefined, tracking_url: trackingUrl || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
      onClose();
    },
    onError: () => toast.error('Failed to update order'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Update Order #{order.order_number}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className="input">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tracking Number <span className="text-gray-400">(optional)</span></label>
            <input value={tracking} onChange={e => setTracking(e.target.value)} className="input" placeholder="e.g. KE1234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tracking URL <span className="text-gray-400">(optional)</span></label>
            <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} className="input" placeholder="https://track.example.com/..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Updating…' : 'Update Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, page],
    queryFn: () => adminApi.getOrders({ search: search || undefined, status: statusFilter || undefined, page, limit: 20 }),
    select: d => d.data,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-accent hover:underline">← Dashboard</Link>
            <h1 className="font-display text-2xl font-bold">Orders</h1>
            {pagination && <span className="badge bg-gray-100 text-gray-600 text-xs">{pagination.total} total</span>}
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order #, customer name or email…"
              className="input pl-9 py-2.5 text-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input py-2.5 text-sm w-auto min-w-[160px]">
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{ORDER_STATUS_CONFIG[s].label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? [...Array(6)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                )) : orders.map((order: any) => {
                  const cfg = ORDER_STATUS_CONFIG[order.status as OrderStatus];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-accent">#{order.order_number}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">{order.customer?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-400">{order.customer?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{order.item_count} item(s)</td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('badge text-[10px]',
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                          order.payment_status === 'refunded' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700')}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('badge text-[10px]', cfg?.bgColor, cfg?.color)}>{cfg?.label}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditOrder(order)}
                            className="p-1.5 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-gray-400">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && !isLoading && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">No orders found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editOrder && <UpdateStatusModal order={editOrder} onClose={() => setEditOrder(null)} />}
    </div>
  );
}
