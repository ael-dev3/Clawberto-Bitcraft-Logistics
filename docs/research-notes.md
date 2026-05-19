# BitCraft player tracking research notes

## Prompt context

Ael said the site had too much board/fluff and should start like Bitjita: the player enters their in-game name, then the site begins tracking that player's inventory and location.

## Bitjita behavior checked

Public Bitjita API docs expose the player-first data this prototype now uses:

- `GET /api/players?q={name}` to search player names.
- `GET /api/players/{id}` for profile, signed-in status, `locationX`, `locationZ`, `regionId`, teleport/home location, claims, skills, and related public data.
- `GET /api/players/{id}/inventories` for public storage/inventory pockets.
- `GET /api/players/{id}/market` for active sell and buy orders.
- `GET /api/players/{id}/stats` for character stats and region fallback.

Direct browser fetches from GitHub Pages are blocked by missing CORS headers on `bitjita.com`, so the static prototype routes reads through `https://corsproxy.io/?url=`. That is fine for a prototype but should become a tiny owned proxy if usage matters.

## Prior Clawberto repos reviewed

### Clawberto-Bitcraft

Relevant patterns:

- Vite + TypeScript + GitHub Pages is already working for BitCraft tooling.
- Region model: total map size `38400`, 5×5 grid, `region_size = 7680`.
- Region formula: `floor(z / 7680) * 5 + floor(x / 7680) + 1`.
- BitCraft Map deep links support `regionId`, `center`, and `zoom` query params.

### Clawberto-Bitcraft-Library

Relevant patterns:

- Static Vite site with committed source/data notes is the lowest-friction first release.
- Bitjita and BitCraft Map data should be treated as source-aware context, not copied wiki pages.
- GitHub Pages workflow and README live URL pattern can be reused.

## Prototype shape chosen

The UI now starts with a single player-name form:

1. Normalize the in-game name.
2. Search Bitjita players and prefer exact case-insensitive matches.
3. Load profile, inventories, stats, and market orders for the selected entity ID.
4. Summarize inventory pockets into total quantity, occupied slots, top items, and storage locations.
5. Show current public `locationX`/`locationZ`/`regionId` first, falling back to teleport/home coordinates if needed.
6. Link the location to BitCraft Map.

The old request/offer matcher remains tested as a later logistics layer, but it is no longer the first UI. The board should come back only after inventory/location tracking is useful enough to generate real hauling requests from tracked items.

## Next implementation steps

- Add an owned API proxy instead of a public CORS proxy.
- Add optional player verification through Bitjita chat auth or Discord login.
- Let the user click an inventory row to create a hauling request.
- Add saved tracked players and manual refresh/polling controls.
- Add notifications only after the tracked data has proved useful.
