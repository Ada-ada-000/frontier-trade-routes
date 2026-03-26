import { AppShell } from "../../../components/app-shell";
import { ReputationPanel } from "../../../components/trade-routes/reputation-panel";
import { getTradeRoutesSnapshot } from "../../../lib/trade-routes/server-data";

export default async function ReputationPage() {
  const snapshot = await getTradeRoutesSnapshot();

  return (
    <AppShell>
      <ReputationPanel profiles={snapshot.profiles} tierPolicies={snapshot.tierPolicies} />
    </AppShell>
  );
}
