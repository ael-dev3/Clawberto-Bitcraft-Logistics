# Clawberto BitCraft Logistics

**Live prototype:** https://ael-dev3.github.io/Clawberto-Bitcraft-Logistics/

Clawberto BitCraft Logistics is a static prototype for a player-to-player logistics board: resource delivery requests, ferry routes, carrier offers, and seller/buyer matching for BitCraft Online.

The point is to test the workflow Ael described in Discord: instead of one person manually channeling every request, the board matches a buyer or requester with sellers, haulers, ferry operators, or route legs.

## Prototype features

- Request and offer board for cargo deliveries, ferry routes, market buys, resource sales, and escorts.
- Matching engine that scores listings by service compatibility, route coverage, cargo overlap, capacity, urgency, and posted payout.
- BitCraft region math using the same 5×5 world model from the prior Clawberto BitCraft map repo.
- BitCraft Map deep links for origin and destination inspection.
- Discord-ready handoff brief generator for manual coordination.
- Local-first form entries saved in the browser with no backend required.

## Sources and prior work read

- `ael-dev3/Clawberto-Bitcraft` for Region 12 map overlay, live Bitjita notes, coordinate scaling, and region math.
- `ael-dev3/Clawberto-Bitcraft-Library` for Bitjita/BitCraft Map source notes and static GitHub Pages structure.
- Public BitCraft tools: BitPlanner, Brico, BitCraft Map, HexaVia, and Clockwork Labs' public BitCraft server repo.

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

- Accounts or verified Discord login.
- Durable listing storage.
- Reputation, completion status, and moderation.
- Notifications for matched routes.
- Optional escrow/collateral fields if the community needs trust guarantees.
- SpaceTimeDB or another realtime backend only after the static workflow proves useful.

## Not affiliated

Community-made prototype. Not affiliated with Clockwork Labs, Bitjita, or BitCraft Map.
