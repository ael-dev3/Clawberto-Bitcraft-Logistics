import { describe, expect, it } from 'vitest';

import {
  buildBitcraftMapLinkForLocation,
  buildBitjitaFetchUrl,
  fallbackLocationFromSnapshot,
  normalizeInGameName,
  selectBestPlayerMatch,
  summarizeInventories,
} from '../src/tracker';

describe('BitCraft player tracker', () => {
  it('normalizes player input before starting tracking', () => {
    expect(normalizeInGameName('  Ael  ')).toBe('Ael');
    expect(normalizeInGameName('')).toBe('');
  });

  it('builds a proxied Bitjita API URL for static GitHub Pages', () => {
    expect(buildBitjitaFetchUrl('/api/players', { q: 'Ael' })).toBe(
      'https://corsproxy.io/?url=https%3A%2F%2Fbitjita.com%2Fapi%2Fplayers%3Fq%3DAel',
    );
  });

  it('selects exact case-insensitive player matches before prefix matches', () => {
    const players = [
      { entityId: '1', username: 'Aela' },
      { entityId: '2', username: 'Ael' },
    ];

    expect(selectBestPlayerMatch('ael', players)?.entityId).toBe('2');
  });

  it('summarizes inventory pockets into top items and storage locations', () => {
    const summary = summarizeInventories({
      inventories: [
        {
          inventoryName: 'Town Bank',
          claimName: 'Freeport',
          regionId: 12,
          pockets: [
            { locked: false, contents: { itemId: 101, itemName: 'Limestone', quantity: 30 } },
            { locked: false, contents: { itemId: 101, itemName: 'Limestone', quantity: 70 } },
          ],
        },
        {
          inventoryName: 'Vault',
          claimName: 'Freeport',
          regionId: 12,
          pockets: [{ locked: false, contents: { itemId: 202, itemType: 0, quantity: 15 } }],
        },
      ],
      items: { 202: { name: 'Oak Planks' } },
    });

    expect(summary.inventoryCount).toBe(2);
    expect(summary.occupiedSlots).toBe(3);
    expect(summary.totalQuantity).toBe(115);
    expect(summary.topItems[0]).toMatchObject({ label: 'Limestone', quantity: 100 });
    expect(summary.topItems[1]).toMatchObject({ label: 'Oak Planks', quantity: 15 });
    expect(summary.storageLocations[0]).toMatchObject({ label: 'Freeport · R12', inventoryCount: 2 });
  });

  it('uses current public player coordinates before teleport/home coordinates', () => {
    expect(
      fallbackLocationFromSnapshot({
        player: {
          entityId: '648518346354069088',
          username: 'Ael',
          locationX: 11390,
          locationZ: 16079,
          regionId: 12,
          teleportLocationX: 11403,
          teleportLocationZ: 16110,
          teleportLocationType: 'home_location',
          updatedAt: '2026-05-19 01:44:51+00',
        },
        statsRegionId: 8,
        inventorySummary: { inventoryCount: 0, occupiedSlots: 0, totalQuantity: 0, topItems: [], storageLocations: [] },
        marketSummary: { sellOrders: 0, buyOrders: 0 },
        loadedAt: '2026-05-19T15:30:00.000Z',
      }),
    ).toMatchObject({ x: 11390, z: 16079, regionId: 12, status: 'public player location' });
  });

  it('builds map links for tracked player locations', () => {
    expect(buildBitcraftMapLinkForLocation({ x: 9342.399, z: 16389.73, regionId: 12 })).toBe(
      'https://bitcraftmap.com/?regionId=12&center=9342.399%2C16389.730&zoom=1.4',
    );
  });
});
