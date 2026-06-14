'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

const schema = z.object({ email: z.string().email('Invalid email address') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      await authApi.forgotPassword(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl font-bold text-primary-900">
            Shop<span className="text-accent">KE</span>
          </Link>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="font-bold text-xl mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-1">We sent a password reset link to:</p>
              <p className="font-semibold text-gray-800 mb-6">{sentEmail}</p>
              <p className="text-xs text-gray-400 mb-6">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-accent hover:underline">try again</button>.
              </p>
              <Link href="/auth/login" className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-accent" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 mb-1">Forgot Password?</h1>
                <p className="text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email Address</label>
                  <input {...register('email')} type="email" placeholder="you@example.com"
                    className="input" autoComplete="email" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5">
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <div className="text-center mt-5">
                <Link href="/auth/login" className="text-sm text-gray-500 hover:text-accent flex items-center justify-center gap-1.5">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
