"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { canAccept, canCancel, canComplete } from "@eve/shared";
import type { TradeRouteContract } from "@eve/shared";
import type { AppLocale } from "../lib/i18n";
import { useTradeRoutes } from "../lib/trade-routes-context";
import { StatusBadge } from "./ui/status-badge";

function localizeContractStatus(status: string, locale: AppLocale) {
  if (locale !== "zh") return status === "accepted" ? "Accepted" : status;
  return (
    {
      open: "开放中",
      accepted: "已接单",
      completed: "已完成",
      cancelled: "已取消",
      expired: "已过期",
    }[status] ?? status
  );
}

export function ContractActions({
  contract,
  locale = "en",
}: {
  contract: TradeRouteContract;
  locale?: AppLocale;
}) {
  const isZh = locale === "zh";
  const account = useCurrentAccount();
  const { acceptContract, completeContract, cancelContract, busy, feedback } =
    useTradeRoutes();
  const [hint, setHint] = useState("");
  const acceptState = canAccept(contract);
  const completeState = canComplete(contract);
  const cancelState = canCancel(contract);
  const isCreator = account?.address === contract.creator;

  async function handleAccept() {
    if (!account?.address) {
      setHint(isZh ? "接单前请先连接钱包。" : "Connect a wallet before taking this order.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!acceptState.ok) {
      setHint(acceptState.message ?? (isZh ? "这条订单当前无法接单。" : "This order cannot be accepted right now."));
      return;
    }

    setHint("");
    await acceptContract(contract.id);
  }

  async function handleComplete() {
    if (!account?.address) {
      setHint(isZh ? "完成前请先连接钱包。" : "Connect a wallet before marking this route complete.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!completeState.ok) {
      setHint(completeState.message ?? (isZh ? "这条航线当前无法完成。" : "This route cannot be completed right now."));
      return;
    }

    setHint("");
    await completeContract(contract.id);
  }

  async function handleCancel() {
    if (!account?.address) {
      setHint(isZh ? "取消前请先连接钱包。" : "Connect a wallet before cancelling this order.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!isCreator) {
      setHint(isZh ? "只有发布者才能取消开放中的订单。" : "Only the requester can cancel an open order.");
      return;
    }

    if (!cancelState.ok) {
      setHint(cancelState.message ?? (isZh ? "这条订单当前无法取消。" : "This order cannot be cancelled right now."));
      return;
    }

    setHint("");
    await cancelContract(contract.id);
  }

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">{isZh ? "订单操作" : "Order Controls"}</p>
          <h2>{isZh ? "推进这条航线" : "Advance the route"}</h2>
        </div>
        <StatusBadge label={localizeContractStatus(contract.status, locale)} />
      </div>
      <div className="button-group action-row">
        <button
          className="button primary"
          onClick={() => void handleAccept()}
          disabled={busy}
          title={acceptState.ok ? (isZh ? "接受订单" : "Take order") : acceptState.message}
        >
          {isZh ? "接单" : "Accept"}
        </button>
        <button
          className="button secondary"
          onClick={() => void handleComplete()}
          disabled={busy}
          title={completeState.ok ? (isZh ? "标记完成" : "Mark route complete") : completeState.message}
        >
          {isZh ? "完成" : "Complete"}
        </button>
        <button
          className="button secondary"
          onClick={() => void handleCancel()}
          disabled={busy}
          title={
            !isCreator
              ? isZh
                ? "只有发布者才能取消开放中的订单。"
                : "Only the requester can cancel an open order."
              : cancelState.ok
                ? isZh
                  ? "取消订单"
                  : "Cancel order"
                : cancelState.message
          }
        >
          {isZh ? "取消" : "Cancel"}
        </button>
      </div>
      {hint ? (
        <div className="feedback error">
          <p>{hint}</p>
        </div>
      ) : null}
      {feedback.message ? (
        <div className={`feedback ${feedback.phase}`}>
          <p>{feedback.message}</p>
          {feedback.explorerUrl ? (
            <a href={feedback.explorerUrl} target="_blank" rel="noreferrer">
              {isZh ? "查看交易" : "View transaction"}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
