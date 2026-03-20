"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import {
  canAccept,
  canCancel,
  canComplete,
  deriveStatus,
  type ContractFormInput,
  mockContracts,
  type TradeRouteContract,
  type TransactionFeedback,
  validateContractInput,
} from "@eve/shared";
import {
  advanceOnchainContract,
  createOnchainContract,
  getExplorerUrl,
  getSuiPackageId,
  toContractNote,
} from "./sui";

const STORAGE_KEY = "frontier-trade-routes-contracts";

interface TradeRoutesContextValue {
  contracts: TradeRouteContract[];
  feedback: TransactionFeedback;
  busy: boolean;
  createContract(input: ContractFormInput): Promise<TradeRouteContract | null>;
  acceptContract(id: string): Promise<void>;
  completeContract(id: string): Promise<void>;
  cancelContract(id: string): Promise<void>;
  getContract(id: string): TradeRouteContract | undefined;
}

const TradeRoutesContext = createContext<TradeRoutesContextValue | null>(null);

function loadContracts(): TradeRouteContract[] {
  if (typeof window === "undefined") {
    return mockContracts;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return mockContracts;
  }

  try {
    return (JSON.parse(raw) as TradeRouteContract[]).map((contract) => ({
      ...contract,
      status: deriveStatus(contract),
    }));
  } catch {
    return mockContracts;
  }
}

function persistContracts(contracts: TradeRouteContract[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
}

function ensureWallet(address: string | undefined) {
  if (!address) {
    throw new Error("Wallet not connected.");
  }
}

function createFeedback(
  phase: TransactionFeedback["phase"],
  message: string,
  mode: TransactionFeedback["mode"],
  digest?: string,
): TransactionFeedback {
  return {
    phase,
    message,
    mode,
    digest,
    explorerUrl: digest ? getExplorerUrl(digest) : undefined,
  };
}

function successMessage(action: "accept" | "complete" | "cancel") {
  if (action === "accept") {
    return "Contract accepted successfully.";
  }

  if (action === "complete") {
    return "Contract completed successfully.";
  }

  return "Contract cancelled successfully.";
}

export function TradeRoutesProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [contracts, setContracts] = useState<TradeRouteContract[]>(mockContracts);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<TransactionFeedback>({
    phase: "idle",
    message: "",
    mode: "mock",
  });

  useEffect(() => {
    setContracts(loadContracts());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      persistContracts(contracts);
    }
  }, [contracts]);

  const syncContracts = (updater: (current: TradeRouteContract[]) => TradeRouteContract[]) => {
    setContracts((current) => updater(current).map((contract) => ({
      ...contract,
      status: deriveStatus(contract),
    })));
  };

  const createContract = useCallback(async (input: ContractFormInput) => {
    const validation = validateContractInput(input);
    if (!validation.ok) {
      setFeedback(createFeedback("error", validation.message ?? "Invalid form.", "mock"));
      return null;
    }

    try {
      ensureWallet(account?.address);
      setBusy(true);
      setFeedback(createFeedback("loading", "Creating contract...", "mock"));

      const base: TradeRouteContract = {
        id: crypto.randomUUID(),
        creator: account!.address,
        contractType: input.contractType,
        resource: input.resource.trim(),
        quantity: input.quantity,
        targetRegion: input.targetRegion.trim(),
        reward: input.reward,
        collateral: input.collateral ?? 0,
        expirationTimestamp: new Date(input.expirationTimestamp).toISOString(),
        createdAt: new Date().toISOString(),
        status: "open",
        source: getSuiPackageId() ? "sui" : "mock",
      };

      if (getSuiPackageId()) {
        const result = await createOnchainContract({
          input,
          signAndExecute,
          client,
        });
        base.objectId = result.objectId;
        base.txDigest = result.digest;
        base.note = toContractNote(base);
        syncContracts((current) => [base, ...current]);
        setFeedback(createFeedback("success", "Contract created on Sui.", "sui", result.digest));
        return base;
      }

      base.txDigest = `mock-${base.id}`;
      base.note = toContractNote(base);
      syncContracts((current) => [base, ...current]);
      setFeedback(
        createFeedback(
          "success",
          "Contract created in mock mode. Configure NEXT_PUBLIC_SUI_PACKAGE_ID for live writes.",
          "mock",
          base.txDigest,
        ),
      );
      return base;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transaction rejected or network failed.";
      setFeedback(createFeedback("error", message, getSuiPackageId() ? "sui" : "mock"));
      return null;
    } finally {
      setBusy(false);
    }
  }, [account, client, signAndExecute]);

  const mutateContract = useCallback(async (
    id: string,
    action: "accept" | "complete" | "cancel",
    update: (contract: TradeRouteContract, actor: string) => TradeRouteContract,
  ) => {
    const contract = contracts.find((item) => item.id === id);
    if (!contract) {
      setFeedback(createFeedback("error", "Contract not found.", "mock"));
      return;
    }

    try {
      ensureWallet(account?.address);

      const validation =
        action === "accept"
          ? canAccept(contract)
          : action === "complete"
            ? canComplete(contract)
            : canCancel(contract);

      if (!validation.ok) {
        setFeedback(createFeedback("error", validation.message ?? "Invalid transition.", "mock"));
        return;
      }

      if (action === "cancel" && account?.address !== contract.creator) {
        setFeedback(createFeedback("error", "Only the creator can cancel an open contract.", "mock"));
        return;
      }

      setBusy(true);
      setFeedback(createFeedback("loading", `Submitting ${action} transaction...`, "mock"));

      let digest = contract.txDigest;
      if (getSuiPackageId()) {
        if (!contract.objectId) {
          throw new Error("Missing onchain object id for this contract.");
        }

        const result = await advanceOnchainContract({
          action,
          objectId: contract.objectId,
          signAndExecute,
        });
        digest = result.digest;
      }

      syncContracts((current) =>
        current.map((item) =>
          item.id === id ? update({ ...item, txDigest: digest }, account!.address) : item,
        ),
      );
      setFeedback(
        createFeedback(
          "success",
          successMessage(action),
          getSuiPackageId() ? "sui" : "mock",
          digest,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transaction rejected or network failed.";
      setFeedback(createFeedback("error", message, getSuiPackageId() ? "sui" : "mock"));
    } finally {
      setBusy(false);
    }
  }, [account, contracts, signAndExecute]);

  const value = useMemo<TradeRoutesContextValue>(
    () => ({
      contracts,
      feedback,
      busy,
      async createContract(input) {
        return createContract(input);
      },
      async acceptContract(id) {
        return mutateContract(id, "accept", (contract, actor) => {
          const next = {
            ...contract,
            accepter: actor,
            acceptedAt: new Date().toISOString(),
            status: "accepted" as const,
          };

          return {
            ...next,
            note: toContractNote(next),
          };
        });
      },
      async completeContract(id) {
        return mutateContract(id, "complete", (contract) => {
          const next = {
            ...contract,
            completedAt: new Date().toISOString(),
            status: "completed" as const,
          };

          return {
            ...next,
            note: toContractNote(next),
          };
        });
      },
      async cancelContract(id) {
        return mutateContract(id, "cancel", (contract) => {
          const next = {
            ...contract,
            cancelledAt: new Date().toISOString(),
            status: "cancelled" as const,
          };

          return {
            ...next,
            note: toContractNote(next),
          };
        });
      },
      getContract(id) {
        return contracts.find((contract) => contract.id === id);
      },
    }),
    [busy, contracts, createContract, feedback, mutateContract],
  );

  return <TradeRoutesContext.Provider value={value}>{children}</TradeRoutesContext.Provider>;
}

export function useTradeRoutes() {
  const context = useContext(TradeRoutesContext);
  if (!context) {
    throw new Error("useTradeRoutes must be used inside TradeRoutesProvider.");
  }

  return context;
}
