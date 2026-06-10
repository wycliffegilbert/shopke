import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: [
    { label: 'Electronics', href: '/products?category=electronics' },
    { label: 'Fashion', href: '/products?category=fashion' },
    { label: 'Home & Kitchen', href: '/products?category=home-kitchen' },
    { label: 'Beauty & Health', href: '/products?category=beauty-health' },
    { label: 'Sports & Outdoors', href: '/products?category=sports' },
    { label: 'Flash Deals', href: '/products?sale=true' },
  ],
  Account: [
    { label: 'My Account', href: '/account' },
    { label: 'Order History', href: '/account/orders' },
    { label: 'Track Package', href: '/account/orders' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Returns & Refunds', href: '/returns' },
  ],
  Company: [
    { label: 'About ShopKE', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Become a Vendor', href: '/vendor' },
    { label: 'Affiliate Program', href: '/affiliate' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-gray-400 mt-20">
      {/* Top Bar */}
      <div className="border-b border-white/10">
        <div className="container-pad py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🚚</div>
            <div>
              <p className="text-white font-semibold text-sm">Free Delivery</p>
              <p className="text-xs">On orders above KES 3,000</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🔒</div>
            <div>
              <p className="text-white font-semibold text-sm">Secure Payments</p>
              <p className="text-xs">M-Pesa, Visa, Mastercard & PayPal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">↩️</div>
            <div>
              <p className="text-white font-semibold text-sm">Easy Returns</p>
              <p className="text-xs">30-day hassle-free return policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-pad py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="font-display text-2xl font-bold text-white">
              Shop<span className="text-accent">KE</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              Kenya's premier online marketplace. Fast delivery, genuine products, and unbeatable prices — serving all 47 counties.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2.5">
                <MapPin size={14} className="text-accent flex-shrink-0" />
                <span>Westlands, Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-accent flex-shrink-0" />
                <span>+254 700 000 000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-accent flex-shrink-0" />
                <span>support@shopke.co.ke</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 border border-white/15 rounded-lg flex items-center justify-center hover:border-accent hover:text-accent transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm hover:text-accent transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 pt-10 mb-10">
          <div className="max-w-xl">
            <h4 className="text-white font-display font-semibold text-lg mb-2">Subscribe to our newsletter</h4>
            <p className="text-sm mb-4">Get exclusive deals, new arrivals, and promo codes straight to your inbox.</p>
            <div className="flex gap-3">
              <input type="email" placeholder="your@email.com"
                className="flex-1 px-4 py-3 bg-white/8 border border-white/15 rounded-xl text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent transition-colors" />
              <button className="btn-primary whitespace-nowrap">Subscribe</button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} ShopKE Limited. All rights reserved. Built with ❤️ in Nairobi.</p>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {['M-Pesa', 'Visa', 'Mastercard', 'PayPal', 'Stripe'].map(m => (
                <span key={m} className="border border-white/15 px-2 py-0.5 rounded text-[10px] font-medium">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
