"use client";

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

function toneFor(value: string): Tone {
  const normalized = value.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("verified") || normalized.includes("已验证") || normalized.includes("已完成")) return "success";
  if (normalized.includes("transit") || normalized.includes("进行中")) return "warning";
  if (normalized.includes("accept") || normalized.includes("assign") || normalized.includes("pending") || normalized.includes("已接单") || normalized.includes("待确认")) return "info";
  if (normalized.includes("dispute") || normalized.includes("false") || normalized.includes("有争议") || normalized.includes("不可信")) return "danger";
  return "neutral";
}

export function StatusBadge({ label }: { label: string }) {
  return <span className={`status-badge status-badge--${toneFor(label)}`}>{label}</span>;
}
