# Clawberto BitCraft Logistics

**Live prototype:** https://ael-dev3.github.io/Clawberto-Bitcraft-Logistics/

Clawberto BitCraft Logistics now starts from the player, not a public board: enter an in-game name and the static site loads that character's public Bitjita profile, location, inventory/storage summary, and market-order counts.

The logistics board comes after this. The first useful step is knowing what the player actually has, where it is stored, and where the character currently is.

## Prototype features

- In-game name lookup through Bitjita's public player search API.
- Public player profile snapshot with online status, entity ID, last update, and current public location fields.
- Inventory summarizer that aggregates pockets into top items, total quantity, occupied slots, and storage locations.
- Market order counts for the tracked player.
- BitCraft Map deep links for the tracked location.
- Static GitHub Pages compatible fetch path via a CORS proxy because Bitjita does not send browser CORS headers for Pages.
- Old request/offer matching logic is still tested as a later logistics layer, but it is no longer the first UI.

## Sources and prior work read

- `ael-dev3/Clawberto-Bitcraft` for Region 12 map overlay, Bitjita notes, coordinate/location fields, and region math.
- `ael-dev3/Clawberto-Bitcraft-Library` for Bitjita/BitCraft Map source notes and static GitHub Pages structure.
- Public Bitjita API docs at https://bitjita.com/docs/api.

See [`docs/research-notes.md`](docs/research-notes.md) for the implementation notes.

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

## Deployment

GitHub Pages deploys from `main` through `.github/workflows/pages.yml`.

Target URL:

https://ael-dev3.github.io/Clawberto-Bitcraft-Logistics/

## Next backend steps

This is intentionally a static prototype. A production version should add:

- Verified player ownership through Bitjita chat auth or Discord login.
- Durable saved tracking profiles.
- Item-to-haul-request generation from selected inventory rows.
- Notifications when inventory/location changes.
- Carrier matching after the inventory source of truth is useful.
- A small backend/proxy if the public CORS proxy becomes unreliable.

## Not affiliated

Community-made prototype. Not affiliated with Clockwork Labs, Bitjita, or BitCraft Map.
