import { describe, expect, it } from 'vitest';

import {
  buildBitcraftMapLink,
  calculateRoute,
  createLogisticsBoard,
  findMatches,
  formatDiscordBrief,
  regionIdFromCoord,
  type LogisticsListing,
} from '../src/logistics';

describe('BitCraft logistics matching', () => {
  it('matches a delivery request with carrier offers by route, cargo, and capacity', () => {
    const board = createLogisticsBoard();
    const request = board.listings.find((listing) => listing.id === 'req-limestone-build') as LogisticsListing;

    const matches = findMatches(request, board.listings);

    expect(matches[0]?.listing.id).toBe('offer-oceancrest-ferry');
    expect(matches[0]?.score).toBeGreaterThanOrEqual(80);
    expect(matches[0]?.reasons).toContain('route covers origin and destination regions');
    expect(matches[0]?.reasons).toContain('capacity covers requested quantity');
  });

  it('does not match listings on the same side of the board', () => {
    const board = createLogisticsBoard();
    const request = board.listings.find((listing) => listing.id === 'req-limestone-build') as LogisticsListing;

    const matches = findMatches(
      request,
      board.listings.filter((listing) => listing.side === 'request'),
    );

    expect(matches).toHaveLength(0);
  });

  it('estimates route distance and risk from BitCraft world coordinates', () => {
    const route = calculateRoute({
      origin: { label: 'East Region 12 bank', regionId: 12, x: 9342.399, z: 16389.73 },
      destination: { label: 'Region 14 city yard', regionId: 14, x: 19840, z: 18120 },
    });

    expect(route.regionSpan).toBe(2);
    expect(route.distanceHexes).toBeGreaterThan(10_000);
    expect(route.riskLevel).toBe('medium');
  });

  it('derives region ids with the same 5x5 world model used in prior Clawberto BitCraft repos', () => {
    expect(regionIdFromCoord(9342.399, 16389.73)).toBe(12);
    expect(regionIdFromCoord(19840, 18120)).toBe(13);
    expect(regionIdFromCoord(-1, 100)).toBeNull();
  });

  it('formats a Discord-ready brief for manual handoff', () => {
    const board = createLogisticsBoard();
    const request = board.listings.find((listing) => listing.id === 'req-limestone-build') as LogisticsListing;
    const match = findMatches(request, board.listings)[0];

    const brief = formatDiscordBrief(request, match);

    expect(brief).toContain('Limestone blocks');
    expect(brief).toContain('Region 12 → Region 14');
    expect(brief).toContain('@Ael');
    expect(brief).toContain('Oceancrest ferry window');
  });

  it('builds BitCraft Map links for route inspection', () => {
    expect(buildBitcraftMapLink({ regionId: 12, x: 9342.399, z: 16389.73 })).toBe(
      'https://bitcraftmap.com/?regionId=12&center=9342.399%2C16389.730&zoom=1.2',
    );
  });
});
