/** @type {import('next').NextConfig} */
const nextConfig = {
  // When using a custom server, Next.js is embedded in it.
  // Rewrites proxy Socket.IO in dev mode (next dev without custom server).
  async rewrites() {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    return [
      {
        source: "/socket.io/:path*",
        destination: `${socketUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
