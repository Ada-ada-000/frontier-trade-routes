# Frontier Trade Routes PPT Deck

## Slide 1 - Cover

Title:
Frontier Trade Routes

Subtitle:
Privacy-Aware Logistics and Intel Market for EVE Frontier on Sui

One-line pitch:
Fuzzy discovery, stake-gated execution, staged route reveal, and onchain reputation for trusted frontier logistics.

Speaker note:
We are building a third-party logistics and intelligence coordination terminal for EVE Frontier. It is not a replacement for the official market. It is a trust and execution layer for route-sensitive player coordination.

---

## Slide 2 - Problem

Title:
Why Frontier Logistics Breaks Today

Points:
- Players need trusted logistics coordination, but current channels are fragmented
- Publicly revealing exact routes creates ambush, leakage, and privacy risk
- Informal order matching has weak commitment and poor dispute handling
- High-value runs need stake, reputation, and insurance, not just chat-based trust

Speaker note:
The market gap is not generic trading. The gap is secure coordination for sensitive logistics routes.

---

## Slide 3 - Our Product

Title:
What Frontier Trade Routes Is

Points:
- External dApp for EVE Frontier x Sui
- Privacy-aware logistics and intel market
- Public discovery stays fuzzy
- Commitment is enforced by stake and onchain state
- Visibility expands in stages as the route progresses

Core loop:
intel -> fuzzy order -> accept with stake -> staged reveal -> fulfill -> reputation / insurance outcome

Speaker note:
The product is designed around one idea: commitment before clarity.

---

## Slide 4 - Product Surface

Title:
What the User Sees

Modules:
- Fuzzy Heatmap
- Weighted Bidding Pool
- Stake Lock Command Modal
- Staged Reveal Flow
- Reputation / Insurance Signals

Speaker note:
The UI is a tactical logistics terminal, not a generic Web3 dashboard. It looks and behaves like a hardened command console.

---

## Slide 5 - Privacy Model

Title:
How We Protect Route Privacy

Rules:
- Public board shows fuzzy origin and destination only
- No exact pickup or delivery coordinates in open listings
- Route details are revealed in stages
- Sensitive details stay off-chain until relevant milestone
- Public market stays useful without becoming a targeting tool

Speaker note:
This is the key differentiator. We do not need official exact coordinates to build the economic loop.

---

## Slide 6 - Core Mechanism 1

Title:
Fuzzy Heatmap

What it does:
- Aggregates visible route pressure by region
- Highlights urgent logistics zones
- Shows insured and high-demand areas
- Helps sellers choose where to deploy capacity

Why it matters:
- Players discover demand without exposing exact route intelligence

Speaker note:
The heatmap gives enough information to act, but not enough to exploit.

---

## Slide 7 - Core Mechanism 2

Title:
Weighted Bidding Pool

How it works:
- Orders include cargo, fuzzy route, reward, stake, rep gate, insurance, and stage
- Sellers only participate if they meet the commitment threshold
- Urgent orders can be handled immediately
- Competitive orders can use quoted price selection

Speaker note:
This is not an open exchange. It is a filtered task market with embedded risk controls.

---

## Slide 8 - Core Mechanism 3

Title:
Stake + Staged Reveal

Execution flow:
1. Seller sees only fuzzy route bands
2. Seller locks stake with `accept_order`
3. Pickup details unlock first
4. Destination details unlock later
5. Final fulfillment updates reputation and insurance state

Speaker note:
We make route knowledge progressive, not instant. That reduces leakage and makes commitment meaningful.

---

## Slide 9 - Core Mechanism 4

Title:
Reputation and Insurance

Reputation:
- minimum reputation gate for order eligibility
- successful runs improve access
- failure or bad behavior lowers future access

Insurance:
- insured orders contribute to a mutual recovery model
- failure can trigger compensation logic
- high-value transport becomes more viable

Speaker note:
These two systems turn logistics from informal trust into structured market behavior.

---

## Slide 10 - Tech Architecture

Title:
Full-Stack Architecture

Frontend:
- Next.js 15
- React 19
- TypeScript
- Recharts
- `@mysten/dapp-kit`
- `@mysten/sui`

Onchain:
- Sui Move modules for:
  - profile
  - order
  - intel
  - insurance

State and simulation:
- wallet-connected order acceptance
- mock data for rapid demo
- full simulation path for the trade route lifecycle

Speaker note:
This is not just a concept. The frontend, Move modules, and simulation flow are all implemented.

---

## Slide 11 - What Is Already Implemented

Title:
Current Build Status

Completed:
- tactical homepage and dashboard UI
- fuzzy heatmap layer
- seller-visible order cards
- stake command modal
- wallet-connected `accept_order` flow
- typed trade routes state model
- Move contract package
- local build and simulation flow

Verification:
- `pnpm --filter web lint`
- `pnpm typecheck`
- `pnpm --filter web build`
- `pnpm move:build`

Speaker note:
We already have a runnable MVP, not just slides.

---

## Slide 12 - Why This Matters

Title:
Strategic Value

Why it fits EVE Frontier:
- route privacy matters
- logistics trust matters
- commitment must be verifiable
- high-value delivery needs risk controls

Why it fits Sui:
- object-based state works well for orders, stake, profiles, and insurance
- wallet-native interaction fits player commitment
- staged visibility and state transitions are easy to model

Speaker note:
The fit is strong because the problem is not abstract finance. It is operational coordination under uncertainty.

---

## Slide 13 - Demo Flow

Title:
Live Demo Sequence

Steps:
1. Open the tactical dashboard
2. Show fuzzy heatmap and regional pressure
3. Open seller-visible order market
4. Inspect one order card
5. Trigger `Lock Stake`
6. Show the stake modal
7. Explain staged reveal, reputation, and insurance

Speaker note:
If the package is configured, the wallet interaction can go through the live Sui path. Otherwise the mock path still shows the full product logic.

---

## Slide 14 - Closing

Title:
Frontier Trade Routes

Closing line:
We turn frontier logistics from an informal trust problem into a privacy-aware, stake-backed, onchain coordination market.

Final takeaway:
- useful before exact coordinates
- safer than public route disclosure
- stronger than chat-based coordination
- native fit for EVE Frontier x Sui

Speaker note:
This is a third-party logistics terminal built for the realities of frontier trade: uncertainty, trust, risk, and strategic route privacy.
