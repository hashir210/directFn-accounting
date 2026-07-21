import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "react-icons", "@base-ui/react"],
  },
};

export default nextConfig;
