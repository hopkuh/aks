import * as THREE from "three";
import { createViewport, addViewportHelp, makeLabel } from "./sim-viewport.js";
import { createCalibrationScene } from "./sim-scene.js";
import { exposureOffsetEv } from "./sim-optics.js";
import {
  calibrateLinear,
  makeCalibrationObservations,
  projectCalibrated,
  seededNoise,
  triangulateRectified,
} from "./sim-stereo.js";

const SENSOR = { widthMm: 36, heightMm: 24 };
const IMAGE = { width: 720, height: 480 };
const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
const SHUTTERS = [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1];
const ISOS = [100, 200, 400, 800, 1600, 3200, 6400];
const CAMERA_Y = 1.55;
const SCENE_EV = 12;
const TRUE_K1 = -0.085;

const CONTROL_POINTS = [
  { id: 1, name: "ближний человек", p: new THREE.Vector3(-2.4, 1.45, 4.2), color: "#e2b56a" },
  { id: 2, name: "вентилятор", p: new THREE.Vector3(-0.8, 1.34, 5.0), color: "#6ec3d8" },
  { id: 3, name: "машина", p: new THREE.Vector3(1.3, 1.1, 7.1), color: "#e07a73" },
  { id: 4, name: "шахматная мира", p: new THREE.Vector3(-5.3, 1.35, 10.92), color: "#86c99a" },
  { id: 5, name: "радиальная мира", p: new THREE.Vector3(-2.75, 1.35, 10.92), color: "#c47a6a" },
  { id: 6, name: "штриховая мира", p: new THREE.Vector3(-0.2, 1.35, 10.92), color: "#b898d0" },
  { id: 7, name: "цветовая шкала", p: new THREE.Vector3(2.35, 1.35, 10.92), color: "#69c4a0" },
  { id: 8, name: "дальний человек", p: new THREE.Vector3(4.2, 1.45, 13.2), color: "#f09d5f" },
  { id: 9, name: "дом", p: new THREE.Vector3(-6.6, 2.1, 15.2), color: "#d8d0bd" },
];

function fmtTime(value) {
  return value >= 1 ? `${value.toFixed(1)} с` : `1/${Math.round(1 / value)} с`;
}

function addNoise(ctx, iso, seed) {
  if (iso <= 200) return;
  const random = seededNoise(seed);
  const image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const amplitude = Math.min(38, 4.5 * Math.sqrt(iso / 100));
  for (let i = 0; i < image.data.length; i += 4) {
    const n = random() * amplitude * 2;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
}

function cameraModel(scene, color, name) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.34, 0.42),
    new THREE.MeshStandardMaterial({ color })
  );
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.25, 16),
    new THREE.MeshStandardMaterial({ color: 0x26313d })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.3;
  const label = makeLabel(name, `#${color.toString(16).padStart(6, "0")}`);
  label.position.y = 0.45;
  group.add(body, lens, label);
  scene.add(group);
  return group;
}

export function mountFullLab(root) {
  const host = root.querySelector("[data-lab-3d]");
  const labelHost = root.querySelector("[data-lab-labels]");
  const leftCanvas = root.querySelector("[data-lab-left]");
  const rightCanvas = root.querySelector("[data-lab-right]");
  const leftCtx = leftCanvas.getContext("2d", { willReadFrequently: true });
  const rightCtx = rightCanvas.getContext("2d", { willReadFrequently: true });
  const title = root.querySelector("[data-lab-title]");
  const read = root.querySelector("[data-lab-read]");
  const results = root.querySelector("[data-lab-results]");
  const stepButtons = [...root.querySelectorAll("[data-lab-step]")];
  const controls = {
    f: root.querySelector("[data-lab-f]"),
    aperture: root.querySelector("[data-lab-k]"),
    shutter: root.querySelector("[data-lab-t]"),
    iso: root.querySelector("[data-lab-iso]"),
    baseline: root.querySelector("[data-lab-baseline]"),
    noise: root.querySelector("[data-lab-noise]"),
  };

  const scene = new THREE.Scene();
  const objects = createCalibrationScene(scene);
  const observer = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  const viewport = createViewport({
    host,
    labelHost,
    scene,
    camera: observer,
    position: new THREE.Vector3(11, 7, -3),
    target: new THREE.Vector3(0, 1.35, 8),
    maxDistance: 55,
  });
  addViewportHelp(host.closest(".sim-stage"), viewport);

  const leftCamera = new THREE.PerspectiveCamera(45, 1.5, 0.05, 80);
  const rightCamera = new THREE.PerspectiveCamera(45, 1.5, 0.05, 80);
  leftCamera.filmGauge = SENSOR.widthMm;
  rightCamera.filmGauge = SENSOR.widthMm;
  scene.add(leftCamera, rightCamera);
  const leftModel = cameraModel(scene, 0x6ec3d8, "S₁ — левый снимок");
  const rightModel = cameraModel(scene, 0xe07a73, "S₂ — правый снимок");
  const baselineLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xe2b56a })
  );
  scene.add(baselineLine);
  const baselineLabel = makeLabel("B — базис");
  scene.add(baselineLabel);
  const cloud = new THREE.Group();
  scene.add(cloud);

  const captureRenderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  captureRenderer.outputColorSpace = THREE.SRGBColorSpace;
  captureRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  captureRenderer.setPixelRatio(1);
  captureRenderer.setSize(IMAGE.width, IMAGE.height, false);

  const state = {
    step: "scene",
    aperture: 5.6,
    shutter: 1 / 250,
    iso: 100,
    baseline: 1,
    noisePx: 0.3,
    fMm: 35,
    captured: false,
    calibration: null,
    stereo: [],
    selected: 1,
    captureTime: 0.73,
  };

  function trueIntrinsics() {
    return {
      fPx: state.fMm / SENSOR.widthMm * IMAGE.width,
      cx: IMAGE.width / 2,
      cy: IMAGE.height / 2,
      k1: TRUE_K1,
    };
  }

  function configureCameras() {
    const half = state.baseline / 2;
    for (const [camera, x] of [[leftCamera, -half], [rightCamera, half]]) {
      camera.position.set(x, CAMERA_Y, 0);
      camera.lookAt(x, CAMERA_Y, 10);
      camera.filmGauge = SENSOR.widthMm;
      camera.aspect = IMAGE.width / IMAGE.height;
      camera.setFocalLength(state.fMm);
      camera.updateProjectionMatrix();
    }
    leftModel.position.copy(leftCamera.position);
    rightModel.position.copy(rightCamera.position);
    leftModel.quaternion.copy(leftCamera.quaternion);
    rightModel.quaternion.copy(rightCamera.quaternion);
    baselineLine.geometry.dispose();
    baselineLine.geometry = new THREE.BufferGeometry().setFromPoints([
      leftCamera.position,
      rightCamera.position,
    ]);
    baselineLabel.position.set(0, CAMERA_Y + 0.2, 0);
    baselineLabel.element.textContent = `B = ${state.baseline.toFixed(1)} м`;
  }

  function setMotion(time) {
    if (objects.fan?.userData.rotor) objects.fan.userData.rotor.rotation.z = time * 14;
    if (objects.car) objects.car.position.x = 1.3 + Math.sin(time * 0.9) * 0.7;
  }

  function hideRig(hidden) {
    leftModel.visible = !hidden;
    rightModel.visible = !hidden;
    baselineLine.visible = !hidden;
    baselineLabel.visible = !hidden;
    cloud.visible = !hidden;
  }

  function paintExposure(camera, ctx, seed) {
    const offset = exposureOffsetEv(
      state.aperture,
      state.shutter,
      state.iso,
      SCENE_EV
    );
    captureRenderer.toneMappingExposure = Math.max(0.08, Math.min(8, 2 ** -offset));
    const moving = state.shutter >= 1 / 60;
    const samples = moving ? Math.min(20, 8 + Math.round(state.shutter * 16)) : 1;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, IMAGE.width, IMAGE.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1 / samples;
    for (let i = 0; i < samples; i++) {
      const time = state.captureTime - state.shutter / 2 +
        state.shutter * (i + 0.5) / samples;
      setMotion(time);
      captureRenderer.render(scene, camera);
      ctx.drawImage(captureRenderer.domElement, 0, 0, IMAGE.width, IMAGE.height);
    }
    ctx.restore();
    setMotion(state.captureTime);
    addNoise(ctx, state.iso, seed);
    return samples;
  }

  function capturePair(showMeasurements = false) {
    configureCameras();
    leftCanvas.width = rightCanvas.width = IMAGE.width;
    leftCanvas.height = rightCanvas.height = IMAGE.height;
    hideRig(true);
    const leftSamples = paintExposure(leftCamera, leftCtx, 1201);
    paintExposure(rightCamera, rightCtx, 1202);
    hideRig(false);
    setMotion(state.captureTime);
    CONTROL_POINTS[2].p.x = objects.car.position.x;
    state.captured = true;
    if (showMeasurements && state.stereo.length) drawMeasurements();
    return leftSamples;
  }

  function observationPair(point, random = null) {
    const intrinsics = trueIntrinsics();
    const center = {
      x: point.p.x,
      y: point.p.y - CAMERA_Y,
      z: point.p.z,
    };
    const left = projectCalibrated({
      x: center.x + state.baseline / 2,
      y: center.y,
      z: center.z,
    }, intrinsics);
    const right = projectCalibrated({
      x: center.x - state.baseline / 2,
      y: center.y,
      z: center.z,
    }, intrinsics);
    if (random) {
      left.u += random() * state.noisePx * 2;
      left.v += random() * state.noisePx * 2;
      right.u += random() * state.noisePx * 2;
      right.v += random() * state.noisePx * 2;
    }
    return { left, right, truth: center };
  }

  function drawPoint(ctx, image, point, selected) {
    ctx.save();
    ctx.strokeStyle = point.color;
    ctx.fillStyle = selected ? point.color : "#10151c";
    ctx.lineWidth = selected ? 4 : 2;
    ctx.beginPath();
    ctx.arc(image.u, image.v, selected ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = point.color;
    ctx.font = "bold 13px Segoe UI, sans-serif";
    ctx.fillText(String(point.id), image.u + 9, image.v - 8);
    if (selected) {
      ctx.strokeStyle = `${point.color}99`;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(0, image.v);
      ctx.lineTo(IMAGE.width, image.v);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMeasurements() {
    for (const item of state.stereo) {
      const point = CONTROL_POINTS.find((candidate) => candidate.id === item.id);
      const selected = item.id === state.selected;
      drawPoint(leftCtx, item.left, point, selected);
      drawPoint(rightCtx, item.right, point, selected);
    }
  }

  function calibrate() {
    const truth = trueIntrinsics();
    const observations = makeCalibrationObservations({
      intrinsics: truth,
      views: 9,
      noisePx: state.noisePx,
      seed: 2026,
    });
    state.calibration = calibrateLinear(observations);
    state.step = "calibration";
    syncStep();
  }

  function clearCloud() {
    while (cloud.children.length) {
      const object = cloud.children.pop();
      object.geometry?.dispose();
      object.material?.dispose();
    }
  }

  function processStereo() {
    if (!state.captured) capturePair();
    if (!state.calibration) calibrate();
    const random = seededNoise(9042);
    state.stereo = CONTROL_POINTS.map((point) => {
      const measured = observationPair(point, random);
      const reconstructed = triangulateRectified(
        measured.left,
        measured.right,
        state.calibration,
        state.baseline
      );
      const errorM = Math.hypot(
        reconstructed.x - measured.truth.x,
        reconstructed.y - measured.truth.y,
        reconstructed.z - measured.truth.z
      );
      return {
        id: point.id,
        ...measured,
        reconstructed,
        errorM,
      };
    });
    clearCloud();
    for (const item of state.stereo) {
      const source = CONTROL_POINTS.find((point) => point.id === item.id);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 12, 10),
        new THREE.MeshBasicMaterial({ color: source.color })
      );
      dot.position.set(
        item.reconstructed.x,
        item.reconstructed.y + CAMERA_Y,
        item.reconstructed.z
      );
      dot.add(makeLabel(`p${item.id}`, source.color));
      cloud.add(dot);
      const error = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          source.p,
          dot.position,
        ]),
        new THREE.LineBasicMaterial({ color: 0xff5c5c })
      );
      cloud.add(error);
    }
    capturePair(true);
    state.step = "stereo";
    syncStep();
  }

  function selectedMeasurement() {
    return state.stereo.find((item) => item.id === state.selected);
  }

  function syncStep() {
    stepButtons.forEach((button) => {
      button.classList.toggle("is-on", button.dataset.labStep === state.step);
    });
    const offset = exposureOffsetEv(
      state.aperture,
      state.shutter,
      state.iso,
      SCENE_EV
    );
    const calibration = state.calibration;
    const selected = selectedMeasurement();
    const rmse = state.stereo.length
      ? Math.sqrt(state.stereo.reduce((sum, item) => sum + item.errorM ** 2, 0) / state.stereo.length)
      : null;
    const content = {
      scene: {
        title: "Подготовка сцены",
        body: `<p><strong>Синтетическая сцена</strong> содержит миры, масштабную линейку и объекты на известных расстояниях.</p>
          <p>Выберите f, K, t, ISO, базис B и ошибку измерения координат.</p>
          <p>Эталонные координаты скрыты от алгоритма и используются только для оценки результата.</p>`,
      },
      capture: {
        title: "Съёмка стереопары",
        body: `<p>Обе камеры имеют одинаковые внутренние параметры и экспонируются синхронно.</p>
          <p>Экспозиционное отклонение: <strong>${offset >= 0 ? "+" : ""}${offset.toFixed(1)} EV</strong>.</p>
          <p>Длинная выдержка размывает вентилятор и машину; высокое ISO добавляет шум только снимкам.</p>`,
      },
      calibration: {
        title: "Калибровка камеры",
        body: calibration
          ? `<p>По ${calibration.count} изображениям узлов шахматной миры оценены внутренние параметры.</p>
            <p>f = ${(calibration.fPx * SENSOR.widthMm / IMAGE.width).toFixed(3)} мм; x₀ = ${calibration.cx.toFixed(2)} px; y₀ = ${calibration.cy.toFixed(2)} px.</p>
            <p>k₁ = ${calibration.k1.toFixed(5)}; ошибка репроекции = <strong>${calibration.rmsePx.toFixed(3)} px</strong>.</p>`
          : `<p>Нажмите «Калибровать». Алгоритм оценит f, главную точку и радиальную дисторсию k₁ методом наименьших квадратов.</p>`,
      },
      stereo: {
        title: "Измерение стереопары",
        body: selected
          ? `<p>Точка ${selected.id}: ${CONTROL_POINTS.find((p) => p.id === selected.id).name}.</p>
            <p>Горизонтальный параллакс p = <strong>${selected.reconstructed.disparityPx.toFixed(2)} px</strong>.</p>
            <p>Остаточный вертикальный параллакс = ${selected.reconstructed.verticalParallaxPx.toFixed(2)} px.</p>
            <p>Z = f<sub>px</sub>·B/p = ${selected.reconstructed.z.toFixed(3)} м.</p>
            <p class="muted">Щёлкните по измеренной точке на любом снимке. Пунктиром показана её эпиполярная линия.</p>`
          : `<p>Нажмите «Обработать»: будут измерены одноимённые точки, построены эпиполярные линии и вычислены параллаксы.</p>`,
      },
      result: {
        title: "Восстановленные 3D-точки",
        body: rmse == null
          ? `<p>Сначала обработайте стереопару.</p>`
          : `<p>В 3D-сцене цветные точки — реконструкция, красные отрезки — ошибка относительно эталона.</p>
            <p>Среднеквадратическая пространственная ошибка = <strong>${rmse.toFixed(3)} м</strong>.</p>
            <p>Измените базис B или ошибку измерения и сравните устойчивость глубины.</p>`,
      },
    }[state.step];
    title.textContent = content.title;
    read.innerHTML = content.body;
    results.innerHTML = state.stereo.length
      ? `<div class="sim-result-list">${state.stereo.map((item) =>
          `<div><span>Точка ${item.id}</span><span class="${item.errorM < 0.08 ? "sim-result-ok" : "sim-result-warn"}">σ = ${item.errorM.toFixed(3)} м</span></div>`
        ).join("")}</div>`
      : "";
  }

  function syncControls() {
    state.fMm = Number(controls.f.value);
    state.aperture = APERTURES[Number(controls.aperture.value)];
    state.shutter = SHUTTERS[Number(controls.shutter.value)];
    state.iso = ISOS[Number(controls.iso.value)];
    state.baseline = Number(controls.baseline.value);
    state.noisePx = Number(controls.noise.value);
    root.querySelector("[data-lab-fval]").textContent = `${state.fMm} мм`;
    root.querySelector("[data-lab-kval]").textContent = `f/${state.aperture}`;
    root.querySelector("[data-lab-tval]").textContent = fmtTime(state.shutter);
    root.querySelector("[data-lab-isoval]").textContent = `${state.iso}`;
    root.querySelector("[data-lab-bval]").textContent = `${state.baseline.toFixed(1).replace(".", ",")} м`;
    root.querySelector("[data-lab-noiseval]").textContent = `${state.noisePx.toFixed(1).replace(".", ",")} px`;
    state.calibration = null;
    state.stereo = [];
    state.captured = false;
    clearCloud();
    configureCameras();
    syncStep();
  }

  stepButtons.forEach((button) => button.addEventListener("click", () => {
    state.step = button.dataset.labStep;
    syncStep();
  }));
  Object.values(controls).forEach((input) => input.addEventListener("input", syncControls));
  root.querySelector("[data-lab-capture]").addEventListener("click", () => {
    const samples = capturePair();
    state.step = "capture";
    syncStep();
    read.insertAdjacentHTML("beforeend", `<p>Кадр построен накоплением ${samples} подкадров.</p>`);
  });
  root.querySelector("[data-lab-calibrate]").addEventListener("click", calibrate);
  root.querySelector("[data-lab-process]").addEventListener("click", processStereo);

  function selectFromCanvas(event, canvas, side) {
    if (!state.stereo.length) return;
    const rect = canvas.getBoundingClientRect();
    const u = (event.clientX - rect.left) / rect.width * IMAGE.width;
    const v = (event.clientY - rect.top) / rect.height * IMAGE.height;
    const best = state.stereo
      .map((item) => ({
        item,
        distance: Math.hypot(item[side].u - u, item[side].v - v),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!best || best.distance > 28) return;
    state.selected = best.item.id;
    capturePair(true);
    state.step = "stereo";
    syncStep();
  }
  leftCanvas.addEventListener("click", (event) => selectFromCanvas(event, leftCanvas, "left"));
  rightCanvas.addEventListener("click", (event) => selectFromCanvas(event, rightCanvas, "right"));

  configureCameras();
  syncStep();
  const baseWake = viewport.wake;
  return {
    ...viewport,
    resize() {
      viewport.resize();
    },
    wake() {
      baseWake();
      viewport.resize();
    },
    dispose() {
      captureRenderer.dispose();
      viewport.dispose();
    },
  };
}
