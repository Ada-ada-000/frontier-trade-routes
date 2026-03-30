"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { localizePath, type AppLocale } from "../../lib/i18n";
import { HeatmapLayer } from "./heatmap-layer";
import { StakeModal } from "./stake-modal";
import { useTradeRoutes } from "../../lib/trade-routes/use-trade-routes";
import { formatMist, type OrderPublicView } from "../../lib/trade-routes/types";
import { StatusBadge } from "../ui/status-badge";
import { mapPoints } from "../../lib/trade-routes/map-scene";
import { OrderList } from "./order-list";

function sumStake(orders: OrderPublicView[]) {
  return orders.reduce((total, order) => total + Number(order.requiredStakeMist), 0);
}

function formatDeadline(value: string) {
  return new Date(Number(value)).toLocaleDateString();
}

export function TradeRoutesDashboard({ locale = "en" }: { locale?: AppLocale }) {
  const router = useRouter();
  const account = useCurrentAccount();
  const tradeRoutes = useTradeRoutes();
  const [selectedOrder, setSelectedOrder] = useState<OrderPublicView | undefined>();
  const [activeRegion, setActiveRegion] = useState("");
  const isZh = locale === "zh";

  const metrics = useMemo(() => {
    const openOrders = tradeRoutes.orders.filter((order) => order.status === "open").length;
    const insured = tradeRoutes.orders.filter((order) => order.insured).length;
    const totalStake = sumStake(tradeRoutes.orders) / 1_000_000_000;

    return { openOrders, insured, totalStake };
  }, [tradeRoutes.orders]);

  const filteredOrders = useMemo(() => {
    if (!activeRegion) {
      return [];
    }

    return tradeRoutes.orders.filter(
      (order) => order.originFuzzy === activeRegion || order.destinationFuzzy === activeRegion,
    );
  }, [activeRegion, tradeRoutes.orders]);

  const activeSummary = useMemo(() => {
    if (!activeRegion) {
      return null;
    }
    const relatedOrders = filteredOrders;
    const insuredRoutes = relatedOrders.filter((order) => order.insured).length;
    const rewardTotal = relatedOrders.reduce(
      (sum, order) => sum + Number(order.rewardBudgetMist) / 1_000_000_000,
      0,
    );
    return {
      routes: relatedOrders.length,
      insuredRoutes,
      rewardTotal,
    };
  }, [activeRegion, filteredOrders]);

  const activeSystem = useMemo(
    () => mapPoints.find((point) => point.id === activeRegion && point.kind === "region"),
    [activeRegion],
  );

  return (
    <>
      <section className="operations-screen" id="overview">
        <HeatmapLayer
          data={tradeRoutes.heatmap}
          activeRegion={activeRegion || undefined}
          onSelectRegion={(regionName) => setActiveRegion(regionName)}
          metrics={metrics}
          locale={locale}
          overlay={
            <aside className={`route-drawer ${activeRegion ? "is-open" : ""}`} aria-hidden={!activeRegion}>
              <div className="route-drawer__head">
                <div>
                  <p className="eyebrow">Frontier system</p>
                  <h2>{activeRegion || "System Orders"}</h2>
                </div>
                <div className="button-group">
                  {activeSystem ? (
                    <a
                      className="button tertiary"
                      href={`https://ef-map.com/solar-system/${activeSystem.solarSystemId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {isZh ? "查看星图" : "Frontier Map"}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="button tertiary"
                    onClick={() => router.push(localizePath(`/opportunities#intel`, locale))}
                  >
                    {isZh ? "打开情报" : "Open Intel"}
                  </button>
                  <button type="button" className="button tertiary" onClick={() => setActiveRegion("")}>
                    {isZh ? "关闭" : "Close"}
                  </button>
                </div>
              </div>

              <div className="route-drawer__body">
                {filteredOrders.length === 0 ? (
                  <div className="route-drawer__empty">
                    <strong>{isZh ? "当前没有可见航线" : "No visible routes"}</strong>
                    <div className="button-group route-drawer__actions">
                      <button
                        type="button"
                        className="button tertiary"
                        onClick={() => router.push(localizePath(`/opportunities#intel`, locale))}
                      >
                        {isZh ? "打开情报" : "Open Intel"}
                      </button>
                      <button type="button" className="button tertiary" onClick={() => setActiveRegion("")}>
                        {isZh ? "返回热力图" : "Back to Heatmap"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeSummary ? (
                      <article className="route-drawer__card route-drawer__card--summary">
                        <div className="route-drawer__grid">
                          <div className="side-block">
                            <span className="eyebrow">{isZh ? "可见航线" : "Visible routes"}</span>
                            <strong>{activeSummary.routes}</strong>
                          </div>
                          <div className="side-block">
                            <span className="eyebrow">{isZh ? "已投保任务" : "Protected jobs"}</span>
                            <strong>{activeSummary.insuredRoutes}</strong>
                          </div>
                          <div className="side-block">
                            <span className="eyebrow">{isZh ? "奖励规模" : "Reward volume"}</span>
                            <strong>{activeSummary.rewardTotal.toFixed(0)} SUI</strong>
                          </div>
                        </div>
                        <div className="button-group route-drawer__actions">
                          <button
                            type="button"
                            className="button tertiary"
                            onClick={() =>
                              router.push(localizePath(`/contracts?region=${encodeURIComponent(activeRegion)}`, locale))
                            }
                          >
                            {isZh ? "查看订单" : "Open Orders"}
                          </button>
                          <button
                            type="button"
                            className="button tertiary"
                            onClick={() =>
                              router.push(
                                localizePath(
                                  `/contracts?region=${encodeURIComponent(activeRegion)}&intent=deliver`,
                                  locale,
                                ),
                              )
                            }
                          >
                            {isZh ? "为该区域发单" : "Post for this system"}
                          </button>
                        </div>
                      </article>
                    ) : null}

                    <OrderList
                      orders={filteredOrders}
                      walletConnected={Boolean(account?.address)}
                      locale={locale}
                      onAccept={(order) => setSelectedOrder(order)}
                    />
                  </>
                )}
              </div>
            </aside>
          }
        />
      </section>

      <StakeModal
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        coins={tradeRoutes.ownedCoins}
        busy={tradeRoutes.isAccepting}
        error={tradeRoutes.acceptError}
        locale={locale}
        onClose={() => setSelectedOrder(undefined)}
        onConfirm={async (input) => {
          await tradeRoutes.acceptOrder(input);
          setSelectedOrder(undefined);
        }}
      />
    </>
  );
}
