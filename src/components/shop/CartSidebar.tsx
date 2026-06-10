'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '@/store';
import { cartApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

export default function CartSidebar() {
  const { isOpen, items, subtotal, shipping, discount, total, itemCount, setOpen, setCart, updateItem, removeItem, setLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Sync cart from server when authenticated
  const { data: serverCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
    enabled: isAuthenticated,
    select: d => d.data.data,
  });

  useEffect(() => {
    if (serverCart) setCart(serverCart.items, serverCart.summary);
  }, [serverCart]);

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => cartApi.update(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => cartApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed');
    },
  });

  const handleQuantity = (id: string, current: number, delta: number) => {
    const newQty = current + delta;
    if (newQty < 1) return;
    if (isAuthenticated) { updateMutation.mutate({ id, quantity: newQty }); }
    updateItem(id, newQty);
  };

  const handleRemove = (id: string) => {
    if (isAuthenticated) { removeMutation.mutate(id); }
    removeItem(id);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-accent" />
            <h2 className="font-display font-bold text-lg">Shopping Cart</h2>
            {itemCount > 0 && (
              <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">{itemCount}</span>
            )}
          </div>
          <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="font-semibold text-gray-800 mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-500 mb-6">Add some products to get started</p>
              <button onClick={() => setOpen(false)} className="btn-primary">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                  ) : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`} onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-gray-800 hover:text-accent line-clamp-2 leading-tight">
                    {item.name}
                  </Link>
                  {item.variant_value && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.variant_name}: {item.variant_value}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-1">
                      <button onClick={() => handleQuantity(item.id, item.quantity, -1)}
                        className="p-1 hover:text-accent transition-colors" disabled={item.quantity <= 1}>
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => handleQuantity(item.id, item.quantity, 1)}
                        className="p-1 hover:text-accent transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-accent">
                        {formatCurrency(item.effective_price * item.quantity)}
                      </span>
                      <button onClick={() => handleRemove(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-6 py-5 space-y-4 bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>−{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-accent">{formatCurrency(total)}</span>
              </div>
            </div>

            {shipping > 0 && (
              <p className="text-xs text-gray-500 bg-orange-50 px-3 py-2 rounded-lg">
                🚚 Add {formatCurrency(3000 - subtotal)} more for free shipping!
              </p>
            )}

            <div className="space-y-2">
              <Link href="/checkout" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-primary-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-accent transition-colors">
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
              <button onClick={() => setOpen(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-1">
                Continue Shopping
              </button>
            </div>

            {/* Payment logos */}
            <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
              {['M-Pesa', 'Visa', 'Mastercard', 'PayPal'].map(m => (
                <span key={m} className="text-[10px] font-semibold text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
