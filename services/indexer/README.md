# Indexer Service

This service is the next backend milestone for Frontier Trade Routes.

## Current state

The live UI already reads from a minimal backend snapshot exposed through:

- `/api/trade-routes/health`
- `/api/trade-routes/snapshot`

That snapshot is currently powered by a mock indexer model inside the web app.

## What the real indexer should do

- watch Sui events from the `trade_routes` package
- normalize onchain order state into queryable records
- store snapshots in Postgres
- compute public-safe heatmap aggregation
- expose delayed and privacy-safe order intelligence to the frontend
- maintain reputation and insurance rollups

## Suggested pipeline

1. Sui event polling or checkpoint ingestion
2. normalization into `orders`, `order_events`, `profiles`, `insurance_snapshots`
3. aggregation into heatmap tiles and public order summaries
4. API delivery to the web app

## EVE Frontier boundary

This service should treat EVE Frontier as an external source of logistics signals, not as a directly controlled execution layer.

Recommended inputs:

- player-submitted intel
- alliance-submitted route pressure reports
- delayed and aggregated regional summaries

Avoid:

- exact public route disclosure
- direct dependence on private APIs
- assumptions of full in-game settlement automation
