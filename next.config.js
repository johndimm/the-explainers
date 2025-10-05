/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For Capacitor builds, use regular build (not static export)
  // Static export doesn't work with API routes
  ...(process.env.BUILD_NATIVE === 'true' && {
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  }),
  experimental: {
    serverComponentsExternalPackages: []
  },
  // Force proper chunk generation
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
  // Ensure proper static generation
  generateEtags: false,
  poweredByHeader: false,
  compress: true
}

module.exports = nextConfig