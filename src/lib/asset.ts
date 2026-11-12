/** Prefixes a public path with the deployment base path (GitHub Pages serves under /<repo>). */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
