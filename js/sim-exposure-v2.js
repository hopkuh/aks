import * as THREE from "three";
import { createViewport, addViewportHelp, makeLabel } from "./sim-viewport.js?v=20260907-2";
import {
  createCalibrationScene,
  createHouse,
  createCar,
  createPerson,
} from "./sim-scene.js?v=20260910-1";
import { exposureOffsetEv } from "./sim-optics.js";

const STOPS = {
  aperture: [1.4, 2, 2.8, 4, 5.6, 8, 11, 16],
  shutter: [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1],
  iso: [100, 200, 400, 800, 1600, 3200, 6400],
};

const nearest = (list, value) =>
  list.reduce((a, b) => Math.abs(a - value) < Math.abs(b - value) ? a : b);

function fmtTime(value) {
  return value >= 1 ? `${value.toFixed(1)} с` : `1/${Math.round(1 / value)} с`;
}

function pingpong(initial, velocity, time, min, max) {
  const length = max - min;
  let value = (initial - min + velocity * time) % (2 * length);
  if (value < 0) value += 2 * length;
  return value <= length ? min + value : max - (value - length);
}

export function mountExposureSim(root) {
  const shot = root.querySelector("[data-exp-photo]");
  const originalStage = shot.closest(".sim-stage");
  const observerStage = document.createElement("div");
  observerStage.className = "sim-stage sim-stage--photo sim-stage--observer";
  observerStage.innerHTML = `<div class="sim-canvas" data-exp-3d></div><div class="sim-labels" data-exp-labels></div>`;
  originalStage.before(observerStage);
  const host = observerStage.querySelector("[data-exp-3d]");
  const labelHost = observerStage.querySelector("[data-exp-labels]");
  const read = root.querySelector("[data-exp-read]");
  const kEl = root.querySelector("[data-exp-k]");
  const tEl = root.querySelector("[data-exp-t]");
  const isoEl = root.querySelector("[data-exp-iso]");
  const modeButtons = [...root.querySelectorAll("[data-exp-mode]")];
  const sceneButtons = [...root.querySelectorAll("[data-exp-scene]")];
  const snap = root.querySelector("[data-exp-snap]");
  const live = root.querySelector("[data-exp-live]");

  const scene = new THREE.Scene();
  const lab = createCalibrationScene(scene);
  const house = createHouse();
  house.position.set(-4.8, 0, 16);
  house.add(makeLabel("Дом: неподвижный объект"));
  const car = createCar();
  car.position.set(2.5, 0, 9);
  car.rotation.y = Math.PI / 2;
  car.add(makeLabel("Машина: 9 м/с"));
  const person = createPerson();
  person.position.set(-1.8, 0, 7);
  person.add(makeLabel("Человек: 1,2 м/с"));
  scene.add(house, car, person);

  const observer = new THREE.PerspectiveCamera(48, 1, 0.05, 120);
  const viewport = createViewport({
    host,
    labelHost,
    scene,
    camera: observer,
    position: new THREE.Vector3(10, 6.5, -2),
    target: new THREE.Vector3(0, 1.3, 8),
    maxDistance: 55,
    onFrame: (_dt, time) => {
      if (state.live) setMotion(time);
    },
  });
  addViewportHelp(observerStage, viewport);

  const capture = new THREE.PerspectiveCamera(48, 1.5, 0.05, 100);
  capture.position.set(0, 1.55, 0);
  capture.filmGauge = 36;
  capture.setFocalLength(35);
  capture.lookAt(0, 1.55, 10);
  const captureRenderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  captureRenderer.outputColorSpace = THREE.SRGBColorSpace;
  captureRenderer.setPixelRatio(1);
  captureRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  const ctx = shot.getContext("2d", { willReadFrequently: true });

  const state = {
    mode: "M",
    scene: "table",
    aperture: 2.8,
    shutter: 1 / 125,
    iso: 100,
    live: true,
    time: 0,
  };

  function setVisible() {
    const isLab = state.scene === "table";
    Object.values(lab).forEach((object) => {
      object.visible = isLab;
    });
    house.visible = !isLab;
    car.visible = !isLab;
    person.visible = !isLab;
    capture.position.y = isLab ? 1.55 : 1.65;
    capture.lookAt(0, isLab ? 1.35 : 1.5, isLab ? 8.5 : 11);
  }

  function setMotion(time) {
    state.time = time;
    if (lab.fan?.userData.rotor) lab.fan.userData.rotor.rotation.z = time * 14;
    car.position.x = pingpong(2.5, -9, time, -5.8, 5.8);
    person.position.x = pingpong(-1.8, 1.2, time, -4, 4);
  }

  function sceneEv() {
    return state.scene === "table" ? 9 : 13;
  }

  function autoExposure() {
    const wanted = sceneEv() + Math.log2(state.iso / 100);
    if (state.mode === "A") {
      state.shutter = nearest(STOPS.shutter, state.aperture ** 2 / 2 ** wanted);
    } else if (state.mode === "S") {
      state.aperture = nearest(STOPS.aperture, Math.sqrt(state.shutter * 2 ** wanted));
    } else if (state.mode === "P") {
      const pair = STOPS.aperture
        .map((aperture) => ({
          aperture,
          shutter: nearest(STOPS.shutter, aperture ** 2 / 2 ** wanted),
        }))
        .sort((a, b) =>
          Math.abs(Math.log2(a.shutter / (1 / 125))) -
          Math.abs(Math.log2(b.shutter / (1 / 125)))
        )[0];
      state.aperture = pair.aperture;
      state.shutter = pair.shutter;
    }
  }

  function syncControls() {
    if (state.mode !== "M") autoExposure();
    kEl.value = String(STOPS.aperture.indexOf(nearest(STOPS.aperture, state.aperture)));
    tEl.value = String(STOPS.shutter.indexOf(nearest(STOPS.shutter, state.shutter)));
    isoEl.value = String(STOPS.iso.indexOf(nearest(STOPS.iso, state.iso)));
    root.querySelector("[data-exp-kval]").textContent = `f/${state.aperture}`;
    root.querySelector("[data-exp-tval]").textContent = fmtTime(state.shutter);
    root.querySelector("[data-exp-isoval]").textContent = `${state.iso}`;
    kEl.disabled = state.mode === "S" || state.mode === "P";
    tEl.disabled = state.mode === "A" || state.mode === "P";
  }

  function prepareShot() {
    const w = shot.clientWidth;
    const h = shot.clientHeight;
    if (w < 8 || h < 8) return null;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    shot.width = Math.round(w * dpr);
    shot.height = Math.round(h * dpr);
    captureRenderer.setSize(shot.width, shot.height, false);
    capture.aspect = shot.width / shot.height;
    capture.updateProjectionMatrix();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, shot.width, shot.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, shot.width, shot.height);
    return { w, h };
  }

  function addNoise() {
    if (state.iso <= 200) return;
    const image = ctx.getImageData(0, 0, shot.width, shot.height);
    const amplitude = Math.min(42, Math.sqrt(state.iso / 100) * 4.8);
    for (let i = 0; i < image.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * amplitude;
      image.data[i] += noise;
      image.data[i + 1] += noise;
      image.data[i + 2] += noise;
    }
    ctx.putImageData(image, 0, 0);
  }

  function takeShot() {
    syncControls();
    if (!prepareShot()) return;
    const dynamic = state.scene === "table" ? 14 : 9;
    const samples = Math.max(12, Math.min(24, Math.round(12 + state.shutter * dynamic * 12)));
    const start = state.time - state.shutter / 2;
    const hidden = [observerStage];
    hidden.forEach(() => {});
    captureRenderer.toneMappingExposure = Math.max(
      0.08,
      Math.min(8, 2 ** -exposureOffsetEv(state.aperture, state.shutter, state.iso, sceneEv()))
    );
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1 / samples;
    for (let i = 0; i < samples; i++) {
      setMotion(start + state.shutter * (i + 0.5) / samples);
      captureRenderer.render(scene, capture);
      ctx.drawImage(captureRenderer.domElement, 0, 0, shot.width, shot.height);
    }
    ctx.restore();
    setMotion(state.time);
    addNoise();
    state.live = false;
    syncRead(samples);
  }

  function renderLivePreview() {
    if (!state.live || !prepareShot()) return;
    captureRenderer.toneMappingExposure = Math.max(
      0.08,
      Math.min(8, 2 ** -exposureOffsetEv(state.aperture, state.shutter, state.iso, sceneEv()))
    );
    captureRenderer.render(scene, capture);
    ctx.drawImage(captureRenderer.domElement, 0, 0, shot.width, shot.height);
    syncRead(1);
  }

  function syncRead(samples = 1) {
    const offset = exposureOffsetEv(
      state.aperture,
      state.shutter,
      state.iso,
      sceneEv()
    );
    const signed = `${offset >= 0 ? "+" : ""}${offset.toFixed(1)} EV`;
    const verdict = offset > 1.2
      ? "недодержка"
      : offset < -1.2 ? "передержка" : "экспозиция близка к норме";
    read.innerHTML = `
      <p><strong>${signed}</strong> — ${verdict}.</p>
      <p>Режим ${state.mode}: K = f/${state.aperture}; t = ${fmtTime(state.shutter)}; ISO ${state.iso}.</p>
      <p>${state.scene === "table"
        ? "Лаборатория содержит штриховую, радиальную и шахматную миры, шкалы, линейку и вращающийся вентилятор."
        : "Улица содержит неподвижный дом, человека 1,2 м/с и машину 9 м/с."}</p>
      <p class="muted">${state.live
        ? "Live резкий и анимированный. Нажмите «Кадр», чтобы накопить подкадры за время открытия затвора."
        : `Снимок фиксирован. Усреднено ${samples} подкадров; смаз равен пути объекта за выдержку.`}</p>`;
    snap.classList.toggle("is-on", !state.live);
    live.classList.toggle("is-on", state.live);
  }

  kEl.addEventListener("input", () => {
    state.aperture = STOPS.aperture[Number(kEl.value)];
    state.live ? renderLivePreview() : takeShot();
  });
  tEl.addEventListener("input", () => {
    state.shutter = STOPS.shutter[Number(tEl.value)];
    state.live ? renderLivePreview() : takeShot();
  });
  isoEl.addEventListener("input", () => {
    state.iso = STOPS.iso[Number(isoEl.value)];
    state.live ? renderLivePreview() : takeShot();
  });
  modeButtons.forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.expMode;
    modeButtons.forEach((b) => b.classList.toggle("is-on", b === button));
    syncControls();
    state.live ? renderLivePreview() : takeShot();
  }));
  sceneButtons.forEach((button) => button.addEventListener("click", () => {
    state.scene = button.dataset.expScene;
    sceneButtons.forEach((b) => b.classList.toggle("is-on", b === button));
    setVisible();
    syncControls();
    state.live = true;
    renderLivePreview();
  }));
  snap.addEventListener("click", takeShot);
  live.addEventListener("click", () => {
    state.live = true;
    renderLivePreview();
  });

  let previewRaf = 0;
  function previewLoop() {
    previewRaf = requestAnimationFrame(previewLoop);
    if (state.live && root.classList.contains("is-on")) renderLivePreview();
  }
  previewLoop();
  const ro = new ResizeObserver(() => state.live && renderLivePreview());
  ro.observe(shot);
  setVisible();
  syncControls();

  const baseSleep = viewport.sleep;
  const baseWake = viewport.wake;
  return {
    ...viewport,
    resize() {
      viewport.resize();
      if (state.live) renderLivePreview();
    },
    wake() {
      baseWake();
      if (!previewRaf) previewLoop();
      if (state.live) renderLivePreview();
    },
    sleep() {
      baseSleep();
      cancelAnimationFrame(previewRaf);
      previewRaf = 0;
    },
    dispose() {
      cancelAnimationFrame(previewRaf);
      ro.disconnect();
      captureRenderer.dispose();
      viewport.dispose();
      observerStage.remove();
    },
  };
}
