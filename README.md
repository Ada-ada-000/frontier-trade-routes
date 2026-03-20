# Frontier Trade Routes

A privacy-aware logistics and intel market for EVE Frontier on Sui.

## Stack

- Next.js 15
- React 19
- `@mysten/dapp-kit` 0.16
- `@mysten/sui` 1.36
- Sui Move 2024 beta

## What is implemented

- Move modules for `profile`, `order`, `intel`, and `insurance`
- fuzzy regional order board with staged reveal constraints
- wallet-connected `accept_order` flow with stake locking
- Recharts-based regional heatmap layer
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

## Verify

```bash
pnpm typecheck
pnpm --filter web build
pnpm move:build
pnpm simulate:trade-routes
```
