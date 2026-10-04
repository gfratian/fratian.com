/** @type {import('next').NextConfig} */
const isExport = process.env.OUTPUT_EXPORT === 'true';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  basePath: '/may2027',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL:
      process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL ||
      'https://script.google.com/macros/s/AKfycbzVbqtZEU5MoD2yZSnR8GS7SiWmN-29T-bP60Uug2TSm4w67SqQ0mNZq76MKgLJRyq_/exec',
    NEXT_PUBLIC_WEDDING_PASSWORD:
      process.env.NEXT_PUBLIC_WEDDING_PASSWORD || 'Cantacuzino27',
  },
  ...(isExport
    ? {
        output: 'export',
      }
    : {
        async headers() {
          return [
            {
              source: '/:path*',
              headers: [
                {
                  key: 'X-Robots-Tag',
                  value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
                },
                {
                  key: 'X-Frame-Options',
                  value: 'DENY',
                },
                {
                  key: 'X-Content-Type-Options',
                  value: 'nosniff',
                },
                {
                  key: 'Referrer-Policy',
                  value: 'strict-origin-when-cross-origin',
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
