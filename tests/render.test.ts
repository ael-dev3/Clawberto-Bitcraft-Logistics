import { describe, expect, it } from 'vitest';

import { renderAppShell } from '../src/ui/renderAppShell';

describe('player tracking shell', () => {
  it('starts with player-name tracking instead of a fluffy logistics board', () => {
    const root = document.createElement('main');

    renderAppShell(root);

    expect(root.querySelector('[data-testid="hero-title"]')?.textContent).toContain('Track a BitCraft player');
    expect(root.querySelector('[data-testid="player-tracker-form"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="player-name-input"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="listing-card"]')).toBeNull();
  });

  it('renders tracked player dashboard when initial data is provided', () => {
    const root = document.createElement('main');

    renderAppShell(root, {
      initialSnapshot: {
        player: {
          entityId: '648518346354069088',
          username: 'Ael',
          signedIn: false,
          updatedAt: '2026-05-19 01:44:51+00',
          teleportLocationX: 11403,
          teleportLocationZ: 16110,
        },
        statsRegionId: 12,
        inventorySummary: {
          inventoryCount: 2,
          occupiedSlots: 3,
          totalQuantity: 115,
          topItems: [{ key: 'item:101', label: 'Limestone', quantity: 100, slotCount: 2 }],
          storageLocations: [{ key: 'Freeport · R12', label: 'Freeport · R12', inventoryCount: 2, occupiedSlots: 3 }],
        },
        marketSummary: { sellOrders: 2, buyOrders: 1 },
        loadedAt: '2026-05-19T15:30:00.000Z',
      },
    });

    expect(root.querySelector('[data-testid="player-dashboard"]')?.textContent).toContain('Ael');
    expect(root.querySelector('[data-testid="inventory-summary"]')?.textContent).toContain('115');
    expect(root.querySelector('[data-testid="location-card"]')?.textContent).toContain('Region 12');
  });
});
