/** @type {import('next').NextConfig} */
const nocodeBase = (process.env.NOCODE_API_BASE_URL || "").replace(/\/$/, "");

let nocodeRemotePattern;
if (nocodeBase) {
  try {
    const u = new URL(nocodeBase);
    nocodeRemotePattern = {
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
    };
  } catch {
    nocodeRemotePattern = undefined;
  }
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      ...(nocodeRemotePattern ? [nocodeRemotePattern] : []),
    ],
  },
  // The Legends and Programmes pages moved from /doctors and /programs.
  // Old links (shared, bookmarked, indexed) go to the same page at the new URL.
  async redirects() {
    return [
      { source: "/doctors", destination: "/legends", permanent: true },
      { source: "/doctors/:slug*", destination: "/legends/:slug*", permanent: true },
      { source: "/programs", destination: "/programmes", permanent: true },
      { source: "/programs/:slug*", destination: "/programmes/:slug*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
