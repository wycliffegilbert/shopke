'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { wishlistApi, cartApi } from '@/lib/api';
import { useAuthStore, useWishlistStore } from '@/store';
import { formatCurrency, getDiscountPercentage, cn } from '@/lib/utils';

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const { items: localItems, removeItem } = useWishlistStore();
  const queryClient = useQueryClient();

  const { data: serverWishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get(),
    enabled: isAuthenticated,
    select: d => d.data.data,
  });

  const items = isAuthenticated ? (serverWishlist || []) : localItems;

  const removeMutation = useMutation({
    mutationFn: (product_id: string) => wishlistApi.toggle(product_id),
    onSuccess: (_, product_id) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      removeItem(product_id);
      toast.success('Removed from wishlist');
    },
  });

  const addCartMutation = useMutation({
    mutationFn: (product_id: string) => cartApi.add({ product_id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: () => {
      if (!isAuthenticated) toast.error('Please sign in to add to cart');
      else toast.error('Failed to add to cart');
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container-pad py-24 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Heart size={36} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-800">Sign in to view your wishlist</h2>
        <p className="text-gray-500 text-sm mb-6">Save products and access them from any device.</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/auth/login" className="btn-primary text-center">Sign In</Link>
          <Link href="/products" className="btn-secondary text-center">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-pad py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">My Wishlist</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} saved item(s)</p>
        </div>
        {items.length > 0 && (
          <Link href="/products" className="text-sm text-accent font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            Continue Shopping <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-72 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-600 mb-2">No saved items yet</h3>
          <p className="text-sm text-gray-400 mb-6">Browse products and tap the heart icon to save them here.</p>
          <Link href="/products" className="btn-primary">Discover Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(items as any[]).map((item: any) => {
            const productId = item.product_id || item.id;
            const discountPct = item.compare_price
              ? getDiscountPercentage(item.price, item.compare_price)
              : null;

            return (
              <div key={item.id} className="card group overflow-hidden hover:shadow-card-hover transition-all hover:-translate-y-1">
                {/* Image */}
                <div className="relative aspect-square bg-gray-50">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={36} className="text-gray-200" />
                    </div>
                  )}
                  {discountPct && (
                    <span className="absolute top-2 left-2 badge bg-red-500 text-white text-[10px]">
                      −{discountPct}%
                    </span>
                  )}
                  {item.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="badge bg-gray-800 text-white text-xs">Out of Stock</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeMutation.mutate(productId)}
                    disabled={removeMutation.isPending}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-sm font-semibold text-gray-800 hover:text-accent line-clamp-2 leading-snug block mb-3">
                    {item.name}
                  </Link>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="font-bold text-base text-primary-900">{formatCurrency(item.price)}</p>
                      {item.compare_price && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(item.compare_price)}</p>
                      )}
                    </div>
                    {item.average_rating > 0 && (
                      <div className="flex items-center gap-0.5 text-xs text-amber-500">
                        ★ <span className="text-gray-500 ml-0.5">{Number(item.average_rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => addCartMutation.mutate(productId)}
                    disabled={addCartMutation.isPending || item.stock_quantity === 0}
                    className="w-full flex items-center justify-center gap-1.5 bg-primary-900 hover:bg-accent text-white py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <ShoppingCart size={13} />
                    {item.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
