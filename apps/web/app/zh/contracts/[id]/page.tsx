import { AppShell } from "../../../../components/app-shell";
import { ContractDetail } from "../../../contracts/[id]/page-client";

export default async function ContractDetailPageZh({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell locale="zh">
      <ContractDetail id={id} locale="zh" />
    </AppShell>
  );
}
