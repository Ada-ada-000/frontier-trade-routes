"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  function handlePrimaryAction() {
    if (!walletConnected) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (order.status === "open") {
      onAccept(order);
      return;
    }

    router.push("/contracts#contracts");
  }

  const actionLabel = !walletConnected
    ? "Accept Order"
    : order.status === "open"
      ? "Accept Order"
      : "View Flow";

  const stageLabel =
    order.stage === "pickup_revealed"
      ? "📍 Pickup Revealed"
      : order.stage === "destination_revealed"
        ? "🎯 Dest. Revealed"
        : order.stage === "delivered"
          ? "✅ Delivered"
          : "🔒 Hidden";

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
            <span className="eyebrow" title="Reputation Required">Min Rep</span>
            <strong>{order.minReputationScore}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Stage</span>
            <strong>{stageLabel}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Mode</span>
            <strong>{order.orderMode}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">Bids</span>
            <strong>{order.bidCount}</strong>
          </div>
        </div>
      </div>

      <aside className="order-card__side">
        <div className="side-block">
          <span className="eyebrow">Seller</span>
          <strong>{order.seller ? formatAddress(order.seller) : "Unassigned"}</strong>
        </div>
        <div className="side-block">
          <span className="eyebrow">Deadline</span>
          <strong>{new Date(Number(order.deadlineMs)).toLocaleDateString()}</strong>
        </div>
        <button
          type="button"
          className="button primary"
          onClick={handlePrimaryAction}
          title={
            !walletConnected
              ? "Connect your wallet to accept this order."
              : order.status === "open"
                ? "Lock stake and accept this route."
                : "Open the order flow to review progress."
          }
        >
          {actionLabel}
        </button>
      </aside>
    </article>
  );
}
