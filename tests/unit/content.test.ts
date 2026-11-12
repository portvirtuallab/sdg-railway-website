import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_ALT } from '@/content/image-alt';
import corridors from '@/data/corridors.json';
import { buildDepartures, RAIL_SERVICES } from '@/data/departures';
import glossary from '@/data/glossary.json';
import manifest from '@/data/image-manifest.json';
import itus from '@/data/itus.json';
import locomotives from '@/data/locomotives.json';
import conditions from '@/data/sales-conditions.json';
import terminals from '@/data/terminals.json';

const publicImage = (id: string) =>
  path.resolve(__dirname, `../../public/images/source/${id}.webp`);

describe('migrated content', () => {
  it('keeps all 31 source terminals with unique ids, a photo and alt text', () => {
    expect(terminals).toHaveLength(31);
    expect(new Set(terminals.map((t) => t.id)).size).toBe(31);
    for (const t of terminals) {
      expect(t.image, t.id).toBeTruthy();
      expect(existsSync(publicImage(t.image!)), t.image!).toBe(true);
      expect(IMAGE_ALT[t.image!], t.image!).toBeTruthy();
    }
  });

  it('corrects the Toulouse typo from the source (V-07)', () => {
    expect(terminals.map((t) => t.city)).toContain('Toulouse');
    expect(terminals.map((t) => t.city)).not.toContain('Tolouse');
  });

  it('keeps the 13 corridors with at least two stops each', () => {
    expect(corridors).toHaveLength(13);
    for (const c of corridors) expect(c.stops.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the glossary, locomotives, loading units and sales conditions', () => {
    expect(glossary).toHaveLength(24);
    expect(locomotives).toHaveLength(12);
    expect(itus).toHaveLength(9);
    expect(conditions.sections).toHaveLength(20);
  });

  it('fixes the "Greek earring" mistranslation (V-02)', () => {
    expect(JSON.stringify(locomotives)).not.toMatch(/earring/i);
  });

  it('only keeps simple formatting in migrated HTML', () => {
    for (const s of conditions.sections) {
      expect(s.html).not.toMatch(/<(script|style|iframe|img|a)\b|\son\w+=|style=/i);
    }
  });

  it('has a published file and dimensions for every image with alt text', () => {
    for (const id of Object.keys(IMAGE_ALT)) {
      expect(existsSync(publicImage(id)), id).toBe(true);
      expect((manifest as Record<string, unknown>)[id], id).toBeTruthy();
    }
  });
});

describe('departures board (scenario timetable)', () => {
  it('follows operating days and cancels blocked dates', () => {
    // Monday 2 November 2026: Express Rail is blocked that day in the source data.
    const rows = buildDepartures(new Date('2026-11-02T12:00:00'), 1);
    expect(rows.map((r) => r.service.id).sort()).toEqual(['EXP-RAIL', 'GRN-RAIL', 'STD-RAIL']);
    expect(rows.find((r) => r.service.id === 'EXP-RAIL')?.cancelled).toBe(true);
    expect(rows.find((r) => r.service.id === 'STD-RAIL')?.cancelled).toBe(false);
  });

  it('computes the ETA from distance and speed', () => {
    const rows = buildDepartures(new Date('2026-11-10T12:00:00'), 1); // Tuesday: Standard only
    expect(rows).toHaveLength(1);
    const r = rows[0]!;
    expect(r.etaHours).toBe(Math.round((r.route.km / r.service.speedKmh) * 10) / 10);
  });

  it('defines the three source services', () => {
    expect(RAIL_SERVICES.map((s) => s.id)).toEqual(['STD-RAIL', 'EXP-RAIL', 'GRN-RAIL']);
  });
});
