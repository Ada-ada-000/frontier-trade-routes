"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTradeRoutes } from "../../lib/trade-routes-context";
import { ProgressBar } from "../../components/ui/progress-bar";
import { StatusBadge } from "../../components/ui/status-badge";
import { contractTypeLabels } from "@eve/shared";

function contractProgress(status: string) {
  if (status === "completed") return 100;
  if (status === "accepted") return 55;
  if (status === "cancelled" || status === "expired") return 100;
  return 12;
}

function remainingTime(value: string) {
  const delta = new Date(value).getTime() - Date.now();
  if (delta <= 0) return "Expired";
  const hours = Math.floor(delta / 3_600_000);
  const minutes = Math.floor((delta % 3_600_000) / 60_000);
  if (hours >= 24) {
    return `${Math.floor(hours / 24)}d left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${Math.max(minutes, 1)}m left`;
}

export function ContractsClientPage() {
  const { contracts } = useTradeRoutes();
  const [sortMode, setSortMode] = useState<"newest" | "oldest" | "reward_high" | "reward_low">("newest");
  const [typeFilter, setTypeFilter] = useState<"all" | "procure" | "deliver">("all");
  const [regionFilter, setRegionFilter] = useState<"all" | string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "accepted" | "completed" | "cancelled" | "expired"
  >("all");

  const regions = useMemo(
    () => Array.from(new Set(contracts.map((contract) => contract.targetRegion))).sort(),
    [contracts],
  );

  const filteredContracts = useMemo(() => {
    const next = contracts.filter((contract) => {
      if (typeFilter !== "all" && contract.contractType !== typeFilter) {
        return false;
      }
      if (regionFilter !== "all" && contract.targetRegion !== regionFilter) {
        return false;
      }
      if (statusFilter !== "all" && contract.status !== statusFilter) {
        return false;
      }
      return true;
    });

    next.sort((left, right) => {
      if (sortMode === "reward_high") {
        return right.reward - left.reward;
      }
      if (sortMode === "reward_low") {
        return left.reward - right.reward;
      }
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return sortMode === "newest" ? rightTime - leftTime : leftTime - rightTime;
    });

    return next;
  }, [contracts, regionFilter, sortMode, statusFilter, typeFilter]);

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Order Board</p>
          <h2>Active Orders</h2>
        </div>
        <span className="subtle">{filteredContracts.length} visible orders</span>
      </div>
      <div className="contracts-filters">
        <div className="contracts-filters__summary">
          <span className="eyebrow">Filters</span>
          <strong>Refine what carriers see first</strong>
        </div>
        <div className="contracts-filters__controls">
          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-sort">
              Sort
            </label>
            <select
              id="contracts-sort"
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value as "newest" | "oldest" | "reward_high" | "reward_low")
              }
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="reward_high">Highest reward</option>
              <option value="reward_low">Lowest reward</option>
            </select>
          </div>

          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-type">
              Type
            </label>
            <select
              id="contracts-type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | "procure" | "deliver")
              }
            >
              <option value="all">All orders</option>
              <option value="procure">Procure only</option>
              <option value="deliver">Deliver only</option>
            </select>
          </div>

          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-region">
              Region
            </label>
            <select
              id="contracts-region"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
            >
              <option value="all">All regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-status">
              Status
            </label>
            <select
              id="contracts-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "open" | "accepted" | "completed" | "cancelled" | "expired",
                )
              }
            >
              <option value="all">All states</option>
              <option value="open">Open</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

        </div>
      </div>
      <div className="contract-table">
        {filteredContracts.map((contract) => (
          <Link key={contract.id} href={`/contracts/${contract.id}`} className="contract-row">
            <div className="contract-row__main">
              <div className="contract-row__header">
                <strong>{contract.targetRegion}</strong>
                <StatusBadge label={contract.status === "accepted" ? "Accepted" : contract.status} />
              </div>
              <p>
                {contractTypeLabels[contract.contractType]} · {contract.resource} · {contract.quantity}
              </p>
              <ProgressBar
                value={contractProgress(contract.status)}
                tone={
                  contract.status === "completed"
                    ? "green"
                    : contract.status === "accepted"
                      ? "blue"
                      : contract.status === "expired" || contract.status === "cancelled"
                        ? "red"
                        : "orange"
                }
              />
            </div>
            <div className="contract-row__aside">
              <strong className="contract-row__reward">{contract.reward} SUI</strong>
              <p>{remainingTime(contract.expirationTimestamp)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
