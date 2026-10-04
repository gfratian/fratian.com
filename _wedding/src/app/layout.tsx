import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider } from '@/context/LocaleContext';

export const metadata: Metadata = {
  title: 'A Carpathian Celebration • May 2027',
  description: 'Private celebration portal for Elizabeth & George',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="robots"
          content="noindex, nofollow, noarchive, nosnippet, noimageindex"
        />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="bg-stone-950 text-stone-100 antialiased selection:bg-carpathian-700 selection:text-gold-200">
        <AuthProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
