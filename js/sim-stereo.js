export function radialDistort(x, y, k1 = 0) {
  const scale = 1 + k1 * (x * x + y * y);
  return { x: x * scale, y: y * scale };
}

export function radialUndistort(xd, yd, k1 = 0, iterations = 8) {
  let x = xd;
  let y = yd;
  for (let i = 0; i < iterations; i++) {
    const scale = 1 + k1 * (x * x + y * y);
    x = xd / scale;
    y = yd / scale;
  }
  return { x, y };
}

export function projectCalibrated(point, intrinsics) {
  if (!(point.z > 0)) return null;
  const ideal = { x: point.x / point.z, y: point.y / point.z };
  const distorted = radialDistort(ideal.x, ideal.y, intrinsics.k1);
  return {
    u: intrinsics.cx + intrinsics.fPx * distorted.x,
    v: intrinsics.cy - intrinsics.fPx * distorted.y,
  };
}

function solveLinear(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const divisor = a[col][col];
    if (Math.abs(divisor) < 1e-12) throw new Error("Вырожденная система калибровки.");
    for (let j = col; j <= n; j++) a[col][j] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let j = col; j <= n; j++) a[row][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row[n]);
}

export function calibrateLinear(observations) {
  const normal = Array.from({ length: 4 }, () => Array(4).fill(0));
  const rhs = Array(4).fill(0);
  const addRow = (row, value) => {
    for (let i = 0; i < 4; i++) {
      rhs[i] += row[i] * value;
      for (let j = 0; j < 4; j++) normal[i][j] += row[i] * row[j];
    }
  };
  for (const point of observations) {
    const r2 = point.x * point.x + point.y * point.y;
    addRow([1, 0, point.x, point.x * r2], point.u);
    addRow([0, 1, -point.y, -point.y * r2], point.v);
  }
  const [cx, cy, fPx, fk] = solveLinear(normal, rhs);
  const intrinsics = { cx, cy, fPx, k1: fk / fPx };
  let sumSq = 0;
  for (const point of observations) {
    const predicted = projectCalibrated({ x: point.x, y: point.y, z: 1 }, intrinsics);
    sumSq += (predicted.u - point.u) ** 2 + (predicted.v - point.v) ** 2;
  }
  return {
    ...intrinsics,
    rmsePx: Math.sqrt(sumSq / observations.length),
    count: observations.length,
  };
}

export function triangulateRectified(left, right, intrinsics, baselineM) {
  const leftD = {
    x: (left.u - intrinsics.cx) / intrinsics.fPx,
    y: -(left.v - intrinsics.cy) / intrinsics.fPx,
  };
  const rightD = {
    x: (right.u - intrinsics.cx) / intrinsics.fPx,
    y: -(right.v - intrinsics.cy) / intrinsics.fPx,
  };
  const leftIdeal = radialUndistort(leftD.x, leftD.y, intrinsics.k1);
  const rightIdeal = radialUndistort(rightD.x, rightD.y, intrinsics.k1);
  const normalizedDisparity = leftIdeal.x - rightIdeal.x;
  if (Math.abs(normalizedDisparity) < 1e-9) return null;
  const z = baselineM / normalizedDisparity;
  return {
    x: leftIdeal.x * z - baselineM / 2,
    y: (leftIdeal.y + rightIdeal.y) * 0.5 * z,
    z,
    disparityPx: normalizedDisparity * intrinsics.fPx,
    verticalParallaxPx: (leftIdeal.y - rightIdeal.y) * intrinsics.fPx,
  };
}

export function seededNoise(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296 - 0.5;
  };
}

export function makeCalibrationObservations({
  intrinsics,
  views = 8,
  columns = 9,
  rows = 6,
  noisePx = 0.2,
  seed = 1234,
}) {
  const random = seededNoise(seed);
  const observations = [];
  for (let view = 0; view < views; view++) {
    const scale = 0.55 + view * 0.035;
    const shiftX = (random()) * 0.25;
    const shiftY = (random()) * 0.18;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = ((column / (columns - 1)) - 0.5) * scale + shiftX;
        const y = ((row / (rows - 1)) - 0.5) * scale * 0.68 + shiftY;
        const image = projectCalibrated({ x, y, z: 1 }, intrinsics);
        observations.push({
          x,
          y,
          u: image.u + random() * noisePx * 2,
          v: image.v + random() * noisePx * 2,
          view,
        });
      }
    }
  }
  return observations;
}
