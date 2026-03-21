import { AppShell } from "../../../components/app-shell";
import { ReputationPanel } from "../../../components/trade-routes/reputation-panel";
import { mockReputationProfiles } from "../../../lib/trade-routes/mock-data";

export default function ReputationPage() {
  return (
    <AppShell>
      <ReputationPanel profiles={mockReputationProfiles} />
    </AppShell>
  );
}
