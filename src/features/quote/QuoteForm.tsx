'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import catalogue from '@/data/demo-catalogue.json';
import { Icon } from '@/components/ui/Icon';
import { placeName, resolveLane, validateRequest } from './engine';
import { QuoteDocument } from './QuoteDocument';
import { acceptQuoteByRef, requestQuote, useDemoStore } from './store';
import { addDays, dayName, localNow } from './time';
import {
  INCOTERMS,
  RID_CLASSES,
  type Booking,
  type Place,
  type Quote,
  type QuoteError,
  type QuoteRequest,
} from './types';

const STEPS = ['Team and case', 'Route and date', 'Cargo and unit', 'Review'] as const;
const STEP_FIELDS: (QuoteError['field'] | string)[][] = [
  ['pin', 'requester', 'shipper', 'consignee', 'incoterm'],
  ['origin', 'destination', 'readyDate', 'route'],
  [
    'cargoDescription',
    'packages',
    'packageCm',
    'grossWeightKg',
    'ituCode',
    'quantity',
    'dangerousGoods',
    'temperatureC',
    'insuranceValue',
  ],
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
  cargoDescription: string;
  packages: string;
  length: string;
  width: string;
  height: string;
  grossWeightKg: string;
  ituCode: string;
  quantity: string;
  dg: boolean;
  ridClass: string;
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
  cargoDescription: '',
  packages: '',
  length: '',
  width: '',
  height: '',
  grossWeightKg: '',
  ituCode: '',
  quantity: '1',
  dg: false,
  ridClass: '',
  unNumber: '',
  temperatureC: '',
  insuranceValue: '',
};

/** Next Monday at least 3 days ahead: a ready date that always has a teaching-lane train. */
function exampleReadyDate(): string {
  const today = localNow(new Date()).slice(0, 10);
  let d = addDays(today, 3);
  while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
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
  originId: 'door-toledo',
  destKind: 'door',
  destId: 'door-atessa',
  readyDate: exampleReadyDate(),
  cargoDescription: 'Automotive parts',
  packages: '24',
  length: '120',
  width: '100',
  height: '160',
  grossWeightKg: '18000',
  ituCode: '45HC',
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
    cargoDescription: f.cargoDescription,
    grossWeightKg: num(f.grossWeightKg),
    packages: num(f.packages),
    packageCm: dims.every((d) => d > 0)
      ? { length: dims[0]!, width: dims[1]!, height: dims[2]! }
      : null,
    ituCode: f.ituCode,
    quantity: num(f.quantity),
    dangerousGoods: f.dg ? { ridClass: f.ridClass, unNumber: f.unNumber.trim() } : null,
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
    cargoDescription: r.cargoDescription,
    packages: String(r.packages),
    length: r.packageCm ? String(r.packageCm.length) : '',
    width: r.packageCm ? String(r.packageCm.width) : '',
    height: r.packageCm ? String(r.packageCm.height) : '',
    grossWeightKg: String(r.grossWeightKg),
    ituCode: r.ituCode,
    quantity: String(r.quantity),
    dg: !!r.dangerousGoods,
    ridClass: r.dangerousGoods?.ridClass ?? '',
    unNumber: r.dangerousGoods?.unNumber ?? '',
    temperatureC: r.temperatureC === null ? '' : String(r.temperatureC),
    insuranceValue: r.insuranceValue === null ? '' : String(r.insuranceValue),
  };
}

const input =
  'min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-railway-blue-700 aria-[invalid=true]:border-[#8a1a1a] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-[#8a1a1a]';
const label = 'text-sm font-semibold text-railway-blue-900';

export function QuoteForm() {
  const params = useSearchParams();
  const store = useDemoStore();
  const requoteRef = params.get('requote');
  const requoteVersion = Number(params.get('v') ?? '0');
  const [f, setF] = useState<FormState>(() => {
    if (params.get('example') === '1') return WORKED_EXAMPLE();
    const o = parsePlace(params.get('from'));
    const d = parsePlace(params.get('to'));
    return {
      ...EMPTY,
      ...(o ? { originKind: o.kind, originId: o.id } : {}),
      ...(d ? { destKind: d.kind, destId: d.id } : {}),
      ituCode: params.get('itu') ?? '',
      readyDate: params.get('date') ?? '',
    };
  });
  const [loadedRequote, setLoadedRequote] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<QuoteError[]>([]);
  const [result, setResult] = useState<Quote | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [acceptMsg, setAcceptMsg] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Requote: load the request of an existing quote once the store is available.
  if (requoteRef && store && !loadedRequote) {
    const q = store.quotes.find((x) => x.ref === requoteRef && x.version === requoteVersion);
    setLoadedRequote(true);
    if (q) setF(fromRequest(q.request));
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const req = toRequest(f);
  const lane = f.originId && f.destId ? resolveLane(catalogue, req.origin, req.destination) : null;
  const itu = catalogue.itus.find((u) => u.code === f.ituCode);
  const today = localNow(new Date()).slice(0, 10);

  function focusTop() {
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function showErrors(list: QuoteError[]) {
    setErrors(list);
    if (list.length) requestAnimationFrame(() => errorRef.current?.focus());
  }

  function stepErrors(s: number): QuoteError[] {
    const all = validateRequest(catalogue, req, new Date());
    const fields = STEP_FIELDS.slice(0, s + 1).flat();
    let list = all.filter((e) => fields.includes(e.field));
    if (s === 1 && !list.length && f.originId && f.destId && !lane)
      list = [
        {
          field: 'route',
          code: 'route-not-covered',
          message: `SDG Railway has no approved service from ${placeName(catalogue, req.origin)} to ${placeName(catalogue, req.destination)} in catalogue ${catalogue.version}. Choose a covered lane (listed below the form).`,
        },
      ];
    return list;
  }

  function next() {
    const list = stepErrors(step);
    showErrors(list);
    if (list.length) return;
    setStep(step + 1);
    focusTop();
  }

  function submit() {
    const res = requestQuote(req, requoteRef ?? undefined);
    if (!res.ok) {
      const firstStep = STEP_FIELDS.findIndex((fs) => res.errors.some((e) => fs.includes(e.field)));
      if (firstStep >= 0) setStep(firstStep);
      showErrors(res.errors);
      return;
    }
    setErrors([]);
    setResult(res.quote);
    setBooking(null);
    focusTop();
  }

  function accept() {
    if (!result) return;
    const res = acceptQuoteByRef(result.ref, result.version);
    if (!res.ok) {
      setAcceptMsg(res.message);
      return;
    }
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
                ? `Train ${booking.train.trainId} is assigned.`
                : 'SDG Railway will confirm the train; ERP steps that need a train are blocked meanwhile.'}
            </>
          ) : (
            <>
              Quote <strong className="font-mono">{result.ref}</strong> v{result.version} saved for{' '}
              {result.team}. A quote is not a booking: accept it to confirm capacity.
            </>
          )}
        </div>
        <div className="mt-6">
          <QuoteDocument
            quote={result}
            status={booking ? booking.status : 'issued'}
            booking={booking}
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
        <div className="mt-6 flex flex-wrap gap-3">
          {!booking && (
            <button
              type="button"
              onClick={accept}
              className="bg-railway-green-700 hover:bg-railway-green-800 inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white"
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
                              ? 'Road leg by Play Haulier, included in the price'
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
                              {d.label}
                            </option>
                          ))
                        : catalogue.terminals.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.city} – {t.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </fieldset>
              );
            })}
            <div className="grid gap-1.5 sm:max-w-xs">
              <label htmlFor="f-readyDate" className={label}>
                Cargo ready on
              </label>
              <input
                id="f-readyDate"
                type="date"
                className={input}
                min={addDays(today, 1)}
                max={catalogue.validTo}
                value={f.readyDate}
                onChange={(e) => set('readyDate', e.target.value)}
                aria-invalid={invalid('readyDate')}
              />
            </div>
            <div id="f-route" aria-live="polite">
              {f.originId &&
                f.destId &&
                (lane ? (
                  <p className="bg-railway-blue-100 text-railway-blue-950 rounded-xl p-4 text-sm">
                    <strong>Covered lane {lane.id}:</strong>{' '}
                    {catalogue.terminals.find((t) => t.id === lane.from)?.city} →{' '}
                    {catalogue.terminals.find((t) => t.id === lane.to)?.city}, train {lane.train.id}{' '}
                    on {lane.train.days.map(dayName).join(', ')} at {lane.train.departure}.
                  </p>
                ) : (
                  <p className="border-notice-border bg-notice-bg text-notice-text rounded-xl border-l-4 p-4 text-sm">
                    <strong>Route not covered.</strong> There is no approved SDG Railway service
                    between these places. The quote cannot be issued.
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
                <label htmlFor="f-ituCode" className={label}>
                  Loading unit (ITU)
                </label>
                <select
                  id="f-ituCode"
                  className={input}
                  value={f.ituCode}
                  onChange={(e) => set('ituCode', e.target.value)}
                  aria-invalid={invalid('ituCode')}
                  aria-describedby="h-itu"
                >
                  <option value="">— Choose —</option>
                  {catalogue.itus.map((u) => (
                    <option key={u.code} value={u.code}>
                      {u.name}
                      {lane && !lane.acceptedItus.includes(u.code) ? ' (not on this lane)' : ''}
                    </option>
                  ))}
                </select>
                <span id="h-itu" className="text-sm text-neutral-600">
                  {itu
                    ? `Max ${itu.maxGrossKg.toLocaleString('en-GB')} kg gross and about ${itu.volumeM3} m³ per unit (learning values).`
                    : 'Units not accepted on your lane are marked.'}
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
                  max={10}
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
                    Dangerous goods (RID)
                  </span>
                  <span className="block text-sm text-neutral-600">
                    Only Standard Rail lanes and terminals that handle dangerous goods accept them.
                  </span>
                </span>
              </label>
              {f.dg && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="f-ridClass" className={label}>
                      RID class
                    </label>
                    <select
                      id="f-ridClass"
                      className={input}
                      value={f.ridClass}
                      onChange={(e) => set('ridClass', e.target.value)}
                      aria-invalid={invalid('dangerousGoods')}
                    >
                      <option value="">— Choose —</option>
                      {RID_CLASSES.map(([c, n]) => (
                        <option key={c} value={c}>
                          Class {c} – {n}
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
              {itu && 'reefer' in itu && itu.reefer && (
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
                  Insure declared value (EUR){' '}
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
                  aria-describedby="h-ins"
                />
                <span id="h-ins" className="text-sm text-neutral-600">
                  {catalogue.charges.insuranceRate * 100}% of the value, from{' '}
                  {catalogue.charges.insuranceMinValue} EUR.
                </span>
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
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
                ['Loading unit', `${f.quantity} × ${itu?.name ?? '–'}`],
                [
                  'Special',
                  [
                    f.dg ? `RID class ${f.ridClass}` : 'General cargo',
                    f.temperatureC && `${f.temperatureC} °C`,
                    f.insuranceValue && `insured ${f.insuranceValue} EUR`,
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
              SDG Railway checks the lane, the loading unit and the train before pricing. Prices
              come from the DEMO test catalogue {catalogue.version}.
            </p>
          </div>
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
              className="bg-railway-green-700 hover:bg-railway-green-800 inline-flex min-h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white"
            >
              <Icon name="quote" className="size-4" /> Get the quotation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
