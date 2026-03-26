"use client";

import Link from "next/link";
import { useTradeRoutes } from "../../../lib/trade-routes-context";
import { ContractActions } from "../../../components/contract-actions";
import { StatusBadge } from "../../../components/ui/status-badge";

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
          <p className="eyebrow">Missing order</p>
          <h1>Order not found</h1>
          <Link href="/contracts" className="button secondary">
            Back to orders
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
            <p className="eyebrow">Order detail</p>
            <h1>{contract.resource}</h1>
          </div>
          <StatusBadge label={contract.status === "accepted" ? "Accepted" : contract.status} />
        </div>
        <dl className="detail-grid">
          {row("Requester", contract.creator)}
          {row("Assigned Carrier", contract.accepter)}
          {row("Type", contract.contractType)}
          {row("Quantity", contract.quantity)}
          {row("Target region", contract.targetRegion)}
          {row("Reward", `${contract.reward} SUI`)}
          {row("Bond", `${contract.collateral} SUI`)}
          {row("Deadline", contract.expirationTimestamp)}
          {row("Created", contract.createdAt)}
          {row("Accepted", contract.acceptedAt)}
          {row("Completed", contract.completedAt)}
          {row("Cancelled", contract.cancelledAt)}
          {row("Activity", contract.txDigest)}
        </dl>
        {contract.note ? <div className="feedback success">{contract.note}</div> : null}
      </section>
      <ContractActions contract={contract} />
    </main>
  );
}
