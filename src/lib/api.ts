import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// Auto-refresh on 401 TOKEN_EXPIRED
api.interceptors.response.use(
  res => res,
  async (error: AxiosError<{ code?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && error.response.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        localStorage.setItem('access_token', newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access_token');
        window.location.href = '/auth/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: object) => api.put('/auth/profile', data),
  changePassword: (data: object) => api.put('/auth/password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.get(`/auth/verify/${token}`),
};

// ── Products ──────────────────────────────────────────
export const productApi = {
  getAll: (params?: object) => api.get('/products', { params }),
  getOne: (slug: string) => api.get(`/products/${slug}`),
  search: (q: string) => api.get('/products/search/suggestions', { params: { q } }),
  getFilters: (category?: string) => api.get('/products/filters', { params: { category } }),
  getReviews: (id: string, params?: object) => api.get(`/products/${id}/reviews`, { params }),
  createReview: (data: object) => api.post('/reviews', data),
};

// ── Categories ────────────────────────────────────────
export const categoryApi = {
  getAll: () => api.get('/categories'),
};

// ── Cart ──────────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/cart'),
  add: (data: { product_id: string; quantity: number; variant_id?: string }) => api.post('/cart', data),
  update: (id: string, quantity: number) => api.put(`/cart/${id}`, { quantity }),
  remove: (id: string) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

// ── Wishlist ──────────────────────────────────────────
export const wishlistApi = {
  get: () => api.get('/wishlist'),
  toggle: (product_id: string) => api.post('/wishlist', { product_id }),
};

// ── Orders ────────────────────────────────────────────
export const orderApi = {
  create: (data: object) => api.post('/orders', data),
  getAll: (params?: object) => api.get('/orders', { params }),
  getOne: (id: string) => api.get(`/orders/${id}`),
};

// ── Payments ──────────────────────────────────────────
export const paymentApi = {
  createStripeIntent: (order_id: string) => api.post('/payments/stripe/create-intent', { order_id }),
  stkPush: (order_id: string, phone: string) => api.post('/payments/mpesa/stk-push', { order_id, phone }),
  mpesaStatus: (checkout_request_id: string) => api.get(`/payments/mpesa/status/${checkout_request_id}`),
  createPaypalOrder: (order_id: string) => api.post('/payments/paypal/create-order', { order_id }),
  capturePaypal: (paypal_order_id: string, order_id: string) =>
    api.post('/payments/paypal/capture', { paypal_order_id, order_id }),
};

// ── Coupons ───────────────────────────────────────────
export const couponApi = {
  validate: (code: string, order_amount: number) => api.post('/coupons/validate', { code, order_amount }),
};

// ── Banners ───────────────────────────────────────────
export const bannerApi = {
  get: (position?: string) => api.get('/banners', { params: { position } }),
};

// ── Admin ─────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrders: (params?: object) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, data: object) => api.put(`/admin/orders/${id}/status`, data),
  getProducts: (params?: object) => api.get('/admin/products', { params }),
  createProduct: (data: object) => api.post('/admin/products', data),
  updateProduct: (id: string, data: object) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  getCustomers: (params?: object) => api.get('/admin/customers', { params }),
  getCategories: () => api.get('/categories'),
  createCategory: (data: object) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: object) => api.put(`/admin/categories/${id}`, data),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data: object) => api.post('/admin/coupons', data),
};
