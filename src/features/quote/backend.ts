'use client';

import {
  acceptQuote,
  buildHandoff,
  buildQuote,
  effectiveStatus,
  EXAMPLE_REF,
  isCodeFormat,
  normaliseCode,
  serviceOptions,
  type Booking,
  type CapacityUsage,
  type Catalogue,
  type Handoff,
  type Quote,
  type QuoteError,
  type QuoteRequest,
  type ServiceOption,
  type TerminalOrders,
} from '@/engine';
import seed from '../../../apps-script/seed/v8-seed.json';
import { API_URL } from './catalogue-client';

/**
 * Every quotation operation goes through this interface.
 * - live: the Apps Script web app writes to the Google Sheet (QUOTE_LOG, BOOKINGS, HISTORY) and
 *   Drive (PDF). Used when NEXT_PUBLIC_QUOTE_API_URL is set.
 * - demo: the same engine runs in the browser and keeps the data in this browser only. Used for
 *   local development and tests, or before the web app is deployed.
 */
export type Failure = { errors: QuoteError[] };
/** example: the access code is not in the list, so the quote is shown but not recorded. */
export type QuoteResult = { quote: Quote; pdfUrl?: string; example?: boolean } | Failure;
export type AcceptResult = { quote: Quote; booking: Booking; handoff: Handoff } | Failure;
export interface TeamData {
  team: { name: string; role: string };
  quotes: Quote[];
  bookings: Booking[];
}

export interface Backend {
  mode: 'live' | 'demo';
  options(cat: Catalogue, req: QuoteRequest): Promise<ServiceOption[] | Failure>;
  quote(cat: Catalogue, req: QuoteRequest, requoteRef?: string): Promise<QuoteResult>;
  accept(cat: Catalogue, pin: string, ref: string, version: number): Promise<AcceptResult>;
  orders(pin: string, bookingRef: string, orders: TerminalOrders): Promise<{ ok: true } | Failure>;
  list(pin: string): Promise<TeamData | Failure>;
}

export function isFailure(x: unknown): x is Failure {
  return typeof x === 'object' && x !== null && 'errors' in x;
}

const fail = (message: string, field: QuoteError['field'] = 'route'): Failure => ({
  errors: [{ field, code: 'required', message }],
});

// ---------------------------------------------------------------- live (Apps Script)

async function post<T>(body: unknown): Promise<T | Failure> {
  try {
    // text/plain keeps this a "simple" request: Apps Script cannot answer CORS preflights.
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as T & { fatal?: string };
    if (json.fatal) return fail(json.fatal);
    return json;
  } catch {
    return fail(
      'The SDG Railway quotation service cannot be reached. Check your connection and try again in a minute.',
    );
  }
}

const live: Backend = {
  mode: 'live',
  async options(_cat, req) {
    const r = await post<{ options: ServiceOption[] }>({ action: 'options', request: req });
    return isFailure(r) ? r : r.options;
  },
  quote: (_cat, req, requoteRef) =>
    post<QuoteResult>({
      action: 'quote',
      request: req,
      ...(requoteRef ? { requote: { ref: requoteRef } } : {}),
    }),
  accept: (_cat, pin, ref, version) => post<AcceptResult>({ action: 'accept', pin, ref, version }),
  orders: (pin, bookingRef, orders) =>
    post<{ ok: true }>({ action: 'orders', pin, bookingRef, orders }),
  list: (pin) => post<TeamData>({ action: 'list', pin }),
};

// ---------------------------------------------------------------- demo (this browser)

interface DemoState {
  schema: 8;
  quoteSeq: number;
  bookingSeq: number;
  quotes: Quote[];
  bookings: Booking[];
}
export const DEMO_KEY = 'sdg-railway.demo-store.v8';
const EMPTY: DemoState = { schema: 8, quoteSeq: 0, bookingSeq: 0, quotes: [], bookings: [] };
/** Demo mode uses the example rows of ACCESS_CODES that Set up v8 adds to the Sheet. */
const DEMO_CODES = new Map(
  seed.newTabs.ACCESS_CODES.rows.map((r) => [
    normaliseCode(String(r[0])),
    { name: `${String(r[1])} (demo)`, role: String(r[4]) },
  ]),
);
const CODE_ERROR = 'This access code is not in the SDG Railway list. Check it with your trainer.';

function readDemo(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as DemoState) } : EMPTY;
  } catch {
    return memory;
  }
}
let memory: DemoState = EMPTY;
function writeDemo(s: DemoState) {
  memory = s;
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(s));
  } catch {
    // Private mode: keep it in memory.
  }
}

function usage(s: DemoState): CapacityUsage {
  const u: CapacityUsage = {};
  for (const b of s.bookings) {
    if (b.status !== 'confirmed') continue;
    const q = s.quotes.find((x) => x.ref === b.quoteRef && x.version === b.quoteVersion);
    u[b.train.trainId] = (u[b.train.trainId] ?? 0) + (q?.request.quantity ?? 0);
  }
  return u;
}

const demoTeam = (pin: string) => DEMO_CODES.get(normaliseCode(pin)) ?? null;
const isTrainer = (pin: string) => demoTeam(pin)?.role === 'trainer';
const ref = (prefix: string, n: number) => `${prefix}${String(n).padStart(8, '0')}`;

const demo: Backend = {
  mode: 'demo',
  async options(cat, req) {
    return serviceOptions(cat, req, usage(readDemo()));
  },
  async quote(cat, req, requoteRef) {
    const team = demoTeam(req.pin);
    if (!team) {
      if (requoteRef) return fail(CODE_ERROR, 'pin');
      const r = buildQuote(cat, req, {
        ref: EXAMPLE_REF,
        version: 1,
        now: new Date(),
        usage: usage(readDemo()),
        team: 'Example – no valid access code',
      });
      return r.ok ? { quote: r.quote, example: true } : { errors: r.errors };
    }
    req = { ...req, pin: normaliseCode(req.pin) };
    const s = readDemo();
    const prev = requoteRef ? s.quotes.filter((q) => q.ref === requoteRef) : [];
    if (requoteRef && !prev.length) return fail(`Quote ${requoteRef} was not found.`);
    const quoteSeq = requoteRef ? s.quoteSeq : s.quoteSeq + 1;
    const r = buildQuote(cat, req, {
      ref: requoteRef ?? ref(cat.config.quotePrefix, quoteSeq),
      version: prev.length ? Math.max(...prev.map((q) => q.version)) + 1 : 1,
      now: new Date(),
      usage: usage(s),
      team: team.name,
    });
    if (!r.ok) return { errors: r.errors };
    const quotes = s.quotes.map((q) =>
      q.ref === r.quote.ref && q.status === 'issued' ? { ...q, status: 'superseded' as const } : q,
    );
    writeDemo({ ...s, quoteSeq, quotes: [...quotes, r.quote] });
    return { quote: r.quote };
  },
  async accept(cat, pin, quoteRef, version) {
    if (!demoTeam(pin)) return fail(CODE_ERROR, 'pin');
    const s = readDemo();
    const quote = s.quotes.find((q) => q.ref === quoteRef && q.version === version);
    if (!quote || (quote.request.pin !== normaliseCode(pin) && !isTrainer(pin)))
      return fail(`Quote ${quoteRef} v${version} was not found for this team.`);
    try {
      const bookingSeq = s.bookingSeq + 1;
      const booking = acceptQuote(cat, quote, {
        bookingRef: ref(cat.config.bookingPrefix, bookingSeq),
        now: new Date(),
        usage: usage(s),
      });
      const accepted = { ...quote, status: 'accepted' as const };
      writeDemo({
        ...s,
        bookingSeq,
        quotes: s.quotes.map((q) => (q === quote ? accepted : q)),
        bookings: [...s.bookings, booking],
      });
      return { quote: accepted, booking, handoff: buildHandoff(cat, accepted, booking) };
    } catch (e) {
      return fail((e as Error).message);
    }
  },
  async orders(pin, bookingRef, orders) {
    if (!demoTeam(pin)) return fail(CODE_ERROR, 'pin');
    const s = readDemo();
    writeDemo({
      ...s,
      bookings: s.bookings.map((b) =>
        b.ref === bookingRef ? { ...b, terminalOrders: orders } : b,
      ),
    });
    return { ok: true };
  },
  async list(pin) {
    if (!isCodeFormat(pin)) return fail('Enter your PVL access code (from your trainer).', 'pin');
    const team = demoTeam(pin);
    if (!team) return fail(CODE_ERROR, 'pin');
    const s = readDemo();
    const all = team.role === 'trainer';
    const quotes = s.quotes
      .filter((q) => all || q.request.pin === normaliseCode(pin))
      .map((q) => ({ ...q, status: effectiveStatus(q, new Date()) }));
    const refs = new Set(quotes.map((q) => `${q.ref}|${q.version}`));
    return {
      team: { name: team.name, role: team.role },
      quotes,
      bookings: s.bookings.filter((b) => refs.has(`${b.quoteRef}|${b.quoteVersion}`)),
    };
  },
};

export const backend: Backend = API_URL ? live : demo;

/** Removes the demo quotes and bookings stored in this browser. */
export function clearDemoData() {
  writeDemo(EMPTY);
}
