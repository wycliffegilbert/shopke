'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Package, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { authApi, productApi, categoryApi } from '@/lib/api';
import { Category, Product } from '@/types';
import { cn, formatCurrency, debounce } from '@/lib/utils';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Electronics', slug: 'electronics' },
  { label: 'Fashion', slug: 'fashion' },
  { label: 'Home & Kitchen', slug: 'home-kitchen' },
  { label: 'Beauty', slug: 'beauty-health' },
  { label: 'Sports', slug: 'sports' },
];

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { itemCount, setOpen } = useCartStore();
  const { searchQuery, searchOpen, mobileMenuOpen, setSearchQuery, setSearchOpen, setMobileMenuOpen } = useUIStore();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = debounce(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const { data } = await productApi.search(q);
      setSuggestions(data.data || []);
    } catch {}
  }, 300);

  useEffect(() => { debouncedSearch(searchQuery); }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-accent text-white text-center py-2.5 text-xs sm:text-sm font-medium">
        🎉 Free shipping on orders above KES 3,000 &nbsp;·&nbsp;
        <span className="opacity-80">Use code <strong>WELCOME20</strong> for 20% off first order</span>
      </div>

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="container-pad">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="font-display text-xl font-bold text-primary-900 flex-shrink-0">
            Trends<span className="text-accent">Vault</span>
            </Link>

            {/* Category Links */}
            <div className="hidden lg:flex items-center gap-1 ml-4">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.slug}
                  href={`/products?category=${link.slug}`}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-orange-50 hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Search */}
            <div ref={searchRef} className="flex-1 max-w-lg mx-4 relative hidden sm:block">
              <form onSubmit={handleSearch}>
                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                  <Search className="ml-3 text-gray-400 flex-shrink-0" size={16} />
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); }} className="mr-2 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </form>

              {/* Suggestions Dropdown */}
              {searchOpen && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  {suggestions.map(p => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      onClick={() => { setSearchOpen(false); setSuggestions([]); setSearchQuery(''); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.primary_image ? (
                          <Image src={p.primary_image} alt={p.name} width={40} height={40} className="object-cover" />
                        ) : <span className="text-lg">📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-accent font-semibold">{formatCurrency(p.price)}</p>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/products?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setSearchOpen(false)}
                    className="block px-4 py-2.5 text-xs text-center text-accent font-semibold border-t hover:bg-gray-50"
                  >
                    See all results for "{searchQuery}" →
                  </Link>
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Mobile search */}
              <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSearchOpen(!searchOpen)}>
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative hidden sm:block">
                <Heart size={20} className="text-gray-600" />
              </Link>

              {/* Cart */}
              <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <ShoppingCart size={20} className="text-gray-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[80px] truncate">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      {user?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-accent">
                          <Settings size={15} /> Admin Dashboard
                        </Link>
                      )}
                      <Link href="/account" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={15} /> My Account
                      </Link>
                      <Link href="/account/orders" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Package size={15} /> My Orders
                      </Link>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="hidden sm:flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent transition-colors">
                  <User size={15} /> Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white pb-4">
            <div className="container-pad pt-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4 sm:hidden">
                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 px-3">
                  <Search size={16} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-3 bg-transparent text-sm outline-none"
                  />
                </div>
              </form>
              <div className="grid grid-cols-2 gap-2">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.slug}
                    href={`/products?category=${link.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {!isAuthenticated && (
                <div className="flex gap-3 mt-4">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 btn-primary text-center">Sign In</Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 btn-secondary text-center">Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
