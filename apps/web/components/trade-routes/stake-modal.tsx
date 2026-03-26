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
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!order) {
      return;
    }

    setQuotedPriceMist(order.quotedPriceMist);
    const eligible = coins.find((coin) => BigInt(coin.balanceMist) >= BigInt(order.requiredStakeMist));
    setStakeCoinObjectId(eligible?.objectId ?? "");
    setValidationError("");
  }, [coins, order]);

  if (!open || !order) {
    return null;
  }

  const eligibleCoins = coins.filter((coin) => BigInt(coin.balanceMist) >= BigInt(order.requiredStakeMist));

  async function handleConfirm() {
    if (!order) {
      return;
    }

    if (!quotedPriceMist.trim()) {
      setValidationError("Enter a quoted price before submitting.");
      return;
    }

    if (!stakeCoinObjectId) {
      setValidationError("Select an eligible wallet coin to lock stake.");
      return;
    }

    setValidationError("");
    await onConfirm({
      orderId: order.orderId,
      quotedPriceMist,
      stakeCoinObjectId,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Order Command</p>
            <h3>Take route order #{order.orderId}</h3>
          </div>
          <button type="button" className="button secondary" onClick={onClose}>
            Stand Down
          </button>
        </div>

        <div className="modal-summary">
          <div className="side-block">
            <span className="eyebrow">Cargo</span>
            <strong>{order.cargoHint}</strong>
          </div>
          <div className="side-block">
            <span className="eyebrow">Route</span>
            <strong>
              {order.originFuzzy} → {order.destinationFuzzy}
            </strong>
          </div>
          <div className="side-block">
            <span className="eyebrow">Reward ceiling</span>
            <strong>{formatMist(order.rewardBudgetMist)}</strong>
          </div>
          <div className="side-block">
            <span className="eyebrow">Stake requirement</span>
            <strong>{formatMist(order.requiredStakeMist)}</strong>
          </div>
        </div>

        <div className="modal-form">
          <label className="modal-field">
            <span className="eyebrow">Your Quote</span>
            <input
              value={quotedPriceMist}
              onChange={(event) => setQuotedPriceMist(event.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="modal-field">
            <span className="eyebrow">Funding Coin</span>
            <select value={stakeCoinObjectId} onChange={(event) => setStakeCoinObjectId(event.target.value)}>
              <option value="">Select eligible wallet coin</option>
              {eligibleCoins.map((coin) => (
                <option key={coin.objectId} value={coin.objectId}>
                  {coin.objectId.slice(0, 12)}... / {formatMist(coin.balanceMist)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="risk-panel">
          <p className="eyebrow">Risk Notice</p>
          <ul className="sequence-list compact">
            <li>Stake locks before command execution completes.</li>
            <li>Coordinates remain staged and are not fully revealed in public view.</li>
            <li>Insurance and penalties may apply depending on fulfillment outcome.</li>
          </ul>
        </div>

        {validationError ? <div className="feedback error">{validationError}</div> : null}
        {error ? <div className="feedback error">{error}</div> : null}

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Stand Down
          </button>
          <button
            type="button"
            className="button primary"
            disabled={busy}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {busy ? "Locking bond..." : "Lock Bond & Take Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
