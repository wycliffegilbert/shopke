import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';
import { Toaster } from 'react-hot-toast';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ShopKE — Kenya\'s Premier Online Store',
    template: '%s | ShopKE',
  },
  description: 'Shop the best products in Kenya. Electronics, Fashion, Home & More with fast delivery and M-Pesa payments.',
  keywords: ['shopping', 'kenya', 'online store', 'electronics', 'fashion', 'nairobi'],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: siteUrl,
    siteName: 'ShopKE',
    title: 'ShopKE — Kenya\'s Premier Online Store',
    description: 'Shop the best products in Kenya with fast delivery.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopKE',
    description: 'Kenya\'s Premier Online Store',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${dmSans.variable} ${playfair.variable} font-sans antialiased bg-gray-50`}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontSize: '14px' },
            success: { iconTheme: { primary: '#F97316', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
