'use client';

import { useSyncExternalStore } from 'react';
import { buildCatalogue, type Catalogue, type SheetTables } from '@/engine';
import { SNAPSHOT_CATALOGUE } from './snapshot';

/**
 * The catalogue (routes, terminals, tariffs, trains) always comes from the Google Sheet.
 * Pages render first with the snapshot made at build time, then switch to the live Sheet as soon
 * as the quotation service answers. Editing a route in the Sheet shows up here without a deploy.
 */
export const API_URL = process.env.NEXT_PUBLIC_QUOTE_API_URL ?? '';
const SNAPSHOT = SNAPSHOT_CATALOGUE;
const SESSION_KEY = 'sdg-railway.catalogue.v8';

export type CatalogueSource = 'snapshot' | 'live';
interface State {
  catalogue: Catalogue;
  source: CatalogueSource;
}

let state: State = { catalogue: SNAPSHOT, source: 'snapshot' };
let started = false;
const listeners = new Set<() => void>();

function publish(tables: SheetTables) {
  state = { catalogue: buildCatalogue(tables), source: 'live' };
  listeners.forEach((l) => l());
}

function start() {
  if (started || !API_URL) return;
  started = true;
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) publish(JSON.parse(cached) as SheetTables);
  } catch {
    // No session storage: just fetch.
  }
  fetch(`${API_URL}?action=catalogue`)
    .then((r) => r.json())
    .then((body: { tables?: SheetTables }) => {
      if (!body.tables) return;
      publish(body.tables);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(body.tables));
      } catch {
        // Ignore quota errors.
      }
    })
    .catch(() => {
      // Keep the snapshot: the site still works read-only.
    });
}

function subscribe(l: () => void) {
  listeners.add(l);
  start();
  return () => listeners.delete(l);
}

const SERVER_STATE: State = { catalogue: SNAPSHOT, source: 'snapshot' };

export function useCatalogueState(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export function useCatalogue(): Catalogue {
  return useCatalogueState().catalogue;
}
