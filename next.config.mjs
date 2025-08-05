/** @type {import('next').NextConfig} */
import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Your regular Next.js config options here
};

// Temporarily disabling PWA for build troubleshooting.
// export default withPWA(nextConfig);
export default nextConfig;
