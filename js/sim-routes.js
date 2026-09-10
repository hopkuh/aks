const EARTH_R = 6378137;

export function makeEnuTransform(origin) {
  const lat0 = origin.lat * Math.PI / 180;
  const lon0 = origin.lng * Math.PI / 180;
  return {
    toLocal(point) {
      const lat = point.lat * Math.PI / 180;
      const lon = point.lng * Math.PI / 180;
      return {
        x: (lon - lon0) * Math.cos(lat0) * EARTH_R,
        y: (lat - lat0) * EARTH_R,
      };
    },
    toWgs(point) {
      return {
        lat: (lat0 + point.y / EARTH_R) * 180 / Math.PI,
        lng: (lon0 + point.x / (EARTH_R * Math.cos(lat0))) * 180 / Math.PI,
      };
    },
  };
}

export function rotatePoint(point, headingDeg) {
  const a = headingDeg * Math.PI / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    x: point.x * c + point.y * s,
    y: -point.x * s + point.y * c,
  };
}

export function unrotatePoint(point, headingDeg) {
  return rotatePoint(point, -headingDeg);
}

export function polygonBounds(polygon) {
  return polygon.reduce((box, point) => ({
    minX: Math.min(box.minX, point.x),
    maxX: Math.max(box.maxX, point.x),
    minY: Math.min(box.minY, point.y),
    maxY: Math.max(box.maxY, point.y),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
}

export function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
    const dot = (point.x - a.x) * (point.x - b.x) + (point.y - a.y) * (point.y - b.y);
    if (Math.abs(cross) < 1e-8 && dot <= 1e-8) return true;
    if (
      (a.y > point.y) !== (b.y > point.y) &&
      point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x
    ) inside = !inside;
  }
  return inside;
}

export function clipHorizontalLine(polygon, y) {
  const intersections = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      intersections.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y));
    }
  }
  intersections.sort((a, b) => a - b);
  const segments = [];
  for (let i = 0; i + 1 < intersections.length; i += 2) {
    if (intersections[i + 1] - intersections[i] > 0.01) {
      segments.push([
        { x: intersections[i], y },
        { x: intersections[i + 1], y },
      ]);
    }
  }
  return segments;
}

function sampleSegment(a, b, step) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(length / step));
  return Array.from({ length: n + 1 }, (_, i) => ({
    x: a.x + (b.x - a.x) * i / n,
    y: a.y + (b.y - a.y) * i / n,
  }));
}

function quadratic(a, control, b, steps = 12) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * control.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * control.y + t * t * b.y,
    };
  });
}

export function buildRoutePlan({
  polygon,
  headingDeg,
  footprintAlongM,
  footprintAcrossM,
  overlapAlong,
  overlapAcross,
  fixedWing = false,
  turnRadiusM = 0,
}) {
  const alongStep = footprintAlongM * (1 - overlapAlong);
  const acrossStep = footprintAcrossM * (1 - overlapAcross);
  if (!(alongStep > 0) || !(acrossStep > 0)) {
    throw new Error("Шаг базиса должен быть положительным.");
  }
  const rotated = polygon.map((point) => rotatePoint(point, headingDeg));
  const box = polygonBounds(rotated);
  const lines = [];
  const firstY = box.minY + Math.min(footprintAcrossM / 2, acrossStep / 2);
  let lineIndex = 0;
  for (let y = firstY; y <= box.maxY + 1e-7; y += acrossStep) {
    const clipped = clipHorizontalLine(rotated, y);
    for (const segment of clipped) {
      const ordered = lineIndex % 2 ? [segment[1], segment[0]] : segment;
      const world = ordered.map((point) => unrotatePoint(point, headingDeg));
      lines.push({
        index: lineIndex,
        points: world,
        shots: sampleSegment(ordered[0], ordered[1], alongStep)
          .map((point) => unrotatePoint(point, headingDeg)),
      });
      lineIndex++;
    }
  }
  const path = [];
  lines.forEach((route, index) => {
    if (index === 0) {
      path.push(...route.points);
      return;
    }
    const previous = path[path.length - 1];
    const next = route.points[0];
    if (fixedWing && turnRadiusM > 0) {
      const previousRoute = lines[index - 1].points;
      const dx = previousRoute[1].x - previousRoute[0].x;
      const dy = previousRoute[1].y - previousRoute[0].y;
      const length = Math.hypot(dx, dy) || 1;
      const control = {
        x: (previous.x + next.x) / 2 + dy / length * turnRadiusM,
        y: (previous.y + next.y) / 2 - dx / length * turnRadiusM,
      };
      path.push(...quadratic(previous, control, next).slice(1));
    } else {
      path.push(next);
    }
    path.push(route.points[1]);
  });
  return {
    alongStep,
    acrossStep,
    lines,
    path,
    shots: lines.flatMap((route) => route.shots),
    routeCount: lines.length,
  };
}

export function pathLength(path) {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }
  return total;
}
