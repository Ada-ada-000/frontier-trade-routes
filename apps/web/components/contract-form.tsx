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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
          <p className="eyebrow">Post Order</p>
          <h2>Create a route request</h2>
        </div>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="full-width">
          <span>Order type</span>
          <div className="toggle-grid">
            {([
              ["procure", "📥 Procure", "Source a resource into a market"],
              ["deliver", "📤 Deliver", "Move cargo into a target region"],
            ] as const).map(([value, label, note]) => (
              <button
                key={value}
                type="button"
                className={`toggle-card ${form.contractType === value ? "is-active" : ""}`}
                onClick={() => updateField("contractType", value as ContractType)}
              >
                <strong>{label}</strong>
                <span>{note}</span>
              </button>
            ))}
          </div>
        </div>
        <label>
          <span>Resource</span>
          <input
            value={form.resource}
            onChange={(event) => updateField("resource", event.target.value)}
            placeholder="Rare Alloy · try O3H-1FN or EH1-FQC"
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
            placeholder="O3H-1FN · hotspot routes suggest EH1-FQC"
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
        <div className="full-width accordion-panel">
          <button
            type="button"
            className="accordion-toggle"
            onClick={() => setShowAdvanced((current) => !current)}
          >
            <span>Advanced Settings</span>
            <span>{showAdvanced ? "−" : "+"}</span>
          </button>
          {showAdvanced ? (
            <div className="accordion-content">
              <label>
                <span>Bond</span>
                <input
                  type="number"
                  min="0"
                  value={form.collateral ?? 0}
                  onChange={(event) => updateField("collateral", Number(event.target.value))}
                />
              </label>
              <label>
                <span>Deadline</span>
                <input
                  type="datetime-local"
                  value={form.expirationTimestamp}
                  onChange={(event) => updateField("expirationTimestamp", event.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
        <button type="submit" className="button primary" disabled={busy}>
          {busy ? "Posting..." : "Post Order"}
        </button>
      </form>
      {feedback.message ? (
        <div className={`feedback ${feedback.phase}`}>
          <p>{feedback.message}</p>
          {feedback.explorerUrl ? (
            <a href={feedback.explorerUrl} target="_blank" rel="noreferrer">
              View activity
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
