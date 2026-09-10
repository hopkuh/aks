import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { addOrbitHint } from "./sim-orbit.js";
import { makePerson, makeHouse, makeCar, cornersOf } from "./sim-props-3d.js";

function label(text, color = "#e2b56a") {
  const el = document.createElement("div");
  el.className = "sim-label";
  el.style.borderColor = color;
  el.textContent = text;
  return new CSS2DObject(el);
}

function makeAxes(len, names, colors, ySign = 1) {
  const g = new THREE.Group();
  const dirs = [
    { v: [len, 0, 0], c: colors[0], n: names[0] },
    { v: [0, ySign * len, 0], c: colors[1], n: names[1] },
    { v: [0, 0, len], c: colors[2], n: names[2] },
  ];
  for (const d of dirs) {
    if (!d.n) continue;
    g.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(...d.v)]),
        new THREE.LineBasicMaterial({ color: d.c })
      )
    );
    const lab = label(d.n, `#${d.c.toString(16).padStart(6, "0")}`);
    lab.position.set(...d.v);
    g.add(lab);
  }
  return g;
}

const LX = 36;
const LY = 24;
const CAM_DISP = 22;

export function mountPhotoSim(root) {
  const host = root.querySelector("[data-pg-canvas]");
  const labHost = root.querySelector("[data-pg-labels]");
  const shot = root.querySelector("[data-pg-shot]");
  const read = root.querySelector("[data-pg-read]");
  const els = {
    f: root.querySelector("[data-pg-f]"),
    d: root.querySelector("[data-pg-d]"),
    x: root.querySelector("[data-pg-x]"),
    y: root.querySelector("[data-pg-y]"),
    z: root.querySelector("[data-pg-z]"),
    yaw: root.querySelector("[data-pg-yaw]"),
    pitch: root.querySelector("[data-pg-pitch]"),
    stereo: root.querySelector("[data-pg-stereo]"),
  };
  const objBtns = [...root.querySelectorAll("[data-pg-obj]")];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151c);
  const view = new THREE.PerspectiveCamera(50, 1, 0.05, 200);
  view.position.set(7, 5.2, 11);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.className = "sim-label-layer";
  labHost.appendChild(labels.domElement);

  const controls = new OrbitControls(view, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.4, 4);

  scene.add(new THREE.HemisphereLight(0xd0e4f4, 0x1a222c, 1));
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
  sun.position.set(6, 12, 4);
  scene.add(sun);
  scene.add(new THREE.GridHelper(24, 24, 0x3a4a5c, 0x243040));
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: 0x1a222c, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const worldCS = makeAxes(2.0, ["X", "Y", "Z"], [0xe07a73, 0x86c99a, 0x6ec3d8]);
  worldCS.position.set(-8, 0.02, -1);
  scene.add(worldCS);

  const house = makeHouse(0x8aa0b4);
  house.position.set(-2.6, 0, 8.5);
  house.userData.id = "house";
  const person = makePerson(0xe2b56a);
  person.position.set(0.4, 0, 6.2);
  person.userData.id = "person";
  const car = makeCar(0xe07a73);
  car.position.set(3.2, 0, 7.4);
  car.rotation.y = -0.5;
  car.userData.id = "car";
  const props = { house, person, car };
  scene.add(house, person, car);

  const camGroup = new THREE.Group();
  scene.add(camGroup);
  const cam2Group = new THREE.Group();
  scene.add(cam2Group);

  const rt = new THREE.WebGLRenderTarget(720, 480, { colorSpace: THREE.SRGBColorSpace });
  const sensorMat = new THREE.MeshBasicMaterial({
    map: rt.texture,
    side: THREE.DoubleSide,
  });

  function buildCam(g) {
    g.clear();
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xe2b56a })
    );
    s.name = "S";
    g.add(s);
    const sLab = label("S — центр проекции (узловая)", "#e2b56a");
    sLab.position.set(0.2, 0.28, 0);
    g.add(sLab);

    const camCS = makeAxes(0.7, ["Xc", "Yc вниз", "Zc → объект"], [0xe07a73, 0x86c99a, 0x6ec3d8], -1);
    camCS.name = "camcs";
    g.add(camCS);

    const sensor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sensorMat);
    sensor.name = "sensor";
    g.add(sensor);
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
      new THREE.LineBasicMaterial({ color: 0xe2b56a })
    );
    frame.name = "frame";
    g.add(frame);

    const o = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0x86c99a })
    );
    o.name = "principal";
    g.add(o);
    const oLab = label("o  главная точка (x₀, y₀)", "#86c99a");
    oLab.position.set(0.15, -0.18, 0);
    o.add(oLab);

    const corner = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x6ec3d8 })
    );
    corner.name = "corner";
    g.add(corner);
    const cLab = label("начало пиксельной СК", "#6ec3d8");
    cLab.position.set(-0.05, 0.16, 0);
    corner.add(cLab);

    const fLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]),
      new THREE.LineBasicMaterial({ color: 0xe2b56a })
    );
    fLine.name = "fline";
    g.add(fLine);
    const fLab = label("f", "#e2b56a");
    fLab.name = "flab";
    g.add(fLab);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.16, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x2a3544, transparent: true, opacity: 0.35 })
    );
    body.position.z = 0.12;
    g.add(body);
    return g;
  }
  buildCam(camGroup);
  buildCam(cam2Group);

  const takeCam = new THREE.PerspectiveCamera(40, LX / LY, 0.05, 80);
  const shotRenderer = new THREE.WebGLRenderer({ antialias: true, canvas: shot });
  shotRenderer.setPixelRatio(1);
  shotRenderer.outputColorSpace = THREE.SRGBColorSpace;

  const rayMat = new THREE.LineBasicMaterial({ color: 0x6ec3d8, transparent: true, opacity: 0.9 });
  const rayMatBack = new THREE.LineBasicMaterial({ color: 0xe2b56a, transparent: true, opacity: 0.85 });
  const rays = new THREE.Group();
  scene.add(rays);

  let selected = "person";
  const lastAim = {
    pos: new THREE.Vector3(0, 1.6, 0),
    target: new THREE.Vector3(0, 1, 6),
  };

  function lookTarget() {
    const obj = props[selected];
    const box = new THREE.Box3().setFromObject(obj);
    return box.getCenter(new THREE.Vector3());
  }

  function placeCam(g, pos, target, fMm) {
    g.position.copy(pos);
    g.lookAt(target);
    const fDisp = (fMm / 1000) * CAM_DISP;
    const w = (LX / 1000) * CAM_DISP;
    const h = (LY / 1000) * CAM_DISP;
    const sensor = g.getObjectByName("sensor");
    const frame = g.getObjectByName("frame");
    const o = g.getObjectByName("principal");
    const corner = g.getObjectByName("corner");
    const fline = g.getObjectByName("fline");
    const flab = g.getObjectByName("flab");
    sensor.scale.set(w, -h, 1);
    frame.scale.set(w, h, 1);
    sensor.position.z = -fDisp;
    frame.position.z = -fDisp;
    o.position.set(0, 0, -fDisp);
    corner.position.set(-w / 2, h / 2, -fDisp);
    fline.geometry.dispose();
    fline.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -fDisp),
    ]);
    flab.position.set(0.12, 0.08, -fDisp / 2);
    if (flab?.element) flab.element.textContent = `f = ${fMm} мм`;
  }

  function updateRays(fMm) {
    rays.clear();
    const S = new THREE.Vector3();
    camGroup.getWorldPosition(S);
    const obj = props[selected];
    const fDisp = (fMm / 1000) * CAM_DISP;
    const pts = cornersOf(obj);
    const q = new THREE.Quaternion();
    camGroup.getWorldQuaternion(q);
    const back = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const planePt = S.clone().add(back.clone().multiplyScalar(fDisp));
    const planeN = back.clone();
    for (const P of pts) {
      rays.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([P, S]), rayMat));
      const dir = P.clone().sub(S);
      const den = planeN.dot(dir);
      if (Math.abs(den) < 1e-9) continue;
      const t = planeN.dot(planePt.clone().sub(S)) / den;
      const hit = S.clone().add(dir.multiplyScalar(t));
      rays.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([S, hit]), rayMatBack));
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xe2b56a })
      );
      dot.position.copy(hit);
      rays.add(dot);
    }
  }

  const hideForShot = (v) => {
    camGroup.visible = v;
    cam2Group.visible = v && els.stereo.checked;
    rays.visible = v;
    labels.domElement.style.display = v ? "" : "none";
  };

  const renderOntoSensor = (fMm) => {
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(LY / (2 * fMm)));
    takeCam.fov = fov;
    takeCam.aspect = LX / LY;
    takeCam.updateProjectionMatrix();
    takeCam.position.copy(lastAim.pos);
    takeCam.up.set(0, 1, 0);
    takeCam.lookAt(lastAim.target);
    hideForShot(false);
    scene.add(takeCam);
    renderer.setRenderTarget(rt);
    renderer.render(scene, takeCam);
    renderer.setRenderTarget(null);
    const w = shot.clientWidth || 320;
    const hh = Math.round((w * LY) / LX);
    shotRenderer.setSize(w, hh, false);
    shotRenderer.render(scene, takeCam);
    scene.remove(takeCam);
    hideForShot(true);
  };

  const paint = () => {
    if (!els.f || !els.d) return;
    const fMm = Number(els.f.value);
    const D = Number(els.d.value);
    const target = lookTarget();
    const yaw = THREE.MathUtils.degToRad(Number(els.yaw.value || 0));
    const pitch = THREE.MathUtils.degToRad(Number(els.pitch.value || 0));
    const dir = new THREE.Vector3(0, 0, 1);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    dir.normalize();
    const pos = target.clone().addScaledVector(dir, -D);
    pos.x += Number(els.x?.value || 0);
    pos.y = Number(els.y?.value || 1.6);
    lastAim.pos.copy(pos);
    lastAim.target.copy(target);
    placeCam(camGroup, pos, target, fMm);
    const stereo = els.stereo.checked;
    cam2Group.visible = stereo;
    if (stereo) {
      const pos2 = pos.clone();
      pos2.x += 1.2;
      placeCam(cam2Group, pos2, target, fMm);
    }
    updateRays(fMm);
    for (const [id, obj] of Object.entries(props)) {
      obj.traverse((n) => {
        if (!n.isMesh || !n.material?.emissive) return;
        n.material.emissive.setHex(id === selected ? 0x3a2a10 : 0x000000);
      });
    }
    root.querySelector("[data-pg-fval]").textContent = `${fMm} мм`;
    const dEl = root.querySelector("[data-pg-dval]");
    if (dEl) dEl.textContent = `${D.toFixed(1).replace(".", ",")} м`;
    const names = { house: "дом", person: "человек", car: "машина" };
    root.querySelector("[data-pg-xyz]").textContent =
      `S ≈ (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}) м · D до «${names[selected]}» = ${D.toFixed(1)} м`;
    read.innerHTML = `
      <p><strong>S</strong> — центр проекции (передняя узловая точка объектива). Все проектирующие лучи проходят через неё.</p>
      <p><strong>Матрица</strong> стоит за S на расстоянии f. На ней золотая точка <strong>o</strong> — главная точка снимка (x₀, y₀); здесь x₀ = 0, y₀ = 0, в центре кадра.</p>
      <p>Отрезок So — это фокусное расстояние f = ${fMm} мм (на модели увеличено, чтобы было видно).</p>
      <p>Голубые лучи — от рёбер выбранного объекта к S. Золотые — продолжение тех же прямых на матрицу: так строится изображение.</p>
      <p>СК камеры начинается в S: Zc на объект, Xc вправо, Yc вниз, как оси снимка. Пиксельная СК часто считают от угла матрицы — он подписан отдельно.</p>
      ${stereo ? "<p>Вторая камера: базис 1,2 м. Смотрите общее поле на кадре.</p>" : ""}
    `;
    renderOntoSensor(fMm);
  };

  objBtns.forEach((b) => {
    b.addEventListener("click", () => {
      selected = b.dataset.pgObj;
      objBtns.forEach((x) => x.classList.toggle("is-on", x === b));
      paint();
    });
  });

  Object.values(els).forEach((el) => el?.addEventListener("input", paint));
  root.querySelector("[data-pg-snap]")?.addEventListener("click", paint);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let ptrDown = null;
  renderer.domElement.addEventListener("pointerdown", (ev) => {
    ptrDown = { x: ev.clientX, y: ev.clientY };
  });
  renderer.domElement.addEventListener("pointerup", (ev) => {
    if (!ptrDown) return;
    if (Math.hypot(ev.clientX - ptrDown.x, ev.clientY - ptrDown.y) > 6) {
      ptrDown = null;
      return;
    }
    ptrDown = null;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, view);
    const hits = raycaster.intersectObjects([house, person, car], true);
    if (!hits.length) return;
    let n = hits[0].object;
    while (n && !n.userData.id) n = n.parent;
    if (n?.userData.id) {
      selected = n.userData.id;
      objBtns.forEach((x) => x.classList.toggle("is-on", x.dataset.pgObj === selected));
      paint();
    }
  });

  addOrbitHint(root.querySelector(".sim-stage"));

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 8 || h < 8) return;
    view.aspect = w / h;
    view.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    paint();
  };
  new ResizeObserver(resize).observe(host);

  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, view);
    labels.render(scene, view);
  };
  tick();
  resize();
  return {
    resize,
    stop() {
      cancelAnimationFrame(raf);
      rt.dispose();
    },
  };
}
