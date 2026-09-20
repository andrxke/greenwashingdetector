/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

export default nextConfig;
