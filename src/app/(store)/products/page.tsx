'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, Grid3X3, List, ChevronDown, X, Search } from 'lucide-react';
import { productApi } from '@/lib/api';
import ProductCard from '@/components/shop/ProductCard';
import { cn, formatCurrency } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Best Rated' },
  { value: 'sold-desc', label: 'Most Popular' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  const params = {
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    search: searchParams.get('search') || undefined,
    min_price: searchParams.get('min_price') || undefined,
    max_price: searchParams.get('max_price') || undefined,
    featured: searchParams.get('featured') || undefined,
    new_arrival: searchParams.get('new_arrival') || undefined,
    best_seller: searchParams.get('best_seller') || undefined,
    sale: searchParams.get('sale') || undefined,
    in_stock: searchParams.get('in_stock') || undefined,
    page: searchParams.get('page') || '1',
    limit: '16',
    sort: (searchParams.get('sort') || 'created_at').split('-')[0],
    order: ((searchParams.get('sort') || 'created_at-desc').split('-')[1] || 'desc'),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getAll(params),
    select: d => d.data,
  });

  const { data: filtersData } = useQuery({
    queryKey: ['filters', params.category],
    queryFn: () => productApi.getFilters(params.category),
    select: d => d.data.data,
  });

  const updateParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.push(`/products?${p.toString()}`);
  };

  const clearFilters = () => router.push('/products');
  const hasFilters = ['category','brand','search','min_price','max_price','featured','new_arrival','best_seller','sale','in_stock'].some(k => searchParams.get(k));

  const products = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="container-pad py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title text-2xl">
            {params.category ? params.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All Products'}
          </h1>
          {pagination && <p className="text-sm text-gray-500 mt-1">{pagination.total} products found</p>}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search in list */}
          <form onSubmit={e => { e.preventDefault(); updateParam('search', localSearch || null); }} className="flex-1 sm:w-64 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={localSearch} onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search products…" className="input pl-9 py-2.5 text-sm" />
          </form>
          <button onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              filtersOpen ? 'bg-accent text-white border-accent' : 'border-gray-200 hover:border-accent')}>
            <SlidersHorizontal size={15} /> Filters {hasFilters && '•'}
          </button>
          <select onChange={e => updateParam('sort', e.target.value)} value={`${params.sort}-${params.order}`}
            className="input py-2.5 text-sm w-auto">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setLayout('grid')} className={cn('p-2.5 transition-colors', layout === 'grid' ? 'bg-accent text-white' : 'hover:bg-gray-50')}>
              <Grid3X3 size={15} />
            </button>
            <button onClick={() => setLayout('list')} className={cn('p-2.5 transition-colors', layout === 'list' ? 'bg-accent text-white' : 'hover:bg-gray-50')}>
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {[['category', params.category], ['brand', params.brand], ['search', params.search]].filter(([, v]) => v).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 bg-orange-50 border border-accent/30 text-accent text-xs font-medium px-3 py-1.5 rounded-full">
              {v} <button onClick={() => updateParam(k as string, null)}><X size={12} /></button>
            </span>
          ))}
          {[['featured', 'Featured'], ['new_arrival', 'New Arrival'], ['best_seller', 'Best Seller'], ['sale', 'On Sale'], ['in_stock', 'In Stock']].filter(([k]) => searchParams.get(k)).map(([k, l]) => (
            <span key={k} className="flex items-center gap-1.5 bg-orange-50 border border-accent/30 text-accent text-xs font-medium px-3 py-1.5 rounded-full">
              {l} <button onClick={() => updateParam(k as string, null)}><X size={12} /></button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 px-2 py-1.5 transition-colors">Clear all</button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={cn('w-64 flex-shrink-0 space-y-6', !filtersOpen && 'hidden lg:block')}>
          {/* Quick Filters */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-4">Quick Filters</h3>
            <div className="space-y-2">
              {[['featured', 'Featured'], ['new_arrival', 'New Arrivals'], ['best_seller', 'Best Sellers'], ['sale', 'On Sale'], ['in_stock', 'In Stock']].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={!!searchParams.get(k)} onChange={e => updateParam(k, e.target.checked ? 'true' : null)}
                    className="w-4 h-4 accent-orange-500 rounded" />
                  <span className="text-sm text-gray-700 group-hover:text-accent transition-colors">{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-4">Price Range (KES)</h3>
            <div className="flex gap-2 items-center">
              <input type="number" placeholder="Min" defaultValue={params.min_price}
                onBlur={e => updateParam('min_price', e.target.value || null)}
                className="input py-2 text-xs flex-1" />
              <span className="text-gray-400 text-xs">–</span>
              <input type="number" placeholder="Max" defaultValue={params.max_price}
                onBlur={e => updateParam('max_price', e.target.value || null)}
                className="input py-2 text-xs flex-1" />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {[['0', '10000'], ['10000', '50000'], ['50000', '100000'], ['100000', '']].map(([min, max], i) => (
                <button key={i} onClick={() => { updateParam('min_price', min); updateParam('max_price', max || null); }}
                  className="text-xs px-2.5 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-accent rounded-lg border border-gray-200 transition-colors">
                  {min === '100000' ? '100K+' : `${Number(min)/1000||0}–${Number(max)/1000}K`}
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          {filtersData?.brands?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-4">Brand</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filtersData.brands.map((brand: string) => (
                  <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={params.brand === brand}
                      onChange={e => updateParam('brand', e.target.checked ? brand : null)}
                      className="w-4 h-4 accent-orange-500" />
                    <span className="text-sm text-gray-700 group-hover:text-accent">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-6 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className={cn(layout === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3')}>
                {products.map((p: any) => <ProductCard key={p.id} product={p} layout={layout} />)}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button key={i} onClick={() => updateParam('page', String(i + 1))}
                      className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                        pagination.page === i + 1 ? 'bg-accent text-white' : 'border border-gray-200 hover:border-accent hover:text-accent')}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<div className="container-pad py-16 text-center text-gray-400">Loading…</div>}>
    <ProductsContent />
  </Suspense>;
}
