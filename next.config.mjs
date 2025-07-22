/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress Monaco Editor warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Suppress chunk loading warnings
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };

    return config;
  },
  
  // Improve performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  
  // Handle external resources
  images: {
    domains: ['placeholder.svg'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Fix CSP for Paystack
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://checkout.paystack.com https://js.paystack.co https://*.paystack.com http://localhost:* https://*.vusercontent.net/ https://*.lite.vusercontent.net/ https://generated.vusercontent.net/ https://*.vercel.run/ https://vercel.live/ https://vercel.com https://vercel.fides-cdn.ethyca.com/ https://js.stripe.com/ https://*.accounts.dev https://api.stack-auth.com/api/v1/auth/oauth/*",
          },
        ],
      },
    ];
  },
  
  // Suppress warnings
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
