import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,  // __dirname hamesha current directory hota hai (frontend/)
  },
};

export default nextConfig;
