"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { localizePath, type AppLocale } from "../../lib/i18n";
import { formatMist, type InsurancePoolSnapshot, type OrderPublicView } from "../../lib/trade-routes/types";
import { useTradeRoutes } from "../../lib/trade-routes/use-trade-routes";
import { MetricCard } from "../ui/metric-card";
import { StatusBadge } from "../ui/status-badge";

export function InsurancePanel({
  insurancePool,
  orders,
  commissionScheduleBps,
  locale = "en",
  initialView = "needs",
  coveredOrderId,
}: {
  insurancePool: InsurancePoolSnapshot;
  orders: OrderPublicView[];
  commissionScheduleBps: Record<string, number>;
  locale?: AppLocale;
  initialView?: "needs" | "covered" | "all";
  coveredOrderId?: string;
}) {
  const isZh = locale === "zh";
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string>();
  const [buyingOrderId, setBuyingOrderId] = useState<string>();
  const listRef = useRef<HTMLDivElement>(null);
  const view = initialView;
  const tradeRoutes = useTradeRoutes();

  const insuredOrders = useMemo(
    () => orders.filter((order) => order.insured),
    [orders],
  );
  const uninsuredOrders = useMemo(
    () => orders.filter((order) => !order.insured),
    [orders],
  );

  const visibleOrders =
    view === "needs" ? uninsuredOrders : view === "covered" ? insuredOrders : orders;

  const sortedVisibleOrders = [...visibleOrders].sort(
    (left, right) => Number(right.rewardBudgetMist) - Number(left.rewardBudgetMist),
  );
  const suggestedOrder = sortedVisibleOrders[0] ?? uninsuredOrders[0] ?? orders[0];
  const tierLabel = (value: "silver" | "gold" | "elite") =>
    isZh
      ? {
          silver: "白银",
          gold: "黄金",
          elite: "精英",
        }[value]
      : value[0].toUpperCase() + value.slice(1);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [view, coveredOrderId, sortedVisibleOrders.length]);

  function handleBuyCoverage(order: OrderPublicView) {
    setActionError(undefined);
    setBuyingOrderId(order.orderId);
    startTransition(async () => {
      try {
        await tradeRoutes.buyCoverage(order);

        router.replace(
          localizePath(
            `/app/insurance?view=covered&covered=${encodeURIComponent(order.orderId)}#insurance`,
            locale,
          ),
        );
        router.refresh();
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : isZh
              ? "投保失败，请稍后再试。"
              : "Coverage purchase failed. Please try again.",
        );
      } finally {
        setBuyingOrderId(undefined);
      }
    });
  }

  return (
    <main className="page-stack">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">{isZh ? "保险" : "Insurance"}</p>
            <h1>{isZh ? "给航线上保险" : "Protect live routes"}</h1>
          </div>
          <div className="button-row">
            <Link href={localizePath("/contracts", locale)} className="button secondary">
              {isZh ? "查看订单" : "Open Orders"}
            </Link>
            <button
              type="button"
              className="button tertiary"
              onClick={() => setShowHistory((current) => !current)}
            >
              {showHistory ? (isZh ? "收起说明" : "Hide details") : isZh ? "运作方式" : "How it Works"}
            </button>
          </div>
        </div>
        <div className="button-row action-row">
          <Link
            href={localizePath("/app/insurance?view=needs#insurance", locale)}
            className="button primary"
          >
            {isZh ? "待投保航线" : "Review Uncovered"}
          </Link>
          <Link href={localizePath("/app/insurance?view=covered#insurance", locale)} className="button secondary">
            {isZh ? "已投保航线" : "View Covered"}
          </Link>
          {suggestedOrder ? (
            <span className="subtle">
              {isZh ? `优先处理：${suggestedOrder.cargoHint}` : `Priority: ${suggestedOrder.cargoHint}`}
            </span>
          ) : null}
        </div>
        {coveredOrderId ? (
          <p className="muted">
            {isZh ? `订单 #${coveredOrderId} 已投保。` : `Coverage added for order #${coveredOrderId}.`}
          </p>
        ) : null}
        {actionError ? <p className="muted">{actionError}</p> : null}
        <div className="metric-grid">
          <MetricCard
            label={isZh ? "资金池规模" : "Pool Size"}
            value={formatMist(insurancePool.capitalMist)}
            note={isZh ? "可用于已投保航线" : "Available for protected routes"}
          />
          <MetricCard
            label={isZh ? "标准保费" : "Coverage Fee"}
            value={`${(commissionScheduleBps.silver / 100).toFixed(1)}%`}
            note={isZh ? "常见运输保费" : "Typical protected run fee"}
          />
          <MetricCard label={isZh ? "已投保航线" : "Covered Routes"} value={`${insuredOrders.length}`} note={isZh ? "已经纳入保障" : "Already protected"} />
          <MetricCard
            label={isZh ? "待投保航线" : "Needs Coverage"}
            value={`${uninsuredOrders.length}`}
            note={isZh ? "目前仍有暴露风险" : "Routes still exposed"}
          />
        </div>
        {showHistory ? (
          <div className="accordion-content">
            <div className="stats-grid">
              <div className="side-block">
                <span className="eyebrow">{isZh ? "历史赔付" : "Claims History"}</span>
                <strong>{formatMist(insurancePool.totalClaimsPaidMist)}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">{isZh ? "历史追回" : "Recovered Funds"}</span>
                <strong>{formatMist(insurancePool.totalRecoveriesMist)}</strong>
              </div>
            </div>
            <p className="muted">{isZh ? "赔付先出、追偿后补。默认先给高价值或不稳定航线投保。" : "Coverage pays first, then recovers. Protect unstable or high-value routes first."}</p>
          </div>
        ) : null}
      </section>

      <div className="insurance-grid">
        <section className="panel stack insurance-primary" id="insurance">
          <div className="section-head">
              <div>
                <p className="eyebrow">{isZh ? "投保看板" : "Coverage Board"}</p>
                <h2>{isZh ? "处理活跃航线" : "Protect live routes"}</h2>
              </div>
            <div className="segmented-control" role="tablist" aria-label="Coverage filters">
              {[
                { id: "needs", label: isZh ? "待投保" : "Needs coverage" },
                { id: "covered", label: isZh ? "已投保" : "Covered" },
                { id: "all", label: isZh ? "全部航线" : "All routes" },
              ].map((option) => (
                <Link
                  key={option.id}
                  className={`segmented-control__item ${view === option.id ? "is-active" : ""}`}
                  href={localizePath(`/app/insurance?view=${option.id}#insurance`, locale)}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div ref={listRef} className="coverage-list">
            {sortedVisibleOrders.length === 0 ? (
              <article className="table-card coverage-empty-state">
                <div className="stack compact">
                  <strong>
                    {view === "covered"
                      ? isZh
                        ? "当前还没有已投保航线"
                        : "No covered routes yet"
                      : view === "all"
                        ? isZh
                          ? "当前没有可展示的航线"
                          : "No routes to show right now"
                        : isZh
                          ? "当前没有待投保航线"
                          : "No uncovered routes right now"}
                  </strong>
                  <p className="muted">
                    {view === "covered"
                      ? isZh
                        ? "先去订单页找新的高风险任务，再回来给它们投保。"
                        : "Open orders, find a risky route, then come back to protect it."
                      : view === "all"
                        ? isZh
                          ? "当前没有活跃航线。先去订单页看看新的任务。"
                          : "There are no active routes right now. Open orders to find the next task."
                        : isZh
                          ? "这批活跃订单目前都已经投保了，先去看已投保航线，或者回订单页继续找新的任务。"
                          : "All active routes are already covered. Review covered routes or open orders to find new work."}
                  </p>
                  <div className="button-row action-row">
                    {view !== "covered" ? (
                      <Link href={localizePath("/app/insurance?view=covered#insurance", locale)} className="button primary">
                        {isZh ? "查看已投保" : "View Covered"}
                      </Link>
                    ) : null}
                    <Link href={localizePath("/contracts", locale)} className="button secondary">
                      {isZh ? "打开订单页" : "Open Orders"}
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              sortedVisibleOrders.map((order) => (
              <article key={order.orderId} className="table-card insurance-order-card">
                <div className="table-card__header">
                  <div>
                    <p className="eyebrow">{isZh ? `订单 #${order.orderId}` : `Order #${order.orderId}`}</p>
                    <strong>{order.cargoHint}</strong>
                  </div>
                  <StatusBadge label={order.insured ? (isZh ? "已投保" : "Covered") : isZh ? "未投保" : "Uncovered"} />
                </div>
                <div className="stats-grid">
                  <div className="side-block">
                    <span className="eyebrow">{isZh ? "起点" : "Origin"}</span>
                    <strong>{order.originFuzzy}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">{isZh ? "终点" : "Destination"}</span>
                    <strong>{order.destinationFuzzy}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">{isZh ? "预算" : "Budget"}</span>
                    <strong>{formatMist(order.rewardBudgetMist)}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">{isZh ? "质押" : "Stake"}</span>
                    <strong>{formatMist(order.requiredStakeMist)}</strong>
                  </div>
                </div>
                <div className="card-actions insurance-order-card__actions">
                  {!order.insured ? (
                    <button
                      type="button"
                      className="button primary"
                      disabled={isPending && buyingOrderId === order.orderId}
                      onClick={() => handleBuyCoverage(order)}
                    >
                      {isPending && buyingOrderId === order.orderId
                        ? isZh
                          ? "处理中..."
                          : "Processing..."
                        : isZh
                          ? "购买保险"
                          : "Buy Coverage"}
                    </button>
                  ) : (
                    <Link href={localizePath("/contracts", locale)} className="button secondary">
                      {isZh ? "查看航线" : "View Route"}
                    </Link>
                  )}
                </div>
              </article>
              ))
            )}
          </div>
        </section>

        <aside className="panel stack insurance-rail">
          <section className="insurance-rail__section">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">{isZh ? "保费档位" : "Coverage Rates"}</p>
                <h2>{isZh ? "保费阶梯" : "Premium ladder"}</h2>
              </div>
            </div>
            <div className="insurance-rate-grid">
              <div className="side-block">
                <span className="eyebrow">{tierLabel("silver")}</span>
                <strong>{(commissionScheduleBps.silver / 100).toFixed(1)}%</strong>
                <span className="subtle">{isZh ? "基础路线" : "Starter lanes"}</span>
              </div>
              <div className="side-block">
                <span className="eyebrow">{tierLabel("gold")}</span>
                <strong>{(commissionScheduleBps.gold / 100).toFixed(1)}%</strong>
                <span className="subtle">{isZh ? "稳定承运人" : "Stable carriers"}</span>
              </div>
              <div className="side-block">
                <span className="eyebrow">{tierLabel("elite")}</span>
                <strong>{(commissionScheduleBps.elite / 100).toFixed(1)}%</strong>
                <span className="subtle">{isZh ? "最优费率" : "Best pricing"}</span>
              </div>
            </div>
          </section>

          <section className="insurance-rail__section">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">{isZh ? "资金池" : "Pool Activity"}</p>
                <h2>{isZh ? "资金概览" : "Capital flow"}</h2>
              </div>
            </div>
            <div className="stats-grid insurance-stats-grid">
              <div className="side-block">
                <span className="eyebrow">{isZh ? "保费收入" : "Premiums"}</span>
                <strong>{formatMist(insurancePool.totalPremiumsCollectedMist)}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">{isZh ? "赔付支出" : "Claims"}</span>
                <strong>{formatMist(insurancePool.totalClaimsPaidMist)}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">{isZh ? "追回金额" : "Recoveries"}</span>
                <strong>{formatMist(insurancePool.totalRecoveriesMist)}</strong>
              </div>
            </div>
          </section>

          <section className="insurance-rail__section insurance-rail__section--grow">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">{isZh ? "操作建议" : "Action Guide"}</p>
                <h2>{isZh ? "下一步" : "Next Step"}</h2>
              </div>
            </div>
            <div className="table-card insurance-note-card">
              <div className="stack compact">
                <strong>{isZh ? "优先保护高价值或不稳定航线" : "Protect high-value or unstable runs first"}</strong>
                <div className="button-row action-row">
                  <Link href={localizePath("/contracts", locale)} className="button primary">
                    {isZh ? "查看航线" : "Review Routes"}
                  </Link>
                  <button
                    type="button"
                    className="button tertiary"
                    onClick={() => setShowHistory((current) => !current)}
                  >
                    {showHistory ? (isZh ? "收起说明" : "Hide details") : isZh ? "查看规则" : "View Rules"}
                  </button>
                  <Link href={localizePath("/app/reputation", locale)} className="button secondary">
                    {isZh ? "提高等级" : "Improve Tier"}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
