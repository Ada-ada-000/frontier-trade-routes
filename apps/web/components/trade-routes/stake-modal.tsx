"use client";

import { useEffect, useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { type AppLocale } from "../../lib/i18n";
import { formatMist, type OrderPublicView } from "../../lib/trade-routes/types";

interface CoinOption {
  objectId: string;
  balanceMist: string;
}

const MIST_PER_SUI = 1_000_000_000n;

function mistToSuiInput(value: string) {
  const normalized = value.trim() === "" ? "0" : value;
  const amount = BigInt(normalized);
  const whole = amount / MIST_PER_SUI;
  const fraction = amount % MIST_PER_SUI;

  if (fraction === 0n) {
    return whole.toString();
  }

  return `${whole.toString()}.${fraction.toString().padStart(9, "0").replace(/0+$/, "")}`;
}

function parseSuiToMist(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{0,9})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = `${fraction}000000000`.slice(0, 9);
  return (BigInt(whole) * MIST_PER_SUI + BigInt(paddedFraction)).toString();
}

export function StakeModal({
  open,
  order,
  coins,
  busy,
  error,
  locale = "en",
  onClose,
  onConfirm,
}: {
  open: boolean;
  order?: OrderPublicView;
  coins: CoinOption[];
  busy: boolean;
  error?: string;
  locale?: AppLocale;
  onClose(): void;
  onConfirm(input: { orderId: string; quotedPriceMist: string; stakeCoinObjectId: string }): Promise<void>;
}) {
  const account = useCurrentAccount();
  const isZh = locale === "zh";
  const [quotedPriceInput, setQuotedPriceInput] = useState("");
  const [stakeCoinObjectId, setStakeCoinObjectId] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showBondReview, setShowBondReview] = useState(false);

  useEffect(() => {
    if (!order) {
      return;
    }

    setQuotedPriceInput(mistToSuiInput(order.quotedPriceMist));
    const eligible = [...coins]
      .filter((coin) => BigInt(coin.balanceMist) >= BigInt(order.requiredStakeMist))
      .sort((left, right) => Number(BigInt(right.balanceMist) - BigInt(left.balanceMist)))[0];
    setStakeCoinObjectId(eligible?.objectId ?? "");
    setValidationError("");
    setShowBondReview(false);
  }, [coins, order]);

  if (!open || !order) {
    return null;
  }

  const orderedCoins = [...coins].sort((left, right) => Number(BigInt(right.balanceMist) - BigInt(left.balanceMist)));
  const eligibleCoins = orderedCoins.filter((coin) => BigInt(coin.balanceMist) >= BigInt(order.requiredStakeMist));
  const selectedCoin = coins.find((coin) => coin.objectId === stakeCoinObjectId);
  const parsedQuoteMist = parseSuiToMist(quotedPriceInput);
  const hasWallet = Boolean(account?.address);
  const hasCoins = coins.length > 0;
  const primaryCoin = selectedCoin ?? eligibleCoins[0] ?? orderedCoins[0];
  const hasEligibleCoin = eligibleCoins.length > 0;

  function shortObjectId(value: string) {
    return `${value.slice(0, 8)}...${value.slice(-4)}`;
  }

  function validateSelection() {
    if (!order) {
      return "";
    }

    if (!account?.address) {
      return isZh ? "请先连接 Sui 钱包，再选择可用于质押的 coin。" : "Connect a Sui wallet first, then choose a stake coin.";
    }

    if (!quotedPriceInput.trim()) {
      return isZh ? "请先填写 SUI 报价。" : "Enter a quote in SUI before submitting.";
    }

    if (!parsedQuoteMist) {
      return isZh ? "请输入有效的 SUI 数值，最多保留 9 位小数。" : "Enter a valid SUI amount with up to 9 decimals.";
    }

    if (!stakeCoinObjectId) {
      return isZh ? "请选择一枚可用于锁定质押的钱包 coin。" : "Select an eligible wallet coin to lock stake.";
    }

    return "";
  }

  function handlePrepareConfirm() {
    const message = validateSelection();
    if (message) {
      setValidationError(message);
      return;
    }

    setValidationError("");
    setShowBondReview(true);
  }

  async function handleConfirm() {
    const message = validateSelection();
    if (message) {
      setValidationError(message);
      return;
    }

    if (!order || !parsedQuoteMist) {
      return;
    }

    setValidationError("");
    await onConfirm({
      orderId: order.orderId,
      quotedPriceMist: parsedQuoteMist,
      stakeCoinObjectId,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="section-head">
          <div>
            <p className="eyebrow">{isZh ? "订单确认" : "Order Command"}</p>
            <h3>{isZh ? `接单确认 #${order.orderId}` : `Take route order #${order.orderId}`}</h3>
          </div>
          <button type="button" className="button secondary" onClick={onClose}>
            {isZh ? "取消" : "Stand Down"}
          </button>
        </div>

        <div className="modal-summary">
          <div className="side-block">
            <span className="eyebrow">Cargo</span>
            <span className="eyebrow">{isZh ? "货物" : "Cargo"}</span>
            <strong>{order.cargoHint}</strong>
          </div>
          <div className="side-block">
            <span className="eyebrow">{isZh ? "航线" : "Route"}</span>
            <strong>
              {order.originFuzzy} → {order.destinationFuzzy}
            </strong>
          </div>
          <div className="side-block">
            <span className="eyebrow">{isZh ? "奖励上限" : "Reward ceiling"}</span>
            <strong>{formatMist(order.rewardBudgetMist)}</strong>
          </div>
          <div className="side-block">
            <span className="eyebrow">{isZh ? "质押要求" : "Stake requirement"}</span>
            <strong>{formatMist(order.requiredStakeMist)}</strong>
          </div>
        </div>

        <div className="modal-form">
          <label className="modal-field modal-field--quote">
            <span className="eyebrow">{isZh ? "报价（SUI）" : "Quote (SUI)"}</span>
            <div className="quote-card quote-card--editor">
              <input
                value={quotedPriceInput}
                onChange={(event) => setQuotedPriceInput(event.target.value)}
                inputMode="decimal"
                placeholder={isZh ? "例如 132" : "e.g. 132"}
                aria-label={isZh ? "SUI 报价" : "SUI quote"}
              />
              <span className="quote-card__unit">SUI</span>
            </div>
          </label>
          <div className="modal-field modal-field--coin">
            <span className="eyebrow">{isZh ? "质押币" : "Stake Coin"}</span>
            {!hasWallet ? (
              <div className="coin-card coin-card--empty">
                <div className="wallet-inline">
                  <ConnectButton connectText={isZh ? "连接 Sui 钱包" : "Connect Sui Wallet"} />
                </div>
              </div>
            ) : (
              <div className="coin-card coin-card--picker">
                {!hasCoins ? (
                  <div className="coin-card__empty-inline">{isZh ? "暂无可用 SUI" : "No SUI available"}</div>
                ) : (
                  <div className="coin-choice-list" role="listbox" aria-label={isZh ? "可选质押币" : "Available stake coins"}>
                    <button
                      type="button"
                      className={`coin-choice ${stakeCoinObjectId ? "is-selected" : ""} ${hasEligibleCoin ? "" : "is-disabled"}`}
                      onClick={() => {
                        if (!hasEligibleCoin) {
                          return;
                        }

                        setStakeCoinObjectId((current) =>
                          current === (eligibleCoins[0]?.objectId ?? "") ? "" : (eligibleCoins[0]?.objectId ?? ""),
                        );
                      }}
                      disabled={!hasEligibleCoin}
                      aria-pressed={Boolean(stakeCoinObjectId)}
                    >
                      <span>SUI</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showBondReview && primaryCoin ? (
          <div className="risk-panel bond-review-panel">
            <div className="bond-review-panel__row">
              <span className="eyebrow">{isZh ? "钱包地址" : "Wallet"}</span>
              <strong>{account?.address ? shortObjectId(account.address) : "—"}</strong>
            </div>
            <div className="bond-review-panel__row">
              <span className="eyebrow">{isZh ? "最新余额" : "Latest balance"}</span>
              <strong>{formatMist(primaryCoin.balanceMist)}</strong>
            </div>
          </div>
        ) : null}

        <div className="risk-panel">
          <p className="eyebrow">{isZh ? "风险提示" : "Risk Notice"}</p>
          <ul className="sequence-list compact">
            <li>{isZh ? "在任务结束前，质押会先被锁定。" : "Stake locks before command execution completes."}</li>
            <li>{isZh ? "坐标会分阶段揭示，公开界面不会显示完整路线。" : "Coordinates remain staged and are not fully revealed in public view."}</li>
            <li>{isZh ? "如果履约失败，可能触发保险赔付和惩罚。" : "Insurance and penalties may apply depending on fulfillment outcome."}</li>
          </ul>
        </div>

        {validationError ? <div className="feedback error">{validationError}</div> : null}
        {error ? <div className="feedback error">{error}</div> : null}

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            {isZh ? "取消" : "Stand Down"}
          </button>
          {showBondReview ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => setShowBondReview(false)}
            >
              {isZh ? "返回修改" : "Back"}
            </button>
          ) : null}
          <button
            type="button"
            className="button primary"
            disabled={busy}
            onClick={() => {
              if (showBondReview) {
                void handleConfirm();
                return;
              }

              handlePrepareConfirm();
            }}
          >
            {busy
              ? isZh
                ? "正在锁定质押..."
                : "Locking bond..."
              : showBondReview
                ? isZh
                  ? "确认锁定质押并接单"
                  : "Confirm Bond & Take Order"
                : isZh
                  ? "锁定质押并接单"
                  : "Lock Bond & Take Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
