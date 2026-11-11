import type { SitePage } from '@/types/site';

const SOURCE = 'https://sites.google.com/escolaeuropea.eu/sdgrailway';

/**
 * Page hierarchy preserved from the source site (audit of 2026-11-11, docs/audit/page-migration.md).
 * Order matches the original navigation. Hidden pages (inNav: false) exist in the source but are
 * only reachable from in-content links; their navigation placement awaits owner decision (V-21).
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
      'SDG Railway is the simulated rail freight operator of Port Virtual Lab, developed by Escola Europea – Intermodal Transport for education and professional training.',
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
    id: 'services',
    label: 'Services',
    path: '/services/',
    sourceUrl: `${SOURCE}/services`,
    parentId: null,
    inNav: true,
    description:
      'Gate In and Gate Out procedures and the directory of scenario intermodal terminals.',
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
    id: 'network-routes',
    label: 'Network & Routes',
    path: '/network-routes/',
    sourceUrl: `${SOURCE}/network-routes`,
    parentId: null,
    inNav: true,
    description:
      'Scenario rail corridors and terminals of SDG Railway, with an accessible list of all map information.',
    reviewState: 'source',
  },
  {
    id: 'request-a-quotation',
    label: 'Request a quotation',
    path: '/request-a-quotation/',
    sourceUrl: `${SOURCE}/request-a-quotation`,
    parentId: null,
    inNav: true,
    description: 'Start a simulated rail freight quotation exercise in Port Virtual Lab.',
    reviewState: 'source',
  },
  {
    id: 'railway-dashboard',
    label: 'Railway Dashboard',
    path: '/request-a-quotation/railway-dashboard/',
    sourceUrl: `${SOURCE}/request-a-quotation/railway-dashboard`,
    parentId: 'request-a-quotation',
    inNav: false,
    description: 'Entry point to the SDG Railway quotation simulator.',
    reviewState: 'source',
  },
  {
    id: 'contact',
    label: 'Contact',
    path: '/contact/',
    sourceUrl: `${SOURCE}/contact`,
    parentId: null,
    inNav: true,
    description:
      'Scenario contact details of SDG Railway and how to reach the Port Virtual Lab team.',
    reviewState: 'source',
  },
  {
    id: 'resources',
    label: 'Resources',
    path: '/resources/',
    sourceUrl: `${SOURCE}/resources`,
    parentId: null,
    inNav: true,
    description: 'The SDG Railway glossary and learning resources.',
    reviewState: 'source',
  },
];

export const PVL_ONE_URL = 'https://pvl.one/';
export const ESCOLA_URL = 'https://escolaeuropea.eu/';
