export type MapPoint = {
  id: string;
  solarSystemId: number;
  label: string;
  x: number;
  y: number;
  kind: "region" | "junction";
};

export type MapLink = {
  from: string;
  to: string;
  strength?: "primary" | "secondary";
};

export type BackgroundStar = {
  x: number;
  y: number;
  size: number;
  alpha: number;
};

export const sceneSize = { width: 1600, height: 1040 };

// Real EVE Frontier systems pulled from the public world API and curated into a playable map subset.
export const mapPoints: MapPoint[] = [
  { id: "ONT-MT7", solarSystemId: 30001719, label: "ONT-MT7", x: 236, y: 840, kind: "region" },
  { id: "IN3-K3D", solarSystemId: 30004452, label: "IN3-K3D", x: 372, y: 472, kind: "region" },
  { id: "EH1-FQC", solarSystemId: 30004448, label: "EH1-FQC", x: 448, y: 420, kind: "region" },
  { id: "ULV-77D", solarSystemId: 30004453, label: "ULV-77D", x: 548, y: 454, kind: "region" },
  { id: "U1S-HBD", solarSystemId: 30004449, label: "U1S-HBD", x: 594, y: 372, kind: "region" },
  { id: "E27-HSD", solarSystemId: 30004451, label: "E27-HSD", x: 650, y: 304, kind: "region" },
  { id: "E5V-0BD", solarSystemId: 30004455, label: "E5V-0BD", x: 680, y: 452, kind: "region" },
  { id: "O3V-49D", solarSystemId: 30004454, label: "O3V-49D", x: 756, y: 484, kind: "region" },
  { id: "OBQ-6JD", solarSystemId: 30004450, label: "OBQ-6JD", x: 818, y: 388, kind: "region" },
  { id: "UR7-5FN", solarSystemId: 30000007, label: "UR7-5FN", x: 1016, y: 286, kind: "region" },
  { id: "OFC-3FN", solarSystemId: 30000006, label: "OFC-3FN", x: 1124, y: 248, kind: "region" },
  { id: "I9T-0FN", solarSystemId: 30000005, label: "I9T-0FN", x: 1266, y: 214, kind: "region" },
  { id: "O3H-1FN", solarSystemId: 30000004, label: "O3H-1FN", x: 1384, y: 178, kind: "region" },
];

export const mapLinks: MapLink[] = [
  { from: "O3H-1FN", to: "I9T-0FN", strength: "primary" },
  { from: "O3H-1FN", to: "OFC-3FN", strength: "primary" },
  { from: "OFC-3FN", to: "UR7-5FN", strength: "primary" },
];

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function buildBackgroundStars() {
  const random = seededRandom(30001719);
  const stars: BackgroundStar[] = [];

  for (let index = 0; index < 620; index += 1) {
    stars.push({
      x: Math.round(random() * sceneSize.width),
      y: Math.round(random() * sceneSize.height),
      size: 0.35 + random() * 1.7,
      alpha: 0.12 + random() * 0.42,
    });
  }

  for (const point of mapPoints) {
    for (let index = 0; index < 22; index += 1) {
      const angle = random() * Math.PI * 2;
      const spread = 12 + random() * 84;
      stars.push({
        x: Math.round(point.x + Math.cos(angle) * spread),
        y: Math.round(point.y + Math.sin(angle) * spread),
        size: 0.4 + random() * 1.8,
        alpha: 0.16 + random() * 0.36,
      });
    }
  }

  return stars.filter(
    (star) =>
      star.x >= 0 &&
      star.x <= sceneSize.width &&
      star.y >= 0 &&
      star.y <= sceneSize.height,
  );
}

export const backgroundStars = buildBackgroundStars();
