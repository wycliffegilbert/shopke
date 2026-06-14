'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG, cn } from '@/lib/utils';

function MetricCard({ label, value, sub, icon, trend, trendUp }: any) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">{icon}</div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            trendUp ? 'bg-green-100 text-emerald-600' : 'bg-red-100 text-red-500')}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="font-display text-2xl font-bold text-primary-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { isAuthenticated, user } = useAuthStore();

  const { data: dashboard, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
    select: d => d.data.data,
    enabled: isAuthenticated && user?.role === 'admin',
    retry: 1,
    staleTime: 30000,
  });

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center card p-10">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold mb-2">Failed to load dashboard</h2>
          <p className="text-sm text-gray-500 mb-5">Make sure your backend is running on port 5000</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  const m = dashboard?.metrics;
  const salesChartData = (dashboard?.sales_chart || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(d.revenue || 0),
    orders: parseInt(d.orders || 0),
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-72 animate-pulse" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Sales" value={formatCurrency(m?.total_sales || 0)}
              sub={`${formatCurrency(m?.monthly_sales || 0)} this month`}
              icon={<TrendingUp size={18} className="text-accent" />}
              trend={m?.sales_growth} trendUp={(m?.sales_growth || 0) >= 0} />
            <MetricCard label="Total Orders" value={(m?.total_orders || 0).toLocaleString()}
              sub={`${m?.pending_orders || 0} pending`}
              icon={<ShoppingBag size={18} className="text-accent" />} />
            <MetricCard label="Customers" value={(m?.total_customers || 0).toLocaleString()}
              sub={`+${m?.new_customers || 0} this month`}
              icon={<Users size={18} className="text-accent" />} />
            <MetricCard label="Products" value={(m?.total_products || 0).toLocaleString()}
              sub={`${m?.low_stock_count || 0} low stock`}
              icon={<Package size={18} className="text-accent" />} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold">Revenue — Last 30 Days</h3>
                <Link href="/admin/analytics" className="text-xs text-accent hover:underline">Full analytics →</Link>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} fill="url(#rg)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold mb-5">Daily Orders</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesChartData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#0F172A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Orders</h3>
                <Link href="/admin/orders" className="text-xs text-accent hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {(dashboard?.recent_orders || []).slice(0, 7).map((order: any) => {
                  const cfg = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG];
                  return (
                    <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-accent">#{order.order_number}</p>
                          <span className={cn('badge text-[10px]', cfg?.bgColor, cfg?.color)}>{cfg?.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{order.customer_name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold">{formatCurrency(order.total)}</p>
                        <p className="text-[10px] text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                {!dashboard?.recent_orders?.length && (
                  <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
                )}
              </div>
            </div>

            {/* Top Products + Low Stock */}
            <div className="space-y-5">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Top Products</h3>
                  <Link href="/admin/products" className="text-xs text-accent hover:underline">Manage →</Link>
                </div>
                <div className="space-y-3">
                  {(dashboard?.top_products || []).slice(0, 4).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.sold_count || 0} sold</p>
                      </div>
                      <p className="text-xs font-bold text-gray-700">{formatCurrency(p.price)}</p>
                    </div>
                  ))}
                  {!dashboard?.top_products?.length && (
                    <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
                  )}
                </div>
              </div>

              {(dashboard?.low_stock_products || []).length > 0 && (
                <div className="card p-5 border-orange-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={15} className="text-orange-500" />
                    <h3 className="font-semibold text-sm text-orange-700">Low Stock Alert</h3>
                  </div>
                  <div className="space-y-2">
                    {(dashboard?.low_stock_products || []).slice(0, 4).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate flex-1">{p.name}</span>
                        <span className={cn('font-bold ml-2', p.stock_quantity === 0 ? 'text-red-500' : 'text-orange-500')}>
                          {p.stock_quantity} left
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link href="/admin/products" className="text-xs text-accent hover:underline mt-3 block">
                    Manage inventory →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
