'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  addDays,
  formatDateTime,
  INCOTERMS,
  localNow,
  placeName,
  previewRoute,
  terminalById,
  validateRequest,
  type Booking,
  type Catalogue,
  type Place,
  type Quote,
  type QuoteError,
  type QuoteRequest,
  type ServiceOption,
} from '@/engine';
import { backend, isFailure } from './backend';
import { useCatalogue } from './catalogue-client';
import { money } from './format';
import { QuoteDocument } from './QuoteDocument';
import { REQUOTE_KEY } from './requote';

const STEPS = ['Team and case', 'Route and date', 'Cargo and unit', 'Service and review'] as const;
const STEP_FIELDS: (QuoteError['field'] | string)[][] = [
  ['pin', 'requester', 'shipper', 'consignee', 'incoterm'],
  ['origin', 'destination', 'readyDate', 'route', 'routingMetric'],
  [
    'cargoDescription',
    'packages',
    'packageCm',
    'grossWeightKg',
    'utiType',
    'quantity',
    'dangerousGoods',
    'temperatureC',
    'insuranceValue',
  ],
  ['serviceId'],
];

interface FormState {
  pin: string;
  requester: string;
  shipper: string;
  consignee: string;
  incoterm: string;
  originKind: 'door' | 'terminal';
  originId: string;
  destKind: 'door' | 'terminal';
  destId: string;
  readyDate: string;
  metric: 'DISTANCE' | 'TIME';
  serviceId: string;
  cargoDescription: string;
  packages: string;
  length: string;
  width: string;
  height: string;
  grossWeightKg: string;
  utiType: string;
  quantity: string;
  dg: boolean;
  adrClass: string;
  unNumber: string;
  temperatureC: string;
  insuranceValue: string;
}

const EMPTY: FormState = {
  pin: '',
  requester: '',
  shipper: '',
  consignee: '',
  incoterm: '',
  originKind: 'door',
  originId: '',
  destKind: 'door',
  destId: '',
  readyDate: '',
  metric: 'DISTANCE',
  serviceId: '',
  cargoDescription: '',
  packages: '',
  length: '',
  width: '',
  height: '',
  grossWeightKg: '',
  utiType: '',
  quantity: '1',
  dg: false,
  adrClass: '',
  unNumber: '',
  temperatureC: '',
  insuranceValue: '',
};

/** A weekday at least 5 days ahead, so the Standard train has a departure after the road leg. */
function exampleReadyDate(): string {
  const today = localNow(new Date()).slice(0, 10);
  let d = addDays(today, 5);
  while ([0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay())) d = addDays(d, 1);
  return d;
}

const WORKED_EXAMPLE = (): FormState => ({
  ...EMPTY,
  pin: '4821',
  requester: 'Futura Cargo operations desk',
  shipper: 'Toledo automotive parts manufacturer',
  consignee: 'Atessa assembly plant',
  incoterm: 'DAP',
  originKind: 'door',
  originId: 'DOOR-TOLEDO',
  destKind: 'door',
  destId: 'DOOR-ATESSA',
  readyDate: exampleReadyDate(),
  serviceId: 'STD-RAIL',
  cargoDescription: 'Automotive parts',
  packages: '24',
  length: '120',
  width: '100',
  height: '160',
  grossWeightKg: '18000',
  utiType: 'CONTAINER-40',
  quantity: '1',
});

function parsePlace(v: string | null): { kind: 'door' | 'terminal'; id: string } | null {
  if (!v) return null;
  const [kind, id] = v.split(':');
  if ((kind === 'door' || kind === 'terminal') && id) return { kind, id };
  return null;
}

function toRequest(f: FormState): QuoteRequest {
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s));
  const dims = [f.length, f.width, f.height].map(num);
  return {
    pin: f.pin.trim(),
    requester: f.requester,
    shipper: f.shipper,
    consignee: f.consignee,
    incoterm: f.incoterm as QuoteRequest['incoterm'],
    origin: { kind: f.originKind, id: f.originId } as Place,
    destination: { kind: f.destKind, id: f.destId } as Place,
    readyDate: f.readyDate,
    serviceId: f.serviceId,
    routingMetric: f.metric,
    cargoDescription: f.cargoDescription,
    grossWeightKg: num(f.grossWeightKg),
    packages: num(f.packages),
    packageCm: dims.every((d) => d > 0)
      ? { length: dims[0]!, width: dims[1]!, height: dims[2]! }
      : null,
    utiType: f.utiType,
    quantity: num(f.quantity),
    dangerousGoods: f.dg ? { adrClass: f.adrClass, unNumber: f.unNumber.trim() } : null,
    temperatureC: f.temperatureC.trim() === '' ? null : Number(f.temperatureC),
    insuranceValue: f.insuranceValue.trim() === '' ? null : Number(f.insuranceValue),
  };
}

function fromRequest(r: QuoteRequest): FormState {
  return {
    pin: r.pin,
    requester: r.requester,
    shipper: r.shipper,
    consignee: r.consignee,
    incoterm: r.incoterm,
    originKind: r.origin.kind,
    originId: r.origin.id,
    destKind: r.destination.kind,
    destId: r.destination.id,
    readyDate: r.readyDate,
    metric: r.routingMetric,
    serviceId: r.serviceId,
    cargoDescription: r.cargoDescription,
    packages: String(r.packages),
    length: r.packageCm ? String(r.packageCm.length) : '',
    width: r.packageCm ? String(r.packageCm.width) : '',
    height: r.packageCm ? String(r.packageCm.height) : '',
    grossWeightKg: String(r.grossWeightKg),
    utiType: r.utiType,
    quantity: String(r.quantity),
    dg: !!r.dangerousGoods,
    adrClass: r.dangerousGoods?.adrClass ?? '',
    unNumber: r.dangerousGoods?.unNumber ?? '',
    temperatureC: r.temperatureC === null ? '' : String(r.temperatureC),
    insuranceValue: r.insuranceValue === null ? '' : String(r.insuranceValue),
  };
}

const input =
  'min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-railway-blue-700 aria-[invalid=true]:border-[#8a1a1a] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-[#8a1a1a]';
const label = 'text-sm font-semibold text-railway-blue-900';

/** Terminals grouped by country (active terminals of active countries only). */
function terminalGroups(cat: Catalogue) {
  return cat.countries
    .filter((c) => c.active)
    .map((c) => ({
      country: c,
      terminals: cat.terminals
        .filter((t) => t.active && t.countryCode === c.code)
        .sort((a, b) => a.city.localeCompare(b.city)),
    }))
    .filter((g) => g.terminals.length)
    .sort((a, b) => a.country.name.localeCompare(b.country.name));
}

function loadRequote(): { ref: string; request: QuoteRequest } | null {
  try {
    const raw = sessionStorage.getItem(REQUOTE_KEY);
    return raw ? (JSON.parse(raw) as { ref: string; request: QuoteRequest }) : null;
  } catch {
    return null;
  }
}

export function QuoteForm() {
  const params = useSearchParams();
  const catalogue = useCatalogue();
  const requoteRef = params.get('requote');
  const [f, setF] = useState<FormState>(() => {
    if (params.get('example') === '1') return WORKED_EXAMPLE();
    const o = parsePlace(params.get('from'));
    const d = parsePlace(params.get('to'));
    return {
      ...EMPTY,
      ...(o ? { originKind: o.kind, originId: o.id } : {}),
      ...(d ? { destKind: d.kind, destId: d.id } : {}),
      utiType: params.get('uti') ?? '',
      readyDate: params.get('date') ?? '',
    };
  });
  const [loadedRequote, setLoadedRequote] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<QuoteError[]>([]);
  const [options, setOptions] = useState<ServiceOption[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Quote | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [acceptMsg, setAcceptMsg] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Re-quote: My quotes stores the request of the quote to re-issue (browser only).
  if (requoteRef && !loadedRequote && typeof window !== 'undefined') {
    const saved = loadRequote();
    setLoadedRequote(true);
    if (saved?.ref === requoteRef) setF(fromRequest(saved.request));
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const req = toRequest(f);
  const path = f.originId && f.destId ? previewRoute(catalogue, req) : null;
  const uti = catalogue.utiTypes.find((u) => u.code === f.utiType);
  const adrClasses = catalogue.adrClasses.filter((a) => a.code.toUpperCase() !== 'NON-DG');
  const groups = terminalGroups(catalogue);
  const today = localNow(new Date()).slice(0, 10);
  const cfg = catalogue.config;

  function focusTop() {
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function showErrors(list: QuoteError[]) {
    setErrors(list);
    if (list.length) requestAnimationFrame(() => errorRef.current?.focus());
  }

  function stepErrors(s: number): QuoteError[] {
    // The service is chosen in the last step: check the rest with a provisional one.
    const probe = { ...req, serviceId: req.serviceId || catalogue.services[0]?.id || '' };
    const all = validateRequest(catalogue, probe, new Date());
    const fields = STEP_FIELDS.slice(0, s + 1).flat();
    let list = all.filter((e) => fields.includes(e.field));
    if (s === 1 && !list.length && f.originId && f.destId && !path)
      list = [
        {
          field: 'route',
          code: 'route-not-covered',
          message: `There is no rail route from ${placeName(catalogue, req.origin)} to ${placeName(catalogue, req.destination)} in the SDG Railway network. Choose other terminals (see Network and trains).`,
        },
      ];
    return list;
  }

  async function loadOptions() {
    setOptions(null);
    setBusy('Comparing the services…');
    const probe = { ...req, serviceId: req.serviceId || catalogue.services[0]?.id || '' };
    const res = await backend.options(catalogue, probe);
    setBusy(null);
    if (isFailure(res)) return showErrors(res.errors);
    setOptions(res);
    const usable = res.filter((o) => o.total !== null);
    if (!usable.some((o) => o.serviceId === f.serviceId) && usable[0])
      set('serviceId', usable[0].serviceId);
  }

  function next() {
    const list = stepErrors(step);
    showErrors(list);
    if (list.length) return;
    setStep(step + 1);
    if (step + 1 === 3) void loadOptions();
    focusTop();
  }

  async function submit() {
    const list = validateRequest(catalogue, req, new Date());
    if (list.length) {
      const firstStep = STEP_FIELDS.findIndex((fs) => list.some((e) => fs.includes(e.field)));
      if (firstStep >= 0) setStep(firstStep);
      return showErrors(list);
    }
    setBusy(
      backend.mode === 'live'
        ? 'Issuing the quotation and its PDF in the SDG Railway Sheet…'
        : 'Issuing the quotation…',
    );
    const res = await backend.quote(catalogue, req, requoteRef ?? undefined);
    setBusy(null);
    if (isFailure(res)) {
      const firstStep = STEP_FIELDS.findIndex((fs) => res.errors.some((e) => fs.includes(e.field)));
      if (firstStep >= 0 && firstStep < step) setStep(firstStep);
      return showErrors(res.errors);
    }
    setErrors([]);
    setResult(res.quote);
    setPdfUrl(res.pdfUrl);
    setBooking(null);
    focusTop();
  }

  async function accept() {
    if (!result) return;
    setBusy('Booking capacity on the train…');
    const res = await backend.accept(catalogue, result.request.pin, result.ref, result.version);
    setBusy(null);
    if (isFailure(res)) {
      setAcceptMsg(res.errors.map((e) => e.message).join(' '));
      return;
    }
    setResult(res.quote);
    setBooking(res.booking);
    setAcceptMsg(null);
    focusTop();
  }

  const invalid = (field: string) => (errors.some((e) => e.field === field) ? true : undefined);

  if (result) {
    return (
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-railway-blue-900 text-2xl font-bold outline-none sm:text-3xl"
        >
          {booking
            ? booking.status === 'confirmed'
              ? 'Booking confirmed'
              : 'Booking created – train pending'
            : 'Your quotation'}
        </h2>
        <div
          role="status"
          className="bg-railway-green-100 text-railway-green-700 mt-3 rounded-xl p-4 text-sm"
        >
          {booking ? (
            <>
              Booking <strong className="font-mono">{booking.ref}</strong> is linked to quote{' '}
              <strong className="font-mono">{result.ref}</strong> v{result.version}.{' '}
              {booking.status === 'confirmed'
                ? `The ${formatDateTime(booking.train.departure)} departure is assigned.`
                : 'SDG Railway will confirm the train; ERP steps that need a train are blocked meanwhile.'}
            </>
          ) : (
            <>
              Quote <strong className="font-mono">{result.ref}</strong> v{result.version} saved for{' '}
              {result.team}
              {backend.mode === 'live' ? ' in the SDG Railway register' : ' in this browser (demo)'}
              . A quote is not a booking: accept it to confirm capacity.
            </>
          )}
        </div>
        <div className="mt-6">
          <QuoteDocument
            quote={result}
            status={booking ? booking.status : 'issued'}
            booking={booking}
            pdfUrl={pdfUrl}
          />
        </div>
        {acceptMsg && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-[#fdecec] p-4 text-sm font-semibold text-[#8a1a1a]"
          >
            {acceptMsg}
          </p>
        )}
        {busy && (
          <p role="status" className="text-railway-blue-900 mt-4 text-sm font-semibold">
            {busy}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          {!booking && (
            <button
              type="button"
              onClick={accept}
              disabled={!!busy}
              className="bg-railway-green-700 hover:bg-railway-green-800 inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white disabled:opacity-60"
            >
              <Icon name="check" className="size-4" /> Accept quote and book capacity
            </button>
          )}
          <Link
            href={`/my-quotes/?pin=${encodeURIComponent(result.request.pin)}&ref=${encodeURIComponent(result.ref)}&v=${result.version}`}
            className="border-railway-blue-900/20 text-railway-blue-900 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-white px-5 font-semibold"
          >
            Open in My quotes and bookings
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="border-railway-blue-900/20 text-railway-blue-900 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-white px-5 font-semibold"
          >
            Print or save as PDF
          </button>
          {!booking && (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setStep(0);
                focusTop();
              }}
              className="text-railway-blue-700 inline-flex min-h-11 items-center rounded-lg px-4 font-semibold underline underline-offset-4"
            >
              Change the request
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Quotation steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => {
                setStep(i);
                setErrors([]);
                if (i === 3) void loadOptions();
                focusTop();
              }}
              aria-current={i === step ? 'step' : undefined}
              className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${i === step ? 'border-railway-green-600 bg-railway-green-100 text-railway-green-700' : 'text-railway-blue-900 border-neutral-200 bg-white'}`}
            >
              <span
                className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${i < step ? 'bg-railway-green-700 text-white' : 'bg-neutral-50 ring-1 ring-neutral-200'}`}
                aria-hidden="true"
              >
                {i < step ? '✓' : i + 1}
              </span>
              {s}
              {i < step && <span className="sr-only"> (completed)</span>}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-railway-blue-900 text-2xl font-bold outline-none"
          >
            <span className="sr-only">Step {step + 1} of 4: </span>
            {STEPS[step]}
          </h2>
          {step === 0 && (
            <button
              type="button"
              onClick={() => {
                setF(WORKED_EXAMPLE());
                setErrors([]);
              }}
              className="text-railway-blue-900 hover:border-railway-blue-700 inline-flex min-h-11 items-center gap-2 rounded-lg border border-neutral-200 px-4 text-sm font-semibold"
            >
              Fill in the worked example
            </button>
          )}
        </div>
        {requoteRef && (
          <p className="mt-2 text-sm text-neutral-600">
            New version of quote <span className="font-mono font-semibold">{requoteRef}</span>.
          </p>
        )}

        {errors.length > 0 && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="mt-5 rounded-xl border border-[#8a1a1a] bg-[#fdecec] p-4 text-sm text-[#8a1a1a]"
          >
            <p className="font-bold">
              Please fix {errors.length === 1 ? 'this' : `these ${errors.length} points`}:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errors.map((e, i) => (
                <li key={i}>
                  <a href={`#f-${e.field}`} className="underline">
                    {e.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="f-pin" className={label}>
                Team PIN
              </label>
              <input
                id="f-pin"
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                className={input}
                value={f.pin}
                onChange={(e) => set('pin', e.target.value)}
                aria-invalid={invalid('pin')}
                aria-describedby="h-pin"
              />
              <span id="h-pin" className="text-sm text-neutral-600">
                The 4-digit PVL PIN of your team, from your trainer.
              </span>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="f-requester" className={label}>
                Requested by
              </label>
              <input
                id="f-requester"
                className={input}
                value={f.requester}
                onChange={(e) => set('requester', e.target.value)}
                aria-invalid={invalid('requester')}
                placeholder="Name or role in your team"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="f-shipper" className={label}>
                Shipper
              </label>
              <input
                id="f-shipper"
                className={input}
                value={f.shipper}
                onChange={(e) => set('shipper', e.target.value)}
                aria-invalid={invalid('shipper')}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="f-consignee" className={label}>
                Consignee
              </label>
              <input
                id="f-consignee"
                className={input}
                value={f.consignee}
                onChange={(e) => set('consignee', e.target.value)}
                aria-invalid={invalid('consignee')}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="f-incoterm" className={label}>
                Incoterm of the case
              </label>
              <select
                id="f-incoterm"
                className={input}
                value={f.incoterm}
                onChange={(e) => set('incoterm', e.target.value)}
                aria-invalid={invalid('incoterm')}
                aria-describedby="h-inc"
              >
                <option value="">— Choose —</option>
                {INCOTERMS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <span id="h-inc" className="text-sm text-neutral-600">
                Incoterms 2020 rules for any mode of transport.
              </span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 grid gap-6">
            {(['origin', 'dest'] as const).map((side) => {
              const kindKey = side === 'origin' ? 'originKind' : 'destKind';
              const idKey = side === 'origin' ? 'originId' : 'destId';
              const field = side === 'origin' ? 'origin' : 'destination';
              return (
                <fieldset key={side} className="rounded-xl border border-neutral-200 p-4">
                  <legend className="text-railway-blue-900 px-1 font-bold">
                    {side === 'origin' ? 'Collection' : 'Delivery'}
                  </legend>
                  <div
                    className="grid gap-2 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label={`${side === 'origin' ? 'Collection' : 'Delivery'} type`}
                  >
                    {(['door', 'terminal'] as const).map((k) => (
                      <label
                        key={k}
                        className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 ${f[kindKey] === k ? 'border-railway-green-600 bg-railway-green-100' : 'border-neutral-200'}`}
                      >
                        <input
                          type="radio"
                          name={`${side}-kind`}
                          className="accent-railway-green-700 mt-1"
                          checked={f[kindKey] === k}
                          onChange={() => setF((s) => ({ ...s, [kindKey]: k, [idKey]: '' }))}
                        />
                        <span>
                          <span className="text-railway-blue-900 block font-semibold">
                            {k === 'door'
                              ? side === 'origin'
                                ? 'Door: collect from the shipper'
                                : 'Door: deliver to the consignee'
                              : side === 'origin'
                                ? 'Terminal: you deliver to the terminal'
                                : 'Terminal: you collect at the terminal'}
                          </span>
                          <span className="block text-sm text-neutral-600">
                            {k === 'door'
                              ? `Road leg by ${cfg.haulierName}, included in the price`
                              : 'Road leg arranged by your team, not included'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-1.5">
                    <label htmlFor={`f-${field}`} className={label}>
                      {f[kindKey] === 'door' ? 'Address area' : 'Terminal'}
                    </label>
                    <select
                      id={`f-${field}`}
                      className={input}
                      value={f[idKey]}
                      onChange={(e) => set(idKey, e.target.value)}
                      aria-invalid={invalid(field) || invalid('route')}
                    >
                      <option value="">— Choose —</option>
                      {f[kindKey] === 'door'
                        ? catalogue.doors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.countryCode})
                            </option>
                          ))
                        : groups.map((g) => (
                            <optgroup key={g.country.code} label={g.country.name}>
                              {g.terminals.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.city} – {t.name}
                                  {t.dgCapable ? ' (DG)' : ''}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                    </select>
                  </div>
                </fieldset>
              );
            })}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="f-readyDate" className={label}>
                  Cargo ready on
                </label>
                <input
                  id="f-readyDate"
                  type="date"
                  className={input}
                  min={addDays(today, 1)}
                  max={addDays(today, 180)}
                  value={f.readyDate}
                  onChange={(e) => set('readyDate', e.target.value)}
                  aria-invalid={invalid('readyDate')}
                />
              </div>
              <fieldset id="f-routingMetric" className="grid gap-1.5">
                <legend className={label}>Rail routing</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['DISTANCE', 'Shortest distance'],
                      ['TIME', 'Fastest transit'],
                    ] as const
                  ).map(([v, l]) => (
                    <label
                      key={v}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${f.metric === v ? 'border-railway-green-600 bg-railway-green-100 text-railway-green-700' : 'text-railway-blue-900 border-neutral-200'}`}
                    >
                      <input
                        type="radio"
                        name="metric"
                        className="accent-railway-green-700"
                        checked={f.metric === v}
                        onChange={() => set('metric', v)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div id="f-route" aria-live="polite">
              {f.originId &&
                f.destId &&
                (path ? (
                  <p className="bg-railway-blue-100 text-railway-blue-950 rounded-xl p-4 text-sm">
                    <strong>Rail route found:</strong>{' '}
                    {path.pathIds.map((id) => terminalById(catalogue, id)?.city ?? id).join(' → ')}{' '}
                    · {path.distanceKm.toLocaleString('en-GB')} km
                    {path.borderCrossings > 0 &&
                      ` · ${path.borderCrossings} border crossing${path.borderCrossings > 1 ? 's' : ''}`}
                    . You compare the services and trains in the last step.
                  </p>
                ) : (
                  <p className="border-notice-border bg-notice-bg text-notice-text rounded-xl border-l-4 p-4 text-sm">
                    <strong>Route not covered.</strong> The SDG Railway network has no rail
                    connection between these places. The quote cannot be issued.
                  </p>
                ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 grid gap-5">
            <div className="grid gap-1.5">
              <label htmlFor="f-cargoDescription" className={label}>
                Cargo description
              </label>
              <input
                id="f-cargoDescription"
                className={input}
                value={f.cargoDescription}
                onChange={(e) => set('cargoDescription', e.target.value)}
                aria-invalid={invalid('cargoDescription')}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <label htmlFor="f-utiType" className={label}>
                  Loading unit (UTI)
                </label>
                <select
                  id="f-utiType"
                  className={input}
                  value={f.utiType}
                  onChange={(e) => set('utiType', e.target.value)}
                  aria-invalid={invalid('utiType')}
                  aria-describedby="h-uti"
                >
                  <option value="">— Choose —</option>
                  {catalogue.utiTypes.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <span id="h-uti" className="text-sm text-neutral-600">
                  {uti
                    ? [
                        uti.description,
                        uti.maxGrossKg && `max ${uti.maxGrossKg.toLocaleString('en-GB')} kg`,
                        uti.volumeM3 && `about ${uti.volumeM3} m³ per unit`,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : 'Types of unit SDG Railway carries.'}
                </span>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="f-quantity" className={label}>
                  Number of units
                </label>
                <input
                  id="f-quantity"
                  type="number"
                  min={1}
                  max={20}
                  className={input}
                  value={f.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  aria-invalid={invalid('quantity')}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="f-grossWeightKg" className={label}>
                  Total gross weight (kg)
                </label>
                <input
                  id="f-grossWeightKg"
                  type="number"
                  min={1}
                  step={100}
                  className={input}
                  value={f.grossWeightKg}
                  onChange={(e) => set('grossWeightKg', e.target.value)}
                  aria-invalid={invalid('grossWeightKg')}
                />
              </div>
            </div>
            <fieldset className="rounded-xl border border-neutral-200 p-4" id="f-packageCm">
              <legend className="text-railway-blue-900 px-1 font-bold">Packages</legend>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="grid gap-1.5">
                  <label htmlFor="f-packages" className={label}>
                    Number
                  </label>
                  <input
                    id="f-packages"
                    type="number"
                    min={1}
                    className={input}
                    value={f.packages}
                    onChange={(e) => set('packages', e.target.value)}
                    aria-invalid={invalid('packages')}
                  />
                </div>
                {(['length', 'width', 'height'] as const).map((d) => (
                  <div key={d} className="grid gap-1.5">
                    <label htmlFor={`f-${d}`} className={label}>
                      {d[0]!.toUpperCase() + d.slice(1)} (cm){' '}
                      <span className="font-normal text-neutral-600">optional</span>
                    </label>
                    <input
                      id={`f-${d}`}
                      type="number"
                      min={1}
                      className={input}
                      value={f[d]}
                      onChange={(e) => set(d, e.target.value)}
                      aria-invalid={invalid('packageCm')}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
            <fieldset className="rounded-xl border border-neutral-200 p-4" id="f-dangerousGoods">
              <legend className="text-railway-blue-900 px-1 font-bold">Special requirements</legend>
              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  className="accent-railway-green-700 mt-1 size-5"
                  checked={f.dg}
                  onChange={(e) => set('dg', e.target.checked)}
                />
                <span>
                  <span className="text-railway-blue-900 block font-semibold">
                    Dangerous goods (ADR/RID)
                  </span>
                  <span className="block text-sm text-neutral-600">
                    Only services and terminals that handle dangerous goods accept them; the route
                    avoids the others.
                  </span>
                </span>
              </label>
              {f.dg && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="f-adrClass" className={label}>
                      ADR/RID class
                    </label>
                    <select
                      id="f-adrClass"
                      className={input}
                      value={f.adrClass}
                      onChange={(e) => set('adrClass', e.target.value)}
                      aria-invalid={invalid('dangerousGoods')}
                    >
                      <option value="">— Choose —</option>
                      {adrClasses.map((a) => (
                        <option key={a.code} value={a.code}>
                          Class {a.code} – {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="f-unNumber" className={label}>
                      UN number <span className="font-normal text-neutral-600">optional</span>
                    </label>
                    <input
                      id="f-unNumber"
                      inputMode="numeric"
                      maxLength={4}
                      className={input}
                      value={f.unNumber}
                      onChange={(e) => set('unNumber', e.target.value)}
                      placeholder="e.g. 1203"
                    />
                  </div>
                </div>
              )}
              {uti?.reefer && (
                <div className="mt-4 grid gap-1.5 sm:max-w-xs">
                  <label htmlFor="f-temperatureC" className={label}>
                    Reefer set temperature (°C)
                  </label>
                  <input
                    id="f-temperatureC"
                    type="number"
                    step={0.5}
                    className={input}
                    value={f.temperatureC}
                    onChange={(e) => set('temperatureC', e.target.value)}
                    aria-invalid={invalid('temperatureC')}
                  />
                </div>
              )}
              <div className="mt-4 grid gap-1.5 sm:max-w-xs">
                <label htmlFor="f-insuranceValue" className={label}>
                  Insure declared value ({cfg.currency}){' '}
                  <span className="font-normal text-neutral-600">optional</span>
                </label>
                <input
                  id="f-insuranceValue"
                  type="number"
                  min={0}
                  step={1000}
                  className={input}
                  value={f.insuranceValue}
                  onChange={(e) => set('insuranceValue', e.target.value)}
                  aria-invalid={invalid('insuranceValue')}
                  aria-describedby="h-ins"
                />
                <span id="h-ins" className="text-sm text-neutral-600">
                  {Math.round(cfg.insuranceRate * 1000) / 10}% of the value, from{' '}
                  {cfg.minInsuranceValue} {cfg.currency}.
                </span>
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6">
            <fieldset id="f-serviceId">
              <legend className="text-railway-blue-900 font-bold">Choose the rail service</legend>
              <p className="mt-1 text-sm text-neutral-600">
                Door-to-door price and first train with room, for the cargo ready on{' '}
                {formatDateTime(f.readyDate, false)}.
              </p>
              {!options && busy && (
                <p role="status" className="text-railway-blue-900 mt-4 text-sm font-semibold">
                  {busy}
                </p>
              )}
              {options && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {options.map((o) => {
                    const usable = o.total !== null;
                    const chosen = f.serviceId === o.serviceId;
                    return (
                      <label
                        key={o.serviceId}
                        className={`relative flex flex-col gap-1 rounded-xl border p-4 ${usable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${chosen && usable ? 'border-railway-green-600 bg-railway-green-100 ring-railway-green-600 ring-1' : 'border-neutral-200'}`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="service"
                            className="accent-railway-green-700"
                            disabled={!usable}
                            checked={chosen && usable}
                            onChange={() => set('serviceId', o.serviceId)}
                          />
                          <span className="text-railway-blue-900 font-bold">{o.serviceName}</span>
                        </span>
                        <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                          {o.level}
                          {o.dgAllowed ? ' · dangerous goods allowed' : ''}
                        </span>
                        {usable ? (
                          <>
                            <span className="text-railway-blue-900 mt-1 text-2xl font-bold tabular-nums">
                              {money(o.total!, cfg.currency)}
                            </span>
                            <span className="text-sm text-neutral-700">
                              {o.train?.status === 'proposed'
                                ? `Departs ${formatDateTime(o.train.departure)}`
                                : `Train pending: ${o.train?.reason ?? ''}`}
                            </span>
                            <span className="text-sm text-neutral-600">
                              About {Math.round((o.transitMin ?? 0) / 6) / 10} h by rail
                            </span>
                          </>
                        ) : (
                          <span className="mt-1 text-sm text-neutral-700">{o.error}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
            <dl className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ['Team PIN', f.pin],
                ['Requested by', f.requester],
                ['Shipper → consignee', `${f.shipper} → ${f.consignee}`],
                ['Incoterm', f.incoterm],
                ['From', placeName(catalogue, req.origin)],
                ['To', placeName(catalogue, req.destination)],
                ['Ready on', f.readyDate],
                [
                  'Cargo',
                  `${f.cargoDescription}, ${f.packages} packages, ${Number(f.grossWeightKg).toLocaleString('en-GB')} kg`,
                ],
                ['Loading unit', `${f.quantity} × ${uti?.name ?? '–'}`],
                [
                  'Special',
                  [
                    f.dg ? `ADR/RID class ${f.adrClass}` : 'General cargo',
                    f.temperatureC && `${f.temperatureC} °C`,
                    f.insuranceValue && `insured ${f.insuranceValue} ${cfg.currency}`,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-[9rem_1fr] gap-2 border-b border-neutral-200 py-2"
                >
                  <dt className="text-neutral-600">{k}</dt>
                  <dd className="text-railway-blue-900 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-neutral-600">
              Prices come from the SDG Railway tariff and surcharges in the course Sheet.
              {backend.mode === 'live'
                ? ' The quote is saved in the SDG Railway register with a PDF.'
                : ' Demo mode: the quote is saved in this browser only.'}
            </p>
          </div>
        )}

        {busy && step < 3 && (
          <p role="status" className="text-railway-blue-900 mt-4 text-sm font-semibold">
            {busy}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-neutral-200 pt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => {
                setStep(step - 1);
                setErrors([]);
                focusTop();
              }}
              className="text-railway-blue-900 inline-flex min-h-11 items-center rounded-lg border border-neutral-200 px-5 font-semibold"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="bg-railway-green-700 hover:bg-railway-green-800 inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white"
            >
              Continue <Icon name="arrow" className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={
                !!busy || !options?.some((o) => o.serviceId === f.serviceId && o.total !== null)
              }
              className="bg-railway-green-700 hover:bg-railway-green-800 inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white disabled:opacity-60"
            >
              <Icon name="quote" className="size-4" />{' '}
              {busy && options ? busy : 'Get the quotation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
