import Link from "next/link";
import { AppShell } from "../../../components/app-shell";
import { ContractForm } from "../../../components/contract-form";
import { ContractsClientPage } from "../../contracts/page-client";
import { localizePath } from "../../../lib/i18n";

export default async function ContractsPageZh({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialType =
    params.type === "procure" || params.type === "deliver" ? params.type : undefined;
  const initialResource =
    typeof params.resource === "string" ? decodeURIComponent(params.resource) : undefined;
  const initialRegion =
    typeof params.region === "string" ? decodeURIComponent(params.region) : undefined;

  return (
    <AppShell locale="zh">
      <main className="page-stack">
        <section className="panel stack panel--subtle" id="contracts">
          <div className="section-head">
            <div>
              <p className="eyebrow">交易终端</p>
              <h1>订单</h1>
            </div>
            <Link href={localizePath("/app#bidding-pool", "zh")} className="button tertiary">
              返回主界面
            </Link>
          </div>
        </section>
        <div className="two-column">
          <ContractForm
            initialType={initialType}
            initialResource={initialResource}
            initialRegion={initialRegion}
            locale="zh"
          />
          <ContractsClientPage locale="zh" />
        </div>
      </main>
    </AppShell>
  );
}
