'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
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
      if (!isAuthenticated) { toast.error('Please sign in'); }
      else toast.error('Failed to add to cart');
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container-pad py-20 text-center max-w-md mx-auto">
        <Heart size={48} className="text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Sign in to save products and access your wishlist from any device.</p>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="container-pad py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">My Wishlist</h1>
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
        <div className="text-center py-20">
          <Heart size={56} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">No saved items yet</h3>
          <p className="text-sm text-gray-400 mb-6">Browse products and click the heart icon to save them here.</p>
          <Link href="/products" className="btn-primary">Discover Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => {
            const productId = item.product_id || item.id;
            const discountPct = item.compare_price ? getDiscountPercentage(item.price, item.compare_price) : null;
            return (
              <div key={item.id} className="card group overflow-hidden hover:shadow-card-hover transition-all hover:-translate-y-1">
                <div className="relative aspect-square bg-gray-50">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                  )}
                  {discountPct && (
                    <span className="absolute top-2 left-2 badge bg-red-500 text-white text-[10px]">−{discountPct}%</span>
                  )}
                  <button onClick={() => removeMutation.mutate(productId)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="p-4">
                  <Link href={`/products/${item.slug}`} className="text-sm font-semibold text-gray-800 hover:text-accent line-clamp-2 leading-snug">
                    {item.name}
                  </Link>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-bold text-base text-primary-900">{formatCurrency(item.price)}</p>
                      {item.compare_price && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(item.compare_price)}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => addCartMutation.mutate(productId)}
                    disabled={addCartMutation.isPending || item.stock_quantity === 0}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 bg-primary-900 hover:bg-accent text-white py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50">
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
