'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Package, Heart, MapPin, Lock, LogOut, Edit2, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatDate, cn } from '@/lib/utils';

type Tab = 'profile' | 'password' | 'addresses';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth, updateUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [editMode, setEditMode] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated,
    select: d => d.data.data,
  });

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ name, phone }),
    onSuccess: (res) => { updateUser(res.data.data); setEditMode(false); toast.success('Profile updated!'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (passwords.newPwd !== passwords.confirm) throw new Error('Passwords do not match');
      if (passwords.newPwd.length < 8) throw new Error('Password must be at least 8 characters');
      return authApi.changePassword({ currentPassword: passwords.current, newPassword: passwords.newPwd });
    },
    onSuccess: () => {
      toast.success('Password changed!');
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
      <div className="container-pad py-20 text-center">
        <p className="mb-4 text-gray-500">Please sign in to view your account.</p>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  const TABS = [
    { id: 'profile' as Tab, label: 'Profile', icon: <User size={16} /> },
    { id: 'password' as Tab, label: 'Password', icon: <Lock size={16} /> },
    { id: 'addresses' as Tab, label: 'Addresses', icon: <MapPin size={16} /> },
  ];

  const QUICK_LINKS = [
    { label: 'My Orders', href: '/account/orders', icon: <Package size={18} className="text-accent" />, desc: 'Track and view orders' },
    { label: 'Wishlist', href: '/wishlist', icon: <Heart size={18} className="text-red-400" />, desc: 'Saved products' },
  ];

  return (
    <div className="container-pad py-10 max-w-4xl">
      {/* Header */}
      <div className="card p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold font-display">
            {user?.name?.[0]}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user?.is_email_verified ? (
                <span className="badge bg-green-100 text-green-700 text-[10px] flex items-center gap-1">
                  <Check size={9} /> Verified
                </span>
              ) : (
                <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Unverified</span>
              )}
              <span className="badge bg-gray-100 text-gray-500 text-[10px]">Member since {formatDate(user?.created_at || '')}</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium">
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {QUICK_LINKS.map(l => (
          <Link key={l.href} href={l.href} className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              {l.icon}
            </div>
            <div>
              <p className="font-semibold text-sm">{l.label}</p>
              <p className="text-xs text-gray-400">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Settings Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="max-w-md space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Personal Information</h3>
                <button onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1.5 text-sm text-accent font-medium">
                  <Edit2 size={13} /> {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input value={editMode ? name : (user?.name || '')}
                  onChange={e => setName(e.target.value)}
                  disabled={!editMode} className={cn('input', !editMode && 'bg-gray-50 text-gray-500 cursor-default')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <input value={user?.email || ''} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                <input value={editMode ? phone : (user?.phone || '')}
                  onChange={e => setPhone(e.target.value)}
                  disabled={!editMode} placeholder="e.g. 0712 345 678"
                  className={cn('input', !editMode && 'bg-gray-50 text-gray-500 cursor-default')} />
              </div>
              {editMode && (
                <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary">
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              )}
            </div>
          )}

          {/* Password Tab */}
          {tab === 'password' && (
            <div className="max-w-md space-y-4">
              <h3 className="font-semibold mb-4">Change Password</h3>
              <div>
                <label className="block text-sm font-medium mb-1.5">Current Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                    className="input pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={passwords.newPwd}
                    onChange={e => setPasswords(p => ({ ...p, newPwd: e.target.value }))}
                    className="input pr-10" placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <input type="password" value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  className="input" placeholder="Re-enter new password" />
                {passwords.newPwd && passwords.confirm && passwords.newPwd !== passwords.confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <button onClick={() => passwordMutation.mutate()}
                disabled={passwordMutation.isPending || !passwords.current || !passwords.newPwd}
                className="btn-primary disabled:opacity-50">
                {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          )}

          {/* Addresses Tab */}
          {tab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Saved Addresses</h3>
              </div>
              {(profile?.addresses || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm">No saved addresses yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Addresses are saved when you place an order.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(profile?.addresses || []).map((addr: any) => (
                    <div key={addr.id} className={cn('p-4 rounded-xl border-2 transition-all',
                      addr.is_default ? 'border-accent bg-orange-50/50' : 'border-gray-200')}>
                      {addr.is_default && <span className="badge bg-accent text-white text-[10px] mb-2">Default</span>}
                      <p className="font-semibold text-sm">{addr.full_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-sm text-gray-600">{addr.address_line2}</p>}
                      <p className="text-sm text-gray-600">{addr.city}, {addr.county}</p>
                      <p className="text-sm text-gray-500">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
