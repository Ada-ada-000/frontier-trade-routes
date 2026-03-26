"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HeatmapTile } from "../../lib/trade-routes/types";
import { adaptHeatmapScene } from "../../lib/trade-routes/map-adapter";
import { backgroundStars, sceneSize } from "../../lib/trade-routes/map-scene";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type ContentBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
};

type ViewInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const VIEW_INSETS: ViewInsets = {
  top: 44,
  right: 44,
  bottom: 44,
  left: 44,
};

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function getAvailableViewport(viewport: { width: number; height: number }, insets: ViewInsets) {
  return {
    width: Math.max(0, viewport.width - insets.left - insets.right),
    height: Math.max(0, viewport.height - insets.top - insets.bottom),
    centerX: insets.left + Math.max(0, viewport.width - insets.left - insets.right) / 2,
    centerY: insets.top + Math.max(0, viewport.height - insets.top - insets.bottom) / 2,
  };
}

function getFittedZoom(viewport: { width: number; height: number }, bounds: ContentBounds, insets: ViewInsets) {
  const available = getAvailableViewport(viewport, insets);
  if (!available.width || !available.height) {
    return 1;
  }

  return Math.min(
    2.4,
    Math.max(
      0.55,
      Math.min(available.width / bounds.width, available.height / bounds.height),
    ),
  );
}

function getCenteredMapOffset(
  viewport: { width: number; height: number },
  zoom: number,
  bounds: ContentBounds,
  insets: ViewInsets,
) {
  const available = getAvailableViewport(viewport, insets);
  return {
    x: available.centerX - (bounds.minX + bounds.width / 2) * zoom,
    y: available.centerY - (bounds.minY + bounds.height / 2) * zoom,
  };
}

function getClampedOffset(
  nextOffset: { x: number; y: number },
  nextZoom: number,
  viewport: { width: number; height: number },
  bounds: ContentBounds,
  insets: ViewInsets,
) {
  const available = getAvailableViewport(viewport, insets);
  const scaledWidth = bounds.width * nextZoom;
  const scaledHeight = bounds.height * nextZoom;

  const centeredOffset = getCenteredMapOffset(viewport, nextZoom, bounds, insets);

  const minX =
    scaledWidth <= available.width
      ? centeredOffset.x
      : viewport.width - insets.right - bounds.maxX * nextZoom;
  const maxX =
    scaledWidth <= available.width
      ? centeredOffset.x
      : insets.left - bounds.minX * nextZoom;
  const minY =
    scaledHeight <= available.height
      ? centeredOffset.y
      : viewport.height - insets.bottom - bounds.maxY * nextZoom;
  const maxY =
    scaledHeight <= available.height
      ? centeredOffset.y
      : insets.top - bounds.minY * nextZoom;

  return {
    x: clamp(nextOffset.x, minX, maxX),
    y: clamp(nextOffset.y, minY, maxY),
  };
}

function particleCountForIntensity(intensity: number) {
  if (intensity >= 85) return 110;
  if (intensity >= 70) return 70;
  if (intensity >= 55) return 42;
  if (intensity >= 35) return 20;
  if (intensity > 0) return 8;
  return 0;
}

function spreadForIntensity(intensity: number) {
  if (intensity >= 85) return 42;
  if (intensity >= 70) return 54;
  if (intensity >= 55) return 62;
  if (intensity >= 35) return 70;
  return 84;
}

function alphaForIntensity(intensity: number) {
  return clamp(0.2 + intensity / 115, 0.22, 0.96);
}

export function HeatmapLayer({
  data,
  activeRegion,
  onSelectRegion,
  metrics,
}: {
  data: HeatmapTile[];
  activeRegion?: string;
  onSelectRegion(regionName: string): void;
  metrics: { openOrders: number; insured: number; totalStake: number };
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const didInitView = useRef(false);
  const suppressClickRef = useRef(false);
  const dragState = useRef<{ x: number; y: number; startX: number; startY: number; moved: boolean } | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const scene = useMemo(() => adaptHeatmapScene(data), [data]);
  const contentBounds = useMemo<ContentBounds>(() => {
    const allPoints = [...scene.regions, ...scene.junctions];
    const minX = Math.min(...allPoints.map((point) => point.x)) - 120;
    const maxX = Math.max(...allPoints.map((point) => point.x)) + 120;
    const minY = Math.min(...allPoints.map((point) => point.y)) - 120;
    const maxY = Math.max(...allPoints.map((point) => point.y)) + 120;

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [scene]);
  const minZoom = useMemo(
    () => getFittedZoom(viewportSize, contentBounds, VIEW_INSETS),
    [viewportSize, contentBounds],
  );

  const mapLines = useMemo(() => {
    const byId = new Map(
      [...scene.regions, ...scene.junctions].map((point) => [point.id, point]),
    );
    return scene.links
      .filter(
        (link): link is NonNullable<(typeof scene.links)[number]> => Boolean(link),
      )
      .map((link) => {
        const start = byId.get(link.from);
        const end = byId.get(link.to);
        if (!start || !end) {
          return null;
        }
        return { from: start, to: end, strength: link.strength ?? "secondary" };
      })
      .filter(Boolean) as Array<{
      from: { id: string; x: number; y: number };
      to: { id: string; x: number; y: number };
      strength: "primary" | "secondary";
    }>;
  }, [scene]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const preventBrowserZoom = (event: WheelEvent) => {
      if (!viewport.contains(event.target as Node)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const nextViewport = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
      setViewportSize(nextViewport);
      if (!didInitView.current) {
        didInitView.current = true;
        const nextZoom = getFittedZoom(nextViewport, contentBounds, VIEW_INSETS);
        setZoom(nextZoom);
        setOffset(getCenteredMapOffset(nextViewport, nextZoom, contentBounds, VIEW_INSETS));
        return;
      }
      setZoom((currentZoom) => Math.max(currentZoom, getFittedZoom(nextViewport, contentBounds, VIEW_INSETS)));
      setOffset((current) =>
        getClampedOffset(current, Math.max(zoom, getFittedZoom(nextViewport, contentBounds, VIEW_INSETS)), nextViewport, contentBounds, VIEW_INSETS),
      );
    });

    observer.observe(viewport);
    viewport.addEventListener("wheel", preventBrowserZoom, { passive: false });
    viewport.addEventListener("gesturestart", preventGesture as EventListener, { passive: false });
    viewport.addEventListener("gesturechange", preventGesture as EventListener, { passive: false });
    viewport.addEventListener("gestureend", preventGesture as EventListener, { passive: false });

    return () => {
      observer.disconnect();
      viewport.removeEventListener("wheel", preventBrowserZoom);
      viewport.removeEventListener("gesturestart", preventGesture as EventListener);
      viewport.removeEventListener("gesturechange", preventGesture as EventListener);
      viewport.removeEventListener("gestureend", preventGesture as EventListener);
    };
  }, [zoom, contentBounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = sceneSize.width * dpr;
    canvas.height = sceneSize.height * dpr;
    canvas.style.width = `${sceneSize.width}px`;
    canvas.style.height = `${sceneSize.height}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, sceneSize.width, sceneSize.height);
    context.globalCompositeOperation = "lighter";

    scene.regions.forEach((system) => {
      const particleCount = particleCountForIntensity(system.intensity);
      const spread = spreadForIntensity(system.intensity);
      const alpha = alphaForIntensity(system.intensity);
      const random = seededRandom(hashSeed(system.region));
      const isHighlighted = activeRegion === system.region || hoveredRegion === system.region;
      const highlightScale = isHighlighted ? 1.18 : 1;

      for (let particle = 0; particle < particleCount; particle += 1) {
        const angle = random() * Math.PI * 2;
        const radius = Math.pow(random(), 1.35) * spread * highlightScale;
        const x = system.x + Math.cos(angle) * radius;
        const y = system.y + Math.sin(angle) * radius;
        const size = 0.8 + random() * 1.8 + (isHighlighted ? 0.35 : 0);

        const gradient = context.createRadialGradient(x, y, 0, x, y, size * 4.5);
        gradient.addColorStop(0, `rgba(255, 247, 237, ${alpha})`);
        gradient.addColorStop(0.28, `rgba(249, 115, 22, ${alpha * 0.96})`);
        gradient.addColorStop(0.62, `rgba(194, 65, 12, ${alpha * 0.42})`);
        gradient.addColorStop(1, "rgba(194, 65, 12, 0)");

        context.beginPath();
        context.fillStyle = gradient;
        context.arc(x, y, size * 4.5, 0, Math.PI * 2);
        context.fill();
      }

      context.beginPath();
      context.fillStyle = isHighlighted ? "rgba(255, 247, 237, 0.95)" : "rgba(255, 235, 219, 0.86)";
      context.arc(system.x, system.y, isHighlighted ? 3.4 : 2.4, 0, Math.PI * 2);
      context.fill();
    });

    context.globalCompositeOperation = "source-over";
  }, [scene, activeRegion, hoveredRegion]);

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const worldX = (pointerX - offset.x) / zoom;
    const worldY = (pointerY - offset.y) / zoom;
    const nextZoom = clamp(zoom + (event.deltaY < 0 ? 0.12 : -0.12), minZoom, 2.4);
    const nextOffset = {
      x: pointerX - worldX * nextZoom,
      y: pointerY - worldY * nextZoom,
    };

    setZoom(nextZoom);
    setOffset(getClampedOffset(nextOffset, nextZoom, viewportSize, contentBounds, VIEW_INSETS));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    dragState.current = {
      x: offset.x,
      y: offset.y,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) {
      return;
    }

    const nextX = dragState.current.x + (event.clientX - dragState.current.startX);
    const nextY = dragState.current.y + (event.clientY - dragState.current.startY);

    if (
      !dragState.current.moved &&
      (Math.abs(event.clientX - dragState.current.startX) > 4 ||
        Math.abs(event.clientY - dragState.current.startY) > 4)
    ) {
      dragState.current.moved = true;
    }

    setOffset(getClampedOffset({ x: nextX, y: nextY }, zoom, viewportSize, contentBounds, VIEW_INSETS));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      suppressClickRef.current = dragState.current.moved;
      if (suppressClickRef.current) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    }
    dragState.current = null;
  }

  function handleSelectRegion(regionName: string) {
    if (suppressClickRef.current) {
      return;
    }
    onSelectRegion(regionName);
  }

  function nudgeZoom(delta: number) {
    const nextZoom = clamp(zoom + delta, minZoom, 2.4);
    setZoom(nextZoom);
    setOffset((current) => getClampedOffset(current, nextZoom, viewportSize, contentBounds, VIEW_INSETS));
  }

  function resetView() {
    const nextZoom = minZoom;
    setZoom(nextZoom);
    setOffset(getCenteredMapOffset(viewportSize, nextZoom, contentBounds, VIEW_INSETS));
  }

  function focusRegion(regionName: string) {
    const region = scene.regions.find((item) => item.region === regionName);
    if (!region) {
      onSelectRegion(regionName);
      return;
    }

    const available = getAvailableViewport(viewportSize, VIEW_INSETS);

    const nextOffset = getClampedOffset(
      {
        x: available.centerX - region.x * zoom,
        y: available.centerY - region.y * zoom,
      },
      zoom,
      viewportSize,
      contentBounds,
      VIEW_INSETS,
    );

    setOffset(nextOffset);
    handleSelectRegion(regionName);
  }

  return (
    <section className="heatmap-panel" id="heatmap">
      <section className="heatmap-visual-panel" aria-label="Visual logistics pressure map">
        <div className="heatmap-visual-panel__frame">
          <div className="heatmap-visual-panel__topbar">
            <div className="heatmap-visual-panel__metrics">
              <article className="operations-metric">
                <span className="eyebrow">Visible route tasks</span>
                <strong>{metrics.openOrders}</strong>
              </article>
              <article className="operations-metric">
                <span className="eyebrow">Capital currently required</span>
                <strong>{metrics.totalStake.toFixed(0)} SUI</strong>
              </article>
              <article className="operations-metric">
                <span className="eyebrow">Recovery-backed jobs</span>
                <strong>{metrics.insured}</strong>
              </article>
            </div>

            <div className="heatmap-visual-panel__tools">
              <button type="button" className="heatmap-visual-panel__tool" onClick={() => nudgeZoom(0.16)}>
                +
              </button>
              <button type="button" className="heatmap-visual-panel__tool" onClick={() => nudgeZoom(-0.16)}>
                −
              </button>
              <button
                type="button"
                className="heatmap-visual-panel__tool heatmap-visual-panel__tool--wide"
                onClick={resetView}
              >
                Reset
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="heatmap-visual-panel__viewport"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              className="heatmap-visual-panel__map"
              style={{
                width: `${sceneSize.width}px`,
                height: `${sceneSize.height}px`,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            >
              <div className="heatmap-visual-panel__grid" aria-hidden="true" />

              <svg className="heatmap-visual-panel__stars" viewBox={`0 0 ${sceneSize.width} ${sceneSize.height}`} aria-hidden="true">
                {backgroundStars.map((star, index) => (
                  <circle
                    key={`star-${index}`}
                    cx={star.x}
                    cy={star.y}
                    r={star.size}
                    fill={`rgba(255, 238, 219, ${star.alpha})`}
                  />
                ))}
                {scene.junctions.map((point) => (
                  <circle key={point.id} cx={point.x} cy={point.y} r="1.8" className="heatmap-junction" />
                ))}
              </svg>

              <canvas ref={canvasRef} className="heatmap-canvas" aria-hidden="true" />

              <svg className="heatmap-visual-panel__routes" viewBox={`0 0 ${sceneSize.width} ${sceneSize.height}`} aria-hidden="true">
                {mapLines.map((link) => (
                  <line
                    key={`${link.from.id}-${link.to.id}`}
                    x1={link.from.x}
                    y1={link.from.y}
                    x2={link.to.x}
                    y2={link.to.y}
                    data-strength={link.strength}
                  />
                ))}
              </svg>

              {scene.regions.map((item) => (
                <button
                  key={item.region}
                  type="button"
                  className={`heatmap-visual-node ${activeRegion === item.region ? "is-active" : ""}`}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseEnter={() => setHoveredRegion(item.region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => focusRegion(item.region)}
                  title={`Open ${item.label}`}
                >
                  <span className="heatmap-visual-node__dot" aria-hidden="true" />
                  <div className="heatmap-visual-node__content">
                    <strong>{item.label}</strong>
                    <span>{item.demandCount > 0 ? `${item.demandCount} route${item.demandCount > 1 ? "s" : ""}` : "mapped system"}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="heatmap-visual-panel__footer">
            <div className="heatmap-visual-panel__dock heatmap-visual-panel__dock--legend">
              <div className="heatmap-visual-panel__legend">
                <span>Low</span>
                <div className="heatmap-visual-panel__legend-bar" />
                <span>High</span>
              </div>
            </div>
            <div className="heatmap-visual-panel__dock heatmap-visual-panel__dock--action">
              <button
                type="button"
                className="button tertiary heatmap-visual-panel__action-button"
                onClick={() => {
                  onSelectRegion("");
                  resetView();
                }}
              >
                Show All Regions
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
