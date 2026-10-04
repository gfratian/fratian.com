import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elizabeth & George • May 28, 2027 • Castelul Cantacuzino',
  description: 'Private Bilingual Wedding Portal for Elizabeth & George in Bușteni, Romania',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function May2027Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen bg-stone-950 text-stone-100">{children}</main>;
}
