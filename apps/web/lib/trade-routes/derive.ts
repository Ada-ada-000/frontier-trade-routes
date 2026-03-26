import type { HeatmapTile, OrderPublicView } from "./types";

export function buildHeatmap(orders: OrderPublicView[]): HeatmapTile[] {
  const bucket = new Map<string, HeatmapTile>();

  for (const order of orders) {
    for (const region of [order.originFuzzy, order.destinationFuzzy]) {
      const current = bucket.get(region) ?? {
        region,
        intensity: 0,
        demandCount: 0,
        insuredCount: 0,
        urgentCount: 0,
      };

      current.demandCount += 1;
      current.intensity += order.orderMode === "urgent" ? 24 : 16;
      if (order.insured) {
        current.insuredCount += 1;
        current.intensity += 8;
      }
      if (order.orderMode === "urgent") {
        current.urgentCount += 1;
      }

      bucket.set(region, current);
    }
  }

  return [...bucket.values()]
    .map((item) => ({ ...item, intensity: Math.min(item.intensity, 100) }))
    .sort((left, right) => right.intensity - left.intensity);
}
