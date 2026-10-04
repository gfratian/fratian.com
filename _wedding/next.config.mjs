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
