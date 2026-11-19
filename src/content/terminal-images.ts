import photos from '@/data/terminal-photos.json';

/**
 * Photos of terminal cities from the original Google Sites terminal pages (docs/audit), keyed by
 * city. Only the pictures live here: the terminal list itself comes from the TERMINALS tab of the
 * Sheet, so a new terminal in the Sheet appears on the site (with a neutral card until it has a photo).
 */
function key(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const BY_CITY = new Map(Object.entries(photos).map(([city, id]) => [key(city), id]));

export function terminalImage(city: string): string | null {
  return BY_CITY.get(key(city)) ?? null;
}
