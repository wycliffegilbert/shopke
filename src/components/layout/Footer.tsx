import Link from 'next/link';
import {
  Facebook, Twitter, Instagram, Youtube,
  MapPin, Phone, Mail, Truck, ShieldCheck,
  RotateCcw, Headphones, ChevronRight,
  Smartphone, CreditCard, Wallet, ExternalLink
} from 'lucide-react';

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
    { label: 'About TrendsVault', href: '/about' },
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

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://www.facebook.com/share/1ERzM6xGxm', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: 'https://www.instagram.com/trends.vaults?igsh=MW84Ym55cG5nOHc0Nw==', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

const PAYMENT_METHODS = [
  { icon: Smartphone, label: 'M-Pesa', color: 'text-green-400' },
  { icon: CreditCard, label: 'Visa', color: 'text-blue-400' },
  { icon: CreditCard, label: 'Mastercard', color: 'text-red-400' },
  { icon: Wallet, label: 'PayPal', color: 'text-blue-500' },
];

const TRUST_BADGES = [
  {
    icon: <Truck size={22} className="text-accent" />,
    title: 'Free Delivery',
    desc: 'On orders above KES 3,000',
  },
  {
    icon: <ShieldCheck size={22} className="text-emerald-400" />,
    title: 'Secure Payments',
    desc: 'M-Pesa, Cards & PayPal',
  },
  {
    icon: <RotateCcw size={22} className="text-blue-400" />,
    title: 'Easy Returns',
    desc: '30-day return policy',
  },
  {
    icon: <Headphones size={22} className="text-purple-400" />,
    title: '24/7 Support',
    desc: 'WhatsApp & live chat',
  },
];

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-gray-400 mt-16">

      {/* Trust badges bar */}
      <div className="border-b border-white/10">
        <div className="container-pad py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_BADGES.map(badge => (
              <div key={badge.title} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/8 rounded-xl flex items-center justify-center flex-shrink-0">
                  {badge.icon}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{badge.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-pad py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">

          {/* Brand col */}
          <div className="col-span-2">
            <Link href="/" className="font-display text-2xl font-bold text-white inline-block mb-4">
              Trends<span className="text-accent">Vault</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-gray-500 mb-5">
              Kenya's premier online marketplace. Fast delivery, genuine products, and unbeatable prices — serving all 47 counties.
            </p>

            {/* Contact */}
            <div className="space-y-2.5 mb-6">
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-accent transition-colors group">
                <MapPin size={14} className="text-accent flex-shrink-0" />
                  Nairobi, Kenya
                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="tel:+254715545278"
                className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-accent transition-colors">
                <Phone size={14} className="text-accent flex-shrink-0" />
                +254 715 545 278
              </a>
              <a href="@TrendsVault.co.kemailto:support"
                className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-accent transition-colors">
                <Mail size={14} className="text-accent flex-shrink-0" />
                trendsvaultnairobi@gmail.com
              </a>
            </div>

            {/* Social */}
            <div className="flex gap-2.5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 border border-white/15 rounded-xl flex items-center justify-center text-gray-500 hover:border-accent hover:text-accent hover:bg-accent/10 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-accent transition-colors flex items-center gap-1 group">
                      <ChevronRight
                        size={12}
                        className="text-gray-700 opacity-0 group-hover:opacity-100 -ml-1 transition-all"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 pt-10 pb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h4 className="text-white font-display font-semibold text-lg mb-1">
                Subscribe to our newsletter
              </h4>
              <p className="text-sm text-gray-500">Get exclusive deals and new arrivals straight to your inbox.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto md:min-w-[360px]">
              <div className="relative flex-1">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-4 py-3 bg-white/8 border border-white/15 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-accent transition-colors"
                />
              </div>
              <button className="btn-primary whitespace-nowrap px-5 py-3 text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} TrendsVault Limited. All rights reserved. Powered by Spire Africa Technologies.
          </p>

          {/* Payment icons */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 mr-1">Pay with:</span>
            {PAYMENT_METHODS.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 border border-white/10 px-2.5 py-1.5 rounded-lg bg-white/5"
                title={label}>
                <Icon size={13} className={color} />
                <span className="text-[10px] text-gray-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
