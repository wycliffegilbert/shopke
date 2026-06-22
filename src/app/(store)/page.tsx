'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShoppingBag, Star, TrendingUp, Zap, Shield, RotateCcw, Headphones, ChevronLeft, ChevronRight, Sparkles, Package } from 'lucide-react';
import { productApi, categoryApi } from '@/lib/api';
import ProductCard from '@/components/shop/ProductCard';
import { cn, formatCurrency, getDiscountPercentage } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';

const TESTIMONIALS = [
  { name: 'Wanjiru Kamau', location: 'Nairobi', rating: 5, text: 'Ordered a MacBook Friday evening — delivered Saturday noon in Westlands. Packaging was excellent and price was the best I found anywhere online.', avatar: 'WK', color: 'bg-slate-800' },
  { name: 'Otieno Maina', location: 'Kisumu', rating: 5, text: 'M-Pesa checkout is seamless and instant. ShopKE has become my go-to for electronics. Great prices and fast delivery every time!', avatar: 'OM', color: 'bg-accent' },
  { name: 'Amina Njenga', location: 'Mombasa', rating: 5, text: 'Return policy is hassle-free and customer support replied within minutes on WhatsApp. My whole family shops here now.', avatar: 'AN', color: 'bg-emerald-600' },
];

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '📱', fashion: '👗', 'home-kitchen': '🏠',
  'beauty-health': '💄', sports: '⚽', 'books-media': '📚',
};

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [countdown, setCountdown] = useState({ h: 8, m: 34, s: 22 });
  const [isPaused, setIsPaused] = useState(false);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) h = 23;
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
    select: d => d.data.data,
  });

  const { data: featuredData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.getAll({ featured: true, limit: 8 }),
    select: d => d.data.data,
  });

  // Hero slideshow pulls real New Arrivals — falls back to featured/best sellers if empty
  const { data: heroNewArrivals } = useQuery({
    queryKey: ['products', 'hero-new-arrivals'],
    queryFn: () => productApi.getAll({ new_arrival: true, limit: 6, sort: 'created_at', order: 'desc' }),
    select: d => d.data.data,
  });

  const { data: newArrivalsData } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productApi.getAll({ new_arrival: true, limit: 4 }),
    select: d => d.data.data,
  });

  const { data: bestSellersData } = useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: () => productApi.getAll({ best_seller: true, limit: 4 }),
    select: d => d.data.data,
  });

  // Build hero slides from real new arrival products
  const heroSlides = useMemo(() => {
    const list = heroNewArrivals || [];
    if (!list.length) return [];
    return list.slice(0, 6).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compare_price: p.compare_price,
      brand: p.brand,
      image: p.primary_image || p.images?.[0]?.url,
      rating: p.average_rating,
      reviewCount: p.review_count,
    }));
  }, [heroNewArrivals]);

  const slideCount = heroSlides.length;

  // Auto-advance slides
  useEffect(() => {
    if (isPaused || slideCount <= 1) return;
    const t = setInterval(() => setSlide(s => (s + 1) % slideCount), 5000);
    return () => clearInterval(t);
  }, [slideCount, isPaused]);

  const nextSlide = () => setSlide(s => (s + 1) % Math.max(slideCount, 1));
  const prevSlide = () => setSlide(s => (s - 1 + slideCount) % Math.max(slideCount, 1));

  const currentSlide = heroSlides[slide];
  const currentDiscount = currentSlide?.compare_price
    ? getDiscountPercentage(currentSlide.price, currentSlide.compare_price)
    : null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div>
      {/* ── HERO: New Arrivals Slideshow ────────────────── */}
      <section
        className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #F97316 0%, transparent 60%)' }} />

        {!heroSlides.length ? (
          // Loading skeleton
          <div className="container-pad py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 animate-pulse">
            <div>
              <div className="h-7 w-40 bg-white/10 rounded-full mb-6" />
              <div className="h-14 w-3/4 bg-white/10 rounded-xl mb-3" />
              <div className="h-14 w-1/2 bg-white/10 rounded-xl mb-6" />
              <div className="h-5 w-full max-w-md bg-white/10 rounded mb-8" />
              <div className="flex gap-4">
                <div className="h-12 w-36 bg-white/10 rounded-xl" />
                <div className="h-12 w-36 bg-white/10 rounded-xl" />
              </div>
            </div>
            <div className="h-56 sm:h-72 lg:h-80 bg-white/5 rounded-3xl" />
          </div>
        ) : (
          <div className="container-pad py-10 sm:py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
            {/* Product image card — visible on ALL screen sizes, appears first on mobile */}
            <div className="flex justify-center order-1 lg:order-2">
              <div className="relative w-full max-w-xs sm:max-w-sm lg:w-80">
                <div key={currentSlide.id} className="bg-white/8 border border-white/15 rounded-3xl p-4 sm:p-6 backdrop-blur-sm animate-fade-in">
                  <div className="relative bg-white/10 rounded-2xl h-48 sm:h-64 lg:h-72 overflow-hidden mb-4 sm:mb-5">
                    {currentSlide.image ? (
                      <Image
                        src={currentSlide.image}
                        alt={currentSlide.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 320px, 384px"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={48} className="text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-white truncate">{currentSlide.name}</p>
                      <p className="text-gray-400 text-xs sm:text-sm">{currentSlide.brand || 'New In'}</p>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-accent font-display flex-shrink-0 ml-2">
                      {formatCurrency(currentSlide.price)}
                    </div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl flex items-center gap-1">
                  <Sparkles size={11} /> Just Dropped
                </div>

                {/* Prev / Next arrows — visible on all screens */}
                {slideCount > 1 && (
                  <>
                    <button onClick={prevSlide}
                      className="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-5 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextSlide}
                      className="absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-5 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div key={`text-${currentSlide.id}`} className="animate-fade-in order-2 lg:order-1 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-orange-300 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <Sparkles size={13} /> New Arrival
                {currentSlide.brand && <span className="text-white/60">· {currentSlide.brand}</span>}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 line-clamp-2">
                {currentSlide.name}
              </h1>

              {currentSlide.rating > 0 && (
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 sm:mb-5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} className={i < Math.round(currentSlide.rating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-300">{Number(currentSlide.rating).toFixed(1)} ({currentSlide.reviewCount || 0} reviews)</span>
                </div>
              )}

              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 sm:mb-8">
                <span className="font-display text-3xl sm:text-4xl font-bold text-accent">
                  {formatCurrency(currentSlide.price)}
                </span>
                {currentSlide.compare_price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatCurrency(currentSlide.compare_price)}</span>
                    {currentDiscount && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">−{currentDiscount}%</span>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
                <Link href={`/products/${currentSlide.slug}`}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors">
                  <ShoppingBag size={18} /> View Product
                </Link>
                <Link href="/products?new_arrival=true"
                  className="inline-flex items-center gap-2 border border-white/20 hover:bg-white/10 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors">
                  All New Arrivals <ArrowRight size={16} />
                </Link>
              </div>

              <div className="flex justify-center lg:justify-start gap-6 sm:gap-10 mt-8 sm:mt-10">
                {[['50K+', 'Products'], ['120K+', 'Customers'], ['4.9★', 'Rating']].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-2xl font-bold text-white">{n}</div>
                    <div className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Slide Indicators */}
        {slideCount > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroSlides.map((_: any, i: number) => (
              <button key={i} onClick={() => setSlide(i)}
                className={cn('rounded-full transition-all', i === slide ? 'bg-accent w-8 h-2' : 'bg-white/30 w-2 h-2 hover:bg-white/50')} />
            ))}
          </div>
        )}
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────── */}
      <section className="container-pad pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Featured Products</h2>
            <p className="text-gray-500 text-sm mt-1">Hand-picked deals just for you</p>
          </div>
          <Link href="/products?featured=true" className="text-sm text-accent font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredData?.map((p: any) => <ProductCard key={p.id} product={p} />)}
          {!featuredData && [...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-4 bg-gray-100 rounded w-3/5" />
                <div className="h-6 bg-gray-100 rounded w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEW ARRIVALS + BEST SELLERS ──────────────────── */}
      <section className="container-pad pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* New Arrivals */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="section-title text-2xl">New Arrivals</h2>
              <Link href="/products?new_arrival=true" className="text-sm text-accent font-semibold flex items-center gap-1">
                All new <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {newArrivalsData?.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>

          {/* Best Sellers */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="section-title text-2xl">Best Sellers</h2>
              <Link href="/products?best_seller=true" className="text-sm text-accent font-semibold flex items-center gap-1">
                All popular <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {bestSellersData?.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES BAR ─────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-pad py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <TrendingUp size={20} className="text-accent" />, title: 'Free Delivery', sub: 'Orders over KES 3,000' },
              { icon: <Shield size={20} className="text-emerald-500" />, title: 'Secure Payment', sub: 'M-Pesa, Cards & PayPal' },
              { icon: <RotateCcw size={20} className="text-blue-500" />, title: 'Easy Returns', sub: '30-day return policy' },
              { icon: <Headphones size={20} className="text-purple-500" />, title: '24/7 Support', sub: 'WhatsApp & live chat' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      <section className="container-pad py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Browse Categories</h2>
            <p className="text-gray-500 text-sm mt-1">Find exactly what you're looking for</p>
          </div>
          <Link href="/products" className="text-sm text-accent font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            All categories <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {(categoriesData || []).map((cat: any) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`}
              className="card p-5 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group">
              <div className="text-3xl mb-3">{CATEGORY_ICONS[cat.slug] || '🛍️'}</div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-accent transition-colors">{cat.name}</p>
              <p className="text-xs text-gray-400 mt-1">{cat.product_count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FLASH SALE BANNER ────────────────────────────── */}
      <section className="container-pad pb-14">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #F97316, transparent 60%)' }} />
          <div className="relative z-10 text-white">
            <span className="inline-block bg-accent/20 border border-accent/30 text-orange-300 px-4 py-1 rounded-full text-xs font-semibold mb-4">⚡ Flash Sale — Today Only</span>
            <h3 className="font-display text-3xl sm:text-4xl font-bold mb-3">Up to <span className="text-accent">30% Off</span><br />Top Electronics</h3>
            <p className="text-gray-400 mb-6 max-w-xs">Limited-time deals on smartphones, laptops and more.</p>
            <Link href="/products?sale=true&category=electronics" className="inline-flex items-center gap-2 bg-accent hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
              Browse Deals <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative z-10 text-center text-white flex-shrink-0">
            <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider">Ends in</p>
            <div className="flex gap-3">
              {[['h', pad(countdown.h)], ['m', pad(countdown.m)], ['s', pad(countdown.s)]].map(([label, val]) => (
                <div key={label} className="bg-white/10 border border-white/15 rounded-xl p-4 min-w-[64px] text-center">
                  <div className="font-display text-3xl font-bold">{val}</div>
                  <div className="text-[10px] text-gray-400 uppercase mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="container-pad">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">What Kenyans Say</h2>
              <p className="text-gray-500 text-sm mt-1">Trusted by 120,000+ happy customers</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-bold text-primary-900">4.9</span>
              <div>
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}</div>
                <p className="text-xs text-gray-500">12,847 reviews</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={cn('card p-6', i === 0 && 'border-accent bg-orange-50/50')}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', t.color)}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      ✓ Verified Purchase
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────── */}
      <section className="container-pad py-16">
        <div className="bg-primary-900 rounded-3xl p-10 sm:p-16 text-center text-white">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Get Deals Before Anyone Else</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join 50,000+ subscribers and get exclusive deals, new arrivals, and promo codes delivered to your inbox.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-accent transition-colors text-sm" />
            <button className="btn-primary whitespace-nowrap px-6">Subscribe →</button>
          </div>
          <p className="text-xs text-gray-500 mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}
