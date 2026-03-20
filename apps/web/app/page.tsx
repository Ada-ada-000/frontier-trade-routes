import { AppShell } from "../components/app-shell";
import { TradeRoutesDashboard } from "../components/trade-routes/trade-routes-dashboard";

export default function HomePage() {
  return (
    <AppShell>
      <TradeRoutesDashboard />
    </AppShell>
  );
}
