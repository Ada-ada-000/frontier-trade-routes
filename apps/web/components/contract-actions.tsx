"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { canAccept, canCancel, canComplete } from "@eve/shared";
import type { TradeRouteContract } from "@eve/shared";
import { useTradeRoutes } from "../lib/trade-routes-context";
import { StatusBadge } from "./ui/status-badge";

export function ContractActions({ contract }: { contract: TradeRouteContract }) {
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
      setHint("Connect a wallet before taking this order.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!acceptState.ok) {
      setHint(acceptState.message ?? "This order cannot be accepted right now.");
      return;
    }

    setHint("");
    await acceptContract(contract.id);
  }

  async function handleComplete() {
    if (!account?.address) {
      setHint("Connect a wallet before marking this route complete.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!completeState.ok) {
      setHint(completeState.message ?? "This route cannot be completed right now.");
      return;
    }

    setHint("");
    await completeContract(contract.id);
  }

  async function handleCancel() {
    if (!account?.address) {
      setHint("Connect a wallet before cancelling this order.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!isCreator) {
      setHint("Only the requester can cancel an open order.");
      return;
    }

    if (!cancelState.ok) {
      setHint(cancelState.message ?? "This order cannot be cancelled right now.");
      return;
    }

    setHint("");
    await cancelContract(contract.id);
  }

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Order Controls</p>
          <h2>Advance the route</h2>
        </div>
        <StatusBadge label={contract.status === "accepted" ? "Accepted" : contract.status} />
      </div>
      <div className="button-group action-row">
        <button
          className="button primary"
          onClick={() => void handleAccept()}
          disabled={busy}
          title={acceptState.ok ? "Take order" : acceptState.message}
        >
          Accept
        </button>
        <button
          className="button secondary"
          onClick={() => void handleComplete()}
          disabled={busy}
          title={completeState.ok ? "Mark route complete" : completeState.message}
        >
          Complete
        </button>
        <button
          className="button secondary"
          onClick={() => void handleCancel()}
          disabled={busy}
          title={
            !isCreator
              ? "Only the requester can cancel an open order."
              : cancelState.ok
                ? "Cancel order"
                : cancelState.message
          }
        >
          Cancel
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
              View transaction
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
