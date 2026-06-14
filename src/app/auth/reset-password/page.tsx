'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type Form = z.infer<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const pwd = watch('password', '');
  const checks = [
    { label: 'At least 8 characters', ok: pwd.length >= 8 },
    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(pwd) },
    { label: 'Contains a number', ok: /\d/.test(pwd) },
  ];

  const onSubmit = async (data: Form) => {
    if (!token) { toast.error('Invalid reset link'); return; }
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Reset failed. Link may have expired.');
    }
  };

  if (!token) {
    return (
      <div className="text-center py-8">
        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="font-bold text-xl mb-2">Invalid Reset Link</h2>
        <p className="text-gray-500 text-sm mb-6">This link is invalid or has expired.</p>
        <Link href="/auth/forgot-password" className="btn-primary">Request New Link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="font-bold text-xl mb-2">Password Reset!</h2>
        <p className="text-gray-500 text-sm mb-6">Your password has been changed successfully.</p>
        <Link href="/auth/login" className="btn-primary w-full flex items-center justify-center">
          Sign In with New Password
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Set New Password</h1>
        <p className="text-sm text-gray-500">Choose a strong password for your account.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">New Password</label>
          <div className="relative">
            <input {...register('password')} type={showPwd ? 'text' : 'password'}
              placeholder="Min. 8 characters" className="input pr-10" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}

          {/* Strength indicators */}
          {pwd && (
            <div className="mt-2 space-y-1">
              {checks.map(c => (
                <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${c.ok ? 'bg-green-500' : 'bg-gray-200'}`} />
                  {c.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
          <input {...register('confirmPassword')} type="password" placeholder="Re-enter password"
            className="input" autoComplete="new-password" />
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5">
          {isSubmitting ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl font-bold text-primary-900">
            Shop<span className="text-accent">KE</span>
          </Link>
        </div>
        <div className="card p-8">
          <Suspense fallback={<div className="text-center py-8 text-gray-400">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
