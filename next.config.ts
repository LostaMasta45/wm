import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Turbopack configuration for Next.js 16
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Only apply for non-Turbopack builds
    if (!isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
