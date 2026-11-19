'use client';

import { useSyncExternalStore } from 'react';
import catalogue from '@/data/demo-catalogue.json';
import { acceptQuote, buildQuote, capacityKey, effectiveStatus, validateRequest } from './engine';
import type { Booking, Quote, QuoteError, QuoteRequest, TerminalOrders } from './types';

/**
 * Prototype persistence: quotes and bookings live in this browser (localStorage).
 * In production the same operations go to the SDG Railway back end (Apps Script + Google Sheet),
 * which issues the references, checks capacity and records every operation
 * (docs/product/data-model-and-erp-mapping.md). Components only use the functions below.
 */
export interface StoreState {
  schema: 1;
  quoteSeq: number;
  bookingSeq: number;
  quotes: Quote[];
  bookings: Booking[];
  /** ITUs booked per train departure. */
  capacity: Record<string, number>;
}

const KEY = 'sdg-railway.demo-store.v1';
const EMPTY: StoreState = {
  schema: 1,
  quoteSeq: 0,
  bookingSeq: 0,
  quotes: [],
  bookings: [],
  capacity: {},
};
const listeners = new Set<() => void>();
let cache: StoreState | null = null;
let cacheRaw: string | null = null;

function read(): StoreState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked (private mode): keep working in memory.
    return cache ?? EMPTY;
  }
  if (cache && raw === cacheRaw) return cache;
  try {
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as StoreState) } : (cache ?? EMPTY);
  } catch {
    cache = EMPTY;
  }
  cacheRaw = raw;
  return cache;
}

function write(next: StoreState) {
  cache = next;
  try {
    cacheRaw = JSON.stringify(next);
    localStorage.setItem(KEY, cacheRaw);
  } catch {
    cacheRaw = null;
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useDemoStore(): StoreState | null {
  // null during the static render: the store only exists in the browser.
  return useSyncExternalStore(subscribe, read, () => null);
}

const year = () => new Date().getFullYear();
const seq = (n: number) => String(n).padStart(5, '0');

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; errors: QuoteError[] };

/** Issues a new quote, or a new version of an existing one (the previous version is superseded). */
export function requestQuote(req: QuoteRequest, previousRef?: string): QuoteResult {
  const now = new Date();
  const errors = validateRequest(catalogue, req, now);
  if (errors.length) return { ok: false, errors };
  const s = read();
  const prev = previousRef ? s.quotes.filter((q) => q.ref === previousRef) : [];
  const version = prev.length ? Math.max(...prev.map((q) => q.version)) + 1 : 1;
  const quoteSeq = previousRef ? s.quoteSeq : s.quoteSeq + 1;
  const ref = previousRef ?? `RWQ-${year()}-${seq(quoteSeq)}`;
  const quote = buildQuote(catalogue, req, { ref, version, now, usage: s.capacity });
  const quotes = s.quotes.map((q) =>
    q.ref === ref && q.status === 'issued' ? { ...q, status: 'superseded' as const } : q,
  );
  write({ ...s, quoteSeq, quotes: [...quotes, quote] });
  return { ok: true, quote };
}

export function acceptQuoteByRef(
  ref: string,
  version: number,
): { ok: true; booking: Booking } | { ok: false; message: string } {
  const s = read();
  const quote = s.quotes.find((q) => q.ref === ref && q.version === version);
  if (!quote) return { ok: false, message: `Quote ${ref} v${version} was not found.` };
  try {
    const bookingSeq = s.bookingSeq + 1;
    const booking = acceptQuote(catalogue, quote, {
      bookingRef: `RWB-${year()}-${seq(bookingSeq)}`,
      now: new Date(),
      usage: s.capacity,
    });
    const capacity = { ...s.capacity };
    if (booking.status === 'confirmed' && booking.train.departure) {
      const k = capacityKey(booking.train.trainId, booking.train.departure.slice(0, 10));
      capacity[k] = (capacity[k] ?? 0) + quote.request.quantity;
    }
    write({
      ...s,
      bookingSeq,
      capacity,
      quotes: s.quotes.map((q) => (q === quote ? { ...q, status: 'accepted' as const } : q)),
      bookings: [...s.bookings, booking],
    });
    return { ok: true, booking };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export function updateTerminalOrders(bookingRef: string, orders: TerminalOrders) {
  const s = read();
  write({
    ...s,
    bookings: s.bookings.map((b) => (b.ref === bookingRef ? { ...b, terminalOrders: orders } : b)),
  });
}

/** Removes every quote and booking stored in this browser (prototype reset). */
export function clearDemoData() {
  write(EMPTY);
}

export function quotesForTeam(s: StoreState, pin: string): Quote[] {
  const team = catalogue.teams.find((t) => t.pin === pin);
  if (!team) return [];
  const list = team.role === 'trainer' ? s.quotes : s.quotes.filter((q) => q.request.pin === pin);
  return [...list].sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
}

export function bookingFor(s: StoreState, quote: Quote): Booking | null {
  return (
    s.bookings.find((b) => b.quoteRef === quote.ref && b.quoteVersion === quote.version) ?? null
  );
}

export function statusOf(quote: Quote) {
  return effectiveStatus(quote, new Date());
}
