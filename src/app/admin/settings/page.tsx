'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  User, Lock, Bell, Store, Shield,
  Eye, EyeOff, Check, AlertTriangle
} from 'lucide-react';

type Tab = 'profile' | 'password' | 'store' | 'notifications';

export default function AdminSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [store, setStore] = useState({
    name: 'TrendsVault',
    tagline: "Kenya's #1 Online Store",
    email: 'support@trendsvault.co.ke',
    phone: '+254 700 000 000',
    address: 'Westlands, Nairobi, Kenya',
    currency: 'KES',
    free_shipping_threshold: '3000',
    shipping_fee: '300',
    tax_rate: '0',
    low_stock_threshold: '10',
  });
  const [notifications, setNotifications] = useState({
    new_order: true,
    payment_received: true,
    order_shipped: true,
    order_delivered: false,
    low_stock: true,
    new_customer: false,
    daily_report: true,
    weekly_summary: true,
  });

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateProfile(profile),
    onSuccess: (res) => {
      updateUser(res.data.data);
      setSaved('profile');
      setTimeout(() => setSaved(null), 2000);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (passwords.newPassword !== passwords.confirmPassword)
        throw new Error('Passwords do not match');
      if (passwords.newPassword.length < 8)
        throw new Error('Password must be at least 8 characters');
      return authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) =>
      toast.error(e.message || e.response?.data?.message || 'Failed to change password'),
  });

  const pwdStrength = () => {
    const p = passwords.newPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'password', label: 'Security', icon: <Lock size={16} /> },
    { id: 'store', label: 'Store', icon: <Store size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

  const NOTIFICATION_SETTINGS = [
    { key: 'new_order', label: 'New Order Placed', desc: 'When a customer places an order', critical: true },
    { key: 'payment_received', label: 'Payment Received', desc: 'When payment is confirmed', critical: true },
    { key: 'order_shipped', label: 'Order Shipped', desc: 'When order status changes to shipped' },
    { key: 'order_delivered', label: 'Order Delivered', desc: 'When an order is marked as delivered' },
    { key: 'low_stock', label: 'Low Stock Alert', desc: 'When product falls below threshold', critical: true },
    { key: 'new_customer', label: 'New Registration', desc: 'When a new customer registers' },
    { key: 'daily_report', label: 'Daily Sales Report', desc: 'Daily sales summary email' },
    { key: 'weekly_summary', label: 'Weekly Summary', desc: 'Weekly performance digest' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and store preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <div className="card p-2 h-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all',
                tab === t.id ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-50'
              )}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card p-6">

          {/* PROFILE */}
          {tab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <User size={20} className="text-accent" />
                <h2 className="font-bold text-lg">Profile Information</h2>
              </div>

              <div className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-orange-400 rounded-2xl flex items-center justify-center text-white font-display text-3xl font-bold flex-shrink-0">
                  {user?.name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="badge bg-accent/10 text-accent text-[10px]">Administrator</span>
                    {user?.is_email_verified && (
                      <span className="badge bg-green-100 text-green-700 text-[10px]">✓ Verified</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="input"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                  <input
                    value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className="input"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <input
                  value={user?.email || ''}
                  disabled
                  className="input bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Contact support to change your email</p>
              </div>

              <button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
                className="btn-primary flex items-center gap-2">
                {saved === 'profile'
                  ? <><Check size={15} /> Saved!</>
                  : profileMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* SECURITY */}
          {tab === 'password' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={20} className="text-accent" />
                <h2 className="font-bold text-lg">Security</h2>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3 text-sm text-blue-700">
                <Shield size={16} className="flex-shrink-0 mt-0.5" />
                Use a strong password with at least 8 characters including uppercase, numbers, and symbols.
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                    className="input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={passwords.newPassword}
                    onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                    className="input pr-10"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwords.newPassword && (
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
                <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                  className="input"
                  placeholder="Re-enter new password"
                />
                {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> Passwords do not match
                  </p>
                )}
              </div>

              <button
                onClick={() => passwordMutation.mutate()}
                disabled={
                  passwordMutation.isPending ||
                  !passwords.currentPassword ||
                  !passwords.newPassword ||
                  passwords.newPassword !== passwords.confirmPassword
                }
                className="btn-primary disabled:opacity-50">
                {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          )}

          {/* STORE */}
          {tab === 'store' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Store size={20} className="text-accent" />
                <h2 className="font-bold text-lg">Store Settings</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Store Name', placeholder: 'TrendsVault' },
                  { key: 'tagline', label: 'Tagline', placeholder: "Kenya's #1 Online Store" },
                  { key: 'email', label: 'Support Email', placeholder: 'support@trendsvault.co.ke', type: 'email' },
                  { key: 'phone', label: 'Support Phone', placeholder: '+254 700 000 000' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={(store as any)[f.key]}
                      onChange={e => setStore(s => ({ ...s, [f.key]: e.target.value }))}
                      className="input"
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Store Address</label>
                  <input
                    value={store.address}
                    onChange={e => setStore(s => ({ ...s, address: e.target.value }))}
                    className="input"
                    placeholder="Westlands, Nairobi, Kenya"
                  />
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="font-semibold text-sm mb-4">Pricing & Shipping</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Currency</label>
                    <select
                      value={store.currency}
                      onChange={e => setStore(s => ({ ...s, currency: e.target.value }))}
                      className="input">
                      <option value="KES">KES — Kenyan Shilling</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Free Shipping Over</label>
                    <input
                      type="number"
                      value={store.free_shipping_threshold}
                      onChange={e => setStore(s => ({ ...s, free_shipping_threshold: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Shipping Fee (KES)</label>
                    <input
                      type="number"
                      value={store.shipping_fee}
                      onChange={e => setStore(s => ({ ...s, shipping_fee: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Low Stock At</label>
                    <input
                      type="number"
                      value={store.low_stock_threshold}
                      onChange={e => setStore(s => ({ ...s, low_stock_threshold: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSaved('store');
                  setTimeout(() => setSaved(null), 2000);
                  toast.success('Store settings saved!');
                }}
                className="btn-primary flex items-center gap-2">
                {saved === 'store' ? <><Check size={15} /> Saved!</> : 'Save Settings'}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={20} className="text-accent" />
                <h2 className="font-bold text-lg">Email Notifications</h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Notifications sent to <strong>{user?.email}</strong>
              </p>

              <div className="space-y-1">
                {NOTIFICATION_SETTINGS.map(n => (
                  <div
                    key={n.key}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                        {n.critical && (
                          <span className="badge bg-red-100 text-red-600 text-[9px]">Important</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({
                        ...prev,
                        [n.key]: !prev[n.key as keyof typeof prev],
                      }))}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4',
                        notifications[n.key as keyof typeof notifications] ? 'bg-accent' : 'bg-gray-200'
                      )}>
                      <span className={cn(
                        'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                        notifications[n.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                      )} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setSaved('notif');
                  setTimeout(() => setSaved(null), 2000);
                  toast.success('Notification preferences saved!');
                }}
                className="btn-primary flex items-center gap-2 mt-4">
                {saved === 'notif' ? <><Check size={15} /> Saved!</> : 'Save Preferences'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
