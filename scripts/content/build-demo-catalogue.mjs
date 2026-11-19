// Builds the versioned DEMO test catalogue used by the quotation prototype
// (src/data/demo-catalogue.json). Every amount is fictional test data (brief of 19 Nov 2026, §5):
// it must never be used as a commercial tariff. Lanes and timetables come from the scenario
// Departures Board of the source site; the teaching lane reproduces the brief's worked example.
// Usage: node scripts/content/build-demo-catalogue.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const directory = JSON.parse(fs.readFileSync(path.join(root, 'src/data/terminals.json'), 'utf8'));
const round5 = (n) => Math.round(n / 5) * 5;

// Terminals used by the catalogue. dgCapable comes from the current Apps Script simulator data
// (the website directory only marks Portuguese terminals); Poceirão is on the map but not in the
// directory (verification log V-06).
const USED = {
  'es-barcelona': true,
  'es-zaragoza': true,
  'es-madrid': true,
  'fr-perpignan': true,
  'fr-lyon': true,
  'fr-paris': true,
  'it-verona': true,
  'it-civitavecchia': true,
};
const terminals = directory
  .filter((t) => USED[t.id])
  .map((t) => ({
    id: t.id,
    city: t.city,
    country: t.country,
    name: t.name.replace(/\s*\(.*\)\s*$/, ''),
    dgCapable: USED[t.id],
    source: 'terminal directory',
  }));
terminals.push({
  id: 'pt-poceirao',
  city: 'Poceirão (Lisbon area)',
  country: 'PT',
  name: 'Poceirão Intermodal Platform',
  dgCapable: true,
  source: 'network map (not in directory, V-06)',
});

const SERVICES = {
  'STD-RAIL': {
    name: 'Standard Rail',
    train: 'Iberian Freight Express',
    speedKmh: 80,
    perKm: 0.55,
    slots: 30,
    dg: true,
  },
  'EXP-RAIL': {
    name: 'Express Rail',
    train: 'Eurostar Cargo Rapid',
    speedKmh: 100,
    perKm: 0.7,
    slots: 20,
    dg: false,
  },
  'GRN-RAIL': {
    name: 'Green Rail',
    train: 'EcoRail Green Line',
    speedKmh: 70,
    perKm: 0.48,
    slots: 2,
    dg: false,
  },
};

// Price factor per loading unit relative to a 20 ft container (demo values).
const ITU = [
  { code: '20DV', name: '20 ft dry container', teu: 1, factor: 1, maxGrossKg: 30480, volumeM3: 33 },
  {
    code: '40DV',
    name: '40 ft dry container',
    teu: 2,
    factor: 1.55,
    maxGrossKg: 30480,
    volumeM3: 67,
  },
  {
    code: '40HC',
    name: '40 ft high cube container',
    teu: 2,
    factor: 1.6,
    maxGrossKg: 30480,
    volumeM3: 76,
  },
  {
    code: '45HC',
    name: '45 ft high cube container',
    teu: 2.25,
    factor: 1.75,
    maxGrossKg: 30480,
    volumeM3: 86,
  },
  {
    code: '40RF',
    name: '40 ft reefer container',
    teu: 2,
    factor: 2,
    maxGrossKg: 30480,
    volumeM3: 59,
    reefer: true,
  },
  {
    code: 'SWAP',
    name: 'Swap body (class C)',
    teu: 1.5,
    factor: 1.45,
    maxGrossKg: 16000,
    volumeM3: 45,
  },
  {
    code: 'TRLR',
    name: 'P400 semi-trailer',
    teu: 2.5,
    factor: 1.9,
    maxGrossKg: 40000,
    volumeM3: 90,
    p400: true,
  },
  { code: 'TANK', name: 'Tank container', teu: 1, factor: 1.4, maxGrossKg: 36000, volumeM3: 26 },
];

const STD_ITU = ['20DV', '40DV', '40HC', '45HC', 'SWAP', 'TANK'];
const lanes = [
  // From the Departures Board (Standard Rail, Mon–Fri 08:00, dangerous goods accepted)
  {
    id: 'BCN-ZAR',
    from: 'es-barcelona',
    to: 'es-zaragoza',
    service: 'STD-RAIL',
    km: 315,
    days: [1, 2, 3, 4, 5],
    dep: '08:00',
    train: '41201',
    itus: STD_ITU,
  },
  {
    id: 'ZAR-MAD',
    from: 'es-zaragoza',
    to: 'es-madrid',
    service: 'STD-RAIL',
    km: 315,
    days: [1, 2, 3, 4, 5],
    dep: '08:00',
    train: '41203',
    itus: STD_ITU,
  },
  {
    id: 'PRP-LYO',
    from: 'fr-perpignan',
    to: 'fr-lyon',
    service: 'STD-RAIL',
    km: 480,
    days: [1, 2, 3, 4, 5],
    dep: '08:00',
    train: '41301',
    itus: [...STD_ITU, 'TRLR'],
  },
  // Express Rail, Mon/Wed/Fri/Sat 14:00, no dangerous goods, reefers accepted
  {
    id: 'BCN-VER',
    from: 'es-barcelona',
    to: 'it-verona',
    service: 'EXP-RAIL',
    km: 1150,
    days: [1, 3, 5, 6],
    dep: '14:00',
    train: '42101',
    itus: ['20DV', '40DV', '40HC', '45HC', '40RF', 'SWAP'],
  },
  {
    id: 'LYO-PAR',
    from: 'fr-lyon',
    to: 'fr-paris',
    service: 'EXP-RAIL',
    km: 460,
    days: [1, 3, 5, 6],
    dep: '14:00',
    train: '42301',
    itus: ['20DV', '40DV', '40HC', '45HC', '40RF', 'SWAP', 'TRLR'],
  },
  // Green Rail, Mon/Wed 10:00, no dangerous goods, small capacity
  {
    id: 'MAD-POC',
    from: 'es-madrid',
    to: 'pt-poceirao',
    service: 'GRN-RAIL',
    km: 620,
    days: [1, 3],
    dep: '10:00',
    train: '43101',
    itus: ['20DV', '40DV', '40HC', 'SWAP'],
  },
  {
    id: 'BCN-PRP',
    from: 'es-barcelona',
    to: 'fr-perpignan',
    service: 'GRN-RAIL',
    km: 200,
    days: [1, 3],
    dep: '10:00',
    train: '43103',
    itus: ['20DV', '40DV', '40HC', '45HC', 'SWAP', 'TRLR'],
  },
  // Teaching lane for the brief's case (Toledo → Barcelona Morrot → Civitavecchia → Atessa).
  {
    id: 'BCN-CIV',
    from: 'es-barcelona',
    to: 'it-civitavecchia',
    service: 'STD-RAIL',
    km: 1450,
    days: [2, 5],
    dep: '20:00',
    train: '41501',
    itus: ['20DV', '40DV', '40HC', '45HC', '40RF', 'SWAP'],
    teaching: true,
    railRate45HC: 420,
    slots: 12,
  },
];

const BLOCKED = {
  'STD-RAIL': ['2026-07-14', '2026-07-15', '2026-08-03', '2026-08-04', '2026-08-05'],
  'EXP-RAIL': ['2026-06-29', '2026-06-30', '2026-11-02', '2026-11-03'],
  'GRN-RAIL': ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10'],
};

const catalogue = {
  version: 'DEMO-2026.1',
  status: 'demo',
  notice: 'Fictional test data for teaching. Not a commercial tariff, timetable or capacity.',
  validFrom: '2026-11-01',
  validTo: '2027-03-31',
  currency: 'EUR',
  quoteValidityDays: 14,
  cutOffHoursBeforeDeparture: 12,
  terminals,
  services: Object.entries(SERVICES).map(([id, s]) => ({
    id,
    name: s.name,
    trainName: s.train,
    speedKmh: s.speedKmh,
    dangerousGoods: s.dg,
    blockedDates: BLOCKED[id],
  })),
  globalBlockedDates: ['2026-12-08', '2026-12-25', '2026-12-26', '2027-01-01', '2027-01-06'],
  itus: ITU,
  lanes: lanes.map((l) => {
    const s = SERVICES[l.service];
    const transitHours = Math.round(l.km / s.speedKmh) + 2;
    const rates = {};
    for (const code of l.itus) {
      const u = ITU.find((x) => x.code === code);
      rates[code] = l.railRate45HC
        ? round5((l.railRate45HC / ITU.find((x) => x.code === '45HC').factor) * u.factor)
        : round5(l.km * s.perKm * u.factor);
    }
    return {
      id: l.id,
      from: l.from,
      to: l.to,
      serviceId: l.service,
      distanceKm: l.km,
      transitHours,
      train: {
        id: `SDG ${l.train}`,
        days: l.days,
        departure: l.dep,
        slotsPerDeparture: l.slots ?? s.slots,
      },
      dangerousGoods: s.dg,
      acceptedItus: l.itus,
      railRates: rates,
      note: l.teaching
        ? 'Teaching lane for the Toledo – Atessa case. Confirm that this corridor and train exist in the active catalogue before use (brief §5, P0).'
        : 'Lane and timetable from the scenario Departures Board.',
      teaching: !!l.teaching,
    };
  }),
  // Play Haulier first and last road legs (door ↔ terminal), price per ITU, both directions.
  doors: [
    { id: 'door-toledo', city: 'Toledo', country: 'ES', label: 'Toledo – manufacturer’s plant' },
    {
      id: 'door-martorell',
      city: 'Martorell',
      country: 'ES',
      label: 'Martorell – industrial area',
    },
    { id: 'door-corbas', city: 'Corbas', country: 'FR', label: 'Corbas – logistics park (Lyon)' },
    { id: 'door-setubal', city: 'Setúbal', country: 'PT', label: 'Setúbal – industrial area' },
    {
      id: 'door-atessa',
      city: 'Atessa',
      country: 'IT',
      label: 'Atessa – automotive plant (Val di Sangro)',
    },
  ],
  roadLegs: [
    { door: 'door-toledo', terminal: 'es-barcelona', amount: 180, hours: 24 },
    { door: 'door-toledo', terminal: 'es-madrid', amount: 95, hours: 6 },
    { door: 'door-martorell', terminal: 'es-barcelona', amount: 75, hours: 4 },
    { door: 'door-corbas', terminal: 'fr-lyon', amount: 70, hours: 4 },
    { door: 'door-setubal', terminal: 'pt-poceirao', amount: 85, hours: 4 },
    { door: 'door-atessa', terminal: 'it-civitavecchia', amount: 160, hours: 24 },
  ],
  haulier: 'Play Haulier',
  // Terminal handling has exactly one source per terminal: terminal > country > default.
  charges: {
    terminalHandling: { default: 45, byCountry: { PT: 50 }, byTerminal: {} },
    managementFee: 40,
    dangerousGoodsPerItu: 75,
    reeferPowerPerItu: 90,
    insuranceRate: 0.005,
    insuranceMinValue: 100,
  },
  teams: [
    { pin: '4821', team: 'Futura Cargo – Group B', role: 'student' },
    { pin: '1357', team: 'PlayForwarding – Group A', role: 'student' },
    { pin: '2468', team: 'Futura Cargo – Group C', role: 'student' },
    { pin: '9000', team: 'Trainer', role: 'trainer' },
  ],
};

fs.writeFileSync(
  path.join(root, 'src/data/demo-catalogue.json'),
  `${JSON.stringify(catalogue, null, 2)}\n`,
);
const civ = catalogue.lanes.find((l) => l.id === 'BCN-CIV');
console.log(
  `${catalogue.version}: ${catalogue.lanes.length} lanes, ${catalogue.terminals.length} terminals; BCN-CIV 45HC rail = €${civ.railRates['45HC']}`,
);
for (const l of catalogue.lanes) console.log(l.id, l.train.id, JSON.stringify(l.railRates));
