import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.resolve(__dirname, '../../src/styles/globals.css'), 'utf8');

function token(name: string): string {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m?.[1]) throw new Error(`Token ${name} not found`);
  return m[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = '#ffffff';

// Pairs used for normal-size text must reach WCAG 2.2 AA (4.5:1).
describe('design token contrast', () => {
  it.each([
    ['white on railway-blue-900', WHITE, token('railway-blue-900')],
    ['white on railway-blue-950', WHITE, token('railway-blue-950')],
    ['white on railway-blue-700', WHITE, token('railway-blue-700')],
    ['white on railway-green-700', WHITE, token('railway-green-700')],
    ['railway-green-700 on white', token('railway-green-700'), WHITE],
    ['railway-blue-700 on white', token('railway-blue-700'), WHITE],
    ['neutral-600 on white', token('neutral-600'), WHITE],
    ['neutral-600 on neutral-50', token('neutral-600'), token('neutral-50')],
    ['notice-text on notice-bg', token('notice-text'), token('notice-bg')],
    [
      'railway-green-100 on railway-blue-900',
      token('railway-green-100'),
      token('railway-blue-900'),
    ],
  ])('%s reaches 4.5:1', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('records that the source green is only suitable for large text and graphics on white', () => {
    const ratio = contrast(token('railway-green-600'), WHITE);
    expect(ratio).toBeLessThan(4.5);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });
});
