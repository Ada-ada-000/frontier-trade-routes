import { AppShell } from "../../components/app-shell";
import { HashScrollHandler } from "../../components/hash-scroll-handler";
import { TradeRoutesDashboard } from "../../components/trade-routes/trade-routes-dashboard";

export default function AppPage() {
  return (
    <AppShell showFooter={false} fullViewport>
      <HashScrollHandler />
      <TradeRoutesDashboard />
    </AppShell>
  );
}
