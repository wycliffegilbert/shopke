import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartSidebar from '@/components/shop/CartSidebar';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartSidebar />
      <WhatsAppButton />
    </div>
  );
}