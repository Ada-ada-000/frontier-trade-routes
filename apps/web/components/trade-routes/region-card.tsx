"use client";

import type { HeatmapTile } from "../../lib/trade-routes/types";

function pressureTone(intensity: number) {
  if (intensity > 40) return "is-high";
  if (intensity >= 20) return "is-mid";
  return "is-low";
}

export function RegionCard({
  region,
  active,
  onSelect,
}: {
  region: HeatmapTile;
  active: boolean;
  onSelect(regionName: string): void;
}) {
  return (
    <button
      type="button"
      className={`region-card ${pressureTone(region.intensity)} ${active ? "is-active" : ""}`}
      onClick={() => onSelect(region.region)}
      title={`Filter orders by ${region.region}`}
    >
      <div className="region-card__head">
        <strong>{region.region}</strong>
        <span>{region.intensity}</span>
      </div>
      <div className="region-card__foot">
        <span>{region.demandCount} Orders</span>
        <span>{region.urgentCount} Urgent</span>
      </div>
    </button>
  );
}
