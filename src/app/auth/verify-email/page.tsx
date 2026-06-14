'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') return (
    <div className="text-center py-8">
      <Loader2 size={40} className="animate-spin text-accent mx-auto mb-4" />
      <p className="text-gray-500">Verifying your email…</p>
    </div>
  );

  if (status === 'success') return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-500" />
      </div>
      <h2 className="font-bold text-xl mb-2">Email Verified!</h2>
      <p className="text-gray-500 text-sm mb-6">Your email has been successfully verified. You can now access all features.</p>
      <Link href="/" className="btn-primary w-full flex items-center justify-center">Continue Shopping</Link>
    </div>
  );

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle size={32} className="text-red-500" />
      </div>
      <h2 className="font-bold text-xl mb-2">Verification Failed</h2>
      <p className="text-gray-500 text-sm mb-6">This link is invalid or has expired. Please request a new verification email.</p>
      <Link href="/" className="btn-primary w-full flex items-center justify-center">Go Home</Link>
    </div>
  );
}

export default function VerifyEmailPage() {
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
            <VerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
