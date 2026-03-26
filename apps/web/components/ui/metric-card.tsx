"use client";

import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  accent?: ReactNode;
}) {
  return (
    <article className="metric-card metric-card--ui">
      <div className="metric-card__topline">
        <p className="eyebrow">{label}</p>
        {accent ? <span className="subtle">{accent}</span> : null}
      </div>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </article>
  );
}
