import { describe, expect, it } from 'vitest';

import { renderAppShell } from '../src/ui/renderAppShell';

describe('prototype shell', () => {
  it('renders the logistics board landmarks and prototype controls', () => {
    const root = document.createElement('main');

    renderAppShell(root);

    expect(root.querySelector('[data-testid="hero-title"]')?.textContent).toContain('BitCraft Logistics');
    expect(root.querySelector('[data-testid="request-form"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="match-panel"]')?.textContent).toContain('Best matches');
    expect(root.querySelectorAll('[data-testid="listing-card"]')).toHaveLength(6);
  });
});
