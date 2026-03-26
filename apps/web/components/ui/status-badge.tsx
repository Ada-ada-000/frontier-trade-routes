"use client";

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

function toneFor(value: string): Tone {
  const normalized = value.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("verified")) return "success";
  if (normalized.includes("transit")) return "warning";
  if (normalized.includes("accept") || normalized.includes("assign") || normalized.includes("pending")) return "info";
  if (normalized.includes("dispute") || normalized.includes("false")) return "danger";
  return "neutral";
}

export function StatusBadge({ label }: { label: string }) {
  return <span className={`status-badge status-badge--${toneFor(label)}`}>{label}</span>;
}
