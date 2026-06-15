'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  User, Package, Heart, MapPin, Lock, LogOut,
  Edit2, Eye, EyeOff, Check, Shield, ChevronRight,
  Bell, CreditCard, Star, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { authApi, orderApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

type Tab = 'profile' | 'password' | 'addresses';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth, updateUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [editMode, setEditMode] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated,
    select: d => d.data.data,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => orderApi.getAll({ limit: 3 }),
    enabled: isAuthenticated,
    select: d => d.data.data,
  });

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ name, phone }),
    onSuccess: (res) => {
      updateUser(res.data.data);
      setEditMode(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (passwords.newPwd !== passwords.confirm) throw new Error('Passwords do not match');
      if (passwords.newPwd.length < 8) throw new Error('Password must be at least 8 characters');
      return authApi.changePassword({ currentPassword: passwords.current, newPassword: passwords.newPwd });
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPasswords({ current: '', newPwd: '', confirm: '' });
    },
    onError: (e: any) => toast.error(e.message || e.response?.data?.message || 'Failed'),
  });

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    toast.success('Logged out');
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="container-pad py-24 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <User size={36} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-800">Sign in to your account</h2>
        <p className="text-gray-500 text-sm mb-6">View your orders, manage your profile and more.</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/auth/login" className="btn-primary text-center py-3">Sign In</Link>
          <Link href="/auth/register" className="btn-secondary text-center py-3">Create Account</Link>
        </div>
      </div>
    );
  }

  const pwdStrength = () => {
    const p = passwords.newPwd;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const TABS = [
    { id: 'profile' as Tab, label: 'Profile', icon: <User size={15} /> },
    { id: 'password' as Tab, label: 'Security', icon: <Shield size={15} /> },
    { id: 'addresses' as Tab, label: 'Addresses', icon: <MapPin size={15} /> },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container-pad py-8 max-w-5xl">

        {/* Profile Header Card */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-orange-400 rounded-2xl flex items-center justify-center text-white font-display text-2xl font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {user?.is_email_verified ? (
                    <span className="badge bg-green-100 text-green-700 text-[10px] flex items-center gap-1">
                      <Check size={9} /> Verified
                    </span>
                  ) : (
                    <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Email unverified</span>
                  )}
                  {user?.phone && (
                    <span className="badge bg-gray-100 text-gray-500 text-[10px]">{user.phone}</span>
                  )}
                  <span className="badge bg-gray-100 text-gray-500 text-[10px]">
                    Member since {formatDate(user?.created_at || '')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Quick Nav */}
            <div className="card p-2">
              {[
                { label: 'My Orders', href: '/account/orders', icon: <ShoppingBag size={17} className="text-accent" />, desc: 'Track & view all orders' },
                { label: 'Wishlist', href: '/wishlist', icon: <Heart size={17} className="text-red-400" />, desc: 'Saved products' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 bg-gray-50 group-hover:bg-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                    {l.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{l.label}</p>
                    <p className="text-xs text-gray-400">{l.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-accent transition-colors" />
                </Link>
              ))}
            </div>

            {/* Recent Orders */}
            {(recentOrders || []).length > 0 && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">Recent Orders</p>
                  <Link href="/account/orders" className="text-xs text-accent hover:underline">View all</Link>
                </div>
                <div className="space-y-2">
                  {(recentOrders || []).slice(0, 3).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-accent">#{order.order_number}</p>
                        <p className="text-[10px] text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{formatCurrency(order.total)}</p>
                        <span className={cn(
                          'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        )}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Settings Card */}
          <div className="card overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors flex-1 justify-center sm:flex-none sm:justify-start',
                    tab === t.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}>
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* PROFILE */}
              {tab === 'profile' && (
                <div className="max-w-md space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Personal Information</h3>
                    <button
                      onClick={() => { setEditMode(!editMode); setName(user?.name || ''); setPhone(user?.phone || ''); }}
                      className="flex items-center gap-1.5 text-sm text-accent font-medium hover:underline">
                      <Edit2 size={13} /> {editMode ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      value={editMode ? name : (user?.name || '')}
                      onChange={e => setName(e.target.value)}
                      disabled={!editMode}
                      className={cn('input', !editMode && 'bg-gray-50 text-gray-600 cursor-default')}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      value={user?.email || ''}
                      disabled
                      className="input bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email address cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      value={editMode ? phone : (user?.phone || '')}
                      onChange={e => setPhone(e.target.value)}
                      disabled={!editMode}
                      placeholder={editMode ? '0712 345 678' : 'Not set'}
                      className={cn('input', !editMode && 'bg-gray-50 text-gray-600 cursor-default')}
                    />
                  </div>

                  {editMode && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending}
                        className="btn-primary flex items-center gap-2">
                        {saved
                          ? <><Check size={15} /> Saved!</>
                          : updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECURITY */}
              {tab === 'password' && (
                <div className="max-w-md space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-accent" />
                    <h3 className="font-semibold text-gray-800">Change Password</h3>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-start gap-2">
                    <Shield size={15} className="flex-shrink-0 mt-0.5" />
                    Use at least 8 characters with uppercase, lowercase, and numbers.
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                        className="input pr-10"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={passwords.newPwd}
                        onChange={e => setPasswords(p => ({ ...p, newPwd: e.target.value }))}
                        className="input pr-10"
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {passwords.newPwd && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                'h-1.5 flex-1 rounded-full transition-all',
                                i < pwdStrength() ? strengthColors[pwdStrength() - 1] : 'bg-gray-100'
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Strength: <span className="font-semibold">{strengthLabels[pwdStrength() - 1] || 'Very Weak'}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      className="input"
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                    {passwords.newPwd && passwords.confirm && passwords.newPwd !== passwords.confirm && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    onClick={() => passwordMutation.mutate()}
                    disabled={
                      passwordMutation.isPending ||
                      !passwords.current ||
                      !passwords.newPwd ||
                      passwords.newPwd !== passwords.confirm
                    }
                    className="btn-primary disabled:opacity-50">
                    {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
                  </button>
                </div>
              )}

              {/* ADDRESSES */}
              {tab === 'addresses' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-gray-800">Saved Addresses</h3>
                  </div>

                  {(profile?.addresses || []).length === 0 ? (
                    <div className="text-center py-14">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MapPin size={28} className="text-gray-300" />
                      </div>
                      <h4 className="font-semibold text-gray-600 mb-1">No addresses saved</h4>
                      <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        Your shipping addresses will appear here after you place an order.
                      </p>
                      <Link href="/products" className="btn-primary mt-5 inline-flex">
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(profile?.addresses || []).map((addr: any) => (
                        <div
                          key={addr.id}
                          className={cn(
                            'p-4 rounded-2xl border-2 transition-all relative',
                            addr.is_default ? 'border-accent bg-orange-50/40' : 'border-gray-200 hover:border-gray-300'
                          )}>
                          {addr.is_default && (
                            <span className="badge bg-accent text-white text-[10px] mb-2 inline-flex">
                              Default
                            </span>
                          )}
                          <div className="space-y-0.5">
                            <p className="font-semibold text-sm text-gray-800">{addr.full_name}</p>
                            <p className="text-sm text-gray-500">{addr.address_line1}</p>
                            {addr.address_line2 && <p className="text-sm text-gray-500">{addr.address_line2}</p>}
                            <p className="text-sm text-gray-500">{addr.city}, {addr.county}</p>
                            <p className="text-sm text-gray-400">{addr.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
