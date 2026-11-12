/* eslint-disable @next/next/no-img-element -- static export: images are pre-optimised WebP files */
import { IMAGE_ALT } from '@/content/image-alt';
import manifest from '@/data/image-manifest.json';
import { asset } from '@/lib/asset';

const SIZES = manifest as Record<string, { width: number; height: number }>;

interface Props {
  id: string;
  className?: string;
  /** Mark images that are purely decorative; otherwise alt text must exist in IMAGE_ALT. */
  decorative?: boolean;
  /** Override the default alt text. */
  alt?: string;
  priority?: boolean;
}

/** Migrated source image (public/images/source/<id>.webp) with real dimensions and alt text. */
export function Img({ id, className, decorative, alt, priority }: Props) {
  const size = SIZES[id];
  const text = decorative ? '' : (alt ?? IMAGE_ALT[id]);
  if (text === undefined) throw new Error(`Missing alt text for ${id}`);
  return (
    <img
      src={asset(`/images/source/${id}.webp`)}
      alt={text}
      width={size?.width}
      height={size?.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      className={className}
    />
  );
}

export function imageUrl(id: string): string {
  return asset(`/images/source/${id}.webp`);
}
