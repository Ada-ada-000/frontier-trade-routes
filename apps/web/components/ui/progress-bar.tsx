"use client";

export function ProgressBar({
  value,
  tone = "orange",
}: {
  value: number;
  tone?: "orange" | "blue" | "green" | "red";
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-bar__fill progress-bar__fill--${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
