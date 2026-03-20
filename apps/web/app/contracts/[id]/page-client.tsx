"use client";

import Link from "next/link";
import { useTradeRoutes } from "../../../lib/trade-routes-context";
import { ContractActions } from "../../../components/contract-actions";

function row(label: string, value?: string | number) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

export function ContractDetail({ id }: { id: string }) {
  const { getContract } = useTradeRoutes();
  const contract = getContract(id);

  if (!contract) {
    return (
      <main className="page-stack">
        <section className="panel stack">
          <p className="eyebrow">Missing contract</p>
          <h1>Contract not found</h1>
          <Link href="/contracts" className="button secondary">
            Back to contracts
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Contract detail</p>
            <h1>{contract.resource}</h1>
          </div>
          <span className={`status-pill ${contract.status}`}>{contract.status}</span>
        </div>
        <dl className="detail-grid">
          {row("Creator", contract.creator)}
          {row("Accepter", contract.accepter)}
          {row("Type", contract.contractType)}
          {row("Quantity", contract.quantity)}
          {row("Target region", contract.targetRegion)}
          {row("Reward", `${contract.reward} SUI`)}
          {row("Collateral", `${contract.collateral} SUI`)}
          {row("Expiration", contract.expirationTimestamp)}
          {row("Created", contract.createdAt)}
          {row("Accepted", contract.acceptedAt)}
          {row("Completed", contract.completedAt)}
          {row("Cancelled", contract.cancelledAt)}
          {row("Source", contract.source)}
          {row("Transaction digest", contract.txDigest)}
        </dl>
        {contract.note ? <div className="feedback success">{contract.note}</div> : null}
      </section>
      <ContractActions contract={contract} />
    </main>
  );
}
