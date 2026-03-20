# Frontier Trade Routes Overview

Frontier Trade Routes is an external dApp for EVE Frontier players.
It surfaces route opportunities, lets players post simple trade contracts, and tracks lifecycle state on Sui when deployed.
It is not a replacement for the official market.

## MVP Scope

- mock-first opportunity feed with a live adapter boundary
- wallet connection for Sui-compatible wallets
- contract create / accept / complete / cancel flow
- contract list and detail pages
- Sui Move state machine for verifiable status transitions

## Data Boundary

- opportunities: mock adapter by default, live adapter placeholder
- contracts: local persistence by default, optional Sui write path when a package id is configured
