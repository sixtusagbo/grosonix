/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress webpack warnings for Supabase realtime
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Suppress specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
    ];

    return config;
  },

  // Ensure proper handling of server components and cookies
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Remove standalone output for Netlify
  // output: 'standalone',
};

module.exports = nextConfig;
