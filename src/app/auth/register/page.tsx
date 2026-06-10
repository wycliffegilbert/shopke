'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type RegisterForm = z.infer<typeof registerSchema>;

const PERKS = ['Free shipping on orders KES 3,000+', 'Exclusive member deals & early access', 'Easy order tracking & returns', 'M-Pesa, Card & PayPal checkout'];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await authApi.register({ name: data.name, email: data.email, password: data.password, phone: data.phone });
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      toast.success('Account created! Welcome to ShopKE 🎉');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Panel */}
        <div className="hidden lg:block bg-primary-900 text-white rounded-3xl p-10">
          <Link href="/" className="font-display text-2xl font-bold">Shop<span className="text-accent">KE</span></Link>
          <h2 className="font-display text-3xl font-bold mt-8 mb-3 leading-snug">Join 120,000+<br />Kenyan shoppers</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">Create a free account and start enjoying the best online shopping experience in Kenya.</p>
          <ul className="space-y-4">
            {PERKS.map(p => (
              <li key={p} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-accent" />
                </div>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div>
          <div className="text-center lg:text-left mb-6">
            <Link href="/" className="lg:hidden inline-flex font-display text-xl font-bold text-primary-900 mb-4">
              Shop<span className="text-accent">KE</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Create your account</h1>
            <p className="text-sm text-gray-500">It's free and takes less than a minute</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input {...register('name')} placeholder="Wanjiru Kamau" className="input" autoComplete="name" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input {...register('email')} type="email" placeholder="you@example.com" className="input" autoComplete="email" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-gray-400">(optional)</span></label>
                <input {...register('phone')} type="tel" placeholder="0712 345 678" className="input" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters" className="input pr-10" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input {...register('confirmPassword')} type="password" placeholder="Re-enter your password" className="input" autoComplete="new-password" />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
              </p>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                <UserPlus size={17} />
                {isSubmitting ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-accent font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
