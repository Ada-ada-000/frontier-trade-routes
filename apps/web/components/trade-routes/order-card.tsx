"use client";

import { useRouter } from "next/navigation";
import { localizePath, type AppLocale } from "../../lib/i18n";
import {
  formatMist,
  formatStatus,
  type OrderPublicView,
} from "../../lib/trade-routes/types";

function statusTone(status: OrderPublicView["status"]) {
  if (status === "completed") {
    return "is-completed";
  }
  if (status === "in_transit") {
    return "is-transit";
  }
  if (status === "assigned") {
    return "is-assigned";
  }
  if (status === "disputed") {
    return "is-disputed";
  }
  return "is-open";
}

function progressMeta(order: OrderPublicView, locale: "en" | "zh") {
  const isZh = locale === "zh";

  if (order.status === "completed" || order.stage === "delivered") {
    return {
      value: 100,
      rangeLabel: isZh ? "100%" : "100%",
      title: isZh ? "已完成交付" : "Delivered",
      note: isZh ? "货物已送达并完成结算。" : "Cargo delivered and settled.",
    };
  }

  if (order.status === "disputed") {
    return {
      value: 88,
      rangeLabel: isZh ? "75% - 100%" : "75% - 100%",
      title: isZh ? "等待争议处理" : "Awaiting dispute resolution",
      note: isZh ? "运输已接近尾声，但结算被争议暂时锁住。" : "Route is near completion, but settlement is paused by a dispute.",
    };
  }

  if (order.stage === "destination_revealed" || order.status === "in_transit") {
    return {
      value: 74,
      rangeLabel: isZh ? "50% - 75%" : "50% - 75%",
      title: isZh ? "运输中" : "In transit",
      note: isZh ? "已确认取货，正在前往目标区域。" : "Pickup is confirmed and the route is moving toward the destination region.",
    };
  }

  if (order.stage === "pickup_revealed" || order.status === "assigned") {
    return {
      value: 38,
      rangeLabel: isZh ? "25% - 50%" : "25% - 50%",
      title: isZh ? "前往取货" : "Heading to pickup",
      note: isZh ? "已分配承运人，平台仅揭示取货点。" : "A carrier is assigned and only the pickup leg is visible.",
    };
  }

  return {
    value: 12,
    rangeLabel: isZh ? "0% - 25%" : "0% - 25%",
    title: isZh ? "等待承接" : "Awaiting carrier",
    note: isZh ? "订单已发布，正在等待合适的承运人接单。" : "The route is open and waiting for a qualified carrier.",
  };
}

export function OrderCard({
  order,
  walletConnected,
  locale = "en",
  onAccept,
}: {
  order: OrderPublicView;
  walletConnected: boolean;
  locale?: AppLocale;
  onAccept(order: OrderPublicView): void;
}) {
  const router = useRouter();
  const isZh = locale === "zh";
  const progress = progressMeta(order, locale);

  function handlePrimaryAction() {
    if (order.status === "open") {
      onAccept(order);
      return;
    }

    router.push(localizePath("/contracts#contracts", locale));
  }

  const actionLabel = !walletConnected
    ? isZh ? "连接钱包并接单" : "Connect Wallet"
    : order.status === "open"
      ? isZh ? "接受订单" : "Accept Order"
      : isZh ? "查看流程" : "View Flow";

  const stageLabel =
    order.stage === "pickup_revealed"
      ? isZh ? "📍 已揭示取货点" : "📍 Pickup Revealed"
      : order.stage === "destination_revealed"
        ? isZh ? "🎯 已揭示终点" : "🎯 Dest. Revealed"
        : order.stage === "delivered"
          ? isZh ? "✅ 已完成" : "✅ Delivered"
          : isZh ? "🔒 未揭示" : "🔒 Hidden";

  return (
    <article className={`order-card ${statusTone(order.status)}`}>
      <div className="order-card__main">
        <div className="order-card__header">
          <div>
            <p className="eyebrow">{isZh ? `订单 / ${order.orderId}` : `Order / ${order.orderId}`}</p>
            <h3>{order.cargoHint}</h3>
          </div>
          <div className="order-card__flags">
            {order.insured ? <span className="flag flag--insured">{isZh ? "已投保" : "Insured"}</span> : null}
            <span className={`status-pill ${statusTone(order.status)}`}>{isZh ? (
              order.status === "assigned"
                ? "已接单"
                : order.status === "in_transit"
                  ? "运输中"
                  : order.status === "completed"
                    ? "已完成"
                    : order.status === "disputed"
                      ? "争议中"
                      : "开放中"
            ) : formatStatus(order.status)}</span>
          </div>
        </div>

        <div className="route-band">
          <div>
            <span className="eyebrow">{isZh ? "起点区域" : "Origin band"}</span>
            <strong>{order.originFuzzy}</strong>
          </div>
          <span className="route-band__arrow" />
          <div>
            <span className="eyebrow">{isZh ? "终点区域" : "Destination band"}</span>
            <strong>{order.destinationFuzzy}</strong>
          </div>
        </div>

        <div className="route-progress" aria-label={isZh ? "运输进度" : "Route progress"}>
          <div className="route-progress__head">
            <div>
              <span className="eyebrow">{isZh ? "运输进度" : "Route Progress"}</span>
              <strong>{progress.title}</strong>
            </div>
            <span className="route-progress__range">{progress.rangeLabel}</span>
          </div>
          <div className="route-progress__track" role="progressbar" aria-valuenow={progress.value} aria-valuemin={0} aria-valuemax={100}>
            <div className="route-progress__fill" style={{ width: `${progress.value}%` }} />
          </div>
          <p className="subtle">{progress.note}</p>
        </div>

        <div className="order-metrics">
          <div className="metric-cell">
            <span className="eyebrow">{isZh ? "奖励" : "Reward"}</span>
            <strong>{formatMist(order.rewardBudgetMist)}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">{isZh ? "质押" : "Stake Lock"}</span>
            <strong>{formatMist(order.requiredStakeMist)}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow" title={isZh ? "所需声誉" : "Reputation Required"}>{isZh ? "最低声誉" : "Min Rep"}</span>
            <strong>{order.minReputationScore}</strong>
          </div>
          <div className="metric-cell">
            <span className="eyebrow">{isZh ? "阶段" : "Stage"}</span>
            <strong>{stageLabel}</strong>
          </div>
        </div>
      </div>

      <aside className="order-card__side">
        <div className="side-block">
          <span className="eyebrow">{isZh ? "截止时间" : "Deadline"}</span>
          <strong>{new Date(Number(order.deadlineMs)).toLocaleDateString()}</strong>
        </div>
        <div className="side-block">
          <span className="eyebrow">{isZh ? "模式" : "Mode"}</span>
          <strong>{isZh ? (order.orderMode === "urgent" ? "急单" : "竞价") : order.orderMode}</strong>
        </div>
        <button
          type="button"
          className="button primary"
          onClick={handlePrimaryAction}
          title={
            !walletConnected
              ? isZh ? "打开弹窗后可直接连接钱包并选择 SUI 质押 coin。" : "Open the panel to connect your wallet and pick a SUI stake coin."
              : order.status === "open"
                ? isZh ? "锁定质押并接受这条航线。" : "Lock stake and accept this route."
                : isZh ? "打开订单流程查看当前进度。" : "Open the order flow to review progress."
          }
        >
          {actionLabel}
        </button>
      </aside>
    </article>
  );
}
