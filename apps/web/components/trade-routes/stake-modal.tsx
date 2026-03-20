"use client";

import { useEffect, useState } from "react";
import { formatMist, type OrderPublicView } from "../../lib/trade-routes/types";

interface CoinOption {
  objectId: string;
  balanceMist: string;
}

export function StakeModal({
  open,
  order,
  coins,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  order?: OrderPublicView;
  coins: CoinOption[];
  busy: boolean;
  error?: string;
  onClose(): void;
  onConfirm(input: { orderId: string; quotedPriceMist: string; stakeCoinObjectId: string }): Promise<void>;
}) {
  const [quotedPriceMist, setQuotedPriceMist] = useState("");
  const [stakeCoinObjectId, setStakeCoinObjectId] = useState("");

  useEffect(() => {
    if (!order) {
      return;
    }

    setQuotedPriceMist(order.quotedPriceMist);
    const eligible = coins.find((coin) => BigInt(coin.balanceMist) >= BigInt(order.requiredStakeMist));
    setStakeCoinObjectId(eligible?.objectId ?? "");
  }, [coins, order]);

  if (!open || !order) {
    return null;
  }

  const eligibleCoins = coins.filter((coin) => BigInt(coin.balanceMist) >= BigInt(order.requiredStakeMist));

  return (
    <div className="trade-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="trade-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="trade-order-top">
          <div>
            <p className="eyebrow">Lock stake</p>
            <h3>Accept fuzzy order #{order.orderId}</h3>
          </div>
          <button type="button" className="subtle-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="stack">
          <label className="trade-field">
            <span>Quoted price (mist)</span>
            <input
              value={quotedPriceMist}
              onChange={(event) => setQuotedPriceMist(event.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="trade-field">
            <span>Stake coin object</span>
            <select value={stakeCoinObjectId} onChange={(event) => setStakeCoinObjectId(event.target.value)}>
              <option value="">Select an eligible coin</option>
              {eligibleCoins.map((coin) => (
                <option key={coin.objectId} value={coin.objectId}>
                  {coin.objectId.slice(0, 12)}... · {formatMist(coin.balanceMist)}
                </option>
              ))}
            </select>
          </label>
          <p className="muted small-copy">
            Required stake: {formatMist(order.requiredStakeMist)}. Exact pickup or destination stays hidden in
            public UI until the staged reveal checks pass onchain.
          </p>
          {error ? <div className="feedback error">{error}</div> : null}
          <div className="hero-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy || !stakeCoinObjectId || !quotedPriceMist}
              onClick={() =>
                onConfirm({
                  orderId: order.orderId,
                  quotedPriceMist,
                  stakeCoinObjectId,
                })
              }
            >
              {busy ? "Submitting..." : "Submit accept_order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
