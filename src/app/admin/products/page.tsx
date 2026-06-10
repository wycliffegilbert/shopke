'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, X, Star, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { adminApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Product, Category } from '@/types';

function ProductModal({ product, categories, onClose }: { product?: Product; categories: Category[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    price: product?.price || '',
    compare_price: product?.compare_price || '',
    brand: product?.brand || '',
    category_id: product?.category_id || '',
    stock_quantity: product?.stock_quantity || 0,
    sku: product?.sku || '',
    is_featured: product?.is_featured || false,
    is_new_arrival: product?.is_new_arrival || false,
    is_best_seller: product?.is_best_seller || false,
    is_active: product?.is_active ?? true,
    low_stock_threshold: product?.low_stock_threshold || 10,
  });

  const mutation = useMutation({
    mutationFn: () => product
      ? adminApi.updateProduct(product.id, form)
      : adminApi.createProduct(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save product'),
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Product Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="e.g. Samsung Galaxy S24" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Price (KES) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="input" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Compare Price (KES)</label>
              <input type="number" value={form.compare_price} onChange={e => set('compare_price', e.target.value)} className="input" placeholder="0" />
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1.5">SKU</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} className="input" placeholder="e.g. SAM-S24-BLK" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Stock Quantity</label>
              <input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', parseInt(e.target.value))} className="input" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Low Stock Threshold</label>
              <input type="number" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', parseInt(e.target.value))} className="input" min="1" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Short Description</label>
            <input value={form.short_description} onChange={e => set('short_description', e.target.value)} className="input" placeholder="Brief product summary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input resize-none" rows={4} placeholder="Detailed product description" />
          </div>
          {/* Flags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['is_featured', 'Featured'], ['is_new_arrival', 'New Arrival'], ['is_best_seller', 'Best Seller'], ['is_active', 'Active']].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as any)[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">{l}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
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
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState<Product | 'new' | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => adminApi.getProducts({ search: search || undefined, page, limit: 20 }),
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-accent hover:underline">← Dashboard</Link>
            <h1 className="font-display text-2xl font-bold">Products</h1>
            {pagination && <span className="badge bg-gray-100 text-gray-600 text-xs">{pagination.total}</span>}
          </div>
          <button onClick={() => setModalProduct('new')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Search */}
        <div className="card p-4 mb-6">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="input pl-9 py-2.5 text-sm" />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                )) : products.map((p: any) => (
                  <tr key={p.id} className={cn('hover:bg-gray-50/50 transition-colors', !p.is_active && 'opacity-50')}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
                          {p.primary_image ? <Image src={p.primary_image} alt="" width={48} height={48} className="object-cover w-full h-full" /> : '📦'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.category_name || '—'}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold">{formatCurrency(p.price)}</p>
                      {p.compare_price && <p className="text-xs text-gray-400 line-through">{formatCurrency(p.compare_price)}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {p.stock_quantity <= (p.low_stock_threshold || 10) && p.stock_quantity > 0 && (
                          <AlertTriangle size={12} className="text-orange-500" />
                        )}
                        <span className={cn('text-sm font-medium',
                          p.stock_quantity === 0 ? 'text-red-500' :
                          p.stock_quantity <= 10 ? 'text-orange-500' : 'text-gray-700')}>
                          {p.stock_quantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs text-gray-600">{Number(p.average_rating).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({p.review_count})</span>
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
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalProduct(p)}
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-gray-400">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { if (confirm('Deactivate this product?')) deleteMutation.mutate(p.id); }}
                          className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400">
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
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-sm">No products found</p>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {page} of {pagination.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalProduct !== null && (
        <ProductModal
          product={modalProduct === 'new' ? undefined : (modalProduct as Product)}
          categories={categories}
          onClose={() => setModalProduct(null)}
        />
      )}
    </div>
  );
}
