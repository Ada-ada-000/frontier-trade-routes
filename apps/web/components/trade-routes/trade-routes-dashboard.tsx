"use client";

import { startTransition, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { HeatmapLayer } from "./heatmap-layer";
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
      <section className="dashboard-hero panel stack">
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
          <span>Fuzzy Heatmap</span>
          <span>Weighted Bidding Pool</span>
          <span>Staged Reveal</span>
          <span id="reputation">Reputation</span>
          <span id="insurance">Insurance</span>
        </div>
      </section>

      <div className="dashboard-grid">
        <HeatmapLayer data={tradeRoutes.heatmap} />
        <section className="panel stack">
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
