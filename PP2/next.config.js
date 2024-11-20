/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['csc309pp2profilepictures.s3.us-east-2.amazonaws.com'],
  },
};

module.exports = nextConfig;
