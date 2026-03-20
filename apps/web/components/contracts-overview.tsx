import Link from "next/link";
import type { TradeRouteContract } from "@eve/shared";

function rowLabel(contract: TradeRouteContract) {
  return `${contract.contractType} · ${contract.resource} · ${contract.quantity}`;
}

export function ContractsOverview({ contracts }: { contracts: TradeRouteContract[] }) {
  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Lifecycle</p>
          <h2>Contract board</h2>
        </div>
        <span className="subtle">{contracts.length} contracts in local state</span>
      </div>
      <div className="contract-table">
        {contracts.map((contract) => (
          <Link href={`/contracts/${contract.id}`} key={contract.id} className="contract-row">
            <div>
              <strong>{contract.targetRegion}</strong>
              <p>{rowLabel(contract)}</p>
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
