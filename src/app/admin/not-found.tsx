import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-[120px] font-bold text-gray-100 leading-none select-none">404</div>
        <div className="mt-[-20px] mb-6">
          <h1 className="font-display text-2xl font-bold text-primary-900 mb-3">Page Not Found</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">Go Home</Link>
          <Link href="/products" className="btn-secondary">Browse Products</Link>
        </div>
      </div>
    </div>
  );
}
