"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { localizePath, type AppLocale } from "../../lib/i18n";
import { useTradeRoutes } from "../../lib/trade-routes-context";
import { ProgressBar } from "../../components/ui/progress-bar";
import { StatusBadge } from "../../components/ui/status-badge";
import { contractTypeLabels } from "@eve/shared";

function localizeContractType(type: "procure" | "deliver", locale: AppLocale) {
  if (locale !== "zh") return contractTypeLabels[type];
  return type === "procure" ? "采购" : "运输";
}

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

function contractProgress(status: string) {
  if (status === "completed") return 100;
  if (status === "accepted") return 55;
  if (status === "cancelled" || status === "expired") return 100;
  return 12;
}

function remainingTime(value: string, locale: AppLocale) {
  const delta = new Date(value).getTime() - Date.now();
  if (delta <= 0) return locale === "zh" ? "已过期" : "Expired";
  const hours = Math.floor(delta / 3_600_000);
  const minutes = Math.floor((delta % 3_600_000) / 60_000);
  if (hours >= 24) {
    return locale === "zh" ? `还剩 ${Math.floor(hours / 24)} 天` : `${Math.floor(hours / 24)}d left`;
  }
  if (hours > 0) {
    return locale === "zh" ? `还剩 ${hours} 小时 ${minutes} 分` : `${hours}h ${minutes}m left`;
  }
  return locale === "zh" ? `还剩 ${Math.max(minutes, 1)} 分` : `${Math.max(minutes, 1)}m left`;
}

export function ContractsClientPage({ locale = "en" }: { locale?: AppLocale }) {
  const isZh = locale === "zh";
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
          <p className="eyebrow">{isZh ? "订单面板" : "Order Board"}</p>
          <h2>{isZh ? "活跃订单" : "Active Orders"}</h2>
        </div>
        <div className="button-row action-row">
          <span className="subtle">{isZh ? `${filteredContracts.length} 条可见订单` : `${filteredContracts.length} visible orders`}</span>
          <Link href={localizePath("/opportunities", locale)} className="button tertiary">
            {isZh ? "看机会" : "Scan Intel"}
          </Link>
        </div>
      </div>
      <div className="contracts-filters">
        <div className="contracts-filters__controls">
          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-sort">
              {isZh ? "排序" : "Sort"}
            </label>
            <select
              id="contracts-sort"
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value as "newest" | "oldest" | "reward_high" | "reward_low")
              }
            >
              <option value="newest">{isZh ? "最新优先" : "Newest first"}</option>
              <option value="oldest">{isZh ? "最早优先" : "Oldest first"}</option>
              <option value="reward_high">{isZh ? "奖励从高到低" : "Highest reward"}</option>
              <option value="reward_low">{isZh ? "奖励从低到高" : "Lowest reward"}</option>
            </select>
          </div>

          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-type">
              {isZh ? "类型" : "Type"}
            </label>
            <select
              id="contracts-type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | "procure" | "deliver")
              }
            >
              <option value="all">{isZh ? "全部订单" : "All orders"}</option>
              <option value="procure">{isZh ? "仅采购" : "Procure only"}</option>
              <option value="deliver">{isZh ? "仅运输" : "Deliver only"}</option>
            </select>
          </div>

          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-region">
              {isZh ? "区域" : "Region"}
            </label>
            <select
              id="contracts-region"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
            >
              <option value="all">{isZh ? "全部区域" : "All regions"}</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="contracts-filters__group">
            <label className="eyebrow" htmlFor="contracts-status">
              {isZh ? "状态" : "Status"}
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
              <option value="all">{isZh ? "全部状态" : "All states"}</option>
              <option value="open">{isZh ? "开放中" : "Open"}</option>
              <option value="accepted">{isZh ? "已接单" : "Accepted"}</option>
              <option value="completed">{isZh ? "已完成" : "Completed"}</option>
              <option value="cancelled">{isZh ? "已取消" : "Cancelled"}</option>
              <option value="expired">{isZh ? "已过期" : "Expired"}</option>
            </select>
          </div>

        </div>
      </div>
      <div className="contract-table">
        {filteredContracts.map((contract) => (
          <Link key={contract.id} href={localizePath(`/contracts/${contract.id}`, locale)} className="contract-row">
            <div className="contract-row__main">
              <div className="contract-row__header">
                <strong>{contract.targetRegion}</strong>
                <StatusBadge label={localizeContractStatus(contract.status, locale)} />
              </div>
              <p>
                {localizeContractType(contract.contractType, locale)} · {contract.resource} · {contract.quantity}
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
              <p>{remainingTime(contract.expirationTimestamp, locale)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
