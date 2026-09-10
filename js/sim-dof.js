import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { addOrbitHint } from "./sim-orbit.js";
import { makePerson, makeHouse, makeCar } from "./sim-props-3d.js";

const SENSORS = {
  ff: { id: "ff", name: "полный кадр", w: 36, h: 24 },
  apsc: { id: "apsc", name: "APS-C", w: 22, h: 15 },
  m43: { id: "m43", name: "M4/3", w: 17.3, h: 13 },
  inch1: { id: "inch1", name: "1″", w: 13.2, h: 8.8 },
};

const FF_DIAG = Math.hypot(36, 24);
const CAM_H = 1.55;

const SCENE = [
  { kind: "person", d: 3.2, x: -1.1, h: 1.72, col: "#c47a6a", three: 0xc47a6a },
  { kind: "person", d: 4.5, x: 0.55, h: 1.68, col: "#e2b56a", three: 0xe2b56a, focusDefault: true },
  { kind: "car", d: 6.2, x: 2.4, h: 1.5, w: 3.6, col: "#e07a73", three: 0xe07a73 },
  { kind: "house", d: 10.5, x: -3.4, h: 3.6, w: 3.2, col: "#8aa0b4", three: 0x8aa0b4 },
  { kind: "person", d: 12, x: 0.2, h: 1.75, col: "#86c99a", three: 0x86c99a },
];

function diag(s) {
  return Math.hypot(s.w, s.h);
}

function cocAllow(s) {
  return diag(s) / 1500;
}

function hyperfocal(fM, K, cM) {
  return (fM * fM) / (K * cM) + fM;
}

function dofBounds(fM, K, cM, R) {
  const H = hyperfocal(fM, K, cM);
  const R1 = (H * R) / (H + (R - fM));
  const den = H - R + fM;
  const farInf = den <= 1e-9 || R >= H * 0.98;
  const R2 = farInf ? Infinity : (H * R) / den;
  return { H, R1, R2, farInf };
}

function cocAt(fM, K, R, D) {
  if (D <= 0 || R <= fM) return 1;
  return (fM * fM * Math.abs(D - R)) / (K * D * (R - fM));
}

function fmtM(m) {
  if (!Number.isFinite(m)) return "∞";
  if (m >= 100) return `${m.toFixed(0)} м`;
  if (m >= 10) return `${m.toFixed(1)} м`;
  return `${m.toFixed(2)} м`;
}

function project(X, Y, Z, w, h, fMm, sw, sh) {
  const u = (fMm / sw) * (X / Z);
  const v = (fMm / sh) * ((Y - CAM_H) / Z);
  return { x: w / 2 + u * w, y: h / 2 - v * h };
}

function drawPerson(ctx, fx, fy, headY, color, blurPx, boxed) {
  const s = Math.max(4, fy - headY);
  ctx.save();
  ctx.translate(fx, fy);
  ctx.filter = blurPx > 0.4 ? `blur(${Math.min(22, blurPx)}px)` : "none";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -0.88 * s, 0.09 * s, 0.11 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-0.13 * s, -0.76 * s, 0.26 * s, 0.38 * s);
  ctx.fillRect(-0.12 * s, -0.38 * s, 0.1 * s, 0.38 * s);
  ctx.fillRect(0.02 * s, -0.38 * s, 0.1 * s, 0.38 * s);
  ctx.fillRect(-0.22 * s, -0.72 * s, 0.08 * s, 0.32 * s);
  ctx.fillRect(0.14 * s, -0.72 * s, 0.08 * s, 0.32 * s);
  if (boxed) {
    ctx.filter = "none";
    ctx.strokeStyle = "#e2b56a";
    ctx.lineWidth = 2;
    ctx.strokeRect(-0.26 * s, -s, 0.52 * s, s);
  }
  ctx.restore();
}

function drawHouse(ctx, x0, y0, x1, y1, color, blurPx) {
  const w = x1 - x0;
  const h = y0 - y1;
  ctx.save();
  ctx.filter = blurPx > 0.4 ? `blur(${Math.min(22, blurPx)}px)` : "none";
  ctx.fillStyle = color;
  ctx.fillRect(x0, y1 + 0.28 * h, w, 0.72 * h);
  ctx.beginPath();
  ctx.moveTo(x0 - 0.04 * w, y1 + 0.28 * h);
  ctx.lineTo(x0 + w / 2, y1);
  ctx.lineTo(x1 + 0.04 * w, y1 + 0.28 * h);
  ctx.closePath();
  ctx.fillStyle = "#e07a73";
  ctx.fill();
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(x0 + 0.42 * w, y0 - 0.38 * h, 0.16 * w, 0.38 * h);
  ctx.fillStyle = "#6ec3d8";
  ctx.fillRect(x0 + 0.12 * w, y1 + 0.4 * h, 0.18 * w, 0.16 * h);
  ctx.fillRect(x0 + 0.7 * w, y1 + 0.4 * h, 0.18 * w, 0.16 * h);
  ctx.restore();
}

function drawCar(ctx, x0, y0, x1, y1, color, blurPx) {
  const w = x1 - x0;
  const h = y0 - y1;
  ctx.save();
  ctx.filter = blurPx > 0.4 ? `blur(${Math.min(22, blurPx)}px)` : "none";
  ctx.fillStyle = color;
  ctx.fillRect(x0, y0 - 0.48 * h, w, 0.32 * h);
  ctx.fillRect(x0 + 0.22 * w, y1, 0.5 * w, 0.52 * h);
  ctx.fillStyle = "#1a222c";
  ctx.beginPath();
  ctx.arc(x0 + 0.22 * w, y0 - 0.14 * h, 0.14 * h, 0, Math.PI * 2);
  ctx.arc(x0 + 0.78 * w, y0 - 0.14 * h, 0.14 * h, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function mountDofSim(root) {
  const photo = root.querySelector("[data-photo]");
  const host3d = root.querySelector("[data-dof-3d]");
  const read = root.querySelector("[data-read]");
  const fEl = root.querySelector("[data-f]");
  const kEl = root.querySelector("[data-k]");
  const rEl = root.querySelector("[data-r]");
  const fVal = root.querySelector("[data-fval]");
  const kVal = root.querySelector("[data-kval]");
  const rVal = root.querySelector("[data-rval]");
  const sensorBtns = [...root.querySelectorAll("[data-sensor]")];
  const pctx = photo.getContext("2d");

  let sensor = SENSORS.ff;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151c);
  const view = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  view.position.set(9, 5.5, -2.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host3d.appendChild(renderer.domElement);
  const controls = new OrbitControls(view, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.4, 6.5);
  scene.add(new THREE.HemisphereLight(0xd0e4f4, 0x1a222c, 1));
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.05);
  sun.position.set(6, 10, 2);
  scene.add(sun);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 28),
    new THREE.MeshStandardMaterial({ color: 0x1a222c, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  scene.add(new THREE.GridHelper(28, 28, 0x3a4a5c, 0x243040));

  const camBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.2, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x2a3544 })
  );
  camBody.position.set(0, CAM_H, 0);
  scene.add(camBody);
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0x6ec3d8 })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, CAM_H, 0.22);
  scene.add(lens);

  const worldObjs = [];
  for (const spec of SCENE) {
    let mesh;
    if (spec.kind === "house") mesh = makeHouse(spec.three);
    else if (spec.kind === "car") mesh = makeCar(spec.three);
    else mesh = makePerson(spec.three);
    mesh.position.set(spec.x, 0, spec.d);
    if (spec.kind === "car") mesh.rotation.y = Math.PI / 2;
    scene.add(mesh);
    worldObjs.push({ spec, mesh });
  }

  const dofVol = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x86c99a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })
  );
  scene.add(dofVol);
  const focusPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 4.2),
    new THREE.MeshBasicMaterial({
      color: 0xe2b56a,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    })
  );
  scene.add(focusPlane);

  addOrbitHint(host3d.closest(".sim-stage"));

  const drawPhoto = (fMm, K, R, cMm, bounds) => {
    const { R1, R2, farInf } = bounds;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = photo.clientWidth;
    const h = photo.clientHeight;
    if (w < 8 || h < 8) return;
    photo.width = Math.round(w * dpr);
    photo.height = Math.round(h * dpr);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grd = pctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#24344a");
    grd.addColorStop(0.52, "#3a4a3a");
    grd.addColorStop(1, "#2a3224");
    pctx.fillStyle = grd;
    pctx.fillRect(0, 0, w, h);
    pctx.fillStyle = "#4a5a40";
    const g0 = project(0, 0, 40, w, h, fMm, sensor.w, sensor.h);
    pctx.fillRect(0, g0.y, w, h);

    const fM = fMm / 1000;
    const sorted = [...SCENE].sort((a, b) => b.d - a.d);
    for (const p of sorted) {
      const coc = cocAt(fM, K, R, p.d) * 1000;
      const sharp = p.d >= R1 && (farInf || p.d <= R2);
      const blurPx = sharp ? 0 : Math.min(22, (coc / cMm) * 2.2);
      const boxed = Math.abs(p.d - R) < 0.2;
      if (p.kind === "person") {
        const feet = project(p.x, 0, p.d, w, h, fMm, sensor.w, sensor.h);
        const head = project(p.x, p.h, p.d, w, h, fMm, sensor.w, sensor.h);
        drawPerson(pctx, feet.x, feet.y, head.y, p.col, blurPx, boxed);
      } else if (p.kind === "house") {
        const hw = (p.w || 3.2) / 2;
        const a = project(p.x - hw, 0, p.d, w, h, fMm, sensor.w, sensor.h);
        const b = project(p.x + hw, p.h, p.d, w, h, fMm, sensor.w, sensor.h);
        drawHouse(pctx, a.x, a.y, b.x, b.y, p.col, blurPx);
      } else {
        const hw = (p.w || 3.6) / 2;
        const a = project(p.x - hw, 0, p.d, w, h, fMm, sensor.w, sensor.h);
        const b = project(p.x + hw, p.h, p.d, w, h, fMm, sensor.w, sensor.h);
        drawCar(pctx, a.x, a.y, b.x, b.y, p.col, blurPx);
      }
      const lab = project(p.x, 0, p.d, w, h, fMm, sensor.w, sensor.h);
      pctx.filter = "none";
      pctx.fillStyle = "#e8e4dc";
      pctx.font = "12px Segoe UI, sans-serif";
      pctx.textAlign = "center";
      pctx.fillText(`${p.d} м`, lab.x, Math.min(h - 8, lab.y + 16));
    }

    pctx.fillStyle = "rgba(226,181,106,0.95)";
    pctx.font = "13px Segoe UI, sans-serif";
    pctx.textAlign = "left";
    const fovH = ((2 * Math.atan(sensor.h / (2 * fMm))) * 180) / Math.PI;
    pctx.fillText(`кадр ${sensor.w}×${sensor.h} мм · вертикальный угол ≈ ${fovH.toFixed(0)}°`, 12, 22);
    pctx.fillStyle = "#86c99a";
    pctx.fillText(farInf ? "зона ГРИП до ∞" : `зона ГРИП ${R1.toFixed(2)}…${R2.toFixed(2)} м`, 12, 42);
  };

  const update3d = (R, bounds) => {
    const z1 = bounds.R1;
    const z2 = bounds.farInf ? 16 : Math.min(16, bounds.R2);
    const z0 = (z1 + z2) / 2;
    const dz = Math.max(0.2, z2 - z1);
    dofVol.position.set(0, 2.1, z0);
    dofVol.scale.set(9, 4.2, dz);
    focusPlane.position.set(0, 2.1, R);
    for (const { spec, mesh } of worldObjs) {
      const inDof = spec.d >= bounds.R1 && (bounds.farInf || spec.d <= bounds.R2);
      mesh.traverse((n) => {
        if (!n.isMesh || !n.material || n.material.transparent && n.material.opacity < 0.5) return;
        if (n.material.color) n.material.emissive = new THREE.Color(inDof ? 0x111a10 : 0x000000);
      });
    }
  };

  const render = () => {
    const fMm = Number(fEl.value);
    const K = Number(kEl.value);
    const R = Number(rEl.value);
    const fM = fMm / 1000;
    const cMm = cocAllow(sensor);
    const cM = cMm / 1000;
    const bounds = dofBounds(fM, K, cM, R);
    const crop = FF_DIAG / diag(sensor);
    fVal.textContent = `${fMm} мм`;
    kVal.textContent = `f/${K.toFixed(1)}`;
    rVal.textContent = `${R.toFixed(1)} м`;
    const dTxt = bounds.farInf ? "∞" : fmtM(Math.max(0, bounds.R2 - bounds.R1));
    read.innerHTML = `
      <p><strong>ГРИП = ${dTxt}</strong></p>
      <p>R₁ = ${fmtM(bounds.R1)} · R₂ = ${bounds.farInf ? "∞" : fmtM(bounds.R2)}</p>
      <p>H = ${fmtM(bounds.H)} · c = ${cMm.toFixed(3)} мм</p>
      <p>Матрица ${sensor.w}×${sensor.h} мм · кроп ${crop.toFixed(2)} · c = диагональ / 1500</p>
      <p class="muted">Верх — кадр камеры (человек целиком, если влезает в угол зрения). Низ — та же улица в 3D: зелёный параллелепипед — зона ГРИП, золотая плоскость — наводка R.</p>
    `;
    drawPhoto(fMm, K, R, cMm, bounds);
    update3d(R, bounds);
  };

  sensorBtns.forEach((b) => {
    b.addEventListener("click", () => {
      sensor = SENSORS[b.dataset.sensor] || SENSORS.ff;
      sensorBtns.forEach((x) => x.classList.toggle("is-on", x === b));
      render();
    });
  });
  [fEl, kEl, rEl].forEach((el) => el.addEventListener("input", render));

  const resize = () => {
    const w = host3d.clientWidth;
    const h = host3d.clientHeight;
    if (w > 8 && h > 8) {
      view.aspect = w / h;
      view.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    render();
  };
  new ResizeObserver(resize).observe(photo);
  new ResizeObserver(resize).observe(host3d);

  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, view);
  };
  tick();
  resize();
  return {
    resize,
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
