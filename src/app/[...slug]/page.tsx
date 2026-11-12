import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomePage from '../page';

/**
 * Keeps the source site's /home path working. Every other page has its own route folder.
 */
interface Props {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: ['home'] }];
}

export const metadata: Metadata = {
  title: { absolute: 'SDG Railway' },
  alternates: { canonical: '/' },
};

export default async function LegacyHome({ params }: Props) {
  const { slug } = await params;
  if (slug.join('/') !== 'home') notFound();
  return <HomePage />;
}
