import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OrderStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency = 'KES') =>
  `${currency} ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric', ...options,
  });

export const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const getDiscountPercentage = (price: number | string, comparePrice: number | string): number => {
  const p = parseFloat(price.toString());
  const c = parseFloat(comparePrice.toString());
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
};

export const truncate = (str: string, length: number) =>
  str?.length > length ? `${str.substring(0, length)}...` : str;

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  processing: { label: 'Processing', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  shipped: { label: 'Shipped', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  delivered: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  refunded: { label: 'Refunded', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const ORDER_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered',
];

export const getOrderStep = (status: OrderStatus) => ORDER_STEPS.indexOf(status);

export const validatePhone = (phone: string) => /^(?:\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''));

export const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\s/g, '');
  return cleaned.startsWith('0') ? `254${cleaned.slice(1)}` : cleaned;
};

export const generateStars = (rating: number) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
};

export const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const debounce = <T extends (...args: Parameters<T>) => void>(fn: T, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};
