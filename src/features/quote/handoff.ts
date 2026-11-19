import { placeName } from './engine';
import type { Booking, Catalogue, Quote } from './types';

/**
 * Structured summary for Click & Cargo (brief §4). Until an API exists, students download it as
 * JSON or copy it. Field names are a proposal to be agreed with the ERP team
 * (docs/product/data-model-and-erp-mapping.md).
 */
export interface Handoff {
  schema: 'sdg-railway.handoff/v1';
  simulation: true;
  catalogueVersion: string;
  readyForErp: boolean;
  blockedReason: string | null;
  references: { quote: string; quoteVersion: number; booking: string | null };
  parties: {
    customer: string;
    requester: string;
    shipper: string;
    consignee: string;
    intermodalCarrier: 'SDG Railway';
    roadHaulier: string | null;
  };
  incoterm: string;
  cargo: {
    description: string;
    grossWeightKg: number;
    packages: number;
    itu: string;
    quantity: number;
    dangerousGoods: { ridClass: string; unNumber: string | null } | null;
    temperatureC: number | null;
  };
  route: {
    origin: string;
    originTerminal: string;
    destinationTerminal: string;
    destination: string;
  };
  legs: { leg: string; from: string; to: string; provider: string; scope: string }[];
  prices: { item: string; quantity: number; unitPrice: number; amount: number }[];
  total: number;
  currency: string;
  train: {
    id: string;
    status: string;
    departure: string | null;
    cutOff: string | null;
    arrival: string | null;
  };
  dates: {
    readyDate: string;
    quoteIssued: string;
    quoteExpires: string;
    deliveryEstimate: string | null;
  };
  terminalOrders: {
    delivery: { terminal: string; driver: string; vehicle: string };
    collection: { terminal: string; driver: string; vehicle: string };
  } | null;
  documents: string[];
}

export function buildHandoff(cat: Catalogue, quote: Quote, booking: Booking | null): Handoff {
  const r = quote.request;
  const ot = cat.terminals.find((t) => t.id === quote.route.originTerminal)!;
  const dt = cat.terminals.find((t) => t.id === quote.route.destinationTerminal)!;
  const train = booking?.train ?? quote.train;
  const blockedReason = !booking
    ? 'The quote has not been accepted: there is no booking yet.'
    : booking.status !== 'confirmed'
      ? 'The train is pending confirmation. ERP steps that need a train are blocked.'
      : null;
  const roadIncluded = quote.legs.some(
    (l) => (l.kind === 'origin-road' || l.kind === 'destination-road') && l.scope === 'included',
  );
  return {
    schema: 'sdg-railway.handoff/v1',
    simulation: true,
    catalogueVersion: quote.catalogueVersion,
    readyForErp: blockedReason === null,
    blockedReason,
    references: { quote: quote.ref, quoteVersion: quote.version, booking: booking?.ref ?? null },
    parties: {
      customer: quote.team,
      requester: r.requester,
      shipper: r.shipper,
      consignee: r.consignee,
      intermodalCarrier: 'SDG Railway',
      roadHaulier: roadIncluded ? cat.haulier : null,
    },
    incoterm: r.incoterm,
    cargo: {
      description: r.cargoDescription,
      grossWeightKg: r.grossWeightKg,
      packages: r.packages,
      itu: r.ituCode,
      quantity: r.quantity,
      dangerousGoods: r.dangerousGoods
        ? { ridClass: r.dangerousGoods.ridClass, unNumber: r.dangerousGoods.unNumber || null }
        : null,
      temperatureC: r.temperatureC,
    },
    route: {
      origin: placeName(cat, r.origin),
      originTerminal: `${ot.name}, ${ot.city}`,
      destinationTerminal: `${dt.name}, ${dt.city}`,
      destination: placeName(cat, r.destination),
    },
    legs: quote.legs.map((l) => ({
      leg: l.kind,
      from: l.from,
      to: l.to,
      provider: l.provider,
      scope: l.scope,
    })),
    prices: quote.lines.map((l) => ({
      item: l.label,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: l.amount,
    })),
    total: quote.total,
    currency: quote.currency,
    train: {
      id: train.trainId,
      status: train.status,
      departure: train.departure,
      cutOff: train.cutOff,
      arrival: train.arrival,
    },
    dates: {
      readyDate: r.readyDate,
      quoteIssued: quote.issuedAt,
      quoteExpires: quote.expiresAt,
      deliveryEstimate: quote.deliveryEstimate,
    },
    terminalOrders: booking
      ? {
          delivery: {
            terminal: `${ot.name}, ${ot.city}`,
            driver: booking.terminalOrders.deliveryDriver,
            vehicle: booking.terminalOrders.deliveryVehicle,
          },
          collection: {
            terminal: `${dt.name}, ${dt.city}`,
            driver: booking.terminalOrders.collectionDriver,
            vehicle: booking.terminalOrders.collectionVehicle,
          },
        }
      : null,
    documents: [
      `Quotation ${quote.ref} v${quote.version} (PDF)`,
      ...(booking
        ? [
            `Booking confirmation ${booking.ref}`,
            'Terminal delivery order (gate in)',
            'Terminal collection order (gate out)',
          ]
        : []),
    ],
  };
}
