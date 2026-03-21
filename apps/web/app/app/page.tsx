import { AppShell } from "../../components/app-shell";
import { TradeRoutesDashboard } from "../../components/trade-routes/trade-routes-dashboard";

export default function AppPage() {
  return (
    <AppShell>
      <TradeRoutesDashboard />
    </AppShell>
  );
}
