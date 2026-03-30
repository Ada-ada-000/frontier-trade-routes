"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  contractTypeLabels,
  intelEventLabels,
  riskLevelLabels,
  type IntelEvent,
} from "@eve/shared";
import { localizePath, type AppLocale } from "../lib/i18n";
import type { IntelReportSummary } from "../lib/trade-routes/types";
import { useTradeRoutes } from "../lib/trade-routes/use-trade-routes";
import { ProgressBar } from "./ui/progress-bar";
import { StatusBadge } from "./ui/status-badge";

function statusLabel(status: IntelReportSummary["status"], locale: AppLocale) {
  if (status === "confirmed") return locale === "zh" ? "✅ 已验证" : "✅ Verified";
  if (status === "disputed") return locale === "zh" ? "⚠️ 有争议" : "⚠️ Disputed";
  if (status === "false") return locale === "zh" ? "❌ 不可信" : "❌ False";
  return locale === "zh" ? "⏳ 待确认" : "⏳ Pending";
}

function localizeRecommendedType(type: "procure" | "deliver", locale: AppLocale) {
  if (locale !== "zh") return contractTypeLabels[type];
  return type === "deliver" ? "运输" : "采购";
}

export function IntelEventFeed({
  events,
  reports,
  locale = "en",
}: {
  events: IntelEvent[];
  reports: IntelReportSummary[];
  locale?: AppLocale;
}) {
  const isZh = locale === "zh";
  const account = useCurrentAccount();
  const tradeRoutes = useTradeRoutes();
  const [items, setItems] = useState(reports);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<"reports" | "alerts">("reports");

  useEffect(() => {
    setItems(reports);
  }, [reports]);

  function onAction(reportId: string, action: "support" | "dispute" | "resolve") {
    setActionError(undefined);
    startTransition(async () => {
      try {
        const result = await tradeRoutes.runIntelAction({ reportId, action });
        if (result && typeof result === "object" && "reportId" in result) {
          const updated = result as IntelReportSummary;
          setItems((current) =>
            current.map((item) => (item.reportId === reportId ? updated : item)),
          );
        }
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : isZh ? "情报操作失败。" : "Intel action failed.",
        );
      }
    });
  }

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">{isZh ? "情报验证" : "Validation"}</p>
          <h2>{isZh ? "情报台" : "Intel Desk"}</h2>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Community intelligence views">
          <button
            type="button"
            className={`segmented-control__item${view === "reports" ? " is-active" : ""}`}
            onClick={() => setView("reports")}
          >
            {isZh ? "报告" : "Reports"}
          </button>
          <button
            type="button"
            className={`segmented-control__item${view === "alerts" ? " is-active" : ""}`}
            onClick={() => setView("alerts")}
          >
            {isZh ? "警报" : "Alerts"}
          </button>
        </div>
      </div>
      {actionError ? <p className="muted">{actionError}</p> : null}
      {view === "reports" ? (
        <div className="event-feed">
          {items.map((report) => (
            <article key={report.reportId} className="event-card">
              <div className="opportunity-head">
                <div>
                  <p className="eyebrow">{isZh ? "验证报告" : "Validation report"}</p>
                  <strong>{report.regionFuzzy}</strong>
                  <p className="opportunity-subtitle">
                    {isZh
                      ? `${report.signalKind} · ${(report.confidenceBps / 100).toFixed(0)}%`
                      : `${report.signalKind} · ${(report.confidenceBps / 100).toFixed(0)}%`}
                  </p>
                </div>
                <StatusBadge label={statusLabel(report.status, locale)} />
              </div>
              <div className="consensus-block">
                <div className="consensus-block__head">
                  <span>{isZh ? "可信度" : "Trust level"}</span>
                  <strong>
                    {Math.round(
                      (report.supportCount /
                        Math.max(report.supportCount + report.disputeCount, 1)) *
                        100,
                    )}
                    %
                  </strong>
                </div>
                <ProgressBar
                  value={Math.round(
                    (report.supportCount /
                      Math.max(report.supportCount + report.disputeCount, 1)) *
                      100,
                  )}
                  tone={report.status === "disputed" ? "red" : "green"}
                />
              </div>
              <div className="card-footer">
                <div className="card-footer__meta">
                    <span className="eyebrow">{isZh ? "反馈" : "Signal"}</span>
                    <strong>{isZh ? `${report.supportCount} 支持 · ${report.disputeCount} 质疑` : `${report.supportCount} support · ${report.disputeCount} dispute`}</strong>
                  </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setExpanded((current) => (current === report.reportId ? null : report.reportId))
                  }
                >
                  {isZh ? "查看详情" : "View Details"}
                </button>
              </div>
              {expanded === report.reportId ? (
                <div className="stack compact">
                  <div className="stats-grid">
                    <div className="side-block">
                      <span className="eyebrow">{isZh ? "关联订单" : "Linked orders"}</span>
                      <strong>{report.linkedOrderCount}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">{isZh ? "验证分" : "Validation score"}</span>
                      <strong>{report.validationScore}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">{isZh ? "验证窗口" : "Review window"}</span>
                      <strong>
                        {Date.now() >= Number(report.expiresAtMs) ? (isZh ? "可结算" : "Ready") : isZh ? "进行中" : "Open"}
                      </strong>
                    </div>
                  </div>
                  <div className="button-row action-row">
                  <button
                    type="button"
                    className="button secondary"
                    disabled={!account?.address || isPending}
                    onClick={() => onAction(report.reportId, "support")}
                  >
                    {isZh ? "支持" : "Support"}
                  </button>
                  <button
                    type="button"
                    className="button tertiary"
                    disabled={!account?.address || isPending}
                    onClick={() => onAction(report.reportId, "dispute")}
                  >
                    {isZh ? "质疑" : "Dispute"}
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={isPending || Date.now() < Number(report.expiresAtMs)}
                    onClick={() => onAction(report.reportId, "resolve")}
                  >
                    {isZh ? "结算" : "Resolve"}
                  </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : events.length ? (
        <div className="panel panel--subtle stack">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">{isZh ? "最新警报" : "Latest alerts"}</p>
              <h3>{isZh ? "现场信号" : "Field signals"}</h3>
            </div>
          </div>
          <div className="event-feed event-feed--compact">
            {events.map((event) => (
              <article key={event.id} className="event-card event-card--compact">
                <div className="opportunity-head">
                  <div>
                    <p className="eyebrow">{intelEventLabels[event.type]}</p>
                    <strong>{event.title}</strong>
                  </div>
                  <span className="status-pill">{riskLevelLabels[event.riskLevel]}</span>
                </div>
                <p className="muted">{event.regionName} · {event.confidence}%</p>
                <div className="card-footer">
                  <div className="card-footer__meta">
                    <span className="eyebrow">{isZh ? "推荐动作" : "Best action"}</span>
                    <strong>
                      {event.recommendedContractType
                        ? localizeRecommendedType(event.recommendedContractType, locale)
                        : isZh ? "继续观察" : "Observe"}
                    </strong>
                  </div>
                  {event.recommendedContractType && event.resourceName ? (
                    <Link
                      href={localizePath(`/contracts?type=${event.recommendedContractType}&resource=${encodeURIComponent(event.resourceName)}&region=${encodeURIComponent(event.regionName)}`, locale)}
                      className="button secondary"
                    >
                      {isZh ? "创建订单" : "Post order"}
                    </Link>
                  ) : (
                    <span className="subtle">{new Date(event.timestamp).toLocaleDateString()}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
