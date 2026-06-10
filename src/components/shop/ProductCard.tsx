'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Eye, Zap } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { formatCurrency, getDiscountPercentage, cn } from '@/lib/utils';
import { cartApi, wishlistApi } from '@/lib/api';
import { useAuthStore, useCartStore, useWishlistStore } from '@/store';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem, setOpen } = useCartStore();
  const { hasItem, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const queryClient = useQueryClient();
  const isWishlisted = hasItem(product.id);

  const discountPct = product.compare_price
    ? getDiscountPercentage(product.price, product.compare_price)
    : null;

  const addCartMutation = useMutation({
    mutationFn: () => cartApi.add({ product_id: product.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
      setOpen(true);
    },
    onError: () => toast.error('Failed to add to cart'),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => wishlistApi.toggle(product.id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      if (res.data.data?.action === 'added' || isWishlisted) {
        if (isWishlisted) { removeFromWishlist(product.id); toast.success('Removed from wishlist'); }
        else { addToWishlist({ id: '', product_id: product.id, name: product.name, slug: product.slug, price: product.price, average_rating: product.average_rating, stock_quantity: product.stock_quantity, created_at: new Date().toISOString() }); toast.success('Added to wishlist!'); }
      }
    },
    onError: () => {
      if (!isAuthenticated) { toast.error('Please sign in to add to wishlist'); router.push('/auth/login'); }
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in to add to cart'); router.push('/auth/login'); return; }
    addCartMutation.mutate();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlistMutation.mutate();
  };

  const primaryImage = product.primary_image || product.images?.[0]?.url;

  if (layout === 'list') {
    return (
      <Link href={`/products/${product.slug}`} className="card flex gap-4 p-4 hover:shadow-card-hover transition-shadow group">
        <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
          {primaryImage ? (
            <Image src={primaryImage} alt={product.name} width={128} height={128} className="object-cover w-full h-full" />
          ) : <span className="text-4xl">📦</span>}
        </div>
        <div className="flex-1 min-w-0">
          {product.brand && <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{product.brand}</p>}
          <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-accent transition-colors">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className={i < Math.floor(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className="text-xs text-gray-500">({product.review_count})</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-accent text-lg">{formatCurrency(product.price)}</span>
              {product.compare_price && <span className="text-sm text-gray-400 line-through">{formatCurrency(product.compare_price)}</span>}
            </div>
            <button onClick={handleAddToCart} disabled={addCartMutation.isPending || product.stock_quantity === 0}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
              <ShoppingCart size={14} /> Add to Cart
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className="card group overflow-hidden hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {primaryImage ? (
          <Image src={primaryImage} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new_arrival && (
            <span className="badge bg-emerald-500 text-white text-[10px]">New</span>
          )}
          {discountPct && (
            <span className="badge bg-red-500 text-white text-[10px]">−{discountPct}%</span>
          )}
          {product.is_best_seller && (
            <span className="badge bg-amber-500 text-white text-[10px] flex items-center gap-0.5">
              <Zap size={9} /> Hot
            </span>
          )}
          {product.stock_quantity === 0 && (
            <span className="badge bg-gray-800 text-white text-[10px]">Out of Stock</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={handleWishlist}
            className={cn('w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-colors',
              isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500')}>
            <Heart size={14} className={isWishlisted ? 'fill-current' : ''} />
          </button>
          <Link href={`/products/${product.slug}`}
            className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-accent transition-colors">
            <Eye size={14} />
          </Link>
        </div>

        {/* Quick Add (appears on hover) */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <button onClick={handleAddToCart} disabled={addCartMutation.isPending || product.stock_quantity === 0}
            className="w-full bg-primary-900 hover:bg-accent text-white py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ShoppingCart size={13} />
            {product.stock_quantity === 0 ? 'Out of Stock' : addCartMutation.isPending ? 'Adding…' : 'Quick Add'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {product.brand && (
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{product.brand}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-accent transition-colors leading-snug">
          {product.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} className={i < Math.floor(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
          ))}
          {product.review_count > 0 && (
            <span className="text-[10px] text-gray-400 ml-1">({product.review_count})</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-base text-primary-900">{formatCurrency(product.price)}</span>
            {product.compare_price && (
              <span className="text-xs text-gray-400 line-through ml-1.5">{formatCurrency(product.compare_price)}</span>
            )}
          </div>
          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <span className="text-[10px] text-orange-600 font-medium">Only {product.stock_quantity} left</span>
          )}
        </div>
      </div>
    </Link>
  );
}
