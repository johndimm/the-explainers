/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [],
  experimental: {
    // Next.js 15: serverComponentsExternalPackages moved to serverExternalPackages
  },
}

module.exports = nextConfig