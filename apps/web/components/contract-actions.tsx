"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { canAccept, canCancel, canComplete } from "@eve/shared";
import type { TradeRouteContract } from "@eve/shared";
import { useTradeRoutes } from "../lib/trade-routes-context";

export function ContractActions({ contract }: { contract: TradeRouteContract }) {
  const account = useCurrentAccount();
  const { acceptContract, completeContract, cancelContract, busy, feedback } =
    useTradeRoutes();
  const acceptState = canAccept(contract);
  const completeState = canComplete(contract);
  const cancelState = canCancel(contract);
  const isCreator = account?.address === contract.creator;

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Actions</p>
          <h2>Advance lifecycle</h2>
        </div>
        <span className={`status-pill ${contract.status}`}>{contract.status}</span>
      </div>
      <div className="action-row">
        <button
          className="button primary"
          onClick={() => acceptContract(contract.id)}
          disabled={busy || !acceptState.ok}
          title={acceptState.ok ? "Accept contract" : acceptState.message}
        >
          Accept
        </button>
        <button
          className="button secondary"
          onClick={() => completeContract(contract.id)}
          disabled={busy || !completeState.ok}
          title={completeState.ok ? "Complete contract" : completeState.message}
        >
          Complete
        </button>
        <button
          className="button secondary"
          onClick={() => cancelContract(contract.id)}
          disabled={busy || !cancelState.ok || !isCreator}
          title={
            !isCreator
              ? "Only the creator can cancel an open contract."
              : cancelState.ok
                ? "Cancel contract"
                : cancelState.message
          }
        >
          Cancel
        </button>
      </div>
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
