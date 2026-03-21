"use client";

import {
  formatAddress,
  formatMist,
  formatStage,
  formatStatus,
  type OrderPublicView,
} from "../../lib/trade-routes/types";

function statusTone(status: OrderPublicView["status"]) {
  if (status === "completed") {
    return "is-completed";
  }
  if (status === "in_transit") {
    return "is-transit";
  }
  if (status === "assigned") {
    return "is-assigned";
  }
  if (status === "disputed") {
    return "is-disputed";
  }
  return "is-open";
}

export function OrderCard({
  order,
  walletConnected,
  onAccept,
}: {
  order: OrderPublicView;
  walletConnected: boolean;
  onAccept(order: OrderPublicView): void;
}) {
  return (
    <article className={`order-card ${statusTone(order.status)}`}>
      <div className="order-card__main">
        <div className="order-card__header">
          <div>
            <p className="eyebrow">Order / {order.orderId}</p>
            <h3>{order.cargoHint}</h3>
          </div>
          <div className="order-card__flags">
            {order.insured ? <span className="flag flag--insured">Insured</span> : null}
            <span className={`status-pill ${statusTone(order.status)}`}>{formatStatus(order.status)}</span>
          </div>
        </div>

        <div className="route-band">
          <div>
            <span className="eyebrow">Origin band</span>
            <strong>{order.originFuzzy}</strong>
          </div>
          <span className="route-band__arrow" />
          <div>
            <span className="eyebrow">Destination band</span>
            <strong>{order.destinationFuzzy}</strong>
          </div>
        </div>

        <div className="order-metrics">
          <div className="metric-cell">
            <span className="eyebrow">Reward</span>
            <strong>{formatMist(order.rewardBudgetMist)}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Stake Lock</span>
            <strong>{formatMist(order.requiredStakeMist)}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Rep Gate</span>
            <strong>{order.minReputationScore}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Quote</span>
            <strong>{formatMist(order.quotedPriceMist)}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Stage</span>
            <strong>{formatStage(order.stage)}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Mode</span>
            <strong>{order.orderMode}</strong>
          </div>
        </div>
      </div>

      <aside className="order-card__side">
        <div className="side-block">
          <span className="eyebrow">Buyer</span>
          <strong>{formatAddress(order.buyer)}</strong>
        </div>
        <div className="side-block">
          <span className="eyebrow">Seller</span>
          <strong>{order.seller ? formatAddress(order.seller) : "Unassigned"}</strong>
        </div>
        <div className="side-block">
          <span className="eyebrow">Bid Pool</span>
          <strong>{order.bidCount}</strong>
        </div>
        <div className="side-block">
          <span className="eyebrow">Insurance</span>
          <strong>{order.insured ? "Recovery active" : "None"}</strong>
        </div>
        <button
          type="button"
          className="button primary"
          onClick={() => onAccept(order)}
          disabled={!walletConnected || order.status !== "open"}
        >
          {walletConnected ? "Lock Stake" : "Connect Wallet"}
        </button>
      </aside>
    </article>
  );
}
