import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Toaster } from 'react-hot-toast';
import "@uploadthing/react/styles.css";

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: "ShopKE — Kenya's #1 Online Store", template: '%s | ShopKE' },
  description: 'Shop thousands of authentic products delivered anywhere in Kenya. Fast, secure, and always the best prices.',
  keywords: ['online shopping', 'Kenya', 'electronics', 'fashion', 'ShopKE'],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'ShopKE',
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
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#0F172A', color: '#fff', borderRadius: '10px', fontSize: '14px' },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}