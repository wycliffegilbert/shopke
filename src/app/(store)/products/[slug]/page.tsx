'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Heart, Star, Minus, Plus, Share2, Shield, Truck, RotateCcw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, cartApi, wishlistApi } from '@/lib/api';
import { useAuthStore, useCartStore, useWishlistStore } from '@/store';
import { formatCurrency, getDiscountPercentage, formatDate, cn } from '@/lib/utils';
import ProductCard from '@/components/shop/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setOpen } = useCartStore();
  const { hasItem, addItem: addToWishlist, removeItem } = useWishlistStore();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getOne(slug),
    select: d => d.data.data,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => productApi.getReviews(product!.id),
    enabled: !!product?.id,
    select: d => ({ reviews: d.data.data, stats: d.data.stats }),
  });

  const isWishlisted = hasItem(product?.id || '');
  const discountPct = product?.compare_price ? getDiscountPercentage(product.price, product.compare_price) : null;
  const images = product?.images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const displayImages = images.length > 0 ? images : [{ url: null }];

  const addCartMutation = useMutation({
    mutationFn: () => cartApi.add({ product_id: product!.id, quantity, variant_id: selectedVariant || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
      setOpen(true);
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () => wishlistApi.toggle(product!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      if (isWishlisted) { removeItem(product!.id); toast.success('Removed from wishlist'); }
      else { toast.success('Added to wishlist!'); }
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error('Please sign in'); router.push('/auth/login'); return; }
    addCartMutation.mutate();
  };

  if (isLoading) return (
    <div className="container-pad py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
      <div className="aspect-square bg-gray-100 rounded-2xl" />
      <div className="space-y-4">
        <div className="h-6 bg-gray-100 rounded w-1/4" />
        <div className="h-8 bg-gray-100 rounded w-3/4" />
        <div className="h-8 bg-gray-100 rounded w-1/2" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="container-pad py-20 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-semibold mb-4">Product not found</h2>
      <Link href="/products" className="btn-primary">Browse Products</Link>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="container-pad py-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-accent">Home</Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-accent">Products</Link>
          {product.category_name && <>
            <ChevronRight size={12} />
            <Link href={`/products?category=${product.category_slug}`} className="hover:text-accent">{product.category_name}</Link>
          </>}
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container-pad py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              {displayImages[selectedImage]?.url ? (
                <Image src={displayImages[selectedImage].url} alt={product.name} fill className="object-contain p-4" />
              ) : <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>}
              {discountPct && (
                <span className="absolute top-4 left-4 badge bg-red-500 text-white">−{discountPct}%</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {images.map((img: any, i: number) => (
                  <button key={img.id} onClick={() => setSelectedImage(i)}
                    className={cn('w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImage === i ? 'border-accent' : 'border-gray-100 hover:border-gray-300')}>
                    {img.url ? <Image src={img.url} alt="" width={80} height={80} className="object-cover w-full h-full" />
                      : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl">📦</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.brand && <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">{product.brand}</p>}
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary-900 mb-3 leading-snug">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{Number(product.average_rating).toFixed(1)}</span>
              <button onClick={() => setActiveTab('reviews')} className="text-sm text-accent hover:underline">
                {product.review_count} reviews
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{product.sold_count} sold</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
              <span className="font-display text-3xl font-bold text-primary-900">{formatCurrency(product.price)}</span>
              {product.compare_price && (
                <div>
                  <span className="text-gray-400 line-through text-lg">{formatCurrency(product.compare_price)}</span>
                  <span className="ml-2 badge bg-red-100 text-red-600">Save {discountPct}%</span>
                </div>
              )}
            </div>

            {product.short_description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.short_description}</p>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3">Select Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any) => (
                    <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                      className={cn('px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                        selectedVariant === v.id ? 'border-accent bg-orange-50 text-accent' : 'border-gray-200 hover:border-gray-300',
                        v.stock_quantity === 0 && 'opacity-40 cursor-not-allowed')}>
                      {v.name}: {v.value}
                      {v.price_modifier > 0 && ` (+${formatCurrency(v.price_modifier)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="px-5 font-semibold text-base min-w-[40px] text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))} className="px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={product.stock_quantity === 0 || addCartMutation.isPending}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-50">
                <ShoppingCart size={18} />
                {product.stock_quantity === 0 ? 'Out of Stock' : addCartMutation.isPending ? 'Adding…' : 'Add to Cart'}
              </button>
              <button onClick={() => wishlistMutation.mutate()}
                className={cn('p-3.5 rounded-xl border transition-all', isWishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 hover:border-red-200 hover:text-red-500')}>
                <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
              </button>
              <button className="p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <Share2 size={20} />
              </button>
            </div>

            {/* Stock */}
            <div className="mb-6">
              {product.stock_quantity > 0 ? (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                  ✓ {product.stock_quantity <= 10 ? `Only ${product.stock_quantity} left in stock!` : 'In Stock'}
                </p>
              ) : <p className="text-sm text-red-500 font-medium">✗ Out of Stock</p>}
              {product.sku && <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl">
              {[
                { icon: <Truck size={18} className="text-accent" />, text: 'Free delivery over KES 3,000' },
                { icon: <Shield size={18} className="text-emerald-500" />, text: 'Secure payment' },
                { icon: <RotateCcw size={18} className="text-blue-500" />, text: '30-day returns' },
              ].map(b => (
                <div key={b.text} className="flex flex-col items-center text-center gap-1.5">
                  {b.icon}
                  <p className="text-xs text-gray-600 leading-tight">{b.text}</p>
                </div>
              ))}
            </div>

            {/* Payment methods */}
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <p className="text-xs text-gray-500">Pay with:</p>
              {['M-Pesa', 'Visa', 'Mastercard', 'PayPal'].map(m => (
                <span key={m} className="text-xs font-medium border border-gray-200 px-2 py-0.5 rounded text-gray-600">{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex gap-1 border-b border-gray-100 mb-8">
            {[['description', 'Description'], ['reviews', `Reviews (${product.review_count})`]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id as any)}
                className={cn('px-6 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
                  activeTab === id ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700')}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'description' ? (
            <div className="max-w-3xl">
              <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'No description available.'}
              </div>
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {product.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl">
              {reviewsData?.stats && (
                <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-2xl mb-8">
                  <div className="text-center">
                    <div className="font-display text-5xl font-bold text-primary-900">{Number(reviewsData.stats.average || 0).toFixed(1)}</div>
                    <div className="flex gap-0.5 justify-center my-1">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.floor(Number(reviewsData.stats.average)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />)}
                    </div>
                    <div className="text-sm text-gray-500">{reviewsData.stats.total} reviews</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(n => {
                      const count = Number(reviewsData.stats[['','one','two','three','four','five'][n]]);
                      const pct = reviewsData.stats.total > 0 ? (count / reviewsData.stats.total) * 100 : 0;
                      return (
                        <div key={n} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-right text-gray-500">{n}</span>
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-4 text-gray-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {reviewsData?.reviews?.map((r: any) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {r.reviewer_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.reviewer_name}</p>
                          {r.is_verified_purchase && <p className="text-xs text-emerald-600 font-medium">✓ Verified Purchase</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-0.5 justify-end">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />)}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.created_at)}</p>
                      </div>
                    </div>
                    {r.title && <p className="font-semibold text-sm mb-1">{r.title}</p>}
                    {r.body && <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>}
                  </div>
                ))}
                {!reviewsData?.reviews?.length && (
                  <p className="text-gray-500 text-sm text-center py-8">No reviews yet. Be the first to review this product!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {product.related_products?.length > 0 && (
          <div className="mt-16">
            <h2 className="section-title text-2xl mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {product.related_products.slice(0, 6).map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
