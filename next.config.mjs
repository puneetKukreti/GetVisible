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
  experimental: {
    // The Stitch templates are read from disk at request time through a dynamic
    // path (`fs.readFileSync(path.join(process.cwd(), 'src', 'Demo_website_template',
    // folder, 'code.html'))`), which Next.js' static output tracing cannot detect.
    // Without this include a serverless deployment can ship without the templates
    // and every demo render fails with "template HTML not found".
    //
    // NOTE: in Next 14 this option lives under `experimental` (it only moved to
    // the top level in Next 15). At the top level it is silently ignored.
    outputFileTracingIncludes: {
      '/api/demos/**': ['./src/Demo_website_template/**/*.html'],
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
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
