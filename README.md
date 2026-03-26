# Frontier Trade Routes

A privacy-aware logistics and intel market for EVE Frontier on Sui.

## Stack

- Next.js 15
- React 19
- `@mysten/dapp-kit` 0.16
- `@mysten/sui` 1.36
- Sui Move 2024 beta

## Runtime model

Frontier Trade Routes currently runs as an external companion dApp:

- Next.js frontend for the tactical dashboard and order flow
- Sui Move contracts for stake-backed order acceptance
- a minimal API layer at `/api/trade-routes/*`
- a mock indexer snapshot that feeds public-safe order, heatmap, reputation, and insurance data

This means the project is already runnable end-to-end without private game APIs:

- public discovery is fuzzy and region-level
- stake locking and order acceptance are Sui-ready
- reputation and insurance views are served through the same snapshot model

## Current backend boundary

Implemented now:

- `/api/trade-routes/health`
- `/api/trade-routes/snapshot`
- shared snapshot format for:
  - orders
  - heatmap tiles
  - reputation profiles
  - insurance pool

Planned next:

- Postgres-backed storage
- a real Sui event indexer
- scheduled aggregation jobs
- player- or alliance-submitted intel reports
- moderation and confidence scoring for external intel

## What is implemented

- Move modules for `profile`, `order`, `intel`, and `insurance`
- fuzzy regional order board with staged reveal constraints
- wallet-connected `accept_order` flow with stake locking
- Recharts-based regional heatmap layer
- API-backed mock snapshot for dashboard, reputation, and insurance views
- mock simulation script for publish -> accept -> pickup -> reveal -> complete

## Local run

```bash
pnpm install
pnpm dev
```

Optional `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUI_PACKAGE_ID=0xYOUR_PACKAGE
NEXT_PUBLIC_ORDER_BOOK_ID=0xYOUR_SHARED_ORDER_BOOK
NEXT_PUBLIC_PROFILE_REGISTRY_ID=0xYOUR_SHARED_PROFILE_REGISTRY
NEXT_PUBLIC_INSURANCE_POOL_ID=0xYOUR_SHARED_INSURANCE_POOL
```

The frontend dev server runs on:

```bash
http://localhost:3010
```

Key routes:

- `/`
- `/app`
- `/app/reputation`
- `/app/insurance`
- `/api/trade-routes/health`
- `/api/trade-routes/snapshot`

## Verify

```bash
pnpm --filter web lint
pnpm typecheck
pnpm --filter web build
pnpm move:build
pnpm simulate:trade-routes
```

## Demo flow

1. Open `/app`
2. Show the fuzzy heatmap and explain that public discovery stays region-level
3. Review the seller-visible order queue and call out reward, stake, reputation gate, stage, and insurance
4. Open `Lock Stake` and explain staged reveal plus stake-backed commitment
5. Open `/app/reputation` and `/app/insurance` to show support systems
6. Call out `/api/trade-routes/snapshot` as the current backend boundary feeding the UI

## EVE Frontier integration boundary

The current version is intentionally an external dApp:

- it does not depend on private APIs
- it does not require exact official coordinates
- it does not replace the official market

Near-term integration path:

- player or alliance submitted intel
- delayed, aggregated, privacy-safe route pressure
- Sui-backed stake, reputation, and insurance tracking

Longer-term game-native integration would require a separate Frontier-native smart object path.
