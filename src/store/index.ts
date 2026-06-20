import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CartItem, WishlistItem } from '@/types';

// ── Auth Store ────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        if (typeof window !== 'undefined') localStorage.setItem('access_token', accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('access_token');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      updateUser: (partial) => set(state => ({ user: state.user ? { ...state.user, ...partial } : null })),
    }),
    { name: 'shopke-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);

// ── Cart Store (server-synced for auth users, local for guests) ──
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
  couponCode: string | null;
  setCart: (items: CartItem[], summary: { subtotal: number; shipping: number; discount?: number; total: number; item_count: number }) => void;
  addItem: (item: CartItem) => void;
  updateItem: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCoupon: (code: string | null, discount: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,
      subtotal: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      itemCount: 0,
      couponCode: null,
      setCart: (items, summary) => set({
        items,
        subtotal: summary.subtotal,
        shipping: summary.shipping,
        discount: summary.discount || 0,
        total: summary.total,
        itemCount: summary.item_count,
      }),
      addItem: (newItem) => set(state => {
        const existing = state.items.find(i => i.id === newItem.id);
        const items = existing
          ? state.items.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i)
          : [...state.items, newItem];
        const subtotal = items.reduce((s, i) => s + i.effective_price * i.quantity, 0);
        const shipping = subtotal >= 3000 ? 0 : 300;
        return { items, subtotal, shipping, total: subtotal + shipping - state.discount, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
      }),
      updateItem: (id, quantity) => set(state => {
        const items = quantity === 0
          ? state.items.filter(i => i.id !== id)
          : state.items.map(i => i.id === id ? { ...i, quantity } : i);
        const subtotal = items.reduce((s, i) => s + i.effective_price * i.quantity, 0);
        const shipping = subtotal >= 3000 ? 0 : 300;
        return { items, subtotal, shipping, total: subtotal + shipping - state.discount, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
      }),
      removeItem: (id) => set(state => {
        const items = state.items.filter(i => i.id !== id);
        const subtotal = items.reduce((s, i) => s + i.effective_price * i.quantity, 0);
        const shipping = subtotal >= 3000 ? 0 : 300;
        return { items, subtotal, shipping, total: subtotal + shipping - state.discount, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
      }),
      clearCart: () => set({ items: [], subtotal: 0, shipping: 0, discount: 0, total: 0, itemCount: 0, couponCode: null }),
      setOpen: (isOpen) => set({ isOpen }),
      setLoading: (isLoading) => set({ isLoading }),
      setCoupon: (code, discount) => set(state => ({
        couponCode: code,
        discount,
        total: state.subtotal + state.shipping - discount,
      })),
    }),
    { name: 'shopke-cart', partialize: (s) => ({ items: s.items, couponCode: s.couponCode }) }
  )
);

// ── Wishlist Store ─────────────────────────────────────
interface WishlistState {
  items: WishlistItem[];
  itemIds: Set<string>;
  setWishlist: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      itemIds: new Set(),
      setWishlist: (items) => set({ items, itemIds: new Set(items.map(i => i.product_id)) }),
      addItem: (item) => set(state => ({
        items: [item, ...state.items],
        itemIds: new Set(Array.from(state.itemIds).concat(item.product_id)),
      })),
      removeItem: (productId) => set(state => ({
        items: state.items.filter(i => i.product_id !== productId),
        itemIds: new Set(Array.from(state.itemIds).filter(id => id !== productId)),
      })),
      hasItem: (productId) => get().itemIds.has(productId),
    }),
    {
      name: 'shopke-wishlist',
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.itemIds = new Set(state.items.map(i => i.product_id));
      },
    }
  )
);

// ── UI Store ──────────────────────────────────────────
interface UIState {
  searchQuery: string;
  searchOpen: boolean;
  mobileMenuOpen: boolean;
  setSearchQuery: (q: string) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  searchOpen: false,
  mobileMenuOpen: false,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
}));
