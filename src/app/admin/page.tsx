'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, LayoutDashboard, ListOrdered, Box, Tag, BarChart2, Settings, Menu, X } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatCurrency, formatDate, ORDER_STATUS_CONFIG, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: ListOrdered, label: 'Orders', href: '/admin/orders' },
  { icon: Box, label: 'Products', href: '/admin/products' },
  { icon: Package, label: 'Categories', href: '/admin/categories' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { icon: BarChart2, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

function MetricCard({ label, value, sub, icon, trend, trendUp }: any) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">{icon}</div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold', trendUp ? 'text-emerald-600' : 'text-red-500')}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(trend)}%
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
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
    select: d => d.data.data,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const m = dashboard?.metrics;
  const salesChartData = (dashboard?.sales_chart || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(d.revenue),
    orders: parseInt(d.orders),
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 bg-primary-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold">Shop<span className="text-accent">KE</span></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
              <item.icon size={17} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Nav */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu size={18} /></button>
            <h1 className="font-display text-lg font-bold text-primary-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Welcome, {user.name?.split(' ')[0]}</span>
            <Link href="/" className="text-xs text-accent hover:underline">← Store</Link>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Sales" value={formatCurrency(m?.total_sales || 0)}
                  sub={`${formatCurrency(m?.monthly_sales || 0)} this month`}
                  icon={<TrendingUp size={18} className="text-accent" />}
                  trend={m?.sales_growth} trendUp={m?.sales_growth >= 0} />
                <MetricCard label="Total Orders" value={m?.total_orders?.toLocaleString()}
                  sub={`${m?.pending_orders} pending`}
                  icon={<ShoppingBag size={18} className="text-accent" />} />
                <MetricCard label="Customers" value={m?.total_customers?.toLocaleString()}
                  sub={`+${m?.new_customers} this month`}
                  icon={<Users size={18} className="text-accent" />} />
                <MetricCard label="Products" value={m?.total_products?.toLocaleString()}
                  sub={`${m?.low_stock_count} low stock`}
                  icon={<Package size={18} className="text-accent" />} />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card p-6 lg:col-span-2">
                  <h3 className="font-semibold text-sm mb-5">Revenue — Last 30 Days</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={salesChartData}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                        tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-sm mb-5">Daily Orders</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={salesChartData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                      <Bar dataKey="orders" fill="#0F172A" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Recent Orders</h3>
                    <Link href="/admin/orders" className="text-xs text-accent hover:underline">View all →</Link>
                  </div>
                  <div className="space-y-3">
                    {(dashboard?.recent_orders || []).slice(0, 6).map((order: any) => {
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
                  </div>
                </div>

                {/* Top Products + Low Stock */}
                <div className="space-y-6">
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Top Products</h3>
                      <Link href="/admin/products" className="text-xs text-accent hover:underline">Manage →</Link>
                    </div>
                    <div className="space-y-3">
                      {(dashboard?.top_products || []).slice(0, 4).map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{p.sold_count} sold</p>
                          </div>
                          <p className="text-xs font-bold flex-shrink-0">{formatCurrency(p.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(dashboard?.low_stock_products || []).length > 0 && (
                    <div className="card p-6 border-red-100">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={16} className="text-orange-500" />
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
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
