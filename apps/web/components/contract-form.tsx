"use client";

import { useState } from "react";
import type { ContractFormInput, ContractType } from "@eve/shared";
import { useTradeRoutes } from "../lib/trade-routes-context";

function defaultExpirationInput() {
  const value = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

const defaultForm: ContractFormInput = {
  contractType: "procure",
  resource: "",
  quantity: 100,
  targetRegion: "",
  reward: 50,
  collateral: 0,
  expirationTimestamp: defaultExpirationInput(),
};

function buildInitialForm(
  initialType?: ContractType,
  initialResource?: string,
  initialRegion?: string,
): ContractFormInput {
  return {
    ...defaultForm,
    contractType: initialType ?? defaultForm.contractType,
    resource: initialResource ?? defaultForm.resource,
    targetRegion: initialRegion ?? defaultForm.targetRegion,
    expirationTimestamp: defaultExpirationInput(),
  };
}

export function ContractForm({
  initialType,
  initialResource,
  initialRegion,
}: {
  initialType?: ContractType;
  initialResource?: string;
  initialRegion?: string;
}) {
  const { createContract, feedback, busy } = useTradeRoutes();
  const [form, setForm] = useState<ContractFormInput>(
    buildInitialForm(initialType, initialResource, initialRegion),
  );

  function updateField<K extends keyof ContractFormInput>(key: K, value: ContractFormInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await createContract(form);
    if (created) {
      setForm(buildInitialForm(initialType, initialResource, initialRegion));
    }
  }

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Create</p>
          <h2>New frontier contract</h2>
        </div>
        <span className="subtle">Wallet gated. Writes to Sui when package id is configured.</span>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          <span>Contract type</span>
          <select
            value={form.contractType}
            onChange={(event) =>
              updateField("contractType", event.target.value as ContractType)
            }
          >
            <option value="procure">procure</option>
            <option value="deliver">deliver</option>
          </select>
        </label>
        <label>
          <span>Resource</span>
          <input
            value={form.resource}
            onChange={(event) => updateField("resource", event.target.value)}
            placeholder="Rare Alloy"
          />
        </label>
        <label>
          <span>Quantity</span>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(event) => updateField("quantity", Number(event.target.value))}
          />
        </label>
        <label>
          <span>Target region</span>
          <input
            value={form.targetRegion}
            onChange={(event) => updateField("targetRegion", event.target.value)}
            placeholder="Outer Ring"
          />
        </label>
        <label>
          <span>Reward (SUI)</span>
          <input
            type="number"
            min="1"
            value={form.reward}
            onChange={(event) => updateField("reward", Number(event.target.value))}
          />
        </label>
        <label>
          <span>Optional collateral</span>
          <input
            type="number"
            min="0"
            value={form.collateral ?? 0}
            onChange={(event) => updateField("collateral", Number(event.target.value))}
          />
        </label>
        <label className="full-width">
          <span>Expiration</span>
          <input
            type="datetime-local"
            value={form.expirationTimestamp}
            onChange={(event) => updateField("expirationTimestamp", event.target.value)}
          />
        </label>
        <button type="submit" className="button primary" disabled={busy}>
          {busy ? "Submitting..." : "Create contract"}
        </button>
      </form>
      {feedback.message ? (
        <div className={`feedback ${feedback.phase}`}>
          <p>{feedback.message}</p>
          {feedback.explorerUrl ? (
            <a href={feedback.explorerUrl} target="_blank" rel="noreferrer">
              View transaction
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
