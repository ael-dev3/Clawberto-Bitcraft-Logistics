export const MAP_SIZE = 38_400;
export const REGION_GRID = 5;
export const REGION_SIZE = MAP_SIZE / REGION_GRID;
export const BITCRAFT_MAP_URL = 'https://bitcraftmap.com/';

export type ListingSide = 'request' | 'offer';
export type ServiceKind = 'cargo-delivery' | 'ferry' | 'resource-sale' | 'market-buy' | 'escort';
export type Priority = 'low' | 'normal' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RoutePoint {
  label?: string;
  regionId: number;
  x?: number;
  z?: number;
}

export interface LogisticsListing {
  id: string;
  side: ListingSide;
  title: string;
  owner: string;
  contact: string;
  service: ServiceKind;
  cargo: string;
  tags: string[];
  quantity: number;
  unit: string;
  payout: number;
  payoutUnit: string;
  priority: Priority;
  origin: RoutePoint;
  destination?: RoutePoint;
  routeRegions?: number[];
  capacity?: number;
  availableFrom: string;
  expiresInHours: number;
  notes: string;
  createdAt: string;
}

export interface LogisticsBoard {
  name: string;
  generatedAt: string;
  sources: string[];
  listings: LogisticsListing[];
}

export interface RouteEstimate {
  originRegion: number;
  destinationRegion: number;
  regionSpan: number;
  distanceHexes: number;
  riskLevel: RiskLevel;
}

export interface LogisticsMatch {
  listing: LogisticsListing;
  score: number;
  reasons: string[];
  warnings: string[];
  route: RouteEstimate;
}

const STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'bulk',
  'cargo',
  'delivery',
  'deliver',
  'transport',
  'route',
  'service',
  'region',
  'request',
  'offer',
  'needed',
  'available',
]);

const SERVICE_COMPATIBILITY: Record<ServiceKind, ServiceKind[]> = {
  'cargo-delivery': ['cargo-delivery', 'ferry', 'escort'],
  ferry: ['ferry', 'cargo-delivery'],
  'resource-sale': ['market-buy', 'cargo-delivery'],
  'market-buy': ['resource-sale', 'cargo-delivery'],
  escort: ['escort', 'cargo-delivery'],
};

export function createLogisticsBoard(now = new Date('2026-05-19T15:30:00.000Z')): LogisticsBoard {
  return {
    name: 'Clawberto BitCraft Logistics',
    generatedAt: now.toISOString(),
    sources: [
      'Clawberto-Bitcraft map overlay region math',
      'Clawberto-Bitcraft-Library Bitjita and BitCraft Map source notes',
      'Public BitCraft helper patterns: BitPlanner, Brico, BitCraft Map, HexaVia',
    ],
    listings: [
      {
        id: 'req-limestone-build',
        side: 'request',
        title: 'Limestone blocks for city build',
        owner: 'Ael [Wisp]',
        contact: '@Ael',
        service: 'cargo-delivery',
        cargo: 'Limestone blocks',
        tags: ['stone', 'construction', 'bulk', 'limestone'],
        quantity: 30_000,
        unit: 'blocks',
        payout: 950,
        payoutUnit: 'coins',
        priority: 'high',
        origin: { label: 'East Region 12 bank', regionId: 12, x: 9342.399, z: 16389.73 },
        destination: { label: 'Region 14 city yard', regionId: 14, x: 24_960, z: 18_200 },
        availableFrom: 'Tonight',
        expiresInHours: 12,
        notes: 'Needs a hauler or ferry chain that can move heavy construction cargo without making the requester coordinate every leg manually.',
        createdAt: now.toISOString(),
      },
      {
        id: 'req-timber-market',
        side: 'request',
        title: 'Timber buy order to market stall',
        owner: 'Dwaef',
        contact: '@Dwaef',
        service: 'market-buy',
        cargo: 'Treated timber and planks',
        tags: ['wood', 'planks', 'market', 'construction'],
        quantity: 8_000,
        unit: 'units',
        payout: 410,
        payoutUnit: 'coins',
        priority: 'normal',
        origin: { label: 'Any seller hub', regionId: 13, x: 19_840, z: 18_120 },
        destination: { label: 'Region 12 market depot', regionId: 12, x: 11_400, z: 17_900 },
        availableFrom: 'Next 24h',
        expiresInHours: 24,
        notes: 'Buyer wants a posted market-style match instead of chasing sellers in chat.',
        createdAt: now.toISOString(),
      },
      {
        id: 'req-ferry-party',
        side: 'request',
        title: 'Small group ferry to resource route',
        owner: 'Scout party',
        contact: '@ScoutLead',
        service: 'ferry',
        cargo: '4 passengers plus light tools',
        tags: ['passengers', 'ferry', 'tools', 'scout'],
        quantity: 4,
        unit: 'passengers',
        payout: 180,
        payoutUnit: 'coins',
        priority: 'low',
        origin: { label: 'Region 13 riverside', regionId: 13, x: 18_950, z: 19_300 },
        destination: { label: 'Region 12 claim road', regionId: 12, x: 12_050, z: 18_600 },
        availableFrom: 'Weekend',
        expiresInHours: 72,
        notes: 'Prototype passenger/ferry use case, useful for repeat scheduled crossings.',
        createdAt: now.toISOString(),
      },
      {
        id: 'offer-oceancrest-ferry',
        side: 'offer',
        title: 'Oceancrest ferry window',
        owner: 'Skym route desk',
        contact: '@Skym',
        service: 'ferry',
        cargo: 'Bulk cargo, stone, limestone, passengers',
        tags: ['ferry', 'bulk', 'cargo', 'stone', 'limestone', 'passengers'],
        quantity: 50_000,
        unit: 'cargo units',
        capacity: 50_000,
        payout: 0,
        payoutUnit: 'quote',
        priority: 'normal',
        origin: { label: 'Region 12 east dock', regionId: 12, x: 12_000, z: 18_000 },
        destination: { label: 'Region 14 west dock', regionId: 14, x: 24_500, z: 18_100 },
        routeRegions: [12, 13, 14],
        availableFrom: 'Daily 19:00-22:00 UTC',
        expiresInHours: 48,
        notes: 'Oceancrest ferry window can cover Region 12 → 14 hauls with a single dispatch contact instead of one-off DMs.',
        createdAt: now.toISOString(),
      },
      {
        id: 'offer-dwaef-market-stall',
        side: 'offer',
        title: 'Construction supply seller',
        owner: 'Dwaef',
        contact: '@Dwaef',
        service: 'resource-sale',
        cargo: 'Planks, timber, stone, simple tools',
        tags: ['wood', 'planks', 'timber', 'stone', 'market', 'tools'],
        quantity: 12_000,
        unit: 'units',
        capacity: 12_000,
        payout: 0,
        payoutUnit: 'market price',
        priority: 'normal',
        origin: { label: 'Region 13 workshop', regionId: 13, x: 19_700, z: 18_000 },
        destination: { label: 'Pickup or courier handoff', regionId: 13, x: 19_700, z: 18_000 },
        routeRegions: [13, 12],
        availableFrom: 'A few days ago onward',
        expiresInHours: 96,
        notes: 'Marketplace-style supply post. Best paired with a carrier if the buyer is outside Region 13.',
        createdAt: now.toISOString(),
      },
      {
        id: 'offer-r12-river-runner',
        side: 'offer',
        title: 'Region 12 river runner',
        owner: 'Independent hauler',
        contact: '@RiverRunner',
        service: 'cargo-delivery',
        cargo: 'Ore, tools, food crates, light cargo',
        tags: ['ore', 'tools', 'food', 'light cargo', 'delivery'],
        quantity: 6_000,
        unit: 'cargo units',
        capacity: 6_000,
        payout: 120,
        payoutUnit: 'minimum coins',
        priority: 'normal',
        origin: { label: 'Region 12 road net', regionId: 12, x: 10_800, z: 18_500 },
        destination: { label: 'Region 13 border handoff', regionId: 13, x: 16_200, z: 18_600 },
        routeRegions: [12, 13],
        availableFrom: 'On ping',
        expiresInHours: 24,
        notes: 'Good for short jobs and splitting longer routes into legs.',
        createdAt: now.toISOString(),
      },
    ],
  };
}

export function regionIdFromCoord(x: number, z: number): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  if (x < 0 || z < 0 || x >= MAP_SIZE || z >= MAP_SIZE) return null;
  const col = Math.floor(x / REGION_SIZE);
  const row = Math.floor(z / REGION_SIZE);
  return row * REGION_GRID + col + 1;
}

export function buildBitcraftMapLink(point: RoutePoint): string {
  const url = new URL(BITCRAFT_MAP_URL);
  url.searchParams.set('regionId', String(point.regionId));
  if (typeof point.x === 'number' && typeof point.z === 'number') {
    url.searchParams.set('center', `${point.x.toFixed(3)},${point.z.toFixed(3)}`);
    url.searchParams.set('zoom', '1.2');
  }
  return url.toString();
}

export function calculateRoute(listing: Pick<LogisticsListing, 'origin' | 'destination'>): RouteEstimate {
  const origin = withCoordinates(listing.origin);
  const destination = withCoordinates(listing.destination ?? listing.origin);
  const distanceHexes = Math.round(Math.hypot(destination.x - origin.x, destination.z - origin.z));
  const regionSpan = Math.abs(destination.regionId - origin.regionId);
  const riskLevel: RiskLevel = regionSpan === 0 ? 'low' : regionSpan <= 2 ? 'medium' : 'high';

  return {
    originRegion: origin.regionId,
    destinationRegion: destination.regionId,
    regionSpan,
    distanceHexes,
    riskLevel,
  };
}

export function servicesCompatible(requested: ServiceKind, offered: ServiceKind): boolean {
  return SERVICE_COMPATIBILITY[requested].includes(offered);
}

export function findMatches(subject: LogisticsListing, listings: LogisticsListing[]): LogisticsMatch[] {
  return listings
    .flatMap((candidate) => {
      const match = scoreListingPair(subject, candidate);
      return match ? [match] : [];
    })
    .sort((a, b) => b.score - a.score || a.listing.title.localeCompare(b.listing.title));
}

export function scoreListingPair(subject: LogisticsListing, candidate: LogisticsListing): LogisticsMatch | null {
  if (subject.id === candidate.id || subject.side === candidate.side) return null;

  const request = subject.side === 'request' ? subject : candidate;
  const offer = subject.side === 'offer' ? subject : candidate;
  if (!servicesCompatible(request.service, offer.service)) return null;

  const reasons = [`${serviceLabel(offer.service)} can answer ${serviceLabel(request.service)} request`];
  const warnings: string[] = [];
  let score = 20;

  if (routeCovers(offer, request)) {
    score += 30;
    reasons.push('route covers origin and destination regions');
  } else {
    warnings.push('route needs manual relay or an extra leg');
  }

  const overlappingTokens = sharedCargoTokens(request, offer);
  if (overlappingTokens.length > 0) {
    score += Math.min(20, 10 + overlappingTokens.length * 3);
    reasons.push(`cargo overlap: ${overlappingTokens.slice(0, 4).join(', ')}`);
  } else if (offer.service === 'ferry' || offer.service === 'cargo-delivery') {
    score += 8;
    reasons.push('carrier can move generic cargo');
  } else {
    warnings.push('cargo category needs confirmation');
  }

  const capacity = offer.capacity ?? offer.quantity;
  if (capacity >= request.quantity) {
    score += 20;
    reasons.push('capacity covers requested quantity');
  } else if (capacity > 0) {
    const coverage = capacity / request.quantity;
    score += Math.max(4, Math.round(coverage * 14));
    warnings.push(`partial capacity only: ${capacity.toLocaleString()} ${offer.unit}`);
  }

  if (request.priority === 'high') {
    score += 5;
    reasons.push('high-priority request');
  }

  if (request.payout > 0) {
    score += 5;
    reasons.push('payout is posted up front');
  }

  return {
    listing: candidate,
    score: Math.min(100, score),
    reasons,
    warnings,
    route: calculateRoute(request),
  };
}

export function formatDiscordBrief(listing: LogisticsListing, match?: LogisticsMatch): string {
  const destination = listing.destination ?? listing.origin;
  const routeLabel = `Region ${listing.origin.regionId} → Region ${destination.regionId}`;
  const quantity = `${listing.quantity.toLocaleString()} ${listing.unit}`;
  const mapLink = buildBitcraftMapLink(listing.origin);
  const lines = [
    '**BitCraft logistics match**',
    `${listing.title}: ${quantity} ${listing.cargo}`,
    `Route: ${routeLabel}`,
    `Payout: ${listing.payout > 0 ? `${listing.payout.toLocaleString()} ${listing.payoutUnit}` : listing.payoutUnit}`,
    `Contact: ${listing.contact}`,
    `Map: ${mapLink}`,
  ];

  if (match) {
    lines.push(
      `Suggested match: ${match.listing.title} by ${match.listing.owner} (${match.score}/100)`,
      `Why: ${match.reasons.join('; ')}`,
      `Notes: ${match.listing.notes}`,
    );
  } else {
    lines.push('Suggested match: none yet. Post this as a new request.');
  }

  return lines.join('\n');
}

export function serviceLabel(service: ServiceKind): string {
  return {
    'cargo-delivery': 'cargo delivery',
    ferry: 'ferry',
    'resource-sale': 'resource sale',
    'market-buy': 'market buy',
    escort: 'escort',
  }[service];
}

function routeCovers(offer: LogisticsListing, request: LogisticsListing): boolean {
  const offerRegions = new Set(regionsFor(offer));
  return regionsFor(request).every((region) => offerRegions.has(region));
}

function regionsFor(listing: LogisticsListing): number[] {
  if (listing.routeRegions && listing.routeRegions.length > 0) {
    return uniqueNumbers(listing.routeRegions);
  }
  const regions = [listing.origin.regionId];
  if (listing.destination) regions.push(listing.destination.regionId);
  return uniqueNumbers(regions);
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value)))];
}

function withCoordinates(point: RoutePoint): Required<Pick<RoutePoint, 'regionId' | 'x' | 'z'>> {
  if (typeof point.x === 'number' && typeof point.z === 'number') {
    return { regionId: point.regionId, x: point.x, z: point.z };
  }
  const index = Math.max(1, Math.min(REGION_GRID * REGION_GRID, point.regionId)) - 1;
  const col = index % REGION_GRID;
  const row = Math.floor(index / REGION_GRID);
  return {
    regionId: point.regionId,
    x: col * REGION_SIZE + REGION_SIZE / 2,
    z: row * REGION_SIZE + REGION_SIZE / 2,
  };
}

function sharedCargoTokens(request: LogisticsListing, offer: LogisticsListing): string[] {
  const requestTokens = listingTokens(request);
  const offerTokens = listingTokens(offer);
  return [...requestTokens].filter((token) => offerTokens.has(token)).sort();
}

function listingTokens(listing: LogisticsListing): Set<string> {
  return new Set(tokenize([listing.title, listing.cargo, listing.notes, ...listing.tags]));
}

function tokenize(values: string[]): string[] {
  return values
    .flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/g))
    .map((value) => value.trim())
    .filter((value) => value.length > 2 && !STOPWORDS.has(value));
}
