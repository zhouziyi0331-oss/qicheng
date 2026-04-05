import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发时代理 API 请求到后端，避免 CORS 问题
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
