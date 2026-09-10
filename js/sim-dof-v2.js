import * as THREE from "three";
import { createViewport, addViewportHelp, makeLabel } from "./sim-viewport.js?v=20260907-2";
import { createCalibrationScene } from "./sim-scene.js?v=20260910-1";
import {
  SENSORS,
  circleOfConfusionLimit,
  dofBounds,
  fieldOfViewDeg,
} from "./sim-optics.js";

function fmtM(value) {
  if (!Number.isFinite(value)) return "∞";
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} м`;
}

function boundaryPlane(color, text) {
  const g = new THREE.Group();
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4.8),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.17,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  plane.position.y = 2.4;
  const label = makeLabel(text, `#${color.toString(16).padStart(6, "0")}`);
  label.position.set(5.7, 4.5, 0);
  g.add(plane, label);
  return g;
}

export function mountDofSim(root) {
  const host = root.querySelector("[data-dof-3d]");
  const photo = root.querySelector("[data-photo]");
  const read = root.querySelector("[data-read]");
  const fEl = root.querySelector("[data-f]");
  const kEl = root.querySelector("[data-k]");
  const rEl = root.querySelector("[data-r]");
  const sensorButtons = [...root.querySelectorAll("[data-sensor]")];
  let sensor = SENSORS.ff;

  const scene = new THREE.Scene();
  const objects = createCalibrationScene(scene);
  const observer = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  const viewport = createViewport({
    host,
    scene,
    camera: observer,
    position: new THREE.Vector3(10, 7, -3),
    target: new THREE.Vector3(0, 1.4, 8),
    maxDistance: 50,
  });
  addViewportHelp(host.closest(".sim-stage"), viewport);

  const cameraBody = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.38, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x273442 })
  );
  body.position.y = 1.55;
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.18, 0.32, 20),
    new THREE.MeshStandardMaterial({ color: 0x6ec3d8 })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.55, 0.34);
  cameraBody.add(body, lens);
  scene.add(cameraBody);

  const nearPlane = boundaryPlane(0x6ec3d8, "R₁ — ближняя граница");
  const farPlane = boundaryPlane(0xe07a73, "R₂ — дальняя граница");
  const focusPlane = boundaryPlane(0xe2b56a, "R — плоскость фокусировки");
  scene.add(nearPlane, farPlane, focusPlane);

  const capture = new THREE.PerspectiveCamera(45, 1.5, 0.1, 80);
  capture.position.set(0, 1.55, 0);
  capture.lookAt(0, 1.55, 10);
  capture.filmGauge = sensor.widthMm;

  const shotRenderer = new THREE.WebGLRenderer({ canvas: photo, antialias: false });
  shotRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  shotRenderer.outputColorSpace = THREE.SRGBColorSpace;
  const target = new THREE.WebGLRenderTarget(32, 32, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });
  target.depthTexture = new THREE.DepthTexture(32, 32, THREE.UnsignedIntType);
  target.depthTexture.format = THREE.DepthFormat;

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    tColor: { value: target.texture },
    tDepth: { value: target.depthTexture },
    resolution: { value: new THREE.Vector2(32, 32) },
    cameraNear: { value: capture.near },
    cameraFar: { value: capture.far },
    focusM: { value: 4.5 },
    focalM: { value: 0.035 },
    aperture: { value: 2.8 },
    cocLimitM: { value: circleOfConfusionLimit(sensor) / 1000 },
  };
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      depthTest: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform vec2 resolution;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform float focusM;
        uniform float focalM;
        uniform float aperture;
        uniform float cocLimitM;
        float viewZ(float depth) {
          float z = depth * 2.0 - 1.0;
          return (2.0 * cameraNear * cameraFar) /
            (cameraFar + cameraNear - z * (cameraFar - cameraNear));
        }
        void main() {
          float d = max(viewZ(texture2D(tDepth, vUv).x), focalM + 0.001);
          float coc = focalM * focalM * abs(d - focusM) /
            max(aperture * d * (focusM - focalM), 0.000001);
          float radius = min(14.0, 2.6 * coc / max(cocLimitM, 0.000001));
          vec2 px = radius / resolution;
          vec4 sum = texture2D(tColor, vUv);
          float n = 1.0;
          for (int ring = 1; ring <= 3; ring++) {
            float rr = float(ring) / 3.0;
            for (int i = 0; i < 12; i++) {
              float a = 6.2831853 * float(i) / 12.0 + float(ring) * 0.37;
              sum += texture2D(tColor, vUv + vec2(cos(a), sin(a)) * px * rr);
              n += 1.0;
            }
          }
          gl_FragColor = sum / n;
        }`,
    })
  );
  quadScene.add(quad);

  function resizeShot() {
    const w = photo.clientWidth;
    const h = photo.clientHeight;
    if (w < 8 || h < 8) return false;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rw = Math.max(16, Math.round(w * dpr));
    const rh = Math.max(16, Math.round(h * dpr));
    shotRenderer.setSize(w, h, false);
    target.setSize(rw, rh);
    uniforms.resolution.value.set(rw, rh);
    capture.aspect = w / h;
    capture.updateProjectionMatrix();
    return true;
  }

  function renderShot() {
    if (!resizeShot()) return;
    cameraBody.visible = false;
    nearPlane.visible = false;
    farPlane.visible = false;
    focusPlane.visible = false;
    shotRenderer.setRenderTarget(target);
    shotRenderer.render(scene, capture);
    shotRenderer.setRenderTarget(null);
    shotRenderer.render(quadScene, quadCamera);
    cameraBody.visible = true;
    nearPlane.visible = true;
    farPlane.visible = true;
    focusPlane.visible = true;
  }

  function update() {
    const fMm = Number(fEl.value);
    const aperture = Number(kEl.value);
    const focusM = Number(rEl.value);
    const cocMm = circleOfConfusionLimit(sensor);
    const bounds = dofBounds(fMm, aperture, focusM, cocMm);
    capture.filmGauge = sensor.widthMm;
    capture.aspect = sensor.widthMm / sensor.heightMm;
    capture.setFocalLength(fMm);
    capture.aspect = Math.max(0.1, photo.clientWidth / Math.max(1, photo.clientHeight));
    capture.updateProjectionMatrix();
    uniforms.focusM.value = focusM;
    uniforms.focalM.value = fMm / 1000;
    uniforms.aperture.value = aperture;
    uniforms.cocLimitM.value = cocMm / 1000;

    nearPlane.position.z = bounds.near;
    focusPlane.position.z = focusM;
    farPlane.position.z = Number.isFinite(bounds.far) ? Math.min(25, bounds.far) : 25;
    farPlane.visible = Number.isFinite(bounds.far);
    nearPlane.children.find((child) => child.userData.label).element.textContent =
      `R₁ = ${fmtM(bounds.near)}`;
    focusPlane.children.find((child) => child.userData.label).element.textContent =
      `R = ${fmtM(focusM)}`;
    if (Number.isFinite(bounds.far)) {
      farPlane.children.find((child) => child.userData.label).element.textContent =
        `R₂ = ${fmtM(bounds.far)}`;
    }

    root.querySelector("[data-fval]").textContent = `${fMm} мм`;
    root.querySelector("[data-kval]").textContent = `f/${aperture.toFixed(1)}`;
    root.querySelector("[data-rval]").textContent = `${focusM.toFixed(1)} м`;
    read.innerHTML = `
      <p><strong>ГРИП — пространство, изображаемое допустимо резко.</strong></p>
      <p><strong>Ближняя граница</strong><br>R₁ = ${fmtM(bounds.near)}</p>
      <p><strong>Дальняя граница</strong><br>R₂ = ${fmtM(bounds.far)}</p>
      <p>Гиперфокальное расстояние H = ${fmtM(bounds.hyperfocal)}</p>
      <p>Допустимый кружок нерезкости c = ${cocMm.toFixed(3)} мм: диагональ матрицы / 1500.</p>
      <p>Матрица ${sensor.name}; вертикальный угол поля ${fieldOfViewDeg(sensor.heightMm, fMm).toFixed(1)}°.</p>
      <p class="muted">Сверху — снимок этой же Three.js-сцены с capture-камеры и depth/CoC-размытием. Снизу — наблюдательский 3D-вид.</p>`;
    renderShot();
  }

  sensorButtons.forEach((button) => button.addEventListener("click", () => {
    sensor = SENSORS[button.dataset.sensor] ?? SENSORS.ff;
    sensorButtons.forEach((b) => b.classList.toggle("is-on", b === button));
    update();
  }));
  [fEl, kEl, rEl].forEach((el) => el.addEventListener("input", update));
  const ro = new ResizeObserver(update);
  ro.observe(photo);

  const baseWake = viewport.wake;
  const baseSleep = viewport.sleep;
  return {
    ...viewport,
    resize() {
      viewport.resize();
      update();
    },
    wake() {
      baseWake();
      update();
    },
    sleep: baseSleep,
    dispose() {
      ro.disconnect();
      viewport.dispose();
      target.dispose();
      quad.material.dispose();
      shotRenderer.dispose();
    },
  };
}
