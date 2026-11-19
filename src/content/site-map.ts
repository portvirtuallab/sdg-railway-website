import type { SitePage } from '@/types/site';

const SOURCE = 'https://sites.google.com/escolaeuropea.eu/sdgrailway';

/**
 * Page hierarchy of the SDG Railway site.
 *
 * Architecture follows the Development and Training Brief of 19 November 2026 (task-based
 * navigation: Home, How it works, Network and trains, Equipment and cargo, Get a quote, My quotes
 * and bookings, Teaching help), while every page and URL of the original Google Sites website is
 * preserved (docs/audit/page-migration.md). `sourceLabel` keeps the original page name where the
 * label changed. Array order is the navigation order.
 */
export const SITE_PAGES: readonly SitePage[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    sourceUrl: `${SOURCE}/home`,
    parentId: null,
    inNav: true,
    description:
      'Quote a simulated intermodal rail solution with SDG Railway, the rail freight operator of Port Virtual Lab by Escola Europea – Intermodal Transport.',
    reviewState: 'source',
  },
  {
    id: 'how-it-works',
    label: 'How it works',
    path: '/how-it-works/',
    sourceUrl: null,
    parentId: null,
    inNav: true,
    description:
      'Who does what in an intermodal rail shipment: shipper, freight forwarder, SDG Railway, MTO, railway undertaking, road haulage and terminals.',
    reviewState: 'proposed',
  },
  {
    id: 'network-routes',
    label: 'Network and trains',
    sourceLabel: 'Network & Routes',
    path: '/network-routes/',
    sourceUrl: `${SOURCE}/network-routes`,
    parentId: null,
    inNav: true,
    description:
      'Scenario corridors, terminals and the test train table of SDG Railway: frequency, timetable, cut-off, validity and equipment.',
    reviewState: 'source',
  },
  {
    id: 'services',
    label: 'Equipment and cargo',
    sourceLabel: 'Services',
    path: '/services/',
    sourceUrl: `${SOURCE}/services`,
    parentId: null,
    inNav: true,
    description:
      'Loading units accepted by SDG Railway, route compatibility, weight and volume limits, and special cargo.',
    reviewState: 'source',
  },
  {
    id: 'railway-equipment-fleet',
    label: 'Railway Equipment Fleet',
    path: '/services/railway-equipment-fleet/',
    sourceUrl: `${SOURCE}/services/railway-equipment-fleet`,
    parentId: 'services',
    inNav: true,
    description:
      'Intermodal transport units, locomotives and wagons used in SDG Railway exercises.',
    reviewState: 'source',
  },
  {
    id: 'our-locomotive-models',
    label: 'Our Locomotive Models',
    path: '/services/railway-equipment-fleet/our-locomotive-models/',
    sourceUrl: `${SOURCE}/services/railway-equipment-fleet/our-locomotive-models`,
    parentId: 'railway-equipment-fleet',
    inNav: false,
    description: 'The named locomotives of the SDG Railway simulation fleet.',
    reviewState: 'source',
  },
  {
    id: 'container-and-trailer-packing',
    label: 'Container and Trailer Packing',
    path: '/services/container-and-trailer-packing/',
    sourceUrl: `${SOURCE}/services/container-and-trailer-packing`,
    parentId: 'services',
    inNav: true,
    description:
      'Educational guidance on loading, weight distribution and securing of containers, swap bodies and trailers on rail.',
    reviewState: 'source',
  },
  {
    id: 'dangerous-goods',
    label: 'Dangerous Goods',
    path: '/services/dangerous-goods/',
    sourceUrl: `${SOURCE}/services/dangerous-goods`,
    parentId: 'services',
    inNav: true,
    description:
      'Learning resources on the carriage of dangerous goods by rail, with simulated approval steps.',
    reviewState: 'source',
  },
  {
    id: 'request-a-quotation',
    label: 'Get a quote',
    sourceLabel: 'Request a quotation',
    path: '/request-a-quotation/',
    sourceUrl: `${SOURCE}/request-a-quotation`,
    parentId: null,
    inNav: true,
    description:
      'Request a simulated SDG Railway intermodal quotation with prices by leg, scope, validity and an RWQ reference.',
    reviewState: 'source',
  },
  {
    id: 'railway-dashboard',
    label: 'Railway Dashboard',
    path: '/request-a-quotation/railway-dashboard/',
    sourceUrl: `${SOURCE}/request-a-quotation/railway-dashboard`,
    parentId: 'request-a-quotation',
    inNav: false,
    description: 'Former entry point to the SDG Railway quotation simulator.',
    reviewState: 'source',
  },
  {
    id: 'my-quotes',
    label: 'My quotes and bookings',
    path: '/my-quotes/',
    sourceUrl: null,
    parentId: null,
    inNav: true,
    description:
      'Your team’s SDG Railway quotations and bookings: accept a quote, see the assigned train and hand the operation over to Click & Cargo.',
    reviewState: 'proposed',
  },
  {
    id: 'teaching-help',
    label: 'Teaching help',
    path: '/teaching-help/',
    sourceUrl: null,
    parentId: null,
    inNav: true,
    description:
      'Worked example, Click & Cargo handoff and common errors for the SDG Railway quotation exercise, with notes for trainers.',
    reviewState: 'proposed',
  },
  {
    id: 'resources',
    label: 'Glossary and resources',
    sourceLabel: 'Resources',
    path: '/resources/',
    sourceUrl: `${SOURCE}/resources`,
    parentId: 'teaching-help',
    inNav: true,
    description: 'The SDG Railway glossary and learning resources.',
    reviewState: 'source',
  },
  {
    id: 'about-us',
    label: 'About Us',
    path: '/about-us/',
    sourceUrl: `${SOURCE}/about-us`,
    parentId: null,
    inNav: true,
    description:
      'Identity, mission and role of SDG Railway within the Port Virtual Lab learning environment.',
    reviewState: 'source',
  },
  {
    id: 'railway-general-sales-conditions',
    label: 'Railway General Sales Conditions',
    path: '/about-us/railway-general-sales-conditions/',
    sourceUrl: `${SOURCE}/about-us/railway-general-sales-conditions`,
    parentId: 'about-us',
    inNav: true,
    description:
      'Academic general conditions of sale used in SDG Railway simulation exercises. Not a real transport contract.',
    reviewState: 'source',
  },
  {
    id: 'contact',
    label: 'Contact',
    path: '/contact/',
    sourceUrl: `${SOURCE}/contact`,
    parentId: 'about-us',
    inNav: true,
    description:
      'Scenario contact details of SDG Railway and how to reach the Port Virtual Lab team.',
    reviewState: 'source',
  },
];

export const PVL_ONE_URL = 'https://pvl.one/';
export const ESCOLA_URL = 'https://escolaeuropea.eu/';
