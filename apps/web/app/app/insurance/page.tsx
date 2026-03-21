import { AppShell } from "../../../components/app-shell";
import { InsurancePanel } from "../../../components/trade-routes/insurance-panel";
import { mockInsurancePool, mockOrders } from "../../../lib/trade-routes/mock-data";

export default function InsurancePage() {
  return (
    <AppShell>
      <InsurancePanel insurancePool={mockInsurancePool} orders={mockOrders} />
    </AppShell>
  );
}
