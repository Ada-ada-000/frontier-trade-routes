"use client";

import { formatAddress, formatMist, formatStage, formatStatus, type OrderPublicView } from "../../lib/trade-routes/types";

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
    <article className="trade-order-card">
      <div className="trade-order-top">
        <div>
          <p className="eyebrow">Order #{order.orderId}</p>
          <h3>{order.cargoHint}</h3>
        </div>
        <span className={`status-pill ${order.status}`}>{formatStatus(order.status)}</span>
      </div>
      <p className="muted">
        {order.originFuzzy} → {order.destinationFuzzy}
      </p>
      <dl className="trade-order-grid">
        <div>
          <dt>Budget</dt>
          <dd>{formatMist(order.rewardBudgetMist)}</dd>
        </div>
        <div>
          <dt>Stake</dt>
          <dd>{formatMist(order.requiredStakeMist)}</dd>
        </div>
        <div>
          <dt>Rep floor</dt>
          <dd>{order.minReputationScore}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{formatStage(order.stage)}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{order.orderMode}</dd>
        </div>
        <div>
          <dt>Insurance</dt>
          <dd>{order.insured ? "Mutual pool" : "No policy"}</dd>
        </div>
      </dl>
      <div className="trade-order-footer">
        <p className="small-copy">
          Buyer {formatAddress(order.buyer)}
          {order.seller ? ` · Seller ${formatAddress(order.seller)}` : ""}
        </p>
        <button
          type="button"
          className="button primary"
          onClick={() => onAccept(order)}
          disabled={!walletConnected || order.status !== "open"}
        >
          {walletConnected ? "Lock stake" : "Connect wallet"}
        </button>
      </div>
    </article>
  );
}
