/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.shopke.co.ke' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
};

export default nextConfig;
