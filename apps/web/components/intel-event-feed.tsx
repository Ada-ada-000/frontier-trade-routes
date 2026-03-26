"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  contractTypeLabels,
  intelEventLabels,
  riskLevelLabels,
  type IntelEvent,
} from "@eve/shared";
import type { IntelReportSummary } from "../lib/trade-routes/types";
import { ProgressBar } from "./ui/progress-bar";
import { StatusBadge } from "./ui/status-badge";

function statusLabel(status: IntelReportSummary["status"]) {
  if (status === "confirmed") return "✅ Verified";
  if (status === "disputed") return "⚠️ Disputed";
  if (status === "false") return "❌ False";
  return "⏳ Pending";
}

export function IntelEventFeed({
  events,
  reports,
}: {
  events: IntelEvent[];
  reports: IntelReportSummary[];
}) {
  const account = useCurrentAccount();
  const [items, setItems] = useState(reports);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<"reports" | "alerts">("reports");

  function onAction(reportId: string, action: "support" | "dispute" | "resolve") {
    setActionError(undefined);
    startTransition(async () => {
      const response = await fetch("/api/trade-routes/intel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId, action, actor: account?.address }),
      });

      const payload = (await response.json()) as {
        error?: string;
        report?: IntelReportSummary;
      };

      if (!response.ok || !payload.report) {
        setActionError(payload.error ?? "Intel action failed.");
        return;
      }

      setItems((current) =>
        current.map((item) => (item.reportId === reportId ? payload.report! : item)),
      );
    });
  }

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Validation</p>
          <h2>Check reports before you trust them</h2>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Community intelligence views">
          <button
            type="button"
            className={`segmented-control__item${view === "reports" ? " is-active" : ""}`}
            onClick={() => setView("reports")}
          >
            Reports
          </button>
          <button
            type="button"
            className={`segmented-control__item${view === "alerts" ? " is-active" : ""}`}
            onClick={() => setView("alerts")}
          >
            Alerts
          </button>
        </div>
      </div>
      {actionError ? <p className="muted">{actionError}</p> : null}
      <div className="quick-guide">
        <div className="quick-guide__copy">
          <strong>Support reports you would use. Dispute reports that look misleading.</strong>
          <p className="muted">
            Use details only when you need to validate a report. Most of the time, the status badge is enough.
          </p>
        </div>
      </div>
      {view === "reports" ? (
        <div className="event-feed">
          {items.map((report) => (
            <article key={report.reportId} className="event-card">
              <div className="opportunity-head">
                <div>
                  <p className="eyebrow">Validation report</p>
                  <strong>{report.regionFuzzy}</strong>
                  <p className="opportunity-subtitle">
                    Signal {report.signalKind} · confidence {(report.confidenceBps / 100).toFixed(0)}%
                  </p>
                </div>
                <StatusBadge label={statusLabel(report.status)} />
              </div>
              <div className="consensus-block">
                <div className="consensus-block__head">
                  <span>Trust level</span>
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
                  <span className="eyebrow">Signal</span>
                  <strong>{report.supportCount} support · {report.disputeCount} dispute</strong>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setExpanded((current) => (current === report.reportId ? null : report.reportId))
                  }
                >
                  View Details
                </button>
              </div>
              {expanded === report.reportId ? (
                <div className="stack compact">
                  <div className="stats-grid">
                    <div className="side-block">
                      <span className="eyebrow">Linked orders</span>
                      <strong>{report.linkedOrderCount}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">Validation score</span>
                      <strong>{report.validationScore}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">Review window</span>
                      <strong>
                        {Date.now() >= Number(report.expiresAtMs) ? "Ready" : "Open"}
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
                    Support
                  </button>
                  <button
                    type="button"
                    className="button tertiary"
                    disabled={!account?.address || isPending}
                    onClick={() => onAction(report.reportId, "dispute")}
                  >
                    Dispute
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={isPending || Date.now() < Number(report.expiresAtMs)}
                    onClick={() => onAction(report.reportId, "resolve")}
                  >
                    Resolve
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
              <p className="eyebrow">Latest alerts</p>
              <h3>Field signals</h3>
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
                <div className="stack compact">
                  <p className="muted">
                    {event.regionName} · {event.confidence}% confidence
                  </p>
                </div>
                <div className="card-footer">
                  <div className="card-footer__meta">
                    <span className="eyebrow">Best action</span>
                    <strong>
                      {event.recommendedContractType
                        ? contractTypeLabels[event.recommendedContractType]
                        : "Observe"}
                    </strong>
                  </div>
                  {event.recommendedContractType && event.resourceName ? (
                    <Link
                      href={`/contracts?type=${event.recommendedContractType}&resource=${encodeURIComponent(event.resourceName)}&region=${encodeURIComponent(event.regionName)}`}
                      className="button secondary"
                    >
                      Post order
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
