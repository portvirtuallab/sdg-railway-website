import snapshot from '@/data/sheet-snapshot.json';
import { buildCatalogue, type Catalogue, type SheetTables } from '@/engine';

/**
 * Catalogue from the Sheet snapshot taken at build time (scripts/sheet/snapshot.mjs). Used by
 * static pages and as the first render before the live Sheet answers (catalogue-client.ts).
 */
export const SNAPSHOT_CATALOGUE: Catalogue = buildCatalogue(
  snapshot.tables as unknown as SheetTables,
);
export const SNAPSHOT_DATE = snapshot.generatedAt;
