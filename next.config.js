/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "http://localhost:3000",
    "https://music-lamp-backend.vercel.app/",
  ],
};

module.exports = nextConfig;
