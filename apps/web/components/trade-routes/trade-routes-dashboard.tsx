"use client";

import { startTransition, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { HeatmapLayer } from "./heatmap-layer";
import { OrderCard } from "./order-card";
import { StakeModal } from "./stake-modal";
import { useTradeRoutes } from "../../lib/trade-routes/use-trade-routes";
import type { OrderPublicView } from "../../lib/trade-routes/types";

export function TradeRoutesDashboard() {
  const account = useCurrentAccount();
  const tradeRoutes = useTradeRoutes();
  const [selectedOrder, setSelectedOrder] = useState<OrderPublicView | undefined>();

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">EVE Frontier × Sui</p>
          <h1>Frontier Trade Routes</h1>
          <p className="lede">
            A staged logistics market: public discovery stays fuzzy, seller access becomes precise only after onchain commitment.
          </p>
          <p className="muted large">
            Weighted bidding, mandatory stake locking, insurance-backed recovery, and staged reveal reduce route leakage without relying on official live coordinates.
          </p>
          <div className="hero-actions">
            <div className="panel stat-card">
              <strong>{tradeRoutes.mode.toUpperCase()}</strong>
              <p className="muted">Execution mode</p>
            </div>
            <div className="panel stat-card">
              <strong>{tradeRoutes.orders.length}</strong>
              <p className="muted">Visible fuzzy orders</p>
            </div>
          </div>
        </div>
        <div className="panel stack">
          <p className="eyebrow">Access rules</p>
          <ol className="ordered">
            <li>Open market shows only fuzzy region blocks.</li>
            <li>`accept_order` locks stake before any precise route disclosure.</li>
            <li>Pickup reveal happens at assignment, destination reveal after `confirm_pickup`.</li>
            <li>Insurance and slashing resolve failure without exposing public coordinates.</li>
          </ol>
        </div>
      </section>

      <main className="page-stack">
        <div className="two-column trade-market-grid">
          <HeatmapLayer data={tradeRoutes.heatmap} />
          <section className="panel stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">Weighted bidding pool</p>
                <h2>Seller-visible queue</h2>
              </div>
              <button type="button" className="subtle-button" onClick={() => void tradeRoutes.refresh()}>
                Refresh
              </button>
            </div>
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
          </section>
        </div>
      </main>

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
