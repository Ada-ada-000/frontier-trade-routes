"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMist, type InsurancePoolSnapshot, type OrderPublicView } from "../../lib/trade-routes/types";
import { MetricCard } from "../ui/metric-card";
import { StatusBadge } from "../ui/status-badge";

export function InsurancePanel({
  insurancePool,
  orders,
  commissionScheduleBps,
}: {
  insurancePool: InsurancePoolSnapshot;
  orders: OrderPublicView[];
  commissionScheduleBps: Record<string, number>;
}) {
  const insuredOrders = orders.filter((order) => order.insured);
  const uninsuredOrders = orders.filter((order) => !order.insured);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState<"needs" | "covered" | "all">("needs");

  const visibleOrders =
    view === "needs" ? uninsuredOrders : view === "covered" ? insuredOrders : orders;

  const sortedVisibleOrders = [...visibleOrders].sort(
    (left, right) => Number(right.rewardBudgetMist) - Number(left.rewardBudgetMist),
  );
  const suggestedOrder = sortedVisibleOrders[0];

  return (
    <main className="page-stack">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Insurance</p>
            <h1>Protect the routes that matter most</h1>
          </div>
          <div className="button-row">
            <Link href="/contracts" className="button secondary">
              Open Orders
            </Link>
            <button
              type="button"
              className="button tertiary"
              onClick={() => setShowHistory((current) => !current)}
            >
              {showHistory ? "Hide details" : "How it Works"}
            </button>
          </div>
        </div>
        <div className="quick-guide">
          <div className="quick-guide__copy">
            <strong>
              Start with the biggest uncovered route{suggestedOrder ? `: ${suggestedOrder.cargoHint}` : ""}.
            </strong>
            <p className="muted">
              Use coverage on expensive or unstable runs first. Covered routes are already protected.
            </p>
          </div>
          <div className="button-row action-row">
            <button type="button" className="button primary" onClick={() => setView("needs")}>
              Review Uncovered
            </button>
            <Link href="/contracts" className="button secondary">
              Open Orders
            </Link>
          </div>
        </div>
        <div className="metric-grid">
          <MetricCard
            label="Pool Size"
            value={formatMist(insurancePool.capitalMist)}
            note="Available for protected routes"
          />
          <MetricCard
            label="Coverage Fee"
            value={`${(commissionScheduleBps.silver / 100).toFixed(1)}%`}
            note="Typical protected run fee"
          />
          <MetricCard label="Covered Routes" value={`${insuredOrders.length}`} note="Already protected" />
          <MetricCard
            label="Needs Coverage"
            value={`${uninsuredOrders.length}`}
            note="Routes still exposed"
          />
        </div>
        {showHistory ? (
          <div className="accordion-content">
            <div className="stats-grid">
              <div className="side-block">
                <span className="eyebrow">Claims History</span>
                <strong>{formatMist(insurancePool.totalClaimsPaidMist)}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">Recovered Funds</span>
                <strong>{formatMist(insurancePool.totalRecoveriesMist)}</strong>
              </div>
            </div>
            <p className="muted">Coverage pays first. If a carrier fails, bonded funds can be recovered after review.</p>
          </div>
        ) : null}
      </section>

      <div className="insurance-grid">
        <section className="panel stack insurance-primary" id="insurance">
          <div className="section-head">
            <div>
              <p className="eyebrow">Coverage Board</p>
              <h2>Protect live routes</h2>
            </div>
            <div className="segmented-control" role="tablist" aria-label="Coverage filters">
              {[
                { id: "needs", label: "Needs coverage" },
                { id: "covered", label: "Covered" },
                { id: "all", label: "All routes" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`segmented-control__item ${view === option.id ? "is-active" : ""}`}
                  onClick={() => setView(option.id as typeof view)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="coverage-list">
            {sortedVisibleOrders.map((order) => (
              <article key={order.orderId} className="table-card">
                <div className="table-card__header">
                  <div>
                    <p className="eyebrow">Order #{order.orderId}</p>
                    <strong>{order.cargoHint}</strong>
                  </div>
                  <StatusBadge label={order.insured ? "Covered" : "Uncovered"} />
                </div>
                <div className="stats-grid">
                  <div className="side-block">
                    <span className="eyebrow">Origin</span>
                    <strong>{order.originFuzzy}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">Destination</span>
                    <strong>{order.destinationFuzzy}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">Budget</span>
                    <strong>{formatMist(order.rewardBudgetMist)}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">Stake</span>
                    <strong>{formatMist(order.requiredStakeMist)}</strong>
                  </div>
                </div>
                <div className="card-actions">
                  {!order.insured ? (
                    <button type="button" className="button primary">
                      Buy Coverage
                    </button>
                  ) : (
                    <Link href="/contracts" className="button secondary">
                      View Route
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel stack insurance-rail">
          <section className="insurance-rail__section">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Coverage Rates</p>
                <h2>Premium ladder</h2>
              </div>
            </div>
            <div className="insurance-rate-grid">
              <div className="side-block">
                <span className="eyebrow">Silver</span>
                <strong>{(commissionScheduleBps.silver / 100).toFixed(1)}%</strong>
                <span className="subtle">Starter lanes</span>
              </div>
              <div className="side-block">
                <span className="eyebrow">Gold</span>
                <strong>{(commissionScheduleBps.gold / 100).toFixed(1)}%</strong>
                <span className="subtle">Stable carriers</span>
              </div>
              <div className="side-block">
                <span className="eyebrow">Elite</span>
                <strong>{(commissionScheduleBps.elite / 100).toFixed(1)}%</strong>
                <span className="subtle">Best pricing</span>
              </div>
            </div>
          </section>

          <section className="insurance-rail__section">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Pool Activity</p>
                <h2>Capital flow</h2>
              </div>
            </div>
            <div className="stats-grid insurance-stats-grid">
              <div className="side-block">
                <span className="eyebrow">Premiums</span>
                <strong>{formatMist(insurancePool.totalPremiumsCollectedMist)}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">Claims</span>
                <strong>{formatMist(insurancePool.totalClaimsPaidMist)}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">Recoveries</span>
                <strong>{formatMist(insurancePool.totalRecoveriesMist)}</strong>
              </div>
            </div>
          </section>

          <section className="insurance-rail__section insurance-rail__section--grow">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Action Guide</p>
                <h2>When to buy</h2>
              </div>
            </div>
            <div className="table-card insurance-note-card">
              <div className="stack compact">
                <strong>Protect high-value or unstable runs first</strong>
                <p className="muted">
                  Prioritize routes with larger stakes, longer lanes, or weaker local stability.
                </p>
                <div className="button-row action-row">
                  <Link href="/contracts" className="button primary">
                    Review Routes
                  </Link>
                  <Link href="/app/reputation" className="button secondary">
                    Improve Rate
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
