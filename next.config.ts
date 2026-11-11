import type { NextConfig } from 'next';

// GitHub Pages serves the site under /<repository-name> unless a custom domain is configured.
// Set NEXT_PUBLIC_BASE_PATH="" for a custom domain or local preview at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
