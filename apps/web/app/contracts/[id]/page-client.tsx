"use client";

import Link from "next/link";
import { localizePath, type AppLocale } from "../../../lib/i18n";
import { useTradeRoutes } from "../../../lib/trade-routes-context";
import { ContractActions } from "../../../components/contract-actions";
import { StatusBadge } from "../../../components/ui/status-badge";

function localizeContractType(type: string, locale: AppLocale) {
  if (locale !== "zh") return type;
  return type === "procure" ? "采购" : type === "deliver" ? "运输" : type;
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

function row(label: string, value?: string | number) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

export function ContractDetail({ id, locale = "en" }: { id: string; locale?: AppLocale }) {
  const isZh = locale === "zh";
  const { getContract } = useTradeRoutes();
  const contract = getContract(id);

  if (!contract) {
    return (
      <main className="page-stack">
        <section className="panel stack">
          <p className="eyebrow">{isZh ? "订单缺失" : "Missing order"}</p>
          <h1>{isZh ? "没有找到这条订单" : "Order not found"}</h1>
          <Link href={localizePath("/contracts", locale)} className="button secondary">
            {isZh ? "返回订单页" : "Back to orders"}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">{isZh ? "订单详情" : "Order detail"}</p>
            <h1>{contract.resource}</h1>
          </div>
          <StatusBadge label={localizeContractStatus(contract.status, locale)} />
        </div>
        <dl className="detail-grid">
          {row(isZh ? "发布者" : "Requester", contract.creator)}
          {row(isZh ? "承运人" : "Assigned Carrier", contract.accepter)}
          {row(isZh ? "类型" : "Type", localizeContractType(contract.contractType, locale))}
          {row(isZh ? "数量" : "Quantity", contract.quantity)}
          {row(isZh ? "目标区域" : "Target region", contract.targetRegion)}
          {row(isZh ? "奖励" : "Reward", `${contract.reward} SUI`)}
          {row(isZh ? "质押" : "Bond", `${contract.collateral} SUI`)}
          {row(isZh ? "截止时间" : "Deadline", contract.expirationTimestamp)}
          {row(isZh ? "创建时间" : "Created", contract.createdAt)}
          {row(isZh ? "接单时间" : "Accepted", contract.acceptedAt)}
          {row(isZh ? "完成时间" : "Completed", contract.completedAt)}
          {row(isZh ? "取消时间" : "Cancelled", contract.cancelledAt)}
          {row(isZh ? "链上记录" : "Activity", contract.txDigest)}
        </dl>
        {contract.note ? <div className="feedback success">{contract.note}</div> : null}
      </section>
      <ContractActions contract={contract} locale={locale} />
    </main>
  );
}
