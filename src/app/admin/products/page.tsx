'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit2, Trash2, Eye, Star, Package,
  ChevronDown, ToggleLeft, ToggleRight, X, Check,
  DollarSign, Tag, BarChart3, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Product, Category } from '@/types';
import ProductImageUploader, { ProductImage } from '@/components/admin/ProductImageUploader';

interface ProductForm {
  name: string; description: string; short_description: string;
  price: string; compare_price: string; cost_price: string;
  category_id: string; brand: string; stock_quantity: string;
  low_stock_threshold: string; sku: string; weight: string;
  is_featured: boolean; is_new_arrival: boolean; is_best_seller: boolean;
  is_active: boolean; tags: string;
  meta_title: string; meta_description: string;
}

const DEFAULT_FORM: ProductForm = {
  name: '', description: '', short_description: '',
  price: '', compare_price: '', cost_price: '',
  category_id: '', brand: '', stock_quantity: '0',
  low_stock_threshold: '10', sku: '', weight: '',
  is_featured: false, is_new_arrival: false, is_best_seller: false,
  is_active: true, tags: '', meta_title: '', meta_description: '',
};

const FLAG_BADGES = [
  { key: 'is_featured', label: '⭐ Featured', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'is_new_arrival', label: '🆕 New Arrival', color: 'bg-blue-100 text-blue-700' },
  { key: 'is_best_seller', label: '🔥 Best Seller', color: 'bg-red-100 text-red-700' },
];

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
        <h3 className="font-bold text-lg text-center mb-2">Delete Product?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Are you sure you want to delete <strong>"{name}"</strong>? This will deactivate the product and it won't appear in the store.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Deleting…' : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, categories, onClose }: {
  product?: Product; categories: Category[]; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'basic' | 'images' | 'pricing' | 'seo'>('basic');
  const [images, setImages] = useState<ProductImage[]>(
    (product?.images as any[] || []).map((img: any, i: number) => ({
      id: img.id, url: img.url, alt_text: img.alt_text,
      is_primary: img.is_primary, sort_order: img.sort_order ?? i,
    }))
  );
  const [form, setForm] = useState<ProductForm>({
    name: product?.name || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    price: product?.price?.toString() || '',
    compare_price: product?.compare_price?.toString() || '',
    cost_price: (product as any)?.cost_price?.toString() || '',
    category_id: product?.category_id || '',
    brand: product?.brand || '',
    stock_quantity: product?.stock_quantity?.toString() || '0',
    low_stock_threshold: product?.low_stock_threshold?.toString() || '10',
    sku: product?.sku || '',
    weight: product?.weight?.toString() || '',
    is_featured: product?.is_featured || false,
    is_new_arrival: product?.is_new_arrival || false,
    is_best_seller: product?.is_best_seller || false,
    is_active: product?.is_active !== false,
    tags: (product?.tags || []).join(', '),
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
  });

  const set = (k: keyof ProductForm, v: any) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
        category_id: form.category_id || null,
        weight: form.weight ? parseFloat(form.weight) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images,
      };
      return product
        ? adminApi.updateProduct(product.id, payload)
        : adminApi.createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(product ? 'Product updated!' : 'Product created!');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const margin = form.price && form.cost_price
    ? (((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100).toFixed(1)
    : null;

  const TABS = [
    { id: 'basic', label: 'Basic Info', icon: <Package size={14} /> },
    { id: 'images', label: 'Images', icon: <ImageIcon size={14} /> },
    { id: 'pricing', label: 'Pricing & Stock', icon: <DollarSign size={14} /> },
    { id: 'seo', label: 'SEO & Tags', icon: <Tag size={14} /> },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex border-b px-6 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === t.id ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {tab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Product Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="input" placeholder="e.g. Samsung Galaxy S24 Ultra" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="input">
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Brand</label>
                  <input value={form.brand} onChange={e => set('brand', e.target.value)}
                    className="input" placeholder="e.g. Samsung" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Short Description</label>
                <input value={form.short_description} onChange={e => set('short_description', e.target.value)}
                  className="input" placeholder="Brief one-line summary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  className="input resize-none" rows={4} placeholder="Detailed product description…" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Product Flags</label>
                <div className="flex flex-wrap gap-2">
                  {FLAG_BADGES.map(f => (
                    <button key={f.key} type="button"
                      onClick={() => set(f.key as keyof ProductForm, !form[f.key as keyof ProductForm])}
                      className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                        form[f.key as keyof ProductForm]
                          ? `${f.color} border-current`
                          : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                      {form[f.key as keyof ProductForm] && <Check size={13} className="inline mr-1" />}
                      {f.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => set('is_active', !form.is_active)}
                    className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all flex items-center gap-1.5',
                      form.is_active ? 'bg-green-100 text-green-700 border-green-300' : 'border-gray-200 text-gray-500')}>
                    {form.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {form.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'images' && (
            <ProductImageUploader images={images} onChange={setImages} />
          )}

          {tab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Selling Price (KES) *</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                    className="input" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Compare Price</label>
                  <input type="number" value={form.compare_price} onChange={e => set('compare_price', e.target.value)}
                    className="input" placeholder="Original price" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cost Price</label>
                  <input type="number" value={form.cost_price} onChange={e => set('cost_price', e.target.value)}
                    className="input" placeholder="Your cost" min="0" />
                </div>
              </div>
              {margin && (
                <div className={cn('p-4 rounded-xl text-sm font-medium', parseFloat(margin) >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
                  <BarChart3 size={14} className="inline mr-2" />
                  Profit margin: <strong>{margin}%</strong>
                  {form.price && form.cost_price && (
                    <span className="ml-2">· Profit: {formatCurrency((parseFloat(form.price) - parseFloat(form.cost_price)).toString())}</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock Quantity</label>
                  <input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)}
                    className="input" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Low Stock Alert At</label>
                  <input type="number" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)}
                    className="input" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">SKU</label>
                  <input value={form.sku} onChange={e => set('sku', e.target.value)}
                    className="input" placeholder="e.g. SAM-S24U-256-BLK" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
                  <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                    className="input" placeholder="0.5" step="0.1" min="0" />
                </div>
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Title</label>
                <input value={form.meta_title} onChange={e => set('meta_title', e.target.value)}
                  className="input" placeholder="SEO page title (leave blank to use product name)" maxLength={60} />
                <p className="text-xs text-gray-400 mt-1">{form.meta_title.length}/60 chars</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Description</label>
                <textarea value={form.meta_description} onChange={e => set('meta_description', e.target.value)}
                  className="input resize-none" rows={3} placeholder="SEO description for search engines…" maxLength={160} />
                <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/160 chars</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tags <span className="text-gray-400">(comma separated)</span></label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)}
                  className="input" placeholder="e.g. smartphone, samsung, android, 5g" />
              </div>
              {form.name && (
                <div className="p-4 border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Google Preview</p>
                  <p className="text-blue-600 text-sm font-medium truncate">{form.meta_title || form.name}</p>
                  <p className="text-green-700 text-xs">shopke.co.ke › products › {form.name.toLowerCase().replace(/\s+/g, '-')}</p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{form.meta_description || form.short_description || 'No description provided.'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.price}
            className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Product | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, categoryFilter, page],
    queryFn: () => adminApi.getProducts({ search: search || undefined, category: categoryFilter || undefined, page, limit: 20 }),
    select: d => d.data,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories(),
    select: d => d.data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const products = data?.data || [];
  const pagination = data?.pagination;
  const categories: Category[] = categoriesData || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination?.total || 0} products total</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…" className="input pl-9 py-2.5 text-sm" />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input py-2.5 text-sm sm:w-48">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Rating', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                </td></tr>
              )) : products.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                        {p.primary_image
                          ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                          : <Package size={18} className="text-gray-300 m-auto mt-2.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{p.name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {p.is_featured && <span className="badge bg-yellow-100 text-yellow-700 text-[9px]">⭐ Featured</span>}
                          {p.is_new_arrival && <span className="badge bg-blue-100 text-blue-700 text-[9px]">🆕 New</span>}
                          {p.is_best_seller && <span className="badge bg-red-100 text-red-700 text-[9px]">🔥 Best</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{p.category_name || '—'}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(p.price)}</p>
                    {p.compare_price && <p className="text-xs text-gray-400 line-through">{formatCurrency(p.compare_price)}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('badge text-[10px]',
                      p.stock_quantity === 0 ? 'bg-red-100 text-red-600' :
                      p.stock_quantity <= p.low_stock_threshold ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700')}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity <= p.low_stock_threshold ? `Low: ${p.stock_quantity}` : p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('badge text-[10px]', p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                      <Star size={11} className="fill-current" />
                      <span className="text-gray-600">{Number(p.average_rating).toFixed(1)} ({p.review_count || 0})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye size={14} />
                      </a>
                      <button onClick={() => setModal(p)}
                        className="p-1.5 hover:bg-accent/10 hover:text-accent rounded-lg text-gray-400 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Package size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No products found</p>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <ProductModal
          product={modal === 'new' ? undefined : modal as Product}
          categories={categories}
          onClose={() => setModal(null)}
        />
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
