/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '',
    NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL:
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      '',
    DEMO_MODE: process.env.DEMO_MODE || 'true',
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || 'true',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Some shared demo modules (e.g. the profession engine) are imported by
    // client components but reference Node-only builtins inside try/catch
    // server utilities. Stub those builtins for the client bundle only, so the
    // server keeps full Node access while the client build stays valid.
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
