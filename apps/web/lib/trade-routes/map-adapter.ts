import type { HeatmapTile } from "./types";
import { mapLinks, mapPoints, sceneSize, type MapPoint } from "./map-scene";

export type AdaptedHeatNode = {
  id: string;
  region: string;
  label: string;
  solarSystemId: number;
  x: number;
  y: number;
  intensity: number;
  demandCount: number;
  insuredCount: number;
  urgentCount: number;
};

export type AdaptedJunction = MapPoint;

export function getCenteredMapOffset(viewport: { width: number; height: number }, zoom: number) {
  return {
    x: (viewport.width - sceneSize.width * zoom) / 2,
    y: (viewport.height - sceneSize.height * zoom) / 2,
  };
}

export function adaptHeatmapScene(tiles: HeatmapTile[]) {
  const tileByRegion = new Map(tiles.map((tile) => [tile.region, tile]));
  const regionPoints = new Map(
    mapPoints.filter((point) => point.kind === "region").map((point) => [point.id, point]),
  );

  const regions: AdaptedHeatNode[] = [...regionPoints.values()].map((point) => {
    const tile = tileByRegion.get(point.id);
    return {
      id: point.id,
      region: point.id,
      label: point.label,
      solarSystemId: point.solarSystemId,
      x: point.x,
      y: point.y,
      intensity: tile?.intensity ?? 0,
      demandCount: tile?.demandCount ?? 0,
      insuredCount: tile?.insuredCount ?? 0,
      urgentCount: tile?.urgentCount ?? 0,
    };
  });

  const regionIds = new Set(regions.map((region) => region.region));
  const junctions = mapPoints.filter((point) => point.kind === "junction");
  const explicitLinks = mapLinks.filter((link) => {
    if (regionIds.has(link.from) || regionIds.has(link.to)) {
      return true;
    }
    const fromPoint = mapPoints.find((point) => point.id === link.from);
    const toPoint = mapPoints.find((point) => point.id === link.to);
    return Boolean(fromPoint && toPoint);
  });

  const explicitPairs = new Set(
    explicitLinks.map((link) => [link.from, link.to].sort().join("::")),
  );

  const secondaryLinks = regions.flatMap((origin) => {
    const neighbors = regions
      .filter((candidate) => candidate.region !== origin.region)
      .map((candidate) => ({
        candidate,
        distance: Math.hypot(origin.x - candidate.x, origin.y - candidate.y),
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 2)
      .filter(({ distance }) => distance < 340)
      .map(({ candidate }) => {
        const key = [origin.region, candidate.region].sort().join("::");
        if (explicitPairs.has(key)) {
          return null;
        }
        explicitPairs.add(key);
        return {
          from: origin.region,
          to: candidate.region,
          strength: "secondary" as const,
        };
      })
      .filter(Boolean);

    return neighbors;
  });

  return { regions, junctions, links: [...explicitLinks, ...secondaryLinks] };
}
