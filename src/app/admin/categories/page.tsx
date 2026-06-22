'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, X, FolderOpen, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

const EMOJI_GROUPS: Record<string, string[]> = {
  'Electronics': ['📱','💻','⌚','🎧','📷','🎮','🖥️','⌨️','📺','🔋','💡','🔌'],
  'Fashion': ['👗','👠','👟','👜','👒','🧥','👔','💍','👓','🧣','🧤','💄'],
  'Home': ['🏠','🛋️','🛏️','🍳','🪴','🕯️','🛁','🚿','🧹','🪞','🖼️','🏺'],
  'Food': ['🍔','☕','🍕','🍰','🥗','🍜','🥤','🍷','🧃','🫖'],
  'Sports': ['⚽','🏋️','🎾','🏊','🚴','🧘','🏀','⚾','🎯','🏆','🥊'],
  'Beauty': ['💄','🧴','🪥','💊','🩺','🌿','🫧','🧖'],
  'Books': ['📚','🎵','🎬','📰','🎙️','📖','🎨','✏️'],
  'Kids': ['🧸','🎠','🪀','🎯','🎲','🧩','👶'],
  'Auto': ['🚗','🏍️','🔧','⛽','🛞','🪛','🔩'],
  'Garden': ['🌱','🌻','🌳','⛺','🏕️','🎣','🌊','🌺'],
  'General': ['🛒','🎁','⭐','🔑','📦','🏷️','💰','🗂️','✨','🌟'],
};
const ALL_EMOJIS = Object.values(EMOJI_GROUPS).flat();

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('General');
  const filtered = search ? ALL_EMOJIS.filter(e => e.includes(search)) : EMOJI_GROUPS[activeGroup] || [];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-2 border-b border-gray-100">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search emoji..." className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-accent" />
      </div>
      {!search && (
        <div className="flex gap-1 px-2 py-1.5 border-b border-gray-100 overflow-x-auto scrollbar-hide">
          {Object.keys(EMOJI_GROUPS).map(g => (
            <button key={g} type="button" onClick={() => setActiveGroup(g)}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                activeGroup === g ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-100')}>
              {g}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-40 overflow-y-auto">
        {filtered.map(emoji => (
          <button key={emoji} type="button" onClick={() => onChange(emoji)}
            className={cn('w-8 h-8 flex items-center justify-center text-xl rounded-lg transition-all hover:bg-gray-100',
              value === emoji && 'bg-accent/20 ring-2 ring-accent scale-110')}>
            {emoji}
          </button>
        ))}
        {filtered.length === 0 && <p className="col-span-8 text-center text-xs text-gray-400 py-4">No emoji found</p>}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ name, onConfirm, onClose, loading }: {
  name: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-bold text-lg text-center mb-2">Delete Category?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Are you sure you want to delete <strong>"{name}"</strong>? Products in this category won't be deleted but will become uncategorized.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Deleting…' : 'Delete Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ category, onClose }: { category?: Category; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    sort_order: category?.sort_order ?? 0,
    is_active: category?.is_active ?? true,
  });
  const [icon, setIcon] = useState((category as any)?.icon || '🗂️');
  const [showPicker, setShowPicker] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => category
      ? adminApi.updateCategory(category.id, { ...form, icon })
      : adminApi.createCategory({ ...form, icon }),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg">{category ? 'Edit Category' : 'New Category'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Category Icon</label>
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={() => setShowPicker(!showPicker)}
                className={cn('w-16 h-16 text-4xl rounded-2xl border-2 flex items-center justify-center transition-all',
                  showPicker ? 'border-accent bg-orange-50' : 'border-gray-200 hover:border-accent hover:bg-orange-50')}>
                {icon}
              </button>
              <div>
                <p className="text-sm font-medium text-gray-700">Selected: <span className="font-bold">{icon}</span></p>
                <p className="text-xs text-gray-400">Click to choose a different icon</p>
              </div>
            </div>
            {showPicker && <EmojiPicker value={icon} onChange={e => { setIcon(e); setShowPicker(false); }} />}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Category Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="e.g. Electronics" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input resize-none" rows={2} placeholder="Brief description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} className="input" min="0" />
            </div>
            <div className="flex items-end pb-1">
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border-2 w-full transition-all',
                  form.is_active ? 'border-accent bg-orange-50' : 'border-gray-200 hover:border-gray-300')}>
                {form.is_active ? <ToggleRight size={22} className="text-accent" /> : <ToggleLeft size={22} className="text-gray-400" />}
                <span className="text-sm font-medium">{form.is_active ? 'Active' : 'Inactive'}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name.trim()}
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
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const activeCount = (categories || []).filter((c: any) => c.is_active).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{(categories || []).length} categories</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: (categories || []).length, color: 'text-primary-900' },
          { label: 'Active', value: activeCount, color: 'text-green-600' },
          { label: 'Inactive', value: (categories || []).length - activeCount, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={cn('font-display text-3xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-44 animate-pulse" />)}
        </div>
      ) : (categories || []).length === 0 ? (
        <div className="card p-16 text-center">
          <FolderOpen size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-500 mb-2">No categories yet</h3>
          <button onClick={() => setModal('new')} className="btn-primary mt-2">Create First Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories || []).map((cat: any) => (
            <div key={cat.id} className={cn('card p-5 transition-all hover:shadow-card-hover group', !cat.is_active && 'opacity-60')}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {cat.icon || '🗂️'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{cat.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                  </div>
                </div>
              </div>
              {cat.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cat.description}</p>}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-display font-bold text-xl text-gray-800">{cat.product_count || 0}</p>
                  <p className="text-[10px] text-gray-400">Products</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-display font-bold text-xl text-gray-800">#{cat.sort_order}</p>
                  <p className="text-[10px] text-gray-400">Order</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className={cn('w-2.5 h-2.5 rounded-full mx-auto mb-1', cat.is_active ? 'bg-green-500' : 'bg-gray-300')} />
                  <p className="text-[10px] text-gray-400">{cat.is_active ? 'Active' : 'Off'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal(cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:border-accent hover:text-accent transition-colors">
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => toggleMutation.mutate({ id: cat.id, is_active: !cat.is_active })}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl border transition-colors',
                    cat.is_active ? 'border-gray-200 hover:border-orange-300 hover:text-orange-500' : 'border-green-200 text-green-600 hover:bg-green-50')}>
                  {cat.is_active ? <><ToggleLeft size={13} /> Disable</> : <><ToggleRight size={13} /> Enable</>}
                </button>
                <button onClick={() => setDeleteTarget(cat)}
                  className="p-2 border border-gray-200 rounded-xl hover:border-red-300 hover:text-red-500 text-gray-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <CategoryModal category={modal === 'new' ? undefined : modal as Category} onClose={() => setModal(null)} />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
