"use client";

import { formatMist, type InsurancePoolSnapshot, type OrderPublicView } from "../../lib/trade-routes/types";

export function InsurancePanel({
  insurancePool,
  orders,
}: {
  insurancePool: InsurancePoolSnapshot;
  orders: OrderPublicView[];
}) {
  const insuredOrders = orders.filter((order) => order.insured);
  const disputedOrders = orders.filter((order) => order.status === "disputed").length;

  return (
    <main className="page-stack">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Insurance Pool</p>
            <h1>Insurance pool</h1>
          </div>
          <div className="hero-badge">Capital / Recovery Loop</div>
        </div>
        <div className="metric-grid">
          <article className="metric-card">
            <p className="eyebrow">Capital</p>
            <strong>{formatMist(insurancePool.capitalMist)}</strong>
            <span>Available for payouts</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Premiums</p>
            <strong>{formatMist(insurancePool.totalPremiumsCollectedMist)}</strong>
            <span>Total fees collected</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Claims Paid</p>
            <strong>{formatMist(insurancePool.totalClaimsPaidMist)}</strong>
            <span>Historical compensation</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Recoveries</p>
            <strong>{formatMist(insurancePool.totalRecoveriesMist)}</strong>
            <span>Recovered from collateral</span>
          </article>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel stack" id="insurance">
          <div className="section-head">
            <div>
              <p className="eyebrow">Coverage Board</p>
              <h2>Current insured exposure</h2>
            </div>
          </div>
          <div className="table-stack">
            {insuredOrders.map((order) => (
              <article key={order.orderId} className="table-card">
                <div className="table-card__header">
                  <div>
                    <p className="eyebrow">Order #{order.orderId}</p>
                    <strong>{order.cargoHint}</strong>
                  </div>
                  <span className="status-pill is-transit">{order.status}</span>
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
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="section-head">
            <div>
              <p className="eyebrow">Flow</p>
              <h2>Recovery flow</h2>
            </div>
          </div>
          <div className="table-stack">
            <article className="table-card">
              <div className="table-card__header">
                <strong>1. Buyer buys coverage</strong>
                <span className="status-pill is-open">{insuredOrders.length} insured</span>
              </div>
              <p className="muted">Premium enters the pool.</p>
            </article>
            <article className="table-card">
              <div className="table-card__header">
                <strong>2. Arbitration or timeout triggers claim</strong>
                <span className="status-pill is-disputed">{disputedOrders} disputed</span>
              </div>
              <p className="muted">Pool pays the buyer first.</p>
            </article>
            <article className="table-card">
              <div className="table-card__header">
                <strong>3. Slashing and recovery</strong>
                <span className="status-pill is-assigned">Recovery loop</span>
              </div>
              <p className="muted">Seller stake routes back into the pool.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
