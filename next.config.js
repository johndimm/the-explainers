/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [],
  experimental: {
    // Next.js 15: serverComponentsExternalPackages moved to serverExternalPackages
  },
  // Vercel-specific optimizations
  output: 'standalone',
  // Ensure proper handling of client-side code
  transpilePackages: [],
  // Add debugging for Vercel
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Handle potential iOS issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig