"use client";

import { Cell, ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { HeatmapTile } from "../../lib/trade-routes/types";

const palette = ["#242733", "#47321c", "#8f4612", "#c95b12", "#f97316"];

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
    <section className="panel heatmap-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Fuzzy heatmap</p>
          <h2>Regional logistics pressure</h2>
        </div>
        <div className="panel-copy">
          <strong>Region-level only</strong>
          <span>No exact system coordinates exposed</span>
        </div>
      </div>

      <div className="heatmap-chart">
        <ResponsiveContainer width="100%" height={320}>
          <Treemap
            data={data.map((item) => ({ ...item, size: Math.max(item.intensity, 12) }))}
            dataKey="size"
            stroke="rgba(255,255,255,0.08)"
            fill="#242733"
          >
            {data.map((item) => (
              <Cell key={item.region} fill={colorForIntensity(item.intensity)} />
            ))}
            <Tooltip
              contentStyle={{
                background: "rgba(10, 10, 16, 0.96)",
                border: "1px solid rgba(249, 115, 22, 0.25)",
                borderRadius: 12,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
              }}
              formatter={(value, _name, payload) => {
                const intensity = typeof value === "number" ? value : Number(value ?? 0);
                const region = String(payload?.payload?.region ?? "Unknown");
                const demandCount = Number(payload?.payload?.demandCount ?? 0);
                const insuredCount = Number(payload?.payload?.insuredCount ?? 0);
                return [`${intensity} pressure / ${demandCount} orders / ${insuredCount} insured`, region];
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <div className="heatmap-legend">
        <div className="legend-header">
          <span className="eyebrow">Tactical legend</span>
          <span className="eyebrow">Pressure / density / insurance</span>
        </div>
        <div className="legend-list">
          {data.slice(0, 6).map((item) => (
            <div key={item.region} className="legend-row">
              <span className="legend-chip" style={{ backgroundColor: colorForIntensity(item.intensity) }} />
              <div className="legend-copy">
                <strong>{item.region}</strong>
                <span>{item.demandCount} orders / {item.urgentCount} urgent / {item.insuredCount} insured</span>
              </div>
              <span className="legend-value">{item.intensity}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
