'use client';
import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Mail, Phone, ShoppingBag, TrendingUp, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => adminApi.getCustomers({ search: search || undefined, page, limit: 20 }),
    select: d => d.data,
  });

  const customers = data?.data || [];
  const pagination = data?.pagination;

  const totalSpent = customers.reduce((s: number, c: any) => s + parseFloat(c.total_spent || 0), 0);
  const avgOrders = customers.length
    ? (customers.reduce((s: number, c: any) => s + parseInt(c.order_count || 0), 0) / customers.length).toFixed(1)
    : '0';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination?.total || 0} registered customers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Customers', value: pagination?.total?.toLocaleString() || '0', icon: <Users size={18} className="text-accent" />, bg: 'bg-accent/10' },
          { label: 'Active Customers', value: customers.filter((c: any) => c.is_active).length, icon: <UserCheck size={18} className="text-green-500" />, bg: 'bg-green-50' },
          { label: 'Avg. Orders/Customer', value: avgOrders, icon: <ShoppingBag size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Total Revenue', value: formatCurrency(totalSpent), icon: <TrendingUp size={18} className="text-purple-500" />, bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>
              {s.icon}
            </div>
            <p className="font-display text-xl font-bold text-primary-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…" className="input pl-9 py-2.5 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Customer', 'Contact', 'Orders', 'Total Spent', 'Status', 'Joined', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : customers.map((c: any) => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                          {c.is_email_verified && (
                            <p className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
                              <UserCheck size={9} /> Verified
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail size={11} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone size={11} className="text-gray-400 flex-shrink-0" />{c.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full"
                            style={{ width: `${Math.min((parseInt(c.order_count) / 10) * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{c.order_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-accent">{formatCurrency(c.total_spent || 0)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('badge text-[10px]',
                        c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                        {c.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <ChevronDown size={14} className={cn('transition-transform', expanded === c.id && 'rotate-180')} />
                      </button>
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr key={`${c.id}-exp`} className="bg-gray-50/50">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Last Login</p>
                            <p className="font-medium">{c.last_login ? formatDateTime(c.last_login) : 'Never'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Member Since</p>
                            <p className="font-medium">{formatDate(c.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Average Order Value</p>
                            <p className="font-medium">
                              {c.order_count > 0 ? formatCurrency(c.total_spent / c.order_count) : '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {customers.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Users size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No customers found</p>
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
    </div>
  );
}
