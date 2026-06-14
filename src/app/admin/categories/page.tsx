'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, X, FolderOpen, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

const EMOJI_MAP: Record<string, string> = {
  electronics: '📱', fashion: '👗', 'home-kitchen': '🏠',
  'beauty-health': '💄', sports: '⚽', 'books-media': '📚',
  default: '🗂️',
};

const EMOJI_OPTIONS = ['📱','💻','⌚','🎧','👗','👟','🏠','🛋️','💄','🧴','⚽','🎮','📚','🎵','🛒','🎁','🍳','🌿'];

function CategoryModal({ category, onClose }: { category?: Category; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    image: category?.image || '',
    sort_order: category?.sort_order ?? 0,
    is_active: category?.is_active ?? true,
  });
  const [selectedEmoji, setSelectedEmoji] = useState(
    category?.slug ? (EMOJI_MAP[category.slug] || '🗂️') : '📦'
  );
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => category
      ? adminApi.updateCategory(category.id, form)
      : adminApi.createCategory({ ...form, emoji: selectedEmoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(category ? 'Category updated!' : 'Category created!');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg">{category ? 'Edit Category' : 'New Category'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Emoji picker */}
          {!category && (
            <div>
              <label className="block text-sm font-medium mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} type="button" onClick={() => setSelectedEmoji(e)}
                    className={cn('w-10 h-10 text-xl rounded-xl border-2 flex items-center justify-center transition-all',
                      selectedEmoji === e ? 'border-accent bg-orange-50 scale-110' : 'border-gray-200 hover:border-gray-300')}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Category Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="input" placeholder="e.g. Electronics" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input resize-none" rows={2} placeholder="Brief description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Sort Order</label>
              <input type="number" value={form.sort_order}
                onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
                className="input" min="0" />
            </div>
            <div className="flex items-end pb-1">
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 w-full transition-all border-gray-200 hover:border-accent">
                {form.is_active
                  ? <ToggleRight size={22} className="text-accent" />
                  : <ToggleLeft size={22} className="text-gray-400" />}
                <span className="text-sm font-medium">{form.is_active ? 'Active' : 'Inactive'}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name}
            className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : category ? 'Update' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [modal, setModal] = useState<Category | 'new' | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories(),
    select: d => d.data.data,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.updateCategory(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category updated');
    },
  });

  const activeCount = (categories || []).filter((c: Category) => c.is_active).length;
  const totalProducts = (categories || []).reduce((s: number, c: Category) => s + (c.product_count || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{(categories || []).length} categories · {totalProducts} products total</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Categories', value: (categories || []).length, color: 'bg-accent/10 text-accent' },
          { label: 'Active', value: activeCount, color: 'bg-green-100 text-green-700' },
          { label: 'Inactive', value: (categories || []).length - activeCount, color: 'bg-gray-100 text-gray-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg', s.color)}>
              {s.value}
            </div>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-36 animate-pulse" />)}
        </div>
      ) : (categories || []).length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpen size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-500 mb-2">No categories yet</h3>
          <button onClick={() => setModal('new')} className="btn-primary mt-2">Create First Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories || []).map((cat: Category) => (
            <div key={cat.id} className={cn(
              'card p-5 transition-all hover:shadow-card-hover group',
              !cat.is_active && 'opacity-60'
            )}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                    {EMOJI_MAP[cat.slug] || EMOJI_MAP.default}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{cat.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                  </div>
                </div>
              </div>

              {cat.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cat.description}</p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-display font-bold text-xl text-gray-800">{cat.product_count || 0}</p>
                  <p className="text-[10px] text-gray-400">Products</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-display font-bold text-xl text-gray-800">#{cat.sort_order}</p>
                  <p className="text-[10px] text-gray-400">Sort Order</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className={cn('w-2.5 h-2.5 rounded-full mx-auto mb-1', cat.is_active ? 'bg-green-500' : 'bg-gray-300')} />
                  <p className="text-[10px] text-gray-400">{cat.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => setModal(cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:border-accent hover:text-accent transition-colors">
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => toggleMutation.mutate({ id: cat.id, is_active: !cat.is_active })}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl border transition-colors',
                    cat.is_active ? 'border-gray-200 hover:border-red-300 hover:text-red-500' : 'border-green-200 text-green-600 hover:bg-green-50')}>
                  {cat.is_active ? <><ToggleLeft size={13} /> Disable</> : <><ToggleRight size={13} /> Enable</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <CategoryModal
          category={modal === 'new' ? undefined : modal as Category}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
