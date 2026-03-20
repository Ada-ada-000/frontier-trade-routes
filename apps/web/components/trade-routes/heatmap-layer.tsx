"use client";

import { Cell, ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { HeatmapTile } from "../../lib/trade-routes/types";

const palette = ["#173342", "#1f5564", "#2b7c7f", "#46a388", "#87cd93"];

function colorForIntensity(value: number) {
  if (value >= 85) {
    return palette[4];
  }
  if (value >= 70) {
    return palette[3];
  }
  if (value >= 55) {
    return palette[2];
  }
  if (value >= 35) {
    return palette[1];
  }
  return palette[0];
}

export function HeatmapLayer({ data }: { data: HeatmapTile[] }) {
  return (
    <div className="trade-heatmap-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Fuzzy heatmap</p>
          <h2>Regional pressure only</h2>
        </div>
        <p className="muted narrow">No exact station or system coordinates are exposed here.</p>
      </div>
      <div className="trade-heatmap-wrap">
        <ResponsiveContainer width="100%" height={280}>
          <Treemap
            data={data.map((item) => ({ ...item, size: Math.max(item.intensity, 12) }))}
            dataKey="size"
            stroke="rgba(255,255,255,0.08)"
            fill="#1f5564"
            content={<div />}
          >
            {data.map((item) => (
              <Cell key={item.region} fill={colorForIntensity(item.intensity)} />
            ))}
            <Tooltip
              contentStyle={{
                background: "rgba(4, 11, 17, 0.96)",
                border: "1px solid rgba(160, 198, 211, 0.18)",
                borderRadius: 16,
              }}
              formatter={(value, _name, payload) => {
                const intensity = typeof value === "number" ? value : Number(value ?? 0);
                const region = String(payload?.payload?.region ?? "Unknown");
                const demandCount = Number(payload?.payload?.demandCount ?? 0);
                return [`${intensity} intensity · ${demandCount} orders`, region];
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
      <div className="trade-heatmap-legend">
        {data.slice(0, 5).map((item) => (
          <div key={item.region} className="trade-legend-row">
            <span className="trade-legend-chip" style={{ backgroundColor: colorForIntensity(item.intensity) }} />
            <strong>{item.region}</strong>
            <span className="muted">{item.intensity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
