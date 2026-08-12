/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native module — must be kept external from the
  // server bundle and loaded at runtime (Node runtime, not Edge).
  serverExternalPackages: ["better-sqlite3"],
  images: {
    // We use plain <img> with remote art-direction URLs; remotePatterns not needed.
  },
};

module.exports = nextConfig;
