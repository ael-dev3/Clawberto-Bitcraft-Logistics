import {
  buildBitcraftMapLink,
  createLogisticsBoard,
  findMatches,
  formatDiscordBrief,
  serviceLabel,
  type ListingSide,
  type LogisticsListing,
  type ServiceKind,
} from '../logistics';

const STORAGE_KEY = 'clawberto-bitcraft-logistics-custom-listings';

const serviceOptions: Array<{ value: ServiceKind; label: string }> = [
  { value: 'cargo-delivery', label: 'Cargo delivery' },
  { value: 'ferry', label: 'Ferry route' },
  { value: 'market-buy', label: 'Buyer request' },
  { value: 'resource-sale', label: 'Seller offer' },
  { value: 'escort', label: 'Escort' },
];

export function renderAppShell(root: HTMLElement): void {
  let listings = [...createLogisticsBoard().listings, ...loadCustomListings()];
  let selectedId = listings.find((listing) => listing.side === 'request')?.id ?? listings[0]?.id ?? '';

  const render = () => {
    const selected = listings.find((listing) => listing.id === selectedId) ?? listings[0];
    root.innerHTML = appMarkup(listings, selected);
    bindEvents();
  };

  const bindEvents = () => {
    root.querySelectorAll<HTMLButtonElement>('[data-listing-id]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedId = button.dataset.listingId ?? selectedId;
        render();
      });
    });

    root.querySelector<HTMLFormElement>('[data-testid="request-form"]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const listing = listingFromForm(new FormData(form));
      listings = [listing, ...listings];
      selectedId = listing.id;
      saveCustomListings(listings.filter((candidate) => candidate.id.startsWith('custom-')));
      render();
    });

    root.querySelector<HTMLButtonElement>('[data-copy-brief]')?.addEventListener('click', async () => {
      const selected = listings.find((listing) => listing.id === selectedId) ?? listings[0];
      if (!selected) return;
      const brief = root.querySelector<HTMLTextAreaElement>('[data-brief-output]')?.value ?? formatDiscordBrief(selected);
      await navigator.clipboard?.writeText(brief).catch(() => undefined);
    });
  };

  render();
}

function appMarkup(listings: LogisticsListing[], selected?: LogisticsListing): string {
  const requests = listings.filter((listing) => listing.side === 'request');
  const offers = listings.filter((listing) => listing.side === 'offer');
  const matches = selected ? findMatches(selected, listings).slice(0, 3) : [];
  const bestMatch = matches[0];
  const activeRoutes = new Set(listings.flatMap((listing) => [listing.origin.regionId, listing.destination?.regionId].filter(Boolean))).size;
  const urgentCount = listings.filter((listing) => listing.priority === 'high').length;

  return `
    <section class="hero">
      <p class="eyebrow">Clawberto prototype · static GitHub Pages · local-first board</p>
      <div class="hero-grid">
        <div>
          <h1 data-testid="hero-title">BitCraft Logistics</h1>
          <p class="lede">Match buyers, sellers, haulers, and ferry operators without turning every delivery into a Discord DM maze.</p>
          <div class="hero-actions">
            <a href="#post" class="button primary">Post a route</a>
            <a href="https://github.com/ael-dev3/Clawberto-Bitcraft-Logistics" class="button ghost">GitHub repo</a>
          </div>
        </div>
        <aside class="signal-card">
          <span class="signal-dot"></span>
          <strong>Prototype goal</strong>
          <p>Show the exact workflow: create a delivery request, match it to a carrier or seller, then copy a Discord-ready handoff brief.</p>
        </aside>
      </div>
    </section>

    <section class="stats" aria-label="Board stats">
      <article><strong>${listings.length}</strong><span>active listings</span></article>
      <article><strong>${matches.length}</strong><span>matches for selected card</span></article>
      <article><strong>${activeRoutes}</strong><span>regions represented</span></article>
      <article><strong>${urgentCount}</strong><span>high-priority jobs</span></article>
    </section>

    <section class="research-note">
      <h2>Built from prior BitCraft work</h2>
      <p>Uses the same 5×5 world/region model from Clawberto-Bitcraft, source notes from Clawberto-Bitcraft-Library, and public BitCraft tool patterns: offline planners, map links, compendiums, and local-first save flows.</p>
    </section>

    <section class="workspace">
      <div class="board-column">
        <div class="column-head"><h2>Requests</h2><span>${requests.length}</span></div>
        ${requests.map((listing) => listingCard(listing, selected?.id)).join('')}
      </div>
      <div class="board-column">
        <div class="column-head"><h2>Offers</h2><span>${offers.length}</span></div>
        ${offers.map((listing) => listingCard(listing, selected?.id)).join('')}
      </div>
      <aside class="match-panel" data-testid="match-panel">
        <h2>Best matches</h2>
        ${selected ? selectedSummary(selected, bestMatch) : '<p>Select a listing to see matches.</p>'}
        <div class="match-list">
          ${matches.length > 0 ? matches.map((match) => matchMarkup(match.listing, match.score, match.reasons)).join('') : '<p class="empty">No compatible opposite-side listings yet.</p>'}
        </div>
        ${selected ? `<textarea data-brief-output readonly>${escapeHtml(formatDiscordBrief(selected, bestMatch))}</textarea><button class="button primary full" data-copy-brief>Copy Discord handoff</button>` : ''}
      </aside>
    </section>

    <section class="post-panel" id="post">
      <div>
        <p class="eyebrow">Try the workflow</p>
        <h2>Post a request or offer</h2>
        <p>Entries are saved only in this browser for now. A real version would add accounts, reputation, notifications, moderation, and durable backend storage.</p>
      </div>
      <form data-testid="request-form" class="listing-form">
        <label>Side<select name="side"><option value="request">Request</option><option value="offer">Offer</option></select></label>
        <label>Service<select name="service">${serviceOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}</select></label>
        <label>Cargo<input name="cargo" value="Iron ore crates" required /></label>
        <label>Quantity<input name="quantity" type="number" min="1" value="1200" required /></label>
        <label>Origin region<input name="originRegion" type="number" min="1" max="25" value="12" required /></label>
        <label>Destination region<input name="destinationRegion" type="number" min="1" max="25" value="13" required /></label>
        <label>Payout<input name="payout" type="number" min="0" value="150" /></label>
        <label>Contact<input name="contact" value="@yourname" required /></label>
        <label class="wide">Notes<input name="notes" value="Flexible handoff window, DM to confirm." /></label>
        <button class="button primary wide" type="submit">Add to local prototype board</button>
      </form>
    </section>
  `;
}

function listingCard(listing: LogisticsListing, selectedId?: string): string {
  const destination = listing.destination ?? listing.origin;
  const isSelected = listing.id === selectedId;
  return `
    <button class="listing-card ${isSelected ? 'selected' : ''}" data-testid="listing-card" data-listing-id="${escapeHtml(listing.id)}">
      <span class="pill ${listing.side}">${listing.side}</span>
      <h3>${escapeHtml(listing.title)}</h3>
      <p>${escapeHtml(listing.cargo)} · ${listing.quantity.toLocaleString()} ${escapeHtml(listing.unit)}</p>
      <dl>
        <div><dt>Route</dt><dd>R${listing.origin.regionId} → R${destination.regionId}</dd></div>
        <div><dt>Service</dt><dd>${serviceLabel(listing.service)}</dd></div>
        <div><dt>Contact</dt><dd>${escapeHtml(listing.contact)}</dd></div>
      </dl>
      <span class="priority ${listing.priority}">${listing.priority}</span>
    </button>
  `;
}

function selectedSummary(selected: LogisticsListing, bestMatch?: { score: number }): string {
  const destination = selected.destination ?? selected.origin;
  return `
    <article class="selected-summary">
      <p class="eyebrow">Selected</p>
      <h3>${escapeHtml(selected.title)}</h3>
      <p>${escapeHtml(selected.notes)}</p>
      <div class="route-links">
        <a href="${buildBitcraftMapLink(selected.origin)}">Origin map</a>
        <a href="${buildBitcraftMapLink(destination)}">Destination map</a>
      </div>
      <strong>${bestMatch ? `${bestMatch.score}/100 best-fit score` : 'No score yet'}</strong>
    </article>
  `;
}

function matchMarkup(listing: LogisticsListing, score: number, reasons: string[]): string {
  return `
    <article class="match-card">
      <div><strong>${escapeHtml(listing.title)}</strong><span>${score}/100</span></div>
      <p>${escapeHtml(reasons.slice(0, 3).join(' · '))}</p>
    </article>
  `;
}

function listingFromForm(form: FormData): LogisticsListing {
  const side = parseEnum(form.get('side'), ['request', 'offer'], 'request') as ListingSide;
  const service = parseEnum(form.get('service'), serviceOptions.map((option) => option.value), 'cargo-delivery') as ServiceKind;
  const cargo = String(form.get('cargo') || 'Untitled cargo').trim();
  const quantity = Math.max(1, Number(form.get('quantity') || 1));
  const originRegion = clampRegion(Number(form.get('originRegion') || 12));
  const destinationRegion = clampRegion(Number(form.get('destinationRegion') || originRegion));
  const payout = Math.max(0, Number(form.get('payout') || 0));
  const contact = String(form.get('contact') || '@unknown').trim();
  const notes = String(form.get('notes') || 'Prototype listing from the local board.').trim();
  const createdAt = new Date().toISOString();

  return {
    id: `custom-${Date.now()}`,
    side,
    title: `${cargo} ${side === 'request' ? 'request' : 'offer'}`,
    owner: contact.replace(/^@/, '') || 'Community',
    contact,
    service,
    cargo,
    tags: cargo.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean),
    quantity,
    unit: side === 'request' ? 'units requested' : 'units capacity',
    capacity: side === 'offer' ? quantity : undefined,
    payout,
    payoutUnit: 'coins',
    priority: payout > 500 ? 'high' : 'normal',
    origin: { label: `Region ${originRegion} hub`, regionId: originRegion },
    destination: { label: `Region ${destinationRegion} handoff`, regionId: destinationRegion },
    routeRegions: buildRouteRegions(originRegion, destinationRegion),
    availableFrom: 'Now',
    expiresInHours: 48,
    notes,
    createdAt,
  };
}

function buildRouteRegions(origin: number, destination: number): number[] {
  if (origin === destination) return [origin];
  const step = origin < destination ? 1 : -1;
  const regions: number[] = [];
  for (let region = origin; step > 0 ? region <= destination : region >= destination; region += step) {
    regions.push(region);
  }
  return regions;
}

function loadCustomListings(): LogisticsListing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomListings(listings: LogisticsListing[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings.slice(0, 25)));
  } catch {
    // Ignore private browsing or unavailable storage.
  }
}

function parseEnum<T extends string>(value: FormDataEntryValue | null, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clampRegion(value: number): number {
  if (!Number.isFinite(value)) return 12;
  return Math.max(1, Math.min(25, Math.round(value)));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character);
}
