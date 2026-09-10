import * as THREE from "three";
import { createViewport, addViewportHelp, makeLabel } from "./sim-viewport.js?v=20260907-2";
import { createCalibrationScene } from "./sim-scene.js?v=20260907-2";
import {
  cameraIntrinsics,
  distortNormalized,
  undistortNormalized,
  normalizedToPixel,
  pixelToNormalized,
  projectCalibrated,
  triangulateRectified,
  exposureOffsetEv,
  makeBrownCalibrationObservations,
  calibrateBrownLinear,
} from "./sim-optics.js";

const IMAGE = { width: 600, height: 400 };
const SENSOR = { widthMm: 36, heightMm: 24 };
const STOPS = {
  aperture: [1.4, 2, 2.8, 4, 5.6, 8, 11, 16],
  shutter: [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1],
  iso: [100, 200, 400, 800, 1600, 3200, 6400],
};
const COLORS = ["#e2b56a", "#6ec3d8", "#e07a73", "#86c99a", "#cc83d9", "#f2f0e7"];

function fmtTime(value) {
  return value >= 1 ? `${value.toFixed(1)} с` : `1/${Math.round(1 / value)} с`;
}

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE.width;
  canvas.height = IMAGE.height;
  return canvas;
}

function copyCanvas(source, target) {
  target.width = IMAGE.width;
  target.height = IMAGE.height;
  target.getContext("2d").drawImage(source, 0, 0, IMAGE.width, IMAGE.height);
}

function applyNoise(canvas, iso) {
  if (iso <= 200) return;
  const ctx = canvas.getContext("2d");
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const amplitude = Math.min(36, Math.sqrt(iso / 100) * 4);
  for (let i = 0; i < image.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amplitude;
    image.data[i] += noise;
    image.data[i + 1] += noise;
    image.data[i + 2] += noise;
  }
  ctx.putImageData(image, 0, 0);
}

function remapImage(source, intrinsics, coefficients, correction = false) {
  const src = source.getContext("2d").getImageData(0, 0, source.width, source.height);
  const output = makeCanvas();
  const dst = output.getContext("2d").createImageData(source.width, source.height);
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const normalized = pixelToNormalized({ x, y }, intrinsics);
      const sampleNormalized = correction
        ? distortNormalized(normalized, coefficients)
        : undistortNormalized(normalized, coefficients, 6);
      const sample = normalizedToPixel(sampleNormalized, intrinsics);
      const sx = Math.round(sample.x);
      const sy = Math.round(sample.y);
      const di = (y * source.width + x) * 4;
      if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height) {
        dst.data[di + 3] = 255;
        continue;
      }
      const si = (sy * source.width + sx) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = 255;
    }
  }
  output.getContext("2d").putImageData(dst, 0, 0);
  return output;
}

function packedDepth(bytes, index) {
  const downscale = 255 / 256;
  return (
    bytes[index] / 255 * downscale +
    bytes[index + 1] / 255 * downscale / 256 +
    bytes[index + 2] / 255 * downscale / (256 * 256) +
    bytes[index + 3] / 255 / (256 * 256 * 256)
  );
}

export function mountWorkflowSim(root) {
  const host = root.querySelector("[data-wf-canvas]");
  const labelHost = root.querySelector("[data-wf-labels]");
  const read = root.querySelector("[data-wf-read]");
  const action = root.querySelector("[data-wf-action]");
  const showParams = root.querySelector("[data-wf-show-params]");
  const paramsPanel = root.querySelector("[data-wf-params-panel]");
  const stepButtons = [...root.querySelectorAll("[data-wf-step]")];
  const stepPanels = [...root.querySelectorAll("[data-wf-step-panel]")];
  const canvases = {
    left: root.querySelector("[data-wf-left]"),
    right: root.querySelector("[data-wf-right]"),
    calibration: root.querySelector("[data-wf-calibration]"),
    matchLeft: root.querySelector("[data-wf-match-left]"),
    matchRight: root.querySelector("[data-wf-match-right]"),
    depth: root.querySelector("[data-wf-depth]"),
  };
  const controls = {
    f: root.querySelector("[data-wf-f]"),
    aperture: root.querySelector("[data-wf-k]"),
    shutter: root.querySelector("[data-wf-t]"),
    iso: root.querySelector("[data-wf-iso]"),
    baseline: root.querySelector("[data-wf-b]"),
    distance: root.querySelector("[data-wf-d]"),
    k1: root.querySelector("[data-wf-k1]"),
    k2: root.querySelector("[data-wf-k2]"),
    p1: root.querySelector("[data-wf-p1]"),
    p2: root.querySelector("[data-wf-p2]"),
  };

  const scene = new THREE.Scene();
  const objects = createCalibrationScene(scene);
  const observer = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  const viewport = createViewport({
    host,
    labelHost,
    scene,
    camera: observer,
    position: new THREE.Vector3(10, 7, -3),
    target: new THREE.Vector3(0, 1.4, 8),
    maxDistance: 55,
  });
  addViewportHelp(host.closest(".sim-stage"), viewport);

  const stereoRig = new THREE.Group();
  const cameraModels = [];
  for (const side of [-1, 1]) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.4),
      new THREE.MeshStandardMaterial({ color: side < 0 ? 0x6ec3d8 : 0xe07a73 })
    );
    const label = makeLabel(side < 0 ? "Левая камера S₁" : "Правая камера S₂");
    label.position.y = 0.42;
    body.add(label);
    stereoRig.add(body);
    cameraModels.push(body);
  }
  const baselineLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xe2b56a })
  );
  stereoRig.add(baselineLine);
  scene.add(stereoRig);

  const cloud = new THREE.Group();
  cloud.visible = false;
  scene.add(cloud);
  const captureRenderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  captureRenderer.setSize(IMAGE.width, IMAGE.height, false);
  captureRenderer.outputColorSpace = THREE.SRGBColorSpace;
  captureRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  const leftCamera = new THREE.PerspectiveCamera(45, 1.5, 0.05, 80);
  const rightCamera = new THREE.PerspectiveCamera(45, 1.5, 0.05, 80);
  const idealLeft = makeCanvas();
  const idealRight = makeCanvas();
  let leftBase = makeCanvas();
  let rightBase = makeCanvas();
  let captured = false;
  let calibrated = false;
  let calibration = null;
  let currentStep = "capture";
  let lastReconstruction = [];

  function params() {
    return {
      focalMm: Number(controls.f.value),
      aperture: STOPS.aperture[Number(controls.aperture.value)],
      shutter: STOPS.shutter[Number(controls.shutter.value)],
      iso: STOPS.iso[Number(controls.iso.value)],
      baselineM: Number(controls.baseline.value),
      distanceM: Number(controls.distance.value),
      distortion: {
        k1: Number(controls.k1.value),
        k2: Number(controls.k2.value),
        p1: Number(controls.p1.value),
        p2: Number(controls.p2.value),
      },
    };
  }

  function intrinsics(p = params()) {
    return cameraIntrinsics({
      focalMm: p.focalMm,
      sensorWidthMm: SENSOR.widthMm,
      sensorHeightMm: SENSOR.heightMm,
      imageWidthPx: IMAGE.width,
      imageHeightPx: IMAGE.height,
    });
  }

  function configureCameras(p = params()) {
    const z = 11 - p.distanceM;
    for (const camera of [leftCamera, rightCamera]) {
      camera.filmGauge = SENSOR.widthMm;
      camera.setFocalLength(p.focalMm);
      camera.aspect = IMAGE.width / IMAGE.height;
      camera.updateProjectionMatrix();
    }
    leftCamera.position.set(-p.baselineM / 2, 1.55, z);
    rightCamera.position.set(p.baselineM / 2, 1.55, z);
    leftCamera.lookAt(-p.baselineM / 2, 1.55, z + 10);
    rightCamera.lookAt(p.baselineM / 2, 1.55, z + 10);
    cameraModels[0].position.copy(leftCamera.position);
    cameraModels[1].position.copy(rightCamera.position);
    cameraModels.forEach((model) => model.rotation.y = Math.PI);
    baselineLine.geometry.dispose();
    baselineLine.geometry = new THREE.BufferGeometry().setFromPoints([
      leftCamera.position,
      rightCamera.position,
    ]);
  }

  function setMotion(time) {
    if (objects.fan?.userData.rotor) objects.fan.userData.rotor.rotation.z = time * 14;
    if (objects.car) objects.car.position.x = 1.3 + Math.sin(time * 1.8) * 1.5;
    if (objects.personNear) objects.personNear.position.x = -2.4 + Math.sin(time * 0.8) * 0.45;
  }

  function renderOne(camera, targetCanvas, p, time) {
    const ctx = targetCanvas.getContext("2d");
    ctx.clearRect(0, 0, IMAGE.width, IMAGE.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, IMAGE.width, IMAGE.height);
    const samples = Math.max(12, Math.min(24, Math.round(12 + p.shutter * 14)));
    const center = time;
    captureRenderer.toneMappingExposure = Math.max(
      0.08,
      Math.min(8, 2 ** -exposureOffsetEv(p.aperture, p.shutter, p.iso, 13))
    );
    stereoRig.visible = false;
    cloud.visible = false;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1 / samples;
    for (let i = 0; i < samples; i++) {
      setMotion(center + p.shutter * (i / (samples - 1) - 0.5));
      captureRenderer.render(scene, camera);
      ctx.drawImage(captureRenderer.domElement, 0, 0);
    }
    ctx.restore();
    stereoRig.visible = true;
    return samples;
  }

  function capturePair() {
    const p = params();
    configureCameras(p);
    const time = performance.now() / 1000;
    const samples = renderOne(leftCamera, idealLeft, p, time);
    renderOne(rightCamera, idealRight, p, time);
    leftBase = remapImage(idealLeft, intrinsics(p), p.distortion, false);
    rightBase = remapImage(idealRight, intrinsics(p), p.distortion, false);
    applyNoise(leftBase, p.iso);
    applyNoise(rightBase, p.iso);
    copyCanvas(leftBase, canvases.left);
    copyCanvas(rightBase, canvases.right);
    captured = true;
    calibrated = false;
    calibration = null;
    cloud.visible = false;
    const offset = exposureOffsetEv(p.aperture, p.shutter, p.iso, 13);
    read.innerHTML = `
      <p><strong>Стереопара снята синхронно.</strong></p>
      <p>f = ${p.focalMm} мм; K = f/${p.aperture}; t = ${fmtTime(p.shutter)}; ISO ${p.iso}.</p>
      <p>Экспозиционное отклонение ${offset >= 0 ? "+" : ""}${offset.toFixed(1)} EV; накоплено ${samples} подкадров.</p>
      <p>Базис B = ${p.baselineM.toFixed(2)} м; камеры параллельны, поэтому эпиполярные линии после калибровки горизонтальны.</p>
      <p class="muted">В снимки внесены радиальная и тангенциальная дисторсия, ISO-шум и смаз движущихся объектов.</p>`;
  }

  function calibrationGrid() {
    const canvas = canvases.calibration;
    canvas.width = IMAGE.width;
    canvas.height = IMAGE.height;
    const ctx = canvas.getContext("2d");
    const p = params();
    const K = intrinsics(p);
    ctx.fillStyle = "#10151c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#334252";
    ctx.strokeRect(45, 35, canvas.width - 90, canvas.height - 70);
    for (let gy = -4; gy <= 4; gy++) {
      for (let gx = -6; gx <= 6; gx++) {
        const idealN = { x: gx * 0.105, y: gy * 0.095 };
        const distortedN = distortNormalized(idealN, p.distortion);
        const ideal = normalizedToPixel(idealN, K);
        const distorted = normalizedToPixel(distortedN, K);
        ctx.strokeStyle = "#e07a73";
        ctx.beginPath();
        ctx.moveTo(ideal.x, ideal.y);
        ctx.lineTo(distorted.x, distorted.y);
        ctx.stroke();
        ctx.fillStyle = "#6ec3d8";
        ctx.beginPath();
        ctx.arc(ideal.x, ideal.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = calibrated ? "#86c99a" : "#e2b56a";
        ctx.beginPath();
        ctx.arc(distorted.x, distorted.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#e9eef4";
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.fillText("Голубые точки — идеальная сетка", 16, 20);
    ctx.fillStyle = calibrated ? "#86c99a" : "#e2b56a";
    ctx.fillText(calibrated ? "Зелёные точки — исправленные измерения" : "Золотые точки — измерения с дисторсией", 250, 20);
  }

  function calibrate() {
    if (!captured) capturePair();
    const p = params();
    const K = intrinsics(p);
    const observations = makeBrownCalibrationObservations({
      intrinsics: K,
      coefficients: p.distortion,
      views: 12,
      columns: 9,
      rows: 7,
      noisePx: 0.18,
      seed: 73,
    });
    calibration = calibrateBrownLinear(observations);
    calibrated = true;
    calibrationGrid();
    read.innerHTML = `
      <p><strong>Калибровка выполнена по 12 положениям шахматной миры.</strong></p>
      <p>Внутреннее ориентирование: f<sub>x</sub> = ${calibration.fx.toFixed(2)} px; f<sub>y</sub> = ${calibration.fy.toFixed(2)} px; x₀ = ${calibration.cx.toFixed(2)} px; y₀ = ${calibration.cy.toFixed(2)} px.</p>
      <p>Оценённая модель Брауна—Конради: k₁ = ${calibration.k1.toFixed(4)}; k₂ = ${calibration.k2.toFixed(4)}; p₁ = ${calibration.p1.toFixed(5)}; p₂ = ${calibration.p2.toFixed(5)}.</p>
      <p>${calibration.count} измерений; средняя ошибка репроекции RMS = ${calibration.rmsePx.toFixed(3)} px.</p>
      <p class="muted">Калибровка оценивает параметры камеры, а не меняет положение объектов. Следующий этап исправляет координаты точек и изображения.</p>`;
  }

  function landmarks() {
    const list = [];
    const ids = ["checker", "star", "bars", "tones", "personNear", "car", "fan", "house"];
    ids.forEach((id) => {
      const object = objects[id];
      if (!object?.visible) return;
      const box = new THREE.Box3().setFromObject(object);
      list.push({
        id,
        name: object.name || id,
        world: box.getCenter(new THREE.Vector3()),
      });
      if (["checker", "star", "bars", "tones"].includes(id)) {
        list.push({
          id: `${id}-top`,
          name: `${object.name || id}, верх`,
          world: new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        });
      }
    });
    return list;
  }

  function observe(world, camera, p, corrected) {
    const pointCamera = {
      x: world.x - camera.position.x,
      y: camera.position.y - world.y,
      z: world.z - camera.position.z,
    };
    const K = intrinsics(p);
    const measured = projectCalibrated(pointCamera, K, p.distortion);
    if (!corrected || !measured) return measured;
    const estimated = calibration ?? { ...K, ...p.distortion };
    return normalizedToPixel(
      undistortNormalized(pixelToNormalized(measured, estimated), estimated),
      estimated
    );
  }

  function drawMatches() {
    if (!captured) capturePair();
    const p = params();
    const K = calibrated && calibration ? calibration : intrinsics(p);
    const correction = calibrated && calibration ? calibration : p.distortion;
    const correctedLeft = calibrated
      ? remapImage(leftBase, K, correction, true)
      : leftBase;
    const correctedRight = calibrated
      ? remapImage(rightBase, K, correction, true)
      : rightBase;
    copyCanvas(correctedLeft, canvases.matchLeft);
    copyCanvas(correctedRight, canvases.matchRight);
    const leftCtx = canvases.matchLeft.getContext("2d");
    const rightCtx = canvases.matchRight.getContext("2d");
    const observations = [];
    landmarks().forEach((landmark, index) => {
      const left = observe(landmark.world, leftCamera, p, calibrated);
      const right = observe(landmark.world, rightCamera, p, calibrated);
      if (!left || !right) return;
      const color = COLORS[index % COLORS.length];
      for (const [ctx, point] of [[leftCtx, left], [rightCtx, right]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(0, point.y);
        ctx.lineTo(IMAGE.width, point.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(point.x - 6, point.y);
        ctx.lineTo(point.x + 6, point.y);
        ctx.moveTo(point.x, point.y - 6);
        ctx.lineTo(point.x, point.y + 6);
        ctx.stroke();
      }
      observations.push({ ...landmark, left, right });
    });
    read.innerHTML = `
      <p><strong>Найдено ${observations.length} синтетических соответствий.</strong></p>
      <p>${calibrated ? "Дисторсия исправлена: одноимённые точки лежат на горизонтальных эпиполярных линиях." : "Калибровка ещё не применена: тангенциальная дисторсия нарушает горизонтальность линий."}</p>
      <p>Горизонтальный параллакс d = x<sub>L</sub> − x<sub>R</sub>. Чем объект ближе, тем больше d.</p>`;
    return observations;
  }

  function reconstruct() {
    const observations = drawMatches();
    const p = params();
    const K = calibrated && calibration ? calibration : intrinsics(p);
    lastReconstruction = observations.map((observation) => {
      const point = triangulateRectified(
        observation.left,
        observation.right,
        K,
        p.baselineM
      );
      const trueDepth = observation.world.z - leftCamera.position.z;
      return {
        ...observation,
        point,
        trueDepth,
        error: point ? Math.abs(point.z - trueDepth) : Infinity,
      };
    });
    root.querySelector("[data-wf-table]").innerHTML = `
      <table>
        <thead><tr><th>Точка</th><th>d, px</th><th>Z истин., м</th><th>Z по стерео, м</th><th>|ΔZ|, м</th></tr></thead>
        <tbody>${lastReconstruction.map((row) => `
          <tr><td>${row.name}</td><td>${row.point?.disparity.toFixed(2) ?? "—"}</td>
          <td>${row.trueDepth.toFixed(2)}</td><td>${row.point?.z.toFixed(2) ?? "—"}</td>
          <td>${Number.isFinite(row.error) ? row.error.toFixed(3) : "—"}</td></tr>`).join("")}</tbody>
      </table>`;
    const valid = lastReconstruction.filter((row) => Number.isFinite(row.error));
    const mean = valid.reduce((sum, row) => sum + row.error, 0) / Math.max(1, valid.length);
    read.innerHTML = `
      <p><strong>Взаимное ориентирование:</strong> пара камер восстановлена с базисом B = ${p.baselineM.toFixed(2)} м.</p>
      <p>Для ректифицированной пары Z = f<sub>px</sub>·B/d.</p>
      <p>Средняя ошибка глубины по характерным точкам: ${mean.toFixed(3)} м.</p>
      <p class="muted">В общем случае используются две пространственные прямые; здесь ректификация сводит их пересечение к формуле по горизонтальному параллаксу.</p>`;
  }

  function buildCloud() {
    cloud.clear();
    const p = params();
    const cameraZ = 11 - p.distanceM;
    lastReconstruction.forEach((row, index) => {
      if (!row.point) return;
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 8),
        new THREE.MeshBasicMaterial({ color: COLORS[index % COLORS.length] })
      );
      dot.position.set(
        row.point.x,
        1.55 - row.point.y,
        cameraZ + row.point.z
      );
      cloud.add(dot);
    });
    cloud.visible = true;
  }

  function depthMap() {
    if (!lastReconstruction.length) reconstruct();
    const p = params();
    const target = new THREE.WebGLRenderTarget(IMAGE.width, IMAGE.height);
    const depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
    });
    const hidden = [];
    scene.traverse((object) => {
      if (object.isLine || object === stereoRig || object === cloud) {
        hidden.push([object, object.visible]);
        object.visible = false;
      }
    });
    const previousBackground = scene.background;
    const previousClear = captureRenderer.getClearColor(new THREE.Color());
    const previousAlpha = captureRenderer.getClearAlpha();
    scene.background = null;
    captureRenderer.setClearColor(0xffffff, 1);
    scene.overrideMaterial = depthMaterial;
    captureRenderer.setRenderTarget(target);
    captureRenderer.render(scene, leftCamera);
    const pixels = new Uint8Array(IMAGE.width * IMAGE.height * 4);
    captureRenderer.readRenderTargetPixels(target, 0, 0, IMAGE.width, IMAGE.height, pixels);
    captureRenderer.setRenderTarget(null);
    scene.overrideMaterial = null;
    scene.background = previousBackground;
    captureRenderer.setClearColor(previousClear, previousAlpha);
    hidden.forEach(([object, visible]) => object.visible = visible);

    const canvas = canvases.depth;
    canvas.width = IMAGE.width;
    canvas.height = IMAGE.height;
    const ctx = canvas.getContext("2d");
    const output = ctx.createImageData(IMAGE.width, IMAGE.height);
    for (let y = 0; y < IMAGE.height; y++) {
      for (let x = 0; x < IMAGE.width; x++) {
        const si = ((IMAGE.height - 1 - y) * IMAGE.width + x) * 4;
        const di = (y * IMAGE.width + x) * 4;
        const depth = packedDepth(pixels, si);
        if (depth >= 0.99999) {
          output.data[di + 3] = 255;
          continue;
        }
        const viewZ = (leftCamera.near * leftCamera.far) /
          ((leftCamera.far - leftCamera.near) * depth - leftCamera.far);
        const z = Math.max(0.1, -viewZ);
        const normalized = Math.max(0, Math.min(1, (z - 3) / 18));
        output.data[di] = Math.round(235 * (1 - normalized));
        output.data[di + 1] = Math.round(90 + 150 * (1 - Math.abs(normalized - 0.5) * 2));
        output.data[di + 2] = Math.round(235 * normalized);
        output.data[di + 3] = 255;
      }
    }
    ctx.putImageData(output, 0, 0);
    ctx.fillStyle = "#e9eef4";
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.fillText("ближе", 12, 22);
    ctx.textAlign = "right";
    ctx.fillText("дальше", IMAGE.width - 12, 22);
    target.dispose();
    depthMaterial.dispose();
    buildCloud();
    read.innerHTML = `
      <p><strong>Эталонная карта глубины построена из z-buffer синтетической сцены.</strong></p>
      <p>Тёплые цвета соответствуют близким объектам, холодные — дальним.</p>
      <p>Разреженное облако в 3D-виде вычислено независимо: Z = f<sub>px</sub>·B/d по измеренному параллаксу.</p>
      <p class="muted">Эталон позволяет проверить стереорезультат. Плотный автоматический поиск соответствий здесь намеренно не имитируется.</p>`;
  }

  function syncLabels() {
    const p = params();
    root.querySelector("[data-wf-fval]").textContent = `${p.focalMm} мм`;
    root.querySelector("[data-wf-kval]").textContent = `f/${p.aperture}`;
    root.querySelector("[data-wf-tval]").textContent = fmtTime(p.shutter);
    root.querySelector("[data-wf-isoval]").textContent = `${p.iso}`;
    root.querySelector("[data-wf-bval]").textContent = `${p.baselineM.toFixed(2).replace(".", ",")} м`;
    root.querySelector("[data-wf-dval]").textContent = `${p.distanceM.toFixed(1).replace(".", ",")} м`;
    for (const key of ["k1", "k2", "p1", "p2"]) {
      root.querySelector(`[data-wf-${key}val]`).textContent =
        p.distortion[key].toFixed(key.startsWith("p") ? 3 : 2).replace("-", "−").replace(".", ",");
    }
    configureCameras(p);
  }

  const actions = {
    capture: ["Снять стереопару", capturePair],
    calibration: ["Выполнить калибровку", calibrate],
    stereo: ["Найти соответствия", drawMatches],
    orientation: ["Выполнить ориентирование", reconstruct],
    depth: ["Построить глубину", depthMap],
  };

  function showStep(step) {
    currentStep = step;
    stepButtons.forEach((button) => button.classList.toggle("is-on", button.dataset.wfStep === step));
    stepPanels.forEach((panel) => panel.classList.toggle("is-on", panel.dataset.wfStepPanel === step));
    action.textContent = actions[step][0];
    cloud.visible = step === "depth" && lastReconstruction.length > 0;
    if (step === "calibration") calibrationGrid();
    if (step === "stereo" && captured) drawMatches();
    if (step === "orientation" && captured) reconstruct();
    if (step === "depth" && captured) depthMap();
  }

  stepButtons.forEach((button) => button.addEventListener("click", () => showStep(button.dataset.wfStep)));
  action.addEventListener("click", () => actions[currentStep][1]());
  showParams.addEventListener("change", () => {
    paramsPanel.hidden = !showParams.checked;
  });
  Object.values(controls).forEach((control) => control.addEventListener("input", () => {
    syncLabels();
    captured = false;
    calibrated = false;
    calibration = null;
    cloud.visible = false;
    if (currentStep === "calibration") calibrationGrid();
    read.innerHTML = "<p>Параметры изменены. Повторите съёмку и последующие этапы.</p>";
  }));

  syncLabels();
  calibrationGrid();
  capturePair();
  const baseWake = viewport.wake;
  return {
    ...viewport,
    resize() {
      viewport.resize();
    },
    wake() {
      baseWake();
      syncLabels();
    },
    dispose() {
      captureRenderer.dispose();
      viewport.dispose();
    },
  };
}
