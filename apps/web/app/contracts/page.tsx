import { AppShell } from "../../components/app-shell";
import { ContractForm } from "../../components/contract-form";
import { ContractsClientPage } from "./page-client";

export default async function ContractsPage({
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
    <AppShell>
      <main className="page-stack">
        <section className="panel stack" id="contracts">
          <div className="section-head">
            <div>
              <p className="eyebrow">Contracts</p>
              <h1>Publish and fulfill contracts</h1>
            </div>
            <p className="muted narrow">
              Create a small verifiable contract and track the full lifecycle in the UI.
            </p>
          </div>
        </section>
        <div className="two-column">
          <ContractForm
            initialType={initialType}
            initialResource={initialResource}
            initialRegion={initialRegion}
          />
          <ContractsClientPage />
        </div>
      </main>
    </AppShell>
  );
}
