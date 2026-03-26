# Frontier Trade Routes - DeepSurge Submission Pack

## Project Name

Frontier Trade Routes

## One-Line Tagline

Privacy-aware logistics and intelligence coordination for EVE Frontier, secured by Sui.

## Short Pitch

Frontier Trade Routes is an external companion dApp for EVE Frontier that turns fuzzy, region-level route discovery into stake-backed, reputation-aware trade coordination on Sui.

## Short Description

Frontier Trade Routes helps players discover logistics demand without exposing exact routes. It combines a fuzzy heatmap, stake-backed order acceptance, staged route reveal, reputation, and mutual coverage into one coordination layer for EVE Frontier.

## Full Description

Frontier Trade Routes is a privacy-aware logistics and intel market built for EVE Frontier on Sui.

Instead of exposing exact pickup and delivery coordinates in public, the product uses fuzzy, region-level discovery so players can understand where logistics demand exists without leaking sensitive route data. Once a carrier decides to take an order, they lock stake, gain staged visibility into the route, and complete fulfillment through a structured workflow backed by reputation and coverage.

The current MVP includes:

- an interactive overview map for route pressure discovery
- a route order board with stake-aware acceptance flow
- Sui Move contract modules for profile, order, intel, and insurance logic
- reputation and coverage views for carrier trust and recovery handling
- a privacy-first model where exact locations stay gated while public signals remain useful

This is not a replacement for the official market. It is an external trust and coordination layer designed for route-sensitive trade, hauling, and recovery workflows in EVE Frontier.

## Problem

Players in EVE Frontier can coordinate trade and logistics, but the current process is fragile:

- route details are too sensitive to expose publicly
- trust between buyers and carriers is informal
- high-value runs need commitment and recovery mechanisms
- public discovery should stay useful without turning into a targeting surface

## Solution

Frontier Trade Routes solves this by combining:

- fuzzy route discovery
- stake-backed order acceptance
- staged route reveal
- carrier reputation
- mutual coverage / recovery support

The result is a logistics coordination market where players can discover demand, commit to execution, and manage risk without exposing exact operational routes upfront.

## Key Features

### 1. Fuzzy Heatmap

Players see region-level logistics pressure rather than exact coordinates. This preserves discovery value while protecting sensitive route information.

### 2. Stake-Backed Order Acceptance

Carriers accept orders with locked stake, creating credible commitment before deeper route visibility is revealed.

### 3. Staged Reveal

Route details are revealed progressively instead of all at once, reducing information leakage and ambush risk.

### 4. Reputation

Carrier performance feeds into a reputation layer that affects access and fee quality.

### 5. Coverage

Players can evaluate protected vs unprotected routes and use coverage to reduce downside on higher-value runs.

## Why It Fits EVE Frontier

This project is a strong fit because it focuses on real frontier problems:

- trade and hauling under uncertainty
- privacy-sensitive route planning
- carrier trust and fulfillment risk
- player-driven coordination in a live universe

It works as an external dApp, which aligns with the hackathon’s allowance for tools and systems that extend the EVE Frontier experience without requiring private APIs.

## Why It Fits Sui

Sui is used for the coordination layer:

- stake-backed actions
- object-oriented order state
- profile and reputation tracking
- coverage and recovery logic

This lets the system use onchain commitment and state transitions where they matter most, while keeping privacy-sensitive route details gated from public exposure.

## Current Status

Current MVP status:

- working Next.js frontend
- interactive overview map
- route order board
- stake acceptance flow
- reputation page
- coverage page
- Sui Move modules for core logic
- API-backed snapshot model for demo data

## Demo Flow

1. Open the overview map and inspect route pressure.
2. Click a region to inspect available route tasks.
3. Open the order board and review active orders.
4. Accept an order through the stake-backed flow.
5. Show how reputation and coverage support higher-trust coordination.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Sui Move
- `@mysten/dapp-kit`
- `@mysten/sui`

## Submission Category / Positioning

Recommended positioning for submission:

- External Companion dApp
- Tooling / Coordination Layer
- Game Operations / Logistics
- Privacy-Aware Market Infrastructure

## Links

### Project URL

If a public demo URL is required, add the deployed URL here.

### GitHub

https://github.com/Ada-ada-000/frontier-trade-routes

Note: the repository is currently private.

### Demo Video

If DeepSurge requires a demo video, add a Loom or uploaded video URL here.

## Suggested Form Answers

### What makes this project unique?

Frontier Trade Routes does not treat logistics as a simple listing board. Its core innovation is privacy-aware coordination: public discovery stays fuzzy, commitment is stake-backed, route visibility is staged, and carrier trust is reinforced through reputation and coverage.

### What is already working today?

The interactive frontend, route board, reputation, coverage panels, and Sui-ready contract structure are already implemented. The product can be demoed end-to-end as an external companion dApp for EVE Frontier.

### What is the long-term vision?

To become a trusted logistics coordination layer for frontier trade, where route-sensitive discovery, carrier trust, and recovery handling can operate in a structured and player-usable way.

## Missing Before Submission

These may still need to be filled manually depending on the DeepSurge form:

- team name
- team members
- public demo URL
- demo video URL
- cover image / screenshots
