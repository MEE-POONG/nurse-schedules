/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['imagedelivery.net']
  }
}

module.exports = nextConfig
