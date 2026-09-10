import test from "node:test";
import assert from "node:assert/strict";
import {
  radialDistort,
  radialUndistort,
  projectCalibrated,
  makeCalibrationObservations,
  calibrateLinear,
  triangulateRectified,
} from "../js/sim-stereo.js";

test("iterative undistortion reverses radial distortion", () => {
  const source = { x: 0.32, y: -0.21 };
  const distorted = radialDistort(source.x, source.y, -0.09);
  const restored = radialUndistort(distorted.x, distorted.y, -0.09);
  assert.ok(Math.hypot(restored.x - source.x, restored.y - source.y) < 1e-10);
});

test("calibration estimates focal length, principal point and k1", () => {
  const truth = { fPx: 700, cx: 360, cy: 240, k1: -0.085 };
  const observations = makeCalibrationObservations({
    intrinsics: truth,
    views: 10,
    noisePx: 0.15,
    seed: 77,
  });
  const estimated = calibrateLinear(observations);
  assert.ok(Math.abs(estimated.fPx - truth.fPx) < 0.2);
  assert.ok(Math.abs(estimated.cx - truth.cx) < 0.1);
  assert.ok(Math.abs(estimated.cy - truth.cy) < 0.1);
  assert.ok(Math.abs(estimated.k1 - truth.k1) < 0.002);
  assert.ok(estimated.rmsePx < 0.2);
});

test("rectified disparity reconstructs a synthetic 3D point", () => {
  const intrinsics = { fPx: 700, cx: 360, cy: 240, k1: -0.06 };
  const baseline = 1.2;
  const truth = { x: 1.4, y: -0.2, z: 12 };
  const left = projectCalibrated({
    x: truth.x + baseline / 2,
    y: truth.y,
    z: truth.z,
  }, intrinsics);
  const right = projectCalibrated({
    x: truth.x - baseline / 2,
    y: truth.y,
    z: truth.z,
  }, intrinsics);
  const reconstructed = triangulateRectified(left, right, intrinsics, baseline);
  assert.ok(Math.hypot(
    reconstructed.x - truth.x,
    reconstructed.y - truth.y,
    reconstructed.z - truth.z
  ) < 1e-7);
  assert.ok(Math.abs(reconstructed.disparityPx - intrinsics.fPx * baseline / truth.z) < 1e-7);
  assert.ok(Math.abs(reconstructed.verticalParallaxPx) < 1e-8);
});
