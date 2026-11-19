import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_ALT } from '@/content/image-alt';
import { departuresBetween } from '@/engine';
import { SNAPSHOT_CATALOGUE as cat } from '@/features/quote/snapshot';
import glossary from '@/data/glossary.json';
import manifest from '@/data/image-manifest.json';
import itus from '@/data/itus.json';
import locomotives from '@/data/locomotives.json';
import conditions from '@/data/sales-conditions.json';
import photos from '@/data/terminal-photos.json';
import { terminalImage } from '@/content/terminal-images';

const publicImage = (id: string) =>
  path.resolve(__dirname, `../../public/images/source/${id}.webp`);

describe('migrated content', () => {
  it('keeps the 31 source terminal photos, each with a file and alt text', () => {
    const ids = Object.values(photos);
    expect(ids).toHaveLength(31);
    for (const id of ids) {
      expect(existsSync(publicImage(id)), id).toBe(true);
      expect(IMAGE_ALT[id], id).toBeTruthy();
    }
  });

  it('matches every photo to a terminal city of the Sheet, Toulouse spelled right (V-07)', () => {
    const cities = new Set(cat.terminals.map((t) => t.city));
    for (const city of Object.keys(photos)) expect(cities.has(city), city).toBe(true);
    expect(terminalImage('Toulouse')).toBeTruthy();
    expect(terminalImage('Liège')).toBe(terminalImage('Liege'));
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

describe('departures board (SCHEDULES tab)', () => {
  it('follows operating days and marks blocked dates as no service', () => {
    // Monday 2 November 2026: Express Rail is blocked that day in the Sheet.
    const rows = departuresBetween(cat, '2026-11-02', 1);
    expect(new Set(rows.map((r) => r.serviceId))).toEqual(
      new Set(['EXP-RAIL', 'GRN-RAIL', 'STD-RAIL']),
    );
    expect(rows.filter((r) => r.serviceId === 'EXP-RAIL').every((r) => r.blocked)).toBe(true);
    expect(rows.filter((r) => r.serviceId === 'STD-RAIL').every((r) => !r.blocked)).toBe(true);
  });

  it('only lists the services that run that weekday', () => {
    const rows = departuresBetween(cat, '2026-11-10', 1); // Tuesday
    expect(rows.map((r) => r.serviceId)).toEqual(['STD-RAIL']);
    expect(rows[0]).toMatchObject({ departureTime: '08:00', blocked: false });
  });

  it('marks public holidays from the GLOBAL row', () => {
    expect(departuresBetween(cat, '2026-12-08', 1).every((r) => r.blocked)).toBe(true);
  });
});
