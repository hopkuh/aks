import test from "node:test";
import assert from "node:assert/strict";
import {
  makeEnuTransform,
  rotatePoint,
  unrotatePoint,
  clipHorizontalLine,
  pointInPolygon,
  buildRoutePlan,
  pathLength,
} from "../js/sim-routes.js";

const rectangle = [
  { x: 0, y: 0 },
  { x: 400, y: 0 },
  { x: 400, y: 300 },
  { x: 0, y: 300 },
];

test("ENU transform round-trips WGS84 near its origin", () => {
  const transform = makeEnuTransform({ lat: 55.76, lng: 37.66 });
  const source = { lat: 55.762, lng: 37.665 };
  const back = transform.toWgs(transform.toLocal(source));
  assert.ok(Math.abs(back.lat - source.lat) < 1e-10);
  assert.ok(Math.abs(back.lng - source.lng) < 1e-10);
});

test("route coordinate rotation is reversible", () => {
  const source = { x: 123.4, y: -56.7 };
  const back = unrotatePoint(rotatePoint(source, 37), 37);
  assert.ok(Math.hypot(back.x - source.x, back.y - source.y) < 1e-10);
});

test("horizontal line is clipped to polygon", () => {
  assert.deepEqual(clipHorizontalLine(rectangle, 120), [
    [{ x: 0, y: 120 }, { x: 400, y: 120 }],
  ]);
  assert.deepEqual(clipHorizontalLine(rectangle, 350), []);
});

test("routes and exposure stations remain inside contour", () => {
  const plan = buildRoutePlan({
    polygon: rectangle,
    headingDeg: 23,
    footprintAlongM: 150,
    footprintAcrossM: 100,
    overlapAlong: 0.8,
    overlapAcross: 0.6,
  });
  assert.ok(plan.routeCount > 1);
  assert.ok(plan.shots.length > plan.routeCount);
  plan.shots.forEach((point) => assert.equal(pointInPolygon(point, rectangle), true));
  assert.ok(Math.abs(plan.alongStep - 30) < 1e-10);
  assert.ok(Math.abs(plan.acrossStep - 40) < 1e-10);
});

test("fixed-wing path contains curved turn samples", () => {
  const multirotor = buildRoutePlan({
    polygon: rectangle,
    headingDeg: 0,
    footprintAlongM: 150,
    footprintAcrossM: 100,
    overlapAlong: 0.8,
    overlapAcross: 0.6,
  });
  const fixedWing = buildRoutePlan({
    polygon: rectangle,
    headingDeg: 0,
    footprintAlongM: 150,
    footprintAcrossM: 100,
    overlapAlong: 0.8,
    overlapAcross: 0.6,
    fixedWing: true,
    turnRadiusM: 70,
  });
  assert.ok(fixedWing.path.length > multirotor.path.length);
  assert.ok(pathLength(fixedWing.path) > 0);
});
