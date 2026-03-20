"use client";

import { Transaction } from "@mysten/sui/transactions";
import type { ContractFormInput, ContractType, TradeRouteContract } from "@eve/shared";

const CLOCK_OBJECT_ID = "0x6";

type SignAndExecuteFn = (input: { transaction: Transaction }) => Promise<{ digest: string }>;
type WaitForTransactionClient = {
  waitForTransaction(input: {
    digest: string;
    options?: {
      showObjectChanges?: boolean;
    };
  }): Promise<{
    objectChanges?: Array<{
      type?: string;
      objectId?: string;
    }> | null;
  }>;
};

function typeToCode(type: ContractType): number {
  return type === "procure" ? 0 : 1;
}

function toMist(value: number): number {
  return Math.round(value * 1_000_000_000);
}

export function getSuiPackageId() {
  return process.env.NEXT_PUBLIC_SUI_PACKAGE_ID;
}

export function getExplorerUrl(digest: string) {
  return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
}

async function resolveCreatedObjectId(client: WaitForTransactionClient, digest: string) {
  const tx = await client.waitForTransaction({
    digest,
    options: {
      showObjectChanges: true,
    },
  });

  return tx.objectChanges?.find((change) => change.type === "created")?.objectId;
}

export async function createOnchainContract(args: {
  input: ContractFormInput;
  signAndExecute: SignAndExecuteFn;
  client: WaitForTransactionClient;
}) {
  const packageId = getSuiPackageId();
  if (!packageId) {
    throw new Error("NEXT_PUBLIC_SUI_PACKAGE_ID is not set.");
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::trade_routes::create_contract`,
    arguments: [
      tx.pure.u8(typeToCode(args.input.contractType)),
      tx.pure.string(args.input.resource),
      tx.pure.u64(args.input.quantity),
      tx.pure.string(args.input.targetRegion),
      tx.pure.u64(toMist(args.input.reward)),
      tx.pure.u64(toMist(args.input.collateral ?? 0)),
      tx.pure.u64(new Date(args.input.expirationTimestamp).getTime()),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  const result = await args.signAndExecute({ transaction: tx });
  const objectId = await resolveCreatedObjectId(args.client, result.digest);

  return {
    digest: result.digest,
    objectId,
  };
}

export async function advanceOnchainContract(args: {
  action: "accept" | "complete" | "cancel";
  objectId: string;
  signAndExecute: SignAndExecuteFn;
}) {
  const packageId = getSuiPackageId();
  if (!packageId) {
    throw new Error("NEXT_PUBLIC_SUI_PACKAGE_ID is not set.");
  }

  const tx = new Transaction();
  const target =
    args.action === "accept"
      ? `${packageId}::trade_routes::accept_contract`
      : args.action === "complete"
        ? `${packageId}::trade_routes::complete_contract`
        : `${packageId}::trade_routes::cancel_contract`;

  tx.moveCall({
    target,
    arguments: [tx.object(args.objectId), tx.object(CLOCK_OBJECT_ID)],
  });

  const result = await args.signAndExecute({ transaction: tx });
  return {
    digest: result.digest,
  };
}

export function toContractNote(contract: TradeRouteContract) {
  return contract.source === "sui"
    ? "State is mirrored from the local UI and anchored by a Sui transaction."
    : "Running in mock mode until a package id is configured.";
}
