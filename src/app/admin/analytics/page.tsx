'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

const COLORS = ['#F97316', '#0F172A', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-600 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name === 'revenue' ? formatCurrency(p.value) : p.value} {p.name}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
    select: d => d.data.data,
    staleTime: 60000,
  });

  const m = dashboard?.metrics;

  const salesChart = (dashboard?.sales_chart || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(d.revenue || 0),
    orders: parseInt(d.orders || 0),
  }));

  const displayChart = period === '7' ? salesChart.slice(-7)
    : period === '90' ? salesChart
    : salesChart.slice(-30);

  const topProducts = (dashboard?.top_products || []).slice(0, 6);
  const maxSold = topProducts[0]?.sold_count || 1;

  const pieData = topProducts.slice(0, 5).map((p: any, i: number) => ({
    name: p.name?.split(' ').slice(0, 2).join(' '),
    value: p.sold_count || 0,
  }));

  const statCards = [
    {
      label: 'Total Revenue', value: formatCurrency(m?.total_sales || 0),
      sub: `${formatCurrency(m?.monthly_sales || 0)} this month`,
      icon: <TrendingUp size={20} />, color: 'text-accent', bg: 'bg-accent/10',
      trend: m?.sales_growth, up: (m?.sales_growth || 0) >= 0,
    },
    {
      label: 'Total Orders', value: (m?.total_orders || 0).toLocaleString(),
      sub: `${m?.this_month_orders || 0} this month`,
      icon: <ShoppingBag size={20} />, color: 'text-blue-500', bg: 'bg-blue-50',
    },
    {
      label: 'Total Customers', value: (m?.total_customers || 0).toLocaleString(),
      sub: `+${m?.new_customers || 0} new`,
      icon: <Users size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50',
    },
    {
      label: 'Total Products', value: (m?.total_products || 0).toLocaleString(),
      sub: `${m?.low_stock_count || 0} low stock`,
      icon: <Package size={20} />, color: 'text-purple-500', bg: 'bg-purple-50',
    },
  ];

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
      </div>
      <div className="card h-72 animate-pulse" />
      <div className="grid grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Store performance overview</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg, s.color)}>
                {s.icon}
              </div>
              {s.trend !== undefined && (
                <span className={cn('flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full',
                  s.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                  {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(s.trend || 0).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="font-display text-2xl font-bold text-primary-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-800">Revenue Over Time</h3>
            <p className="text-xs text-gray-400 mt-0.5">Daily revenue trend</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[['7', '7D'], ['30', '30D'], ['90', '90D']].map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v as any)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  period === v ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={displayChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#F97316"
              strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#F97316' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders bar chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Daily Orders</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={displayChart.slice(-14)} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="orders" fill="#0F172A" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Top Products by Sales</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={80}
                    dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                    {pieData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} sold`, '']}
                    contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {pieData.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                    <p className="text-xs text-gray-700 flex-1 truncate">{d.name}</p>
                    <p className="text-xs font-bold text-gray-500">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No sales data yet</div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 mb-5">Best Selling Products</h3>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No sales data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Rank', 'Product', 'Units Sold', 'Unit Price', 'Est. Revenue'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5">
                      <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        i === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400')}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3.5 text-sm font-medium text-gray-800 max-w-[220px] truncate">{p.name}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full"
                            style={{ width: `${((p.sold_count || 0) / maxSold) * 100}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{p.sold_count || 0}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-sm text-gray-500">{formatCurrency(p.price)}</td>
                    <td className="py-3.5 text-sm font-bold text-accent">
                      {formatCurrency((p.sold_count || 0) * parseFloat(p.price))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
