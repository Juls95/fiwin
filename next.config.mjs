/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  // 0G SDK + ethers need node runtime; enforced per-route too.
  serverExternalPackages: ["@0glabs/0g-ts-sdk", "@0glabs/0g-serving-broker", "ethers"]
};
export default nextConfig;
