import type catalogueJson from '@/data/demo-catalogue.json';

export type Catalogue = typeof catalogueJson;
export type Lane = Catalogue['lanes'][number];
export type Itu = Catalogue['itus'][number];
export type CatalogueTerminal = Catalogue['terminals'][number];
export type Door = Catalogue['doors'][number];

export const INCOTERMS = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] as const;
export type Incoterm = (typeof INCOTERMS)[number];

export const RID_CLASSES: [string, string][] = [
  ['1', 'Explosives'],
  ['2', 'Gases'],
  ['3', 'Flammable liquids'],
  ['4.1', 'Flammable solids'],
  ['4.2', 'Substances liable to spontaneous combustion'],
  ['4.3', 'Substances which emit flammable gases with water'],
  ['5.1', 'Oxidising substances'],
  ['5.2', 'Organic peroxides'],
  ['6.1', 'Toxic substances'],
  ['6.2', 'Infectious substances'],
  ['7', 'Radioactive material'],
  ['8', 'Corrosive substances'],
  ['9', 'Miscellaneous dangerous substances'],
];

export type Place = { kind: 'door'; id: string } | { kind: 'terminal'; id: string };

export interface QuoteRequest {
  pin: string;
  requester: string;
  shipper: string;
  consignee: string;
  incoterm: Incoterm | '';
  origin: Place;
  destination: Place;
  /** Date the loading unit is ready at the origin (YYYY-MM-DD). */
  readyDate: string;
  cargoDescription: string;
  grossWeightKg: number;
  packages: number;
  /** Optional package dimensions in cm, used to estimate the volume. */
  packageCm: { length: number; width: number; height: number } | null;
  ituCode: string;
  quantity: number;
  dangerousGoods: { ridClass: string; unNumber: string } | null;
  temperatureC: number | null;
  insuranceValue: number | null;
}

export type ErrorCode =
  | 'required'
  | 'invalid-pin'
  | 'route-not-covered'
  | 'itu-incompatible'
  | 'weight-exceeded'
  | 'volume-exceeded'
  | 'dangerous-goods-not-accepted'
  | 'temperature-required'
  | 'date-invalid';

export interface QuoteError {
  field: keyof QuoteRequest | 'route';
  code: ErrorCode;
  message: string;
}

export type LegKind =
  'origin-road' | 'origin-terminal' | 'rail' | 'destination-terminal' | 'destination-road';
export type Scope = 'included' | 'excluded' | 'pending';

export interface QuoteLeg {
  kind: LegKind;
  from: string;
  to: string;
  provider: string;
  scope: Scope;
  note: string;
}

export interface QuoteLine {
  id: string;
  leg: LegKind | 'extra';
  label: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface TrainProposal {
  status: 'proposed' | 'pending';
  trainId: string;
  serviceName: string;
  /** Local date-times, YYYY-MM-DDTHH:mm. Null while the train is pending. */
  departure: string | null;
  cutOff: string | null;
  arrival: string | null;
  reason: string | null;
}

export type QuoteStatus = 'issued' | 'accepted' | 'expired' | 'superseded';

export interface Quote {
  ref: string;
  version: number;
  status: QuoteStatus;
  issuedAt: string;
  expiresAt: string;
  catalogueVersion: string;
  team: string;
  request: QuoteRequest;
  laneId: string;
  route: { originTerminal: string; destinationTerminal: string; distanceKm: number };
  legs: QuoteLeg[];
  lines: QuoteLine[];
  total: number;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  conditions: string[];
  train: TrainProposal;
  /** Estimated delivery at the destination (door or terminal), or null while the train is pending. */
  deliveryEstimate: string | null;
}

export interface TerminalOrders {
  deliveryDriver: string;
  deliveryVehicle: string;
  collectionDriver: string;
  collectionVehicle: string;
}

export interface Booking {
  ref: string;
  quoteRef: string;
  quoteVersion: number;
  status: 'confirmed' | 'pending-train';
  createdAt: string;
  train: TrainProposal;
  terminalOrders: TerminalOrders;
}
