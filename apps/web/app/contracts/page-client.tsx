"use client";

import Link from "next/link";
import { useTradeRoutes } from "../../lib/trade-routes-context";

export function ContractsClientPage() {
  const { contracts } = useTradeRoutes();

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Open Board</p>
          <h2>Track lifecycle</h2>
        </div>
        <span className="subtle">{contracts.length} visible contracts</span>
      </div>
      <div className="contract-table">
        {contracts.map((contract) => (
          <Link key={contract.id} href={`/contracts/${contract.id}`} className="contract-row">
            <div>
              <strong>{contract.targetRegion}</strong>
              <p>
                {contract.contractType} · {contract.resource} · {contract.quantity}
              </p>
            </div>
            <div>
              <strong>{contract.reward} SUI</strong>
              <p>{contract.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
