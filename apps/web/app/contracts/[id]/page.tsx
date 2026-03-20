import { AppShell } from "../../../components/app-shell";
import { ContractDetail } from "./page-client";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <ContractDetail id={id} />
    </AppShell>
  );
}
