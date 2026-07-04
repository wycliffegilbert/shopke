'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Heart, Star, Truck, Shield, RotateCcw,
  ChevronRight, Package, Minus, Plus, Zap, Share2, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, cartApi, wishlistApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { formatCurrency, getDiscountPercentage, cn } from '@/lib/utils';

const COLORS = [
  { name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#e5e7eb' },
  { name: 'Red', hex: '#ef4444' }, { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' }, { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' }, { name: 'Pink', hex: '#ec4899' },
  { name: 'Gray', hex: '#6b7280' }, { name: 'Brown', hex: '#a16207' },
  { name: 'Orange', hex: '#f97316' }, { name: 'Navy', hex: '#1e3a8a' },
];
const SIZES_CLOTHING = ['XS','S','M','L','XL','XXL','3XL'];
const SIZES_SHOES = ['36','37','38','39','40','41','42','43','44','45'];

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => productApi.getBySlug(params.slug),
    select: d => d.data.data,
  });

  const cartMutation = useMutation({
    mutationFn: () => cartApi.add({ product_id: product.id, quantity, variant_id: selectedVariant?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setAddedToCart(true);
      toast.success('Added to cart!');
      setTimeout(() => setAddedToCart(false), 2500);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add to cart'),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => wishlistApi.toggle(product.id),
    onSuccess: () => {
      setWishlisted(w => !w);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const handleBuyNow = () => {
    if (!product) return;
    const p = new URLSearchParams({
      product_id: product.id,
      quantity: quantity.toString(),
      name: product.name,
      price: effectivePrice.toString(),
      image: displayImage || '',
      ...(selectedVariant?.id && { variant_id: selectedVariant.id }),
      ...(selectedColor && { color: selectedColor }),
      ...(selectedSize && { size: selectedSize }),
    });
    router.push(`/buy-now?${p.toString()}`);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      router.push('/auth/login');
      return;
    }
    cartMutation.mutate();
  };

  if (isLoading) return (
    <div className="container-pad py-10 max-w-6xl animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-3xl" />
          <div className="flex gap-2">{[...Array(4)].map((_,i)=><div key={i} className="w-20 h-20 bg-gray-100 rounded-xl"/>)}</div>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-3/4"/><div className="h-10 bg-gray-100 rounded w-1/3"/>
          <div className="h-32 bg-gray-100 rounded"/>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container-pad py-20 text-center">
      <Package size={48} className="text-gray-200 mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Product not found</h2>
      <Link href="/products" className="btn-primary mt-4 inline-flex">Browse Products</Link>
    </div>
  );

  const images: any[] = product.images || [];
  const displayImage = images[selectedImage]?.url || images.find((i:any)=>i.is_primary)?.url;
  const discount = product.compare_price ? getDiscountPercentage(product.price, product.compare_price) : null;
  const inStock = product.stock_quantity > 0;
  const variants: any[] = product.variants || [];
  const colorVariants = variants.filter((v:any) => v.name?.toLowerCase() === 'color');
  const sizeVariants = variants.filter((v:any) => v.name?.toLowerCase() === 'size');
  const otherVariants = variants.filter((v:any) => !['color','size'].includes(v.name?.toLowerCase()));
  const isShoes = ['shoe','footwear'].some(c => product.category_slug?.includes(c)||product.category_name?.toLowerCase().includes(c));
  const isClothing = ['fashion','cloth','apparel','wear'].some(c => product.category_slug?.includes(c)||product.category_name?.toLowerCase().includes(c));
  const displaySizes = sizeVariants.length > 0 ? sizeVariants.map((v:any)=>v.value) : isShoes ? SIZES_SHOES : isClothing ? SIZES_CLOTHING : [];
  const displayColors = colorVariants.length > 0 ? colorVariants.map((v:any)=>v.value) : COLORS.map(c=>c.name);
  const effectivePrice = parseFloat(product.price) + parseFloat(selectedVariant?.price_modifier || 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="container-pad py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
            {[{label:'Home',href:'/'},{label:'Products',href:'/products'},
              ...(product.category_name?[{label:product.category_name,href:`/products?category=${product.category_slug}`}]:[]),
              {label:product.name,href:'#'}
            ].map((b,i,arr)=>(
              <span key={i} className="flex items-center gap-1.5">
                {i>0&&<ChevronRight size={12}/>}
                {i===arr.length-1
                  ? <span className="text-gray-600 font-medium truncate max-w-[160px]">{b.label}</span>
                  : <Link href={b.href} className="hover:text-accent">{b.label}</Link>}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="container-pad py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
              {displayImage
                ? <Image src={displayImage} alt={product.name} fill className="object-contain p-4" sizes="(max-width:1024px) 100vw, 50vw" priority/>
                : <div className="w-full h-full flex items-center justify-center"><Package size={64} className="text-gray-200"/></div>}
              {discount && <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl">−{discount}%</div>}
              {!inStock && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="badge bg-gray-800 text-white px-4 py-2">Out of Stock</span>
                </div>
              )}
              <button onClick={()=>{navigator.clipboard.writeText(window.location.href);toast.success('Link copied!');}}
                className="absolute top-4 right-4 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-gray-500 hover:text-accent">
                <Share2 size={15}/>
              </button>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {images.map((img:any, i:number)=>(
                  <button key={i} onClick={()=>setSelectedImage(i)}
                    className={cn('relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImage===i?'border-accent':'border-gray-200 hover:border-gray-300')}>
                    <Image src={img.url} alt={img.alt_text||product.name} fill className="object-cover" sizes="80px"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {product.brand && <span className="text-sm font-semibold text-accent">{product.brand}</span>}
              {product.is_new_arrival && <span className="badge bg-blue-100 text-blue-700 text-xs">🆕 New</span>}
              {product.is_best_seller && <span className="badge bg-red-100 text-red-700 text-xs">🔥 Best Seller</span>}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary-900 leading-tight">{product.name}</h1>

            {product.review_count > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_,i)=>(
                    <Star key={i} size={16} className={i<Math.round(product.average_rating)?'fill-amber-400 text-amber-400':'text-gray-200'}/>
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium">{Number(product.average_rating).toFixed(1)}</span>
                <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-3xl font-bold text-primary-900">{formatCurrency(effectivePrice)}</span>
              {product.compare_price && <>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.compare_price)}</span>
                <span className="badge bg-red-100 text-red-600 text-xs font-bold">
                  SAVE {formatCurrency(parseFloat(product.compare_price)-effectivePrice)}
                </span>
              </>}
            </div>

            {product.short_description && <p className="text-gray-600 leading-relaxed">{product.short_description}</p>}

            {/* Color selection */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2.5">
                Colour {selectedColor && <span className="font-normal text-accent">— {selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {displayColors.map(colorName => {
                  const hex = COLORS.find(c=>c.name===colorName)?.hex || '#ccc';
                  return (
                    <button key={colorName} title={colorName}
                      onClick={()=>setSelectedColor(selectedColor===colorName?null:colorName)}
                      className={cn('relative w-9 h-9 rounded-full border-2 transition-all',
                        selectedColor===colorName?'border-accent scale-110 shadow-md':'border-gray-300 hover:border-gray-400')}>
                      <span className="absolute inset-1 rounded-full" style={{background:hex,border:'1px solid rgba(0,0,0,0.1)'}}/>
                      {selectedColor===colorName && <CheckCircle size={14} className="absolute -top-1 -right-1 text-accent bg-white rounded-full"/>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size selection */}
            {displaySizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm font-semibold text-gray-700">
                    Size {selectedSize && <span className="font-normal text-accent">— {selectedSize}</span>}
                  </p>
                  <button className="text-xs text-accent hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displaySizes.map(size=>(
                    <button key={size} onClick={()=>setSelectedSize(selectedSize===size?null:size)}
                      className={cn('min-w-[44px] h-10 px-3 rounded-xl border-2 text-sm font-medium transition-all',
                        selectedSize===size?'border-accent bg-accent text-white':'border-gray-200 text-gray-700 hover:border-accent hover:text-accent')}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other variants */}
            {otherVariants.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5">Options</p>
                <div className="flex flex-wrap gap-2">
                  {otherVariants.map((v:any)=>(
                    <button key={v.id} onClick={()=>setSelectedVariant(selectedVariant?.id===v.id?null:v)}
                      className={cn('px-4 py-2 rounded-xl border-2 text-sm transition-all',
                        selectedVariant?.id===v.id?'border-accent bg-accent text-white':'border-gray-200 hover:border-accent')}>
                      {v.value}{v.price_modifier>0&&<span className="ml-1 text-xs opacity-80">+{formatCurrency(v.price_modifier)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2.5">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={()=>setQuantity(q=>Math.max(1,q-1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                    <Minus size={16}/>
                  </button>
                  <span className="w-14 text-center font-bold text-gray-800">{quantity}</span>
                  <button onClick={()=>setQuantity(q=>Math.min(product.stock_quantity,q+1))}
                    disabled={quantity>=product.stock_quantity}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-600 disabled:opacity-30">
                    <Plus size={16}/>
                  </button>
                </div>
                <span className={cn('text-sm font-medium',inStock?'text-green-600':'text-red-500')}>
                  {inStock?`${product.stock_quantity} in stock`:'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleAddToCart} disabled={!inStock||cartMutation.isPending}
                className={cn('flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all border-2',
                  addedToCart?'border-green-500 bg-green-50 text-green-700':'border-primary-900 bg-primary-900 hover:bg-accent hover:border-accent text-white',
                  !inStock&&'opacity-50 cursor-not-allowed')}>
                {addedToCart?<><CheckCircle size={18}/>Added!</>:cartMutation.isPending?'Adding…':<><ShoppingCart size={18}/>Add to Cart</>}
              </button>
              <button onClick={handleBuyNow} disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm bg-accent hover:bg-orange-600 text-white transition-colors disabled:opacity-50">
                <Zap size={18}/> Buy Now
              </button>
              <button onClick={()=>wishlistMutation.mutate()}
                className={cn('w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all flex-shrink-0',
                  wishlisted?'border-red-400 bg-red-50 text-red-500':'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400')}>
                <Heart size={20} className={wishlisted?'fill-current':''}/>
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              {[
                {icon:<Truck size={16} className="text-accent"/>, text:'Fast Delivery',sub:'Nairobi & countrywide'},
                {icon:<Shield size={16} className="text-emerald-500"/>, text:'Genuine Product',sub:'100% authentic'},
                {icon:<RotateCcw size={16} className="text-blue-500"/>, text:'Easy Returns',sub:'30-day policy'},
              ].map(b=>(
                <div key={b.text} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-center mb-1">{b.icon}</div>
                  <p className="text-xs font-semibold text-gray-700">{b.text}</p>
                  <p className="text-[10px] text-gray-400">{b.sub}</p>
                </div>
              ))}
            </div>

            {product.sku && <p className="text-xs text-gray-400">SKU: <span className="font-mono">{product.sku}</span></p>}
          </div>
        </div>

        {/* Full description */}
        {product.description && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="font-display text-xl font-bold text-primary-900 mb-4">Product Description</h3>
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</div>
          </div>
        )}

        {/* Related products */}
        {(product.related_products||[]).length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="font-display text-xl font-bold text-primary-900 mb-6">You May Also Like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {product.related_products.slice(0,6).map((p:any)=>(
                <Link key={p.id} href={`/products/${p.slug}`}
                  className="card group overflow-hidden hover:shadow-card-hover transition-all hover:-translate-y-1">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {p.primary_image
                      ? <Image src={p.primary_image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="200px"/>
                      : <Package size={24} className="text-gray-200 absolute inset-0 m-auto"/>}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-sm font-bold text-accent">{formatCurrency(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
