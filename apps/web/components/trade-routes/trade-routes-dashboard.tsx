"use client";

import { startTransition, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { HeatmapLayer } from "./heatmap-layer";
import Link from "next/link";
import { OrderCard } from "./order-card";
import { StakeModal } from "./stake-modal";
import { useTradeRoutes } from "../../lib/trade-routes/use-trade-routes";
import type { OrderPublicView } from "../../lib/trade-routes/types";

function sumStake(orders: OrderPublicView[]) {
  return orders.reduce((total, order) => total + Number(order.requiredStakeMist), 0);
}

export function TradeRoutesDashboard() {
  const account = useCurrentAccount();
  const tradeRoutes = useTradeRoutes();
  const [selectedOrder, setSelectedOrder] = useState<OrderPublicView | undefined>();

  const metrics = useMemo(() => {
    const openOrders = tradeRoutes.orders.filter((order) => order.status === "open").length;
    const insured = tradeRoutes.orders.filter((order) => order.insured).length;
    const totalStake = sumStake(tradeRoutes.orders) / 1_000_000_000;

    return { openOrders, insured, totalStake };
  }, [tradeRoutes.orders]);

  return (
    <>
      <section className="dashboard-hero panel stack" id="overview">
        <div className="section-head">
          <div>
            <p className="eyebrow">Tactical Logistics Grid</p>
            <h1>Fuzzy intel, weighted bidding, staged route reveal.</h1>
          </div>
          <div className="hero-badge">App / Control Surface</div>
        </div>
        <p className="hero-lede">
          Frontier Trade Routes is a hardened logistics and intel terminal. Public discovery stays
          blurred, stake commitment unlocks staged visibility, and reputation plus insurance reduce
          bad delivery flow.
        </p>
        <div className="metric-grid">
          <article className="metric-card">
            <p className="eyebrow">Execution</p>
            <strong>{tradeRoutes.mode.toUpperCase()}</strong>
            <span>{tradeRoutes.mode === "sui" ? "Live order rail" : "Mock relay active"}</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Open queue</p>
            <strong>{metrics.openOrders}</strong>
            <span>Seller-visible assignments</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Stake pressure</p>
            <strong>{metrics.totalStake.toFixed(0)} SUI</strong>
            <span>Capital currently requested</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Insured</p>
            <strong>{metrics.insured}</strong>
            <span>Orders under recovery pool</span>
          </article>
        </div>
        <div className="rule-strip">
          <Link href="/app#heatmap">Fuzzy Heatmap</Link>
          <Link href="/app#bidding-pool">Weighted Bidding Pool</Link>
          <Link href="/app#staged-reveal">Staged Reveal</Link>
          <Link href="/app/reputation#reputation">Reputation</Link>
          <Link href="/app/insurance#insurance">Insurance</Link>
        </div>
      </section>

      <div className="dashboard-grid">
        <HeatmapLayer data={tradeRoutes.heatmap} />
        <section className="panel stack" id="bidding-pool">
          <div className="section-head">
            <div>
              <p className="eyebrow">Order market</p>
              <h2>Seller-visible route queue</h2>
            </div>
            <button type="button" className="button secondary" onClick={() => void tradeRoutes.refresh()}>
              Refresh Queue
            </button>
          </div>
          <div className="meta-strip">
            <div className="meta-chip">
              <span className="eyebrow">Wallet</span>
              <strong>{account ? "Ready" : "Not linked"}</strong>
            </div>
            <div className="meta-chip">
              <span className="eyebrow">Coord Precision</span>
              <strong>Staged / Hidden</strong>
            </div>
            <div className="meta-chip">
              <span className="eyebrow">Insurance Model</span>
              <strong>Mutual Pool</strong>
            </div>
          </div>
          <div className="order-stack">
            {tradeRoutes.orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                walletConnected={Boolean(account?.address)}
                onAccept={(nextOrder) => {
                  startTransition(() => setSelectedOrder(nextOrder));
                }}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="panel stack" id="staged-reveal">
        <div className="section-head">
          <div>
            <p className="eyebrow">Staged Reveal</p>
            <h2>Route visibility unlocks in two controlled steps</h2>
          </div>
          <Link href="/contracts" className="button secondary">
            Open Contract Flow
          </Link>
        </div>
        <div className="timeline-grid">
          <article className="table-card">
            <div className="table-card__header">
              <strong>01. Accept order</strong>
              <span className="status-pill is-open">Stake locked</span>
            </div>
            <p className="muted">
              Seller meets reputation and stake thresholds, then commits collateral before seeing
              full delivery details.
            </p>
          </article>
          <article className="table-card">
            <div className="table-card__header">
              <strong>02. Pickup revealed</strong>
              <span className="status-pill is-assigned">Stage one</span>
            </div>
            <p className="muted">
              Only the pickup location becomes visible after acceptance, so the route cannot be
              leaked in full at the moment of assignment.
            </p>
          </article>
          <article className="table-card">
            <div className="table-card__header">
              <strong>03. Pickup confirmed</strong>
              <span className="status-pill is-transit">Stage two</span>
            </div>
            <p className="muted">
              Once the seller confirms cargo collection, destination visibility unlocks and the
              delivery leg becomes actionable.
            </p>
          </article>
          <article className="table-card">
            <div className="table-card__header">
              <strong>04. Complete or dispute</strong>
              <span className="status-pill is-disputed">Resolution</span>
            </div>
            <p className="muted">
              Successful delivery releases stake and improves score. Failure can trigger slashing,
              insurance payout, and recovery flow.
            </p>
          </article>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel stack" id="reputation-preview">
          <div className="section-head">
            <div>
              <p className="eyebrow">Reputation</p>
              <h2>Carrier access and score ladder</h2>
            </div>
            <Link href="/app/reputation" className="button secondary">
              Open Reputation
            </Link>
          </div>
          <div className="meta-strip">
            {tradeRoutes.profiles.slice(0, 3).map((profile) => (
              <div className="meta-chip" key={profile.owner}>
                <span className="eyebrow">Tier {profile.tier}</span>
                <strong>{profile.score} score</strong>
                <span>{profile.successCount} successful runs</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack" id="insurance-preview">
          <div className="section-head">
            <div>
              <p className="eyebrow">Insurance</p>
              <h2>Mutual recovery pool</h2>
            </div>
            <Link href="/app/insurance" className="button secondary">
              Open Insurance
            </Link>
          </div>
          <div className="meta-strip">
            <div className="meta-chip">
              <span className="eyebrow">Pool Capital</span>
              <strong>
                {(Number(tradeRoutes.insurancePool.capitalMist) / 1_000_000_000).toFixed(0)} SUI
              </strong>
            </div>
            <div className="meta-chip">
              <span className="eyebrow">Premiums</span>
              <strong>
                {(Number(tradeRoutes.insurancePool.totalPremiumsCollectedMist) / 1_000_000_000).toFixed(0)} SUI
              </strong>
            </div>
            <div className="meta-chip">
              <span className="eyebrow">Recoveries</span>
              <strong>
                {(Number(tradeRoutes.insurancePool.totalRecoveriesMist) / 1_000_000_000).toFixed(0)} SUI
              </strong>
            </div>
          </div>
        </section>
      </div>

      <StakeModal
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        coins={tradeRoutes.ownedCoins}
        busy={tradeRoutes.isAccepting}
        error={tradeRoutes.acceptError}
        onClose={() => setSelectedOrder(undefined)}
        onConfirm={async (input) => {
          await tradeRoutes.acceptOrder(input);
          setSelectedOrder(undefined);
        }}
      />
    </>
  );
}
