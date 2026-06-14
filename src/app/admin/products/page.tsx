'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, X, Star, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { adminApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Product, Category } from '@/types';
import ProductImageUploader, { ProductImage } from '@/components/admin/ProductImageUploader';

interface ProductForm {
  name: string; description: string; short_description: string;
  price: string; compare_price: string; cost_price: string;
  category_id: string; brand: string; stock_quantity: number;
  sku: string; weight: string; low_stock_threshold: number;
  is_featured: boolean; is_new_arrival: boolean;
  is_best_seller: boolean; is_active: boolean;
  tags: string; meta_title: string; meta_description: string;
}

type ModalTab = 'basic' | 'images' | 'pricing' | 'seo';

function ProductModal({ product, categories, onClose }: {
  product?: Product; categories: Category[]; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ModalTab>('basic');
  const [images, setImages] = useState<ProductImage[]>(
    product?.images?.map((img, i) => ({
      id: img.id, url: img.url, alt_text: img.alt_text,
      is_primary: img.is_primary, sort_order: i,
    })) || []
  );
  const [form, setForm] = useState<ProductForm>({
    name: product?.name || '', description: product?.description || '',
    short_description: product?.short_description || '',
    price: product?.price?.toString() || '',
    compare_price: product?.compare_price?.toString() || '',
    cost_price: product?.cost_price?.toString() || '',
    category_id: product?.category_id || '', brand: product?.brand || '',
    stock_quantity: product?.stock_quantity || 0,
    sku: product?.sku || '', weight: '',
    low_stock_threshold: product?.low_stock_threshold || 10,
    is_featured: product?.is_featured || false,
    is_new_arrival: product?.is_new_arrival || false,
    is_best_seller: product?.is_best_seller || false,
    is_active: product?.is_active ?? true,
    tags: product?.tags?.join(', ') || '',
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
  });

  const set = (k: keyof ProductForm, v: any) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        images: images.map((img, i) => ({ url: img.url, alt_text: img.alt_text, is_primary: img.is_primary, sort_order: i })),
      };
      return product ? adminApi.updateProduct(product.id, payload) : adminApi.createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(product ? 'Product updated!' : 'Product created!');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save product'),
  });

  const TABS: { id: ModalTab; label: string; count?: number }[] = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'images', label: 'Images', count: images.length },
    { id: 'pricing', label: 'Pricing & Stock' },
    { id: 'seo', label: 'SEO & Tags' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="flex border-b px-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5',
                tab === t.id ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Product Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="input" placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className="input">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Brand</label>
                  <input value={form.brand} onChange={e => set('brand', e.target.value)} className="input" placeholder="e.g. Samsung" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Short Description</label>
                <input value={form.short_description} onChange={e => set('short_description', e.target.value)}
                  className="input" placeholder="Brief summary shown in product cards" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  className="input resize-none" rows={5} placeholder="Detailed product description…" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SKU</label>
                <input value={form.sku} onChange={e => set('sku', e.target.value)} className="input" placeholder="e.g. SAM-S24U-256-BLK" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Product Flags</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'is_featured', label: '⭐ Featured', desc: 'Show on homepage' },
                    { key: 'is_new_arrival', label: '🆕 New Arrival', desc: 'Badge on card' },
                    { key: 'is_best_seller', label: '🔥 Best Seller', desc: 'Hot badge' },
                    { key: 'is_active', label: '✅ Active', desc: 'Visible in store' },
                  ].map(f => (
                    <label key={f.key} className={cn('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      (form as any)[f.key] ? 'border-accent bg-orange-50' : 'border-gray-200 hover:border-gray-300')}>
                      <input type="checkbox" checked={(form as any)[f.key]}
                        onChange={e => set(f.key as keyof ProductForm, e.target.checked)}
                        className="w-4 h-4 accent-orange-500" />
                      <div>
                        <p className="text-sm font-medium">{f.label}</p>
                        <p className="text-xs text-gray-400">{f.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'images' && (
            <ProductImageUploader images={images} onChange={setImages} maxImages={8} />
          )}

          {tab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (KES) *</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="input" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Compare Price</label>
                  <input type="number" value={form.compare_price} onChange={e => set('compare_price', e.target.value)} className="input" placeholder="Original price" />
                  <p className="text-xs text-gray-400 mt-1">Shows strikethrough</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cost Price</label>
                  <input type="number" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} className="input" placeholder="Your cost" />
                  <p className="text-xs text-gray-400 mt-1">Not shown publicly</p>
                </div>
              </div>
              {form.price && form.cost_price && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-sm font-semibold text-green-700 mb-1">Profit Margin</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-green-600">Gross Profit</p>
                      <p className="font-bold text-green-700">{formatCurrency(parseFloat(form.price) - parseFloat(form.cost_price))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Margin</p>
                      <p className="font-bold text-green-700">{((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock Quantity</label>
                  <input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', parseInt(e.target.value) || 0)} className="input" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Low Stock Alert</label>
                  <input type="number" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', parseInt(e.target.value) || 10)} className="input" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
                  <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} className="input" placeholder="0.5" step="0.01" />
                </div>
              </div>
              <div className={cn('p-3 rounded-xl text-sm font-medium',
                form.stock_quantity === 0 ? 'bg-red-50 text-red-600' :
                form.stock_quantity <= form.low_stock_threshold ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600')}>
                {form.stock_quantity === 0 ? '❌ Out of Stock' :
                 form.stock_quantity <= form.low_stock_threshold ? `⚠️ Low Stock — ${form.stock_quantity} left` :
                 `✅ In Stock — ${form.stock_quantity} units`}
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Tags</label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)} className="input" placeholder="smartphone, android, 5g (comma separated)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Title</label>
                <input value={form.meta_title} onChange={e => set('meta_title', e.target.value)} className="input" placeholder="SEO page title" maxLength={60} />
                <p className="text-xs text-gray-400 mt-1">{form.meta_title.length}/60 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Meta Description</label>
                <textarea value={form.meta_description} onChange={e => set('meta_description', e.target.value)}
                  className="input resize-none" rows={3} placeholder="SEO description" maxLength={160} />
                <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/160 characters</p>
              </div>
              {(form.meta_title || form.name) && (
                <div className="p-4 bg-gray-50 rounded-xl border">
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Google Preview</p>
                  <p className="text-blue-600 text-base font-medium">{form.meta_title || form.name}</p>
                  <p className="text-green-700 text-xs">shopke.co.ke/products/{form.name.toLowerCase().replace(/\s+/g, '-')}</p>
                  <p className="text-gray-600 text-sm mt-1">{form.meta_description || form.short_description || form.description?.slice(0, 160)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">{images.length} image(s) · {form.stock_quantity} in stock</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary py-2 px-4">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.price}
              className="btn-primary py-2 px-6 disabled:opacity-50">
              {mutation.isPending ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Product deactivated'); },
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
          className="input py-2.5 text-sm w-auto min-w-[160px]">
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
              {isLoading ? [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : products.map((p: any) => (
                <tr key={p.id} className={cn('hover:bg-gray-50/50 transition-colors', !p.is_active && 'opacity-50')}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {p.primary_image
                          ? <Image src={p.primary_image} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                          : <Package size={20} className="text-gray-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku || 'No SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{p.category_name || '—'}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">{formatCurrency(p.price)}</p>
                    {p.compare_price && <p className="text-xs text-gray-400 line-through">{formatCurrency(p.compare_price)}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {p.stock_quantity <= (p.low_stock_threshold || 10) && p.stock_quantity > 0 && <AlertTriangle size={12} className="text-orange-400" />}
                      <span className={cn('text-sm font-semibold',
                        p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity <= 10 ? 'text-orange-500' : 'text-gray-700')}>
                        {p.stock_quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={cn('badge text-[10px]', p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {p.is_featured && <span className="badge text-[10px] bg-accent/10 text-accent">Featured</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs">{Number(p.average_rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({p.review_count || 0})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(p)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-gray-400"><Edit2 size={14} /></button>
                      <button onClick={() => { if (confirm('Deactivate this product?')) deleteMutation.mutate(p.id); }}
                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No products found</p>
            <button onClick={() => setModal('new')} className="btn-primary">Add First Product</button>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t">
            <p className="text-xs text-gray-500">Page {page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <ProductModal product={modal === 'new' ? undefined : modal as Product} categories={categories} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
