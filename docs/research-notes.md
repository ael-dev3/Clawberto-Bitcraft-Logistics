# BitCraft logistics prototype research notes

## Prompt context

Ael wanted a BitCraft external app system for transportation, ferries across regions, resource deliveries, and buyer/seller matching. The conversation specifically called out that Skym/Oceancrest-style logistics existed, but was mostly one operator channeling requests toward himself. This prototype tests a more general matching board.

## Prior Clawberto repos reviewed

### Clawberto-Bitcraft

Relevant patterns:

- Vite + TypeScript + GitHub Pages is already working for BitCraft tooling.
- Region model: total map size `38400`, 5×5 grid, `region_size = 7680`.
- Region formula: `floor(z / 7680) * 5 + floor(x / 7680) + 1`.
- Confirmed BitCraft Map and Bitjita endpoints:
  - `https://bitcraftmap.com/api/players?q=...`
  - `https://bitcraftmap.com/api/players/:entityId`
  - `https://bcmap-api.bitjita.com/region{regionId}/resource/{resourceId}`
  - `wss://live.bitjita.com`
- Static hosted apps should avoid relying on arbitrary `bcmap-api.bitjita.com` resource fetches from GitHub Pages because CORS is pinned to BitCraft Map.

### Clawberto-Bitcraft-Library

Relevant patterns:

- Static Vite site with committed source/data notes is the lowest-friction first release.
- Bitjita and BitCraft Map data should be treated as source-aware context, not copied wiki pages.
- GitHub Pages workflow and README live URL pattern can be reused.

## Public BitCraft tools reviewed

- `fsobolev/BitPlanner`: offline helper, crafting calculator, copyable lists for spreadsheets. Useful pattern: local-first utility with exportable text.
- `BitCraftToolBox/brico`: client-side companion site using game data and compendium-style browsing. Useful pattern: static SPA first, backend later.
- `bitcraftmap/bitcraftmap`: Leaflet map, shareable waypoints, GeoJSON import/export. Useful pattern: links and shareable route/coordinate context.
- `OneNoBeing/HexaVia`: browser-based local planning. Useful pattern: save/load locally and keep the first version practical.
- `clockworklabs/BitCraftPublic`: official open-source server code exists, but this prototype does not depend on private/complex server integration.

## Prototype shape chosen

A static logistics board is the quickest way to validate usefulness:

1. A player posts a request: cargo, quantity, route, payout, contact.
2. A seller/carrier/ferry operator posts an offer: service type, capacity, route regions, contact.
3. The app scores compatible opposite-side listings.
4. The app generates a Discord-ready handoff brief.
5. Real coordination still happens manually until the community proves the workflow is valuable.

## Matching score fields

- Service compatibility: cargo delivery, ferry, market buy/sell, escort.
- Route coverage: carrier route regions cover origin and destination.
- Cargo overlap: tags and text overlap between request and offer.
- Capacity: offer capacity covers requested quantity.
- Priority and payout: urgent or paid jobs surface higher.

## Production backend candidates

Keep static until people actually use it. If it gets traction:

- SpaceTimeDB for realtime listings and match notifications.
- Discord auth or Discord bot posting for identity and status updates.
- Reputation and completion history.
- Moderation queue and spam controls.
- Optional collateral/escrow fields if trust becomes the blocker.
