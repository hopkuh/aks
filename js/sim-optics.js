export const SENSORS = {
  ff: { id: "ff", name: "36×24 мм", widthMm: 36, heightMm: 24 },
  apsc: { id: "apsc", name: "APS-C", widthMm: 22.3, heightMm: 14.9 },
  m43: { id: "m43", name: "M4/3", widthMm: 17.3, heightMm: 13 },
  inch1: { id: "inch1", name: "1″", widthMm: 13.2, heightMm: 8.8 },
};

export function circleOfConfusionLimit(sensor) {
  return Math.hypot(sensor.widthMm, sensor.heightMm) / 1500;
}

export function hyperfocal(fMm, aperture, cocMm) {
  return (fMm * fMm) / (aperture * cocMm) / 1000 + fMm / 1000;
}

export function dofBounds(fMm, aperture, focusM, cocMm) {
  const fM = fMm / 1000;
  const H = hyperfocal(fMm, aperture, cocMm);
  const near = (H * focusM) / (H + focusM - fM);
  const den = H - focusM + fM;
  const far = den <= 0 ? Infinity : (H * focusM) / den;
  return { hyperfocal: H, near, far };
}

export function imageDistanceMm(fMm, objectDistanceM) {
  const dMm = objectDistanceM * 1000;
  return (fMm * dMm) / (dMm - fMm);
}

export function cocDiameterMm(fMm, aperture, focusM, objectDistanceM) {
  const focusImage = imageDistanceMm(fMm, focusM);
  const objectImage = imageDistanceMm(fMm, objectDistanceM);
  const apertureDiameter = fMm / aperture;
  return Math.abs(apertureDiameter * (objectImage - focusImage) / objectImage);
}

export function fieldOfViewDeg(sensorMm, fMm) {
  return (2 * Math.atan(sensorMm / (2 * fMm)) * 180) / Math.PI;
}

export function projectPinhole(pointCamera, fMm, sensor) {
  const z = pointCamera.z;
  if (z <= 0) return null;
  return {
    xMm: -fMm * pointCamera.x / z,
    yMm: -fMm * pointCamera.y / z,
    zMm: -fMm,
  };
}

export function gsdFromHeight(heightM, pixelMm, fMm) {
  return (heightM * pixelMm) / fMm;
}

export function heightFromGsd(gsdM, pixelMm, fMm) {
  return (gsdM * fMm) / pixelMm;
}

export function groundFootprint(heightM, sensorWidthMm, sensorHeightMm, fMm) {
  return {
    alongM: (heightM * sensorWidthMm) / fMm,
    acrossM: (heightM * sensorHeightMm) / fMm,
  };
}

export function ev100(aperture, shutterS) {
  return Math.log2((aperture * aperture) / shutterS);
}

export function exposureOffsetEv(aperture, shutterS, iso, sceneEv100) {
  return ev100(aperture, shutterS) - Math.log2(iso / 100) - sceneEv100;
}

export function linePlaneIntersection(origin, through, planePoint, planeNormal) {
  const dx = through.x - origin.x;
  const dy = through.y - origin.y;
  const dz = through.z - origin.z;
  const den = planeNormal.x * dx + planeNormal.y * dy + planeNormal.z * dz;
  if (Math.abs(den) < 1e-12) return null;
  const t = (
    planeNormal.x * (planePoint.x - origin.x) +
    planeNormal.y * (planePoint.y - origin.y) +
    planeNormal.z * (planePoint.z - origin.z)
  ) / den;
  return {
    x: origin.x + dx * t,
    y: origin.y + dy * t,
    z: origin.z + dz * t,
    t,
  };
}

export function cameraIntrinsics({
  focalMm,
  sensorWidthMm,
  sensorHeightMm,
  imageWidthPx,
  imageHeightPx,
  principalXpx = imageWidthPx / 2,
  principalYpx = imageHeightPx / 2,
}) {
  return {
    fx: focalMm * imageWidthPx / sensorWidthMm,
    fy: focalMm * imageHeightPx / sensorHeightMm,
    cx: principalXpx,
    cy: principalYpx,
    width: imageWidthPx,
    height: imageHeightPx,
  };
}

export function distortNormalized(point, coefficients = {}) {
  const { x, y } = point;
  const {
    k1 = 0,
    k2 = 0,
    k3 = 0,
    p1 = 0,
    p2 = 0,
  } = coefficients;
  const r2 = x * x + y * y;
  const radial = 1 + k1 * r2 + k2 * r2 * r2 + k3 * r2 * r2 * r2;
  return {
    x: x * radial + 2 * p1 * x * y + p2 * (r2 + 2 * x * x),
    y: y * radial + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y,
  };
}

export function undistortNormalized(point, coefficients = {}, iterations = 8) {
  let estimate = { ...point };
  for (let i = 0; i < iterations; i++) {
    const distorted = distortNormalized(estimate, coefficients);
    estimate.x += point.x - distorted.x;
    estimate.y += point.y - distorted.y;
  }
  return estimate;
}

export function normalizedToPixel(point, intrinsics) {
  return {
    x: intrinsics.fx * point.x + intrinsics.cx,
    y: intrinsics.fy * point.y + intrinsics.cy,
  };
}

export function pixelToNormalized(point, intrinsics) {
  return {
    x: (point.x - intrinsics.cx) / intrinsics.fx,
    y: (point.y - intrinsics.cy) / intrinsics.fy,
  };
}

export function projectCalibrated(pointCamera, intrinsics, coefficients = {}) {
  if (pointCamera.z <= 0) return null;
  const normalized = {
    x: pointCamera.x / pointCamera.z,
    y: pointCamera.y / pointCamera.z,
  };
  return normalizedToPixel(distortNormalized(normalized, coefficients), intrinsics);
}

export function stereoDisparityPx(focalPx, baselineM, depthM) {
  if (!(depthM > 0)) return Infinity;
  return focalPx * baselineM / depthM;
}

export function depthFromDisparity(focalPx, baselineM, disparityPx) {
  if (!(disparityPx > 0)) return Infinity;
  return focalPx * baselineM / disparityPx;
}

export function triangulateRectified(leftPixel, rightPixel, intrinsics, baselineM) {
  const disparity = leftPixel.x - rightPixel.x;
  const z = depthFromDisparity(intrinsics.fx, baselineM, disparity);
  if (!Number.isFinite(z)) return null;
  return {
    x: (leftPixel.x - intrinsics.cx) * z / intrinsics.fx - baselineM / 2,
    y: (leftPixel.y - intrinsics.cy) * z / intrinsics.fy,
    z,
    disparity,
  };
}

function solveLinearSystem(matrix, vector) {
  const n = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < n; column++) {
    let pivot = column;
    for (let row = column + 1; row < n; row++) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-12) throw new Error("Вырожденная система калибровки.");
    for (let j = column; j <= n; j++) augmented[column][j] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let j = column; j <= n; j++) {
        augmented[row][j] -= factor * augmented[column][j];
      }
    }
  }
  return augmented.map((row) => row[n]);
}

export function makeBrownCalibrationObservations({
  intrinsics,
  coefficients = {},
  views = 12,
  columns = 9,
  rows = 7,
  noisePx = 0.18,
  seed = 73,
}) {
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (1664525 * randomState + 1013904223) >>> 0;
    return randomState / 4294967296 - 0.5;
  };
  const observations = [];
  for (let view = 0; view < views; view++) {
    const scale = 0.62 + 0.025 * view;
    const shiftX = random() * 0.22;
    const shiftY = random() * 0.14;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const normalized = {
          x: (column / (columns - 1) - 0.5) * scale + shiftX,
          y: (row / (rows - 1) - 0.5) * scale * 0.67 + shiftY,
        };
        const image = normalizedToPixel(
          distortNormalized(normalized, coefficients),
          intrinsics
        );
        observations.push({
          ...normalized,
          imageX: image.x + random() * noisePx * 2,
          imageY: image.y + random() * noisePx * 2,
          view,
        });
      }
    }
  }
  return observations;
}

export function calibrateBrownLinear(observations) {
  const size = 7;
  const normal = Array.from({ length: size }, () => Array(size).fill(0));
  const rhs = Array(size).fill(0);
  const add = (row, value) => {
    for (let i = 0; i < size; i++) {
      rhs[i] += row[i] * value;
      for (let j = 0; j < size; j++) normal[i][j] += row[i] * row[j];
    }
  };
  for (const point of observations) {
    const { x, y } = point;
    const r2 = x * x + y * y;
    const r4 = r2 * r2;
    add([1, 0, x, x * r2, x * r4, 2 * x * y, r2 + 2 * x * x], point.imageX);
    add([0, 1, y, y * r2, y * r4, r2 + 2 * y * y, 2 * x * y], point.imageY);
  }
  const [cx, cy, focal, fk1, fk2, fp1, fp2] = solveLinearSystem(normal, rhs);
  const result = {
    fx: focal,
    fy: focal,
    cx,
    cy,
    k1: fk1 / focal,
    k2: fk2 / focal,
    p1: fp1 / focal,
    p2: fp2 / focal,
    count: observations.length,
  };
  let squared = 0;
  for (const point of observations) {
    const predicted = normalizedToPixel(
      distortNormalized(point, result),
      result
    );
    squared += (predicted.x - point.imageX) ** 2 + (predicted.y - point.imageY) ** 2;
  }
  result.rmsePx = Math.sqrt(squared / observations.length);
  return result;
}
