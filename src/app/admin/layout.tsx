'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, ListOrdered, Box, FolderOpen,
  Users, Tag, BarChart2, Settings, Menu, X,
  LogOut, Store, Bell, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  href: '/admin' },
  { icon: ListOrdered,     label: 'Orders',     href: '/admin/orders' },
  { icon: Box,             label: 'Products',   href: '/admin/products' },
  { icon: FolderOpen,      label: 'Categories', href: '/admin/categories' },
  { icon: Users,           label: 'Customers',  href: '/admin/customers' },
  { icon: Tag,             label: 'Coupons',    href: '/admin/coupons' },
  { icon: BarChart2,       label: 'Analytics',  href: '/admin/analytics' },
  { icon: Settings,        label: 'Settings',   href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    toast.success('Logged out');
    router.push('/');
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center card p-10">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6">You need admin privileges to access this page.</p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 bg-primary-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <Link href="/" className="font-display text-xl font-bold">
            Shop<span className="text-accent">KE</span>
            <span className="text-xs text-gray-400 font-sans font-normal ml-1">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-accent text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                )}>
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/10 space-y-1 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all">
            <Store size={17} /> View Store
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu size={18} />
            </button>
            <h1 className="font-semibold text-gray-800 text-sm">
              {NAV_ITEMS.find(n => n.href === pathname)?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell size={17} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
