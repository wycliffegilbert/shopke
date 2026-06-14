'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, X, Copy, ToggleLeft, ToggleRight, Percent, DollarSign, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Coupon } from '@/types';

function CouponModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage',
    discount_value: '', min_order_amount: '0',
    max_discount_amount: '', usage_limit: '', user_limit: '1',
    starts_at: '', expires_at: '', is_active: true,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    set('code', Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
  };

  const mutation = useMutation({
    mutationFn: () => adminApi.createCoupon({
      code: form.code.toUpperCase(),
      description: form.description,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      user_limit: parseInt(form.user_limit) || 1,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created!');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create coupon'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg">Create Coupon</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Coupon Code *</label>
            <div className="flex gap-2">
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                className="input font-mono tracking-widest uppercase flex-1" placeholder="e.g. SAVE20" />
              <button type="button" onClick={generateCode}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 whitespace-nowrap transition-colors">
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              className="input" placeholder="e.g. Welcome discount — 20% off first order" />
          </div>

          {/* Discount type toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Discount Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'percentage', label: 'Percentage', icon: <Percent size={16} />, example: '20%' },
                { value: 'fixed', label: 'Fixed Amount', icon: <DollarSign size={16} />, example: 'KES 500' },
              ].map(t => (
                <button key={t.value} type="button" onClick={() => set('discount_type', t.value)}
                  className={cn('flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    form.discount_type === t.value ? 'border-accent bg-orange-50' : 'border-gray-200 hover:border-gray-300')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                    form.discount_type === t.value ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500')}>
                    {t.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-gray-400">e.g. {t.example}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Value * {form.discount_type === 'percentage' ? '(%)' : '(KES)'}
              </label>
              <input type="number" value={form.discount_value}
                onChange={e => set('discount_value', e.target.value)}
                className="input" placeholder={form.discount_type === 'percentage' ? '20' : '500'} min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Min. Order (KES)</label>
              <input type="number" value={form.min_order_amount}
                onChange={e => set('min_order_amount', e.target.value)}
                className="input" placeholder="0" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Discount (KES)</label>
              <input type="number" value={form.max_discount_amount}
                onChange={e => set('max_discount_amount', e.target.value)}
                className="input" placeholder="No limit" min="0" />
              <p className="text-xs text-gray-400 mt-1">Cap for % discounts</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Per User Limit</label>
              <input type="number" value={form.user_limit}
                onChange={e => set('user_limit', e.target.value)}
                className="input" placeholder="1" min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Total Usage Limit</label>
              <input type="number" value={form.usage_limit}
                onChange={e => set('usage_limit', e.target.value)}
                className="input" placeholder="Unlimited" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Expiry Date</label>
              <input type="datetime-local" value={form.expires_at}
                onChange={e => set('expires_at', e.target.value)} className="input" />
            </div>
          </div>

          {/* Preview */}
          {form.code && form.discount_value && (
            <div className="bg-gradient-to-r from-accent to-orange-400 rounded-2xl p-4 text-white text-center">
              <p className="text-xs text-white/70 mb-1">Preview</p>
              <p className="font-mono font-bold text-2xl tracking-widest">{form.code}</p>
              <p className="text-lg font-semibold mt-1">
                {form.discount_type === 'percentage' ? `${form.discount_value}% OFF` : `KES ${form.discount_value} OFF`}
              </p>
              {parseFloat(form.min_order_amount) > 0 && (
                <p className="text-xs text-white/70 mt-1">Min order: KES {form.min_order_amount}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => set('is_active', !form.is_active)}
              className={cn('text-2xl transition-colors', form.is_active ? 'text-accent' : 'text-gray-300')}>
              {form.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
            <div>
              <p className="text-sm font-medium">{form.is_active ? 'Active' : 'Inactive'}</p>
              <p className="text-xs text-gray-400">Coupon can be used immediately</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.code || !form.discount_value}
            className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? 'Creating…' : 'Create Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons(),
    select: d => d.data.data,
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const now = new Date();
  const filtered = (coupons || []).filter((c: Coupon) => {
    if (filter === 'active') return c.is_active && (!c.expires_at || new Date(c.expires_at) > now);
    if (filter === 'expired') return !c.is_active || (c.expires_at && new Date(c.expires_at) <= now);
    return true;
  });

  const activeCount = (coupons || []).filter((c: Coupon) => c.is_active && (!c.expires_at || new Date(c.expires_at) > now)).length;
  const totalUses = (coupons || []).reduce((s: number, c: Coupon) => s + (c.used_count || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Coupons & Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">{(coupons || []).length} coupons · {totalUses} total uses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Coupons', value: (coupons || []).length, color: 'text-primary-900' },
          { label: 'Active', value: activeCount, color: 'text-green-600' },
          { label: 'Total Uses', value: totalUses, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={cn('font-display text-3xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[['all', 'All'], ['active', 'Active'], ['expired', 'Expired/Inactive']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as any)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
              filter === v ? 'border-accent bg-accent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Tag size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-500 mb-2">No coupons found</h3>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-2">Create First Coupon</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c: Coupon) => {
            const isExpired = c.expires_at && new Date(c.expires_at) <= now;
            const isActive = c.is_active && !isExpired;
            const usagePct = c.usage_limit ? Math.min((c.used_count / c.usage_limit) * 100, 100) : 0;

            return (
              <div key={c.id} className={cn('card p-5 transition-all hover:shadow-card-hover',
                !isActive && 'opacity-60')}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      isActive ? 'bg-accent/10' : 'bg-gray-100')}>
                      <Tag size={15} className={isActive ? 'text-accent' : 'text-gray-400'} />
                    </div>
                    <code className="font-mono font-bold text-sm tracking-widest text-gray-800">{c.code}</code>
                  </div>
                  <button onClick={() => copyCode(c.code)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Copy size={13} />
                  </button>
                </div>

                {/* Discount badge */}
                <div className={cn('rounded-xl px-4 py-3 mb-3 text-center',
                  isActive ? 'bg-gradient-to-r from-accent to-orange-400' : 'bg-gray-100')}>
                  <p className={cn('font-display text-2xl font-bold', isActive ? 'text-white' : 'text-gray-400')}>
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `KES ${Number(c.discount_value).toLocaleString()} OFF`}
                  </p>
                  {Number(c.min_order_amount) > 0 && (
                    <p className={cn('text-xs mt-0.5', isActive ? 'text-white/70' : 'text-gray-400')}>
                      Min. order {formatCurrency(c.min_order_amount)}
                    </p>
                  )}
                </div>

                {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-1">{c.description}</p>}

                {/* Usage bar */}
                {c.usage_limit && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Usage</span>
                      <span>{c.used_count} / {c.usage_limit}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', usagePct >= 90 ? 'bg-red-400' : 'bg-accent')}
                        style={{ width: `${usagePct}%` }} />
                    </div>
                  </div>
                )}

                {!c.usage_limit && (
                  <p className="text-xs text-gray-400 mb-3">∞ Unlimited uses · {c.used_count} used</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className={cn('badge text-[10px]',
                    isExpired ? 'bg-red-100 text-red-600' :
                    isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {isExpired ? '⏰ Expired' : isActive ? '✅ Active' : '⛔ Inactive'}
                  </span>
                  {c.expires_at && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={9} />
                      {isExpired ? 'Expired' : 'Expires'} {formatDate(c.expires_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <CouponModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
