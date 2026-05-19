import {
  buildBitcraftMapLinkForLocation,
  fallbackLocationFromSnapshot,
  loadTrackingSnapshot,
  normalizeInGameName,
  type TrackingSnapshot,
} from '../tracker';

export interface RenderAppOptions {
  initialSnapshot?: TrackingSnapshot;
  tracker?: (playerName: string) => Promise<TrackingSnapshot>;
}

type AppState =
  | { status: 'idle'; playerName: string }
  | { status: 'loading'; playerName: string }
  | { status: 'ready'; playerName: string; snapshot: TrackingSnapshot }
  | { status: 'error'; playerName: string; error: string; snapshot?: TrackingSnapshot };

export function renderAppShell(root: HTMLElement, options: RenderAppOptions = {}): void {
  const tracker = options.tracker ?? loadTrackingSnapshot;
  let state: AppState = options.initialSnapshot
    ? { status: 'ready', playerName: options.initialSnapshot.player.username, snapshot: options.initialSnapshot }
    : { status: 'idle', playerName: defaultPlayerName() };
  const render = () => {
    root.innerHTML = appMarkup(state);
    bindEvents();
  };

  const bindEvents = () => {
    root.querySelector<HTMLFormElement>('[data-testid="player-tracker-form"]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const playerName = normalizeInGameName(String(new FormData(form).get('playerName') ?? ''));
      void startTracking(playerName);
    });

    root.querySelector<HTMLButtonElement>('[data-refresh-tracker]')?.addEventListener('click', () => {
      void startTracking(state.playerName || defaultPlayerName());
    });
  };

  const startTracking = async (playerName: string) => {
    if (!playerName) {
      state = { status: 'error', playerName: '', error: 'Enter an in-game name first.' };
      render();
      return;
    }

    state = { status: 'loading', playerName };
    render();

    try {
      const snapshot = await tracker(playerName);
      state = { status: 'ready', playerName: snapshot.player.username, snapshot };
    } catch (error) {
      state = { status: 'error', playerName, error: error instanceof Error ? error.message : String(error) };
    }
    render();
  };

  render();

  const queryPlayer = new URLSearchParams(globalThis.location?.search ?? '').get('player');
  if (!options.initialSnapshot && queryPlayer) {
    void startTracking(queryPlayer);
  }
}

function appMarkup(state: AppState): string {
  const playerName = state.playerName || 'Ael';
  const snapshot = state.status === 'ready' ? state.snapshot : state.status === 'error' ? state.snapshot : undefined;
  return `
    <section class="tracker-hero">
      <div>
        <p class="eyebrow">Clawberto BitCraft logistics</p>
        <h1 data-testid="hero-title">Track a BitCraft player</h1>
        <p class="lede">Enter an in-game name. Pull their public Bitjita profile, current public location, inventory, storage, and market orders.</p>
      </div>
      <form class="tracker-form" data-testid="player-tracker-form">
        <label for="playerName">In-game name</label>
        <div class="input-row">
          <input id="playerName" data-testid="player-name-input" name="playerName" value="${escapeHtml(playerName)}" autocomplete="off" placeholder="Ael" />
          <button class="button primary" type="submit">Start tracking</button>
        </div>
        <span class="form-note">Read-only Bitjita public API data. Use refresh to pull the latest snapshot.</span>
      </form>
    </section>

    ${state.status === 'loading' ? loadingMarkup(state.playerName) : ''}
    ${state.status === 'error' ? errorMarkup(state.error) : ''}
    ${snapshot ? dashboardMarkup(snapshot) : emptyStateMarkup()}
  `;
}

function loadingMarkup(playerName: string): string {
  return `<section class="status-line"><span class="pulse"></span> Looking up ${escapeHtml(playerName)} on Bitjita…</section>`;
}

function errorMarkup(error: string): string {
  return `<section class="status-line error"><span>⚠</span> ${escapeHtml(error)}</section>`;
}

function emptyStateMarkup(): string {
  return `
    <section class="empty-panel">
      <h2>No player loaded</h2>
      <p>Start with a character name. The logistics board comes after this: inventory + location first, then matching delivery needs.</p>
    </section>
  `;
}

function dashboardMarkup(snapshot: TrackingSnapshot): string {
  const location = snapshot.liveLocation ?? fallbackLocationFromSnapshot(snapshot);
  const signedIn = snapshot.player.signedIn ? 'online' : 'offline';

  return `
    <section class="dashboard" data-testid="player-dashboard">
      <article class="player-card">
        <span class="status-pill ${signedIn}">${signedIn}</span>
        <h2>${escapeHtml(snapshot.player.username)}</h2>
        <p class="muted">Entity ${escapeHtml(snapshot.player.entityId)}</p>
        <dl>
          <div><dt>Profile updated</dt><dd>${escapeHtml(formatDate(snapshot.player.updatedAt ?? snapshot.loadedAt))}</dd></div>
          <div><dt>Last refresh</dt><dd>${escapeHtml(formatDate(snapshot.loadedAt))}</dd></div>
          <div><dt>Location source</dt><dd>${snapshot.liveLocation ? 'live payload' : 'Bitjita profile'}</dd></div>
        </dl>
        <button class="button ghost" data-refresh-tracker>Refresh Bitjita snapshot</button>
      </article>

      <article class="metric-card" data-testid="location-card">
        <p class="eyebrow">Location</p>
        ${location ? locationMarkup(location) : '<h2>Unknown</h2><p class="muted">No public location payload yet.</p>'}
      </article>

      <article class="metric-card" data-testid="inventory-summary">
        <p class="eyebrow">Inventory</p>
        <h2>${snapshot.inventorySummary.totalQuantity.toLocaleString()}</h2>
        <p class="muted">items across ${snapshot.inventorySummary.inventoryCount} inventories, ${snapshot.inventorySummary.occupiedSlots} occupied slots</p>
      </article>

      <article class="metric-card">
        <p class="eyebrow">Market</p>
        <h2>${snapshot.marketSummary.sellOrders + snapshot.marketSummary.buyOrders}</h2>
        <p class="muted">${snapshot.marketSummary.sellOrders} sell orders · ${snapshot.marketSummary.buyOrders} buy orders</p>
      </article>
    </section>

    <section class="data-grid">
      <article class="table-card">
        <h2>Top carried/stored items</h2>
        ${itemsTable(snapshot.inventorySummary.topItems)}
      </article>
      <article class="table-card">
        <h2>Storage locations</h2>
        ${locationsTable(snapshot.inventorySummary.storageLocations)}
      </article>
      <article class="table-card next-step">
        <h2>Next logistics step</h2>
        <p>Use this tracked inventory as the source of truth, then generate hauling requests from specific items and storage locations.</p>
        <ul>
          <li>Pick item + quantity</li>
          <li>Choose destination claim/market</li>
          <li>Create carrier request automatically</li>
        </ul>
      </article>
    </section>
  `;
}

function locationMarkup(location: NonNullable<ReturnType<typeof fallbackLocationFromSnapshot>>): string {
  const mapLink = buildBitcraftMapLinkForLocation(location);
  return `
    <h2>Region ${location.regionId ?? 'unknown'}</h2>
    <p class="coords">X ${location.x.toFixed(3)} · Z ${location.z.toFixed(3)}</p>
    <p class="muted">${escapeHtml(location.status)} · ${escapeHtml(formatDate(location.updatedAt))}</p>
    <a class="inline-link" href="${mapLink}" target="_blank" rel="noreferrer">Open on BitCraft Map</a>
  `;
}

function itemsTable(items: TrackingSnapshot['inventorySummary']['topItems']): string {
  if (items.length === 0) return '<p class="muted">No public inventory contents returned yet.</p>';
  return `
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Slots</th></tr></thead>
      <tbody>${items
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.label)}</td><td>${item.quantity.toLocaleString()}</td><td>${item.slotCount.toLocaleString()}</td></tr>`,
        )
        .join('')}</tbody>
    </table>
  `;
}

function locationsTable(locations: TrackingSnapshot['inventorySummary']['storageLocations']): string {
  if (locations.length === 0) return '<p class="muted">No storage locations returned yet.</p>';
  return `
    <table>
      <thead><tr><th>Location</th><th>Inventories</th><th>Slots</th></tr></thead>
      <tbody>${locations
        .map(
          (location) =>
            `<tr><td>${escapeHtml(location.label)}</td><td>${location.inventoryCount}</td><td>${location.occupiedSlots}</td></tr>`,
        )
        .join('')}</tbody>
    </table>
  `;
}

function defaultPlayerName(): string {
  return new URLSearchParams(globalThis.location?.search ?? '').get('player') ?? 'Ael';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character);
}
