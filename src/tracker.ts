export const BITJITA_ORIGIN = 'https://bitjita.com';
export const BITCRAFT_MAP_URL = 'https://bitcraftmap.com/';
export const DEFAULT_API_PROXY = 'https://corsproxy.io/?url=';

export interface PlayerSearchResult {
  entityId: string;
  username: string;
  signedIn?: boolean;
  updatedAt?: string;
  lastLoginTimestamp?: string | null;
  [key: string]: unknown;
}

export interface PlayerProfile extends PlayerSearchResult {
  locationX?: number;
  locationZ?: number;
  regionId?: number | string;
  teleportLocationX?: number;
  teleportLocationZ?: number;
  teleportLocationDimension?: number;
  teleportLocationType?: string;
}

export interface InventoryPocketContents {
  itemId?: number | string;
  item_id?: number | string;
  cargoId?: number | string;
  cargo_id?: number | string;
  itemType?: number | string;
  item_type?: number | string;
  itemName?: string;
  name?: string;
  quantity?: number | string;
}

export interface InventoryPocket {
  locked?: boolean;
  volume?: number;
  contents?: InventoryPocketContents | null;
}

export interface PlayerInventory {
  inventoryName?: string;
  buildingName?: string;
  claimName?: string;
  regionId?: number | string;
  pockets?: InventoryPocket[];
}

export interface InventoriesResponse {
  inventories?: PlayerInventory[];
  items?: Record<string, InventoryCatalogEntry> | InventoryCatalogEntry[];
  cargos?: Record<string, InventoryCatalogEntry> | InventoryCatalogEntry[];
}

export interface InventoryCatalogEntry {
  id?: number | string;
  name?: string;
}

export interface AggregatedInventoryItem {
  key: string;
  label: string;
  quantity: number;
  slotCount: number;
}

export interface StorageLocationSummary {
  key: string;
  label: string;
  inventoryCount: number;
  occupiedSlots: number;
}

export interface InventorySummary {
  inventoryCount: number;
  occupiedSlots: number;
  totalQuantity: number;
  topItems: AggregatedInventoryItem[];
  storageLocations: StorageLocationSummary[];
}

export interface MarketSummary {
  sellOrders: number;
  buyOrders: number;
}

export interface PlayerStatsResponse {
  stats?: {
    regionId?: number | string;
    updatedAt?: string;
  };
}

export interface PlayerMarketResponse {
  sellOrders?: unknown[];
  buyOrders?: unknown[];
}

export interface LiveLocation {
  x: number;
  z: number;
  regionId: number | null;
  status: string;
  updatedAt: string;
}

export interface TrackingSnapshot {
  player: PlayerProfile;
  statsRegionId: number | null;
  inventorySummary: InventorySummary;
  marketSummary: MarketSummary;
  liveLocation?: LiveLocation;
  loadedAt: string;
}

export interface TrackerFetchOptions {
  fetcher?: typeof fetch;
  apiProxy?: string;
  now?: () => Date;
}

export function normalizeInGameName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function buildBitjitaApiUrl(path: string, params: Record<string, string | number | boolean> = {}): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalizedPath, BITJITA_ORIGIN);
  Object.entries(params).forEach(([key, value]) => {
    const stringValue = String(value).trim();
    if (stringValue.length > 0) url.searchParams.set(key, stringValue);
  });
  return url.toString();
}

export function buildBitjitaFetchUrl(
  path: string,
  params: Record<string, string | number | boolean> = {},
  proxy = DEFAULT_API_PROXY,
): string {
  const apiUrl = buildBitjitaApiUrl(path, params);
  return proxy ? `${proxy}${encodeURIComponent(apiUrl)}` : apiUrl;
}

export function selectBestPlayerMatch(name: string, players: PlayerSearchResult[]): PlayerSearchResult | null {
  const wanted = normalizeInGameName(name).toLowerCase();
  if (!wanted) return null;
  return (
    players.find((player) => player.username.toLowerCase() === wanted) ??
    players.find((player) => player.username.toLowerCase().startsWith(wanted)) ??
    players[0] ??
    null
  );
}

export async function loadTrackingSnapshot(playerName: string, options: TrackerFetchOptions = {}): Promise<TrackingSnapshot> {
  const normalizedName = normalizeInGameName(playerName);
  if (!normalizedName) throw new Error('Enter an in-game name first.');

  const fetcher = options.fetcher ?? fetch;
  const apiProxy = options.apiProxy ?? DEFAULT_API_PROXY;
  const now = options.now ?? (() => new Date());

  const search = await fetchJson<{ players?: PlayerSearchResult[] }>(
    buildBitjitaFetchUrl('/api/players', { q: normalizedName }, apiProxy),
    fetcher,
  );
  const player = selectBestPlayerMatch(normalizedName, search.players ?? []);
  if (!player) throw new Error(`No BitCraft player found for "${normalizedName}".`);

  const entityId = encodeURIComponent(player.entityId);
  const [profile, inventories, stats, market] = await Promise.all([
    fetchJson<{ player?: PlayerProfile }>(buildBitjitaFetchUrl(`/api/players/${entityId}`, {}, apiProxy), fetcher).catch(() => null),
    fetchJson<InventoriesResponse>(buildBitjitaFetchUrl(`/api/players/${entityId}/inventories`, {}, apiProxy), fetcher).catch(() => ({ inventories: [] })),
    fetchJson<PlayerStatsResponse>(buildBitjitaFetchUrl(`/api/players/${entityId}/stats`, {}, apiProxy), fetcher).catch(() => null),
    fetchJson<PlayerMarketResponse>(buildBitjitaFetchUrl(`/api/players/${entityId}/market`, {}, apiProxy), fetcher).catch(() => null),
  ]);

  return {
    player: { ...player, ...(profile?.player ?? {}) },
    statsRegionId: coerceNumber(stats?.stats?.regionId),
    inventorySummary: summarizeInventories(inventories),
    marketSummary: summarizeMarket(market),
    loadedAt: now().toISOString(),
  };
}

export function summarizeInventories(response: InventoriesResponse): InventorySummary {
  const inventories = Array.isArray(response.inventories) ? response.inventories : [];
  const catalog = buildInventoryCatalog(response);
  const itemMap = new Map<string, AggregatedInventoryItem>();
  const locationMap = new Map<string, StorageLocationSummary>();
  let occupiedSlots = 0;
  let totalQuantity = 0;

  inventories.forEach((inventory) => {
    const locationKey = formatStorageLocation(inventory);
    const location = locationMap.get(locationKey) ?? {
      key: locationKey,
      label: locationKey,
      inventoryCount: 0,
      occupiedSlots: 0,
    };
    location.inventoryCount += 1;

    const pockets = Array.isArray(inventory.pockets) ? inventory.pockets : [];
    pockets.forEach((pocket) => {
      const contents = pocket.contents;
      if (!contents) return;
      const quantity = coerceNumber(contents.quantity) ?? 0;
      if (quantity <= 0) return;

      occupiedSlots += 1;
      totalQuantity += quantity;
      location.occupiedSlots += 1;

      const itemKey = inventoryItemKey(contents);
      const item = itemMap.get(itemKey) ?? {
        key: itemKey,
        label: inventoryItemLabel(contents, catalog),
        quantity: 0,
        slotCount: 0,
      };
      item.quantity += quantity;
      item.slotCount += 1;
      itemMap.set(itemKey, item);
    });

    locationMap.set(locationKey, location);
  });

  return {
    inventoryCount: inventories.length,
    occupiedSlots,
    totalQuantity,
    topItems: [...itemMap.values()].sort((a, b) => b.quantity - a.quantity || a.label.localeCompare(b.label)).slice(0, 8),
    storageLocations: [...locationMap.values()].sort(
      (a, b) => b.occupiedSlots - a.occupiedSlots || b.inventoryCount - a.inventoryCount || a.label.localeCompare(b.label),
    ),
  };
}

export function summarizeMarket(response: PlayerMarketResponse | null): MarketSummary {
  return {
    sellOrders: Array.isArray(response?.sellOrders) ? response.sellOrders.length : 0,
    buyOrders: Array.isArray(response?.buyOrders) ? response.buyOrders.length : 0,
  };
}

export function buildBitcraftMapLinkForLocation(location: { x: number; z: number; regionId?: number | null }): string {
  const url = new URL(BITCRAFT_MAP_URL);
  if (location.regionId) url.searchParams.set('regionId', String(location.regionId));
  url.searchParams.set('center', `${location.x.toFixed(3)},${location.z.toFixed(3)}`);
  url.searchParams.set('zoom', '1.4');
  return url.toString();
}

export function fallbackLocationFromSnapshot(snapshot: TrackingSnapshot): LiveLocation | null {
  const x = coerceNumber(snapshot.player.locationX) ?? coerceNumber(snapshot.player.teleportLocationX);
  const z = coerceNumber(snapshot.player.locationZ) ?? coerceNumber(snapshot.player.teleportLocationZ);
  if (x === null || z === null) return null;
  const hasCurrentLocation = coerceNumber(snapshot.player.locationX) !== null && coerceNumber(snapshot.player.locationZ) !== null;
  return {
    x,
    z,
    regionId: coerceNumber(snapshot.player.regionId) ?? snapshot.statsRegionId,
    status: hasCurrentLocation ? 'public player location' : (snapshot.player.teleportLocationType ?? 'last known'),
    updatedAt: snapshot.player.updatedAt ?? snapshot.loadedAt,
  };
}

async function fetchJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetcher(url, { headers: { accept: 'application/json,text/plain,*/*' } });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
  return (await response.json()) as T;
}

function formatStorageLocation(inventory: PlayerInventory): string {
  const claim = cleanLabel(inventory.claimName) || cleanLabel(inventory.buildingName) || cleanLabel(inventory.inventoryName) || 'Unknown storage';
  const region = coerceNumber(inventory.regionId);
  return region ? `${claim} · R${region}` : claim;
}

function cleanLabel(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildInventoryCatalog(response: InventoriesResponse): Map<string, string> {
  const catalog = new Map<string, string>();
  addCatalogEntries(catalog, response.items, '0');
  addCatalogEntries(catalog, response.cargos, '1');
  return catalog;
}

function addCatalogEntries(
  catalog: Map<string, string>,
  entries: Record<string, InventoryCatalogEntry> | InventoryCatalogEntry[] | undefined,
  itemType: string,
): void {
  if (!entries) return;
  if (Array.isArray(entries)) {
    entries.forEach((entry) => addCatalogEntry(catalog, entry.id, entry.name, itemType));
    return;
  }
  Object.entries(entries).forEach(([id, entry]) => addCatalogEntry(catalog, id, entry.name, itemType));
}

function addCatalogEntry(catalog: Map<string, string>, id: unknown, rawName: unknown, itemType: string): void {
  const name = cleanLabel(rawName);
  if (!name) return;
  const normalizedId = String(id);
  catalog.set(normalizedId, name);
  catalog.set(`${itemType}:${normalizedId}`, name);
}

function inventoryItemKey(contents: InventoryPocketContents): string {
  const itemType = contents.itemType ?? contents.item_type ?? 'item';
  const itemId = contents.itemId ?? contents.item_id ?? contents.cargoId ?? contents.cargo_id ?? 'unknown';
  return `${itemType}:${itemId}`;
}

function inventoryItemLabel(contents: InventoryPocketContents, catalog: Map<string, string>): string {
  const name = cleanLabel(contents.itemName) || cleanLabel(contents.name);
  if (name) return name;
  const itemType = contents.itemType ?? contents.item_type ?? 0;
  const itemId = contents.itemId ?? contents.item_id ?? contents.cargoId ?? contents.cargo_id;
  const catalogName = catalog.get(`${itemType}:${itemId}`) ?? catalog.get(String(itemId));
  if (catalogName) return catalogName;
  return itemId ? `Item #${itemId}` : 'Unknown item';
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
