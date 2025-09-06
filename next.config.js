/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: []
  },
  // Fix for Vercel deployment issues
  trailingSlash: false
}

module.exports = nextConfig