import test from "node:test";
import assert from "node:assert/strict";
import {
  SENSORS,
  circleOfConfusionLimit,
  dofBounds,
  projectPinhole,
  projectThroughCenter,
  gsdFromHeight,
  heightFromGsd,
  groundFootprint,
  cameraIntrinsics,
  distortNormalized,
  undistortNormalized,
  projectCalibrated,
  stereoDisparityPx,
  depthFromDisparity,
  triangulateRectified,
  makeBrownCalibrationObservations,
  calibrateBrownLinear,
} from "../js/sim-optics.js";

test("P, S and p are collinear in central projection", () => {
  const P = { x: 1.2, y: 0.8, z: 8 };
  const p = projectPinhole(P, 50, SENSORS.ff);
  const pM = { x: p.xMm / 1000, y: p.yMm / 1000, z: p.zMm / 1000 };
  const cross = {
    x: P.y * pM.z - P.z * pM.y,
    y: P.z * pM.x - P.x * pM.z,
    z: P.x * pM.y - P.y * pM.x,
  };
  assert.ok(Math.hypot(cross.x, cross.y, cross.z) < 1e-12);
});

test("sensor plane is exactly one focal length behind S", () => {
  const p = projectPinhole({ x: 0, y: 0, z: 10 }, 35, SENSORS.ff);
  assert.equal(p.zMm, -35);
});

test("physical image is inverted in both axes", () => {
  const p = projectPinhole({ x: 2, y: 1, z: 10 }, 50, SENSORS.ff);
  assert.ok(p.xMm < 0);
  assert.ok(p.yMm < 0);
});

test("both stereo rays continue through S to their sensor planes", () => {
  const point = { x: 1.4, y: 0.9, z: 9 };
  const forward = { x: 0, y: 0, z: 1 };
  for (const centerX of [-0.6, 0.6]) {
    const center = { x: centerX, y: 1.55, z: 0 };
    const image = projectThroughCenter(point, center, forward, 0.035);
    assert.ok(image);
    assert.ok(Math.abs(image.z + 0.035) < 1e-12);
    const objectVector = {
      x: point.x - center.x,
      y: point.y - center.y,
      z: point.z - center.z,
    };
    const imageVector = {
      x: image.x - center.x,
      y: image.y - center.y,
      z: image.z - center.z,
    };
    const crossLength = Math.hypot(
      objectVector.y * imageVector.z - objectVector.z * imageVector.y,
      objectVector.z * imageVector.x - objectVector.x * imageVector.z,
      objectVector.x * imageVector.y - objectVector.y * imageVector.x
    );
    assert.ok(crossLength < 1e-12);
  }
});

test("near and far depth-of-field boundaries surround focus", () => {
  const c = circleOfConfusionLimit(SENSORS.ff);
  const bounds = dofBounds(50, 8, 10, c);
  assert.ok(bounds.near < 10);
  assert.ok(bounds.far > 10);
  assert.ok(bounds.hyperfocal > 10);
});

test("GSD, height and footprint use consistent units", () => {
  const pixelMm = 36 / 8192;
  const height = heightFromGsd(0.03, pixelMm, 35);
  assert.ok(Math.abs(gsdFromHeight(height, pixelMm, 35) - 0.03) < 1e-12);
  const footprint = groundFootprint(height, 36, 24, 35);
  assert.ok(footprint.alongM > footprint.acrossM);
  assert.ok(footprint.alongM > 200);
});

test("Brown-Conrady distortion can be numerically inverted", () => {
  const point = { x: 0.42, y: -0.28 };
  const coefficients = { k1: -0.14, k2: 0.035, p1: 0.002, p2: -0.001 };
  const distorted = distortNormalized(point, coefficients);
  const restored = undistortNormalized(distorted, coefficients, 12);
  assert.ok(Math.hypot(restored.x - point.x, restored.y - point.y) < 1e-9);
});

test("rectified stereo disparity reconstructs depth", () => {
  const intrinsics = cameraIntrinsics({
    focalMm: 35,
    sensorWidthMm: 36,
    sensorHeightMm: 24,
    imageWidthPx: 600,
    imageHeightPx: 400,
  });
  const baseline = 1.2;
  const depth = 10;
  const disparity = stereoDisparityPx(intrinsics.fx, baseline, depth);
  assert.ok(Math.abs(depthFromDisparity(intrinsics.fx, baseline, disparity) - depth) < 1e-12);
  const point = triangulateRectified(
    { x: 350, y: 215 },
    { x: 350 - disparity, y: 215 },
    intrinsics,
    baseline
  );
  assert.ok(Math.abs(point.z - depth) < 1e-12);
});

test("calibrated projection uses physical focal length in pixels", () => {
  const intrinsics = cameraIntrinsics({
    focalMm: 50,
    sensorWidthMm: 36,
    sensorHeightMm: 24,
    imageWidthPx: 720,
    imageHeightPx: 480,
  });
  assert.equal(intrinsics.fx, 1000);
  assert.equal(intrinsics.fy, 1000);
  const p = projectCalibrated({ x: 1, y: 0.5, z: 10 }, intrinsics);
  assert.deepEqual(p, { x: 460, y: 290 });
});

test("linear Brown-Conrady calibration recovers synthetic camera", () => {
  const intrinsics = { fx: 700, fy: 700, cx: 360, cy: 240 };
  const truth = { k1: -0.12, k2: 0.03, p1: 0.002, p2: -0.001 };
  const observations = makeBrownCalibrationObservations({
    intrinsics,
    coefficients: truth,
    views: 12,
    noisePx: 0.12,
    seed: 18,
  });
  const estimated = calibrateBrownLinear(observations);
  assert.ok(Math.abs(estimated.fx - intrinsics.fx) < 0.3);
  assert.ok(Math.abs(estimated.cx - intrinsics.cx) < 0.1);
  assert.ok(Math.abs(estimated.k1 - truth.k1) < 0.003);
  assert.ok(Math.abs(estimated.k2 - truth.k2) < 0.006);
  assert.ok(Math.abs(estimated.p1 - truth.p1) < 0.001);
  assert.ok(Math.abs(estimated.p2 - truth.p2) < 0.001);
  assert.ok(estimated.rmsePx < 0.2);
});
