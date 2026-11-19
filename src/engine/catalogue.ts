/**
 * Turns the raw tabs of the SDG Railway Google Sheet into a typed catalogue.
 *
 * The Sheet is the only source of master data. This file is shared: the website imports it, and
 * `scripts/apps-script/build.mjs` bundles it into the Apps Script project, where `Code.gs` passes
 * the tabs read with `getDataRange().getValues()`.
 */

/** One Sheet tab as rows of header → cell value (what Code.gs `getTable_` returns). */
export type SheetRow = Record<string, unknown>;
export type SheetTables = Record<string, SheetRow[]>;

export const TABS = {
  CONFIG: 'CONFIG',
  COUNTRIES: 'COUNTRIES',
  TERMINALS: 'TERMINALS',
  COUNTRY_CONNECTIONS: 'COUNTRY_CONNECTIONS',
  LINKS: 'LINKS',
  SCHEDULES: 'SCHEDULES',
  SERVICES: 'SERVICES',
  UTI_TYPES: 'UTI_TYPES',
  ADR_CLASSES: 'ADR_CLASSES',
  TARIFFS: 'TARIFFS',
  SURCHARGES: 'SURCHARGES',
  ROAD_LEGS: 'ROAD_LEGS',
} as const;

/** Tabs that hold public master data (safe to publish in the website snapshot). */
export const PUBLIC_TABS = Object.values(TABS);

export interface Config {
  companyName: string;
  brandName: string;
  currency: string;
  vatRate: number;
  insuranceRate: number;
  minInsuranceValue: number;
  quotationValidityDays: number;
  supportEmail: string;
  quotePrefix: string;
  bookingPrefix: string;
  defaultRoutingMetric: 'DISTANCE' | 'TIME';
  defaultSpeedKmH: number;
  cutOffHours: number;
  defaultSlotsPerDeparture: number;
  haulierName: string;
  searchDays: number;
}

export interface Country {
  code: string;
  name: string;
  status: string;
  flag: string;
  active: boolean;
}

export interface Terminal {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  type: string;
  dgCapable: boolean;
  active: boolean;
  notes: string;
}

export interface Link {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  timeMin: number;
  active: boolean;
  corridorTag: string;
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  level: string;
  speedKmH: number;
  dgAllowed: boolean;
  active: boolean;
  description: string;
}

export interface Schedule {
  /** Route key: "*", "ES→FR", "*→IT" or "ES→*". */
  route: string;
  departureDays: number[];
  departureTime: string;
  blockedDates: string[];
  notes: string;
  slotsPerDeparture: number | null;
}

export interface UtiType {
  code: string;
  name: string;
  category: string;
  description: string;
  reefer: boolean;
  maxGrossKg: number | null;
  volumeM3: number | null;
}

export interface AdrClass {
  code: string;
  name: string;
  description: string;
}

export interface Tariff {
  serviceId: string;
  utiType: string;
  fixedFee: number;
  ratePerKm: number;
  minCharge: number;
  applyPer: string;
  active: boolean;
}

export interface Surcharge {
  code: string;
  label: string;
  amountType: string;
  amount: number;
  rule: string;
  active: boolean;
  applyPer: string;
  notes: string;
}

/** Play Haulier road leg between a customer place (door) and a rail terminal, both directions. */
export interface RoadLeg {
  id: string;
  placeId: string;
  placeName: string;
  countryCode: string;
  terminalId: string;
  distanceKm: number;
  price: number;
  hours: number;
  active: boolean;
}

export interface Door {
  id: string;
  name: string;
  countryCode: string;
}

export interface Catalogue {
  config: Config;
  countries: Country[];
  terminals: Terminal[];
  connections: { from: string; to: string }[];
  links: Link[];
  services: Service[];
  globalBlockedDates: string[];
  schedules: Record<string, Schedule[]>;
  utiTypes: UtiType[];
  adrClasses: AdrClass[];
  tariffs: Tariff[];
  surcharges: Surcharge[];
  roadLegs: RoadLeg[];
  doors: Door[];
}

// ---------------------------------------------------------------- cell helpers (match Code.gs)

export function toBool(v: unknown, def: boolean): boolean {
  if (v === true || v === false) return v;
  if (v === null || v === undefined || v === '') return def;
  const s = String(v).trim().toUpperCase();
  if (['TRUE', 'YES', 'Y', '1'].includes(s)) return true;
  if (['FALSE', 'NO', 'N', '0'].includes(s)) return false;
  return def;
}

export function toNumber(v: unknown, def: number): number {
  if (typeof v === 'number') return v;
  if (v === null || v === undefined || v === '') return def;
  const n = parseFloat(String(v).replace(/,/g, '').trim());
  return Number.isNaN(n) ? def : n;
}

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

function optNumber(v: unknown): number | null {
  const n = toNumber(v, NaN);
  return Number.isNaN(n) ? null : n;
}

/** Sheets returns time cells as text ("08:00"), a fraction of a day or a 1899 date. */
export function parseTime(raw: unknown): string {
  if (raw instanceof Date) {
    return `${String(raw.getHours()).padStart(2, '0')}:${String(raw.getMinutes()).padStart(2, '0')}`;
  }
  if (typeof raw === 'number') {
    const m = Math.round(raw * 24 * 60);
    return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }
  const s = str(raw);
  if (/^\d{1,2}:\d{2}/.test(s)) {
    const [h, mm] = s.split(':');
    return `${h!.padStart(2, '0')}:${mm!.slice(0, 2)}`;
  }
  return '08:00';
}

/** Dates in a list cell may be ISO text or Date objects. */
function dateList(raw: unknown): string[] {
  if (raw instanceof Date) return [isoDate(raw)];
  return str(raw)
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
}

function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0, '0': 0,
  mon: 1, monday: 1, '1': 1,
  tue: 2, tuesday: 2, '2': 2,
  wed: 3, wednesday: 3, '3': 3,
  thu: 4, thursday: 4, '4': 4,
  fri: 5, friday: 5, '5': 5,
  sat: 6, saturday: 6, '6': 6,
}; // prettier-ignore

function parseDays(raw: unknown): number[] {
  const s = str(raw).toLowerCase();
  if (!s || s === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  const days = s
    .split(',')
    .map((d) => DAY_MAP[d.trim()])
    .filter((d): d is number => d !== undefined);
  return days.length ? days : [0, 1, 2, 3, 4, 5, 6];
}

/** "STD-RAIL:ES → FR" → { serviceId: "STD-RAIL", route: "ES→FR" } */
export function parseScheduleKey(raw: string): { serviceId: string; route: string } {
  const i = raw.indexOf(':');
  if (i < 0) return { serviceId: raw.trim().toUpperCase(), route: '*' };
  return {
    serviceId: raw.slice(0, i).trim().toUpperCase(),
    route: raw
      .slice(i + 1)
      .trim()
      .toUpperCase()
      .replace(/\s*[-–—>→]+\s*/g, '→')
      .replace(/\s/g, ''),
  };
}

/** Terminals a team can choose: active terminal in a country with Status "Active" (as in v7). */
export function bookableTerminals(cat: Catalogue): Terminal[] {
  const active = new Set(cat.countries.filter((c) => c.active).map((c) => c.code));
  return cat.terminals.filter((t) => t.active && active.has(t.countryCode));
}

// ---------------------------------------------------------------- build

export function buildCatalogue(tables: SheetTables): Catalogue {
  const rows = (tab: string) => tables[tab] ?? [];

  const cfg: Record<string, unknown> = {};
  for (const r of rows(TABS.CONFIG)) {
    const key = str(r.Parameter);
    if (key) cfg[key] = r.Value;
  }
  const metric = str(cfg.DefaultRoutingMetric).toUpperCase() === 'TIME' ? 'TIME' : 'DISTANCE';
  const config: Config = {
    companyName: str(cfg.CompanyName) || 'SDG Railway',
    brandName: str(cfg.BrandName) || 'Railway Quotation Simulator',
    currency: str(cfg.Currency) || 'EUR',
    vatRate: toNumber(cfg.VATRate, 0),
    insuranceRate: toNumber(cfg.InsuranceRate, 0),
    minInsuranceValue: toNumber(cfg.MinInsuranceValue, 100),
    quotationValidityDays: Math.max(1, Math.round(toNumber(cfg.QuotationValidityDays, 30))),
    supportEmail: str(cfg.SupportEmail),
    quotePrefix: str(cfg.QuotePrefix) || 'RWQ',
    bookingPrefix: str(cfg.BookingPrefix) || 'RWB',
    defaultRoutingMetric: metric,
    defaultSpeedKmH: toNumber(cfg.DefaultSpeedKmH, 80),
    cutOffHours: toNumber(cfg.CutOffHours, 12),
    defaultSlotsPerDeparture: Math.round(toNumber(cfg.DefaultSlotsPerDeparture, 20)),
    haulierName: str(cfg.HaulierName) || 'Play Haulier',
    searchDays: Math.round(toNumber(cfg.TrainSearchDays, 14)),
  };

  const countries = rows(TABS.COUNTRIES)
    .filter((c) => str(c.CountryCode))
    .map((c) => ({
      code: str(c.CountryCode).toUpperCase(),
      name: str(c.CountryName),
      status: str(c.Status),
      flag: str(c.FlagEmoji),
      active: str(c.Status).toLowerCase() === 'active',
    }));

  const terminals = rows(TABS.TERMINALS)
    .filter((t) => str(t.TerminalID))
    .map((t) => ({
      id: str(t.TerminalID),
      name: str(t.TerminalName),
      city: str(t.City),
      countryCode: str(t.CountryCode).toUpperCase(),
      type: str(t.TerminalType),
      dgCapable: toBool(t.DGCapable, false),
      active: toBool(t.Active, true),
      notes: str(t.Notes),
    }));

  const connections = rows(TABS.COUNTRY_CONNECTIONS)
    .filter((c) => toBool(c.Active, true) && str(c.FromCountry) && str(c.ToCountry))
    .map((c) => ({ from: str(c.FromCountry).toUpperCase(), to: str(c.ToCountry).toUpperCase() }));

  const links = rows(TABS.LINKS)
    .filter((l) => str(l.FromTerminalID) && str(l.ToTerminalID))
    .map((l) => ({
      id: str(l.LinkID),
      from: str(l.FromTerminalID),
      to: str(l.ToTerminalID),
      distanceKm: toNumber(l.DistanceKm, 0),
      timeMin: toNumber(l.TimeMin, 0),
      active: toBool(l.Active, true),
      corridorTag: str(l.CorridorTag),
      notes: str(l.Notes),
    }));

  const services = rows(TABS.SERVICES)
    .filter((s) => str(s.ServiceID))
    .map((s) => ({
      id: str(s.ServiceID),
      name: str(s.ServiceName),
      level: str(s.ServiceLevel),
      speedKmH: toNumber(s.SpeedKmH, config.defaultSpeedKmH),
      dgAllowed: toBool(s.DGAllowed, false),
      active: toBool(s.Active, true),
      description: str(s.Description),
    }));

  const globalBlockedDates: string[] = [];
  const schedules: Record<string, Schedule[]> = {};
  for (const r of rows(TABS.SCHEDULES)) {
    const key = str(r.ServiceID);
    if (!key) continue;
    if (key.toUpperCase() === 'GLOBAL') {
      globalBlockedDates.push(...dateList(r.BlockedDates));
      continue;
    }
    const { serviceId, route } = parseScheduleKey(key);
    (schedules[serviceId] ??= []).push({
      route,
      departureDays: parseDays(r.DepartureDays),
      departureTime: parseTime(r.DepartureTime),
      blockedDates: dateList(r.BlockedDates),
      notes: str(r.Notes),
      slotsPerDeparture: optNumber(r.SlotsPerDeparture),
    });
  }

  const utiTypes = rows(TABS.UTI_TYPES)
    .filter((u) => str(u.UTICode))
    .map((u) => ({
      code: str(u.UTICode),
      name: str(u.UTIName),
      category: str(u.Category),
      description: str(u.Description),
      reefer: /temperature|reefer/i.test(`${str(u.Category)} ${str(u.UTICode)}`),
      maxGrossKg: optNumber(u.MaxGrossKg),
      volumeM3: optNumber(u.VolumeM3),
    }));

  const adrClasses = rows(TABS.ADR_CLASSES)
    .filter((a) => str(a.ClassCode))
    .map((a) => ({
      code: str(a.ClassCode),
      name: str(a.ClassName),
      description: str(a.Description),
    }));

  const tariffs = rows(TABS.TARIFFS)
    .filter((t) => str(t.ServiceID) && str(t.UTIType))
    .map((t) => ({
      serviceId: str(t.ServiceID),
      utiType: str(t.UTIType),
      fixedFee: toNumber(t.FixedFee, 0),
      ratePerKm: toNumber(t.RatePerKm, 0),
      minCharge: toNumber(t.MinCharge, 0),
      applyPer: str(t.ApplyPer).toLowerCase() || 'unit',
      active: toBool(t.Active, true),
    }));

  const surcharges = rows(TABS.SURCHARGES).map((s) => ({
    code: str(s.SurchargeCode),
    label: str(s.Label) || str(s.SurchargeCode),
    amountType: str(s.AmountType).toLowerCase(),
    amount: toNumber(s.Amount, 0),
    rule: str(s.Rule),
    active: toBool(s.Active, true),
    applyPer: str(s.ApplyPer).toLowerCase() || 'shipment',
    notes: str(s.Notes),
  }));

  const roadLegs = rows(TABS.ROAD_LEGS)
    .filter((r) => str(r.PlaceID) && str(r.TerminalID))
    .map((r) => ({
      id: str(r.LegID) || `${str(r.PlaceID)}|${str(r.TerminalID)}`,
      placeId: str(r.PlaceID),
      placeName: str(r.PlaceName) || str(r.PlaceID),
      countryCode: str(r.CountryCode).toUpperCase(),
      terminalId: str(r.TerminalID),
      distanceKm: toNumber(r.DistanceKm, 0),
      price: toNumber(r.Price, 0),
      hours: toNumber(r.TransitHours, 0),
      active: toBool(r.Active, true),
    }));

  const doors: Door[] = [];
  for (const r of roadLegs) {
    if (!r.active || doors.some((d) => d.id === r.placeId)) continue;
    doors.push({ id: r.placeId, name: r.placeName, countryCode: r.countryCode });
  }

  return {
    config,
    countries,
    terminals,
    connections,
    links,
    services,
    globalBlockedDates,
    schedules,
    utiTypes,
    adrClasses,
    tariffs,
    surcharges,
    roadLegs,
    doors,
  };
}
