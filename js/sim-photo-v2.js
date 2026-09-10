import * as THREE from "three";
import { createViewport, addViewportHelp, makeLabel } from "./sim-viewport.js?v=20260907-2";
import {
  addStudio,
  createHouse,
  createCar,
  createPerson,
  boundsCorners,
} from "./sim-scene.js?v=20260907-2";
import { projectPinhole } from "./sim-optics.js";

const SENSOR = { widthMm: 36, heightMm: 24 };
const DISPLAY = 0.045;

function line(points, color) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.92 })
  );
}

function axis(direction, color, text) {
  const g = new THREE.Group();
  g.add(line([new THREE.Vector3(), direction], color));
  const label = makeLabel(text, `#${color.toString(16).padStart(6, "0")}`);
  label.position.copy(direction);
  g.add(label);
  return g;
}

export function mountPhotoSim(root) {
  const host = root.querySelector("[data-pg-canvas]");
  const labelHost = root.querySelector("[data-pg-labels]");
  const shot = root.querySelector("[data-pg-shot]");
  const read = root.querySelector("[data-pg-read]");
  const fEl = root.querySelector("[data-pg-f]");
  const dEl = root.querySelector("[data-pg-d]");
  const xEl = root.querySelector("[data-pg-x]");
  const yEl = root.querySelector("[data-pg-y]");
  const yawEl = root.querySelector("[data-pg-yaw]");
  const pitchEl = root.querySelector("[data-pg-pitch]");
  const stereoEl = root.querySelector("[data-pg-stereo]");
  const objectButtons = [...root.querySelectorAll("[data-pg-obj]")];

  const scene = new THREE.Scene();
  addStudio(scene, 30);
  const props = {
    house: createHouse(),
    person: createPerson(),
    car: createCar(),
  };
  props.house.position.set(-3.8, 0, 10);
  props.person.position.set(0, 0, 7);
  props.car.position.set(3.5, 0, 8.6);
  props.car.rotation.y = -0.45;
  Object.entries(props).forEach(([id, object]) => {
    object.userData.id = id;
    scene.add(object);
  });

  const observer = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  const viewport = createViewport({
    host,
    labelHost,
    scene,
    camera: observer,
    position: new THREE.Vector3(10, 7, -4),
    target: new THREE.Vector3(0, 1.3, 5),
    maxDistance: 45,
  });
  addViewportHelp(host.closest(".sim-stage"), viewport);

  const rt = new THREE.WebGLRenderTarget(900, 600, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    colorSpace: THREE.SRGBColorSpace,
  });
  rt.texture.center.set(0.5, 0.5);
  rt.texture.rotation = Math.PI;

  const rig = new THREE.Group();
  scene.add(rig);
  const S = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 18, 14),
    new THREE.MeshBasicMaterial({ color: 0xffcc72 })
  );
  S.add(makeLabel("S — центр проекции"));
  rig.add(S);
  const sensor = new THREE.Mesh(
    new THREE.PlaneGeometry(SENSOR.widthMm * DISPLAY, SENSOR.heightMm * DISPLAY),
    new THREE.MeshBasicMaterial({ map: rt.texture, side: THREE.DoubleSide })
  );
  sensor.name = "sensor";
  rig.add(sensor);
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(
      SENSOR.widthMm * DISPLAY,
      SENSOR.heightMm * DISPLAY
    )),
    new THREE.LineBasicMaterial({ color: 0xffcc72 })
  );
  rig.add(frame);
  const principal = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0x86c99a })
  );
  principal.add(makeLabel("o(x₀,y₀) — главная точка", "#86c99a"));
  rig.add(principal);
  const corner = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x6ec3d8 })
  );
  corner.add(makeLabel("(0,0) пиксельной СК", "#6ec3d8"));
  rig.add(corner);
  rig.add(
    axis(new THREE.Vector3(1.1, 0, 0), 0xe07a73, "Xc"),
    axis(new THREE.Vector3(0, -1.1, 0), 0x86c99a, "Yc вниз"),
    axis(new THREE.Vector3(0, 0, 1.1), 0x6ec3d8, "Zc к объекту")
  );
  const cameraBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.7, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0x2a3544,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    })
  );
  cameraBody.position.z = -0.55;
  rig.add(cameraBody);

  const rays = new THREE.Group();
  scene.add(rays);
  const secondCamera = new THREE.Group();
  const secondBody = cameraBody.clone();
  secondBody.material = cameraBody.material.clone();
  secondCamera.add(secondBody, new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xe07a73 })
  ));
  secondCamera.add(makeLabel("S₂ — второй снимок", "#e07a73"));
  scene.add(secondCamera);

  const capture = new THREE.PerspectiveCamera(48, 1.5, 0.05, 100);
  capture.filmGauge = SENSOR.widthMm;
  const shotRenderer = new THREE.WebGLRenderer({ canvas: shot, antialias: true });
  shotRenderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  shotRenderer.outputColorSpace = THREE.SRGBColorSpace;
  let selected = "person";

  function objectCenter() {
    return new THREE.Box3().setFromObject(props[selected]).getCenter(new THREE.Vector3());
  }

  function localProjection(worldPoint, fMm) {
    const local = rig.worldToLocal(worldPoint.clone());
    const projected = projectPinhole(local, fMm, SENSOR);
    if (!projected) return null;
    return rig.localToWorld(new THREE.Vector3(
      projected.xMm * DISPLAY,
      projected.yMm * DISPLAY,
      projected.zMm * DISPLAY
    ));
  }

  function rebuildRays(fMm) {
    rays.clear();
    const sWorld = new THREE.Vector3();
    rig.getWorldPosition(sWorld);
    const points = boundsCorners(props[selected]);
    for (const point of points) {
      const hit = localProjection(point, fMm);
      if (!hit) continue;
      rays.add(line([point, sWorld], 0x6ec3d8));
      rays.add(line([sWorld, hit], 0xffcc72));
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffcc72 })
      );
      dot.position.copy(hit);
      rays.add(dot);
    }
  }

  function renderCapture(fMm, position, targetPoint) {
    capture.filmGauge = SENSOR.widthMm;
    capture.setFocalLength(fMm);
    capture.aspect = SENSOR.widthMm / SENSOR.heightMm;
    capture.position.copy(position);
    capture.up.set(0, 1, 0);
    capture.lookAt(targetPoint);
    capture.updateProjectionMatrix();
    rig.visible = false;
    secondCamera.visible = false;
    rays.visible = false;
    viewport.renderer.setRenderTarget(rt);
    viewport.renderer.render(scene, capture);
    viewport.renderer.setRenderTarget(null);
    const width = shot.clientWidth;
    if (width > 8) {
      shotRenderer.setSize(width, width * SENSOR.heightMm / SENSOR.widthMm, false);
      shotRenderer.render(scene, capture);
    }
    rig.visible = true;
    secondCamera.visible = stereoEl.checked;
    rays.visible = true;
  }

  function update() {
    const fMm = Number(fEl.value);
    const distance = Number(dEl.value);
    const targetPoint = objectCenter();
    const yaw = THREE.MathUtils.degToRad(Number(yawEl.value));
    const pitch = THREE.MathUtils.degToRad(Number(pitchEl.value));
    const direction = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch)
      .normalize();
    const position = targetPoint.clone().addScaledVector(direction, -distance);
    position.x += Number(xEl.value);
    position.y = Number(yEl.value);
    rig.position.copy(position);
    rig.up.set(0, 1, 0);
    rig.lookAt(targetPoint);
    rig.updateMatrixWorld(true);

    const sensorZ = -fMm * DISPLAY;
    sensor.position.z = sensorZ;
    frame.position.z = sensorZ;
    principal.position.set(0, 0, sensorZ);
    corner.position.set(
      -SENSOR.widthMm * DISPLAY / 2,
      SENSOR.heightMm * DISPLAY / 2,
      sensorZ
    );
    const old = rig.getObjectByName("focal-line");
    if (old) {
      rig.remove(old);
      old.geometry.dispose();
      old.material.dispose();
    }
    const focalLine = line(
      [new THREE.Vector3(), new THREE.Vector3(0, 0, sensorZ)],
      0xe2b56a
    );
    focalLine.name = "focal-line";
    const focalLabel = makeLabel(`So = f = ${fMm} мм`);
    focalLabel.position.set(0.25, 0.18, sensorZ / 2);
    focalLine.add(focalLabel);
    rig.add(focalLine);

    secondCamera.visible = stereoEl.checked;
    secondCamera.position.copy(position).add(new THREE.Vector3(1.2, 0, 0));
    secondCamera.lookAt(targetPoint);
    rebuildRays(fMm);
    renderCapture(fMm, position, targetPoint);

    Object.entries(props).forEach(([id, object]) => object.traverse((node) => {
      if (node.isMesh && node.material?.emissive) {
        node.material.emissive.setHex(id === selected ? 0x271b08 : 0x000000);
      }
    }));
    root.querySelector("[data-pg-fval]").textContent = `${fMm} мм`;
    root.querySelector("[data-pg-dval]").textContent = `${distance.toFixed(1).replace(".", ",")} м`;
    root.querySelector("[data-pg-xyz]").textContent =
      `S = (${position.x.toFixed(1)}; ${position.y.toFixed(1)}; ${position.z.toFixed(1)}) м`;
    read.innerHTML = `
      <p><strong>Центральная проекция:</strong> каждая прямая P → S → p проходит через один центр S.</p>
      <p><strong>Матрица 36×24 мм</strong> находится за S. На ней показано физически перевёрнутое изображение.</p>
      <p><strong>Главная точка</strong> o(x₀,y₀) — основание перпендикуляра из S; здесь x₀ = 0, y₀ = 0.</p>
      <p><strong>Фокусное расстояние</strong> — отрезок So = ${fMm} мм.</p>
      <p>СК камеры начинается в S. Пиксельная СК начинается в левом верхнем углу матрицы.</p>
      <p class="muted">Превью справа программно ориентировано правильно; физическое изображение на матрице в 3D повёрнуто на 180°.</p>`;
  }

  objectButtons.forEach((button) => button.addEventListener("click", () => {
    selected = button.dataset.pgObj;
    objectButtons.forEach((b) => b.classList.toggle("is-on", b === button));
    update();
  }));
  [fEl, dEl, xEl, yEl, yawEl, pitchEl, stereoEl].forEach((el) =>
    el.addEventListener("input", update)
  );
  root.querySelector("[data-pg-snap]")?.addEventListener("click", update);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  viewport.renderer.domElement.addEventListener("pointerdown", (event) => {
    down = { x: event.clientX, y: event.clientY };
  });
  viewport.renderer.domElement.addEventListener("pointerup", (event) => {
    if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
    const rect = viewport.renderer.domElement.getBoundingClientRect();
    pointer.set(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1
    );
    raycaster.setFromCamera(pointer, observer);
    const hit = raycaster.intersectObjects(Object.values(props), true)[0];
    let object = hit?.object;
    while (object && !object.userData.id) object = object.parent;
    if (object?.userData.id) {
      selected = object.userData.id;
      objectButtons.forEach((b) => b.classList.toggle("is-on", b.dataset.pgObj === selected));
      update();
    }
  });

  const ro = new ResizeObserver(update);
  ro.observe(shot);
  const baseWake = viewport.wake;
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
    dispose() {
      ro.disconnect();
      rt.dispose();
      shotRenderer.dispose();
      viewport.dispose();
    },
  };
}
