import * as THREE from "three";
import { createViewport, addViewportHelp, makeLabel } from "./sim-viewport.js?v=20260907-2";
import { addStudio, createChart, boundsCorners } from "./sim-scene.js?v=20260907-2";

const INFO = {
  body: ["Корпус", "Корпус фиксирует взаимное положение байонета, затвора и матрицы."],
  lens: ["Объектив", "Объектив строит действительное перевёрнутое изображение. В учебной модели S = N = N′."],
  iris: ["Диафрагма", "Диафрагма ограничивает действующее отверстие. K = f/D, где D — диаметр входного зрачка."],
  shutter: ["Затвор", "Затвор задаёт интервал, в течение которого матрица получает свет."],
  sensor: ["Матрица", "Матрица 36×24 мм находится в фокальной плоскости за центром проекции S."],
  mirror: ["Зеркало", "У DSLR зеркало в режиме наблюдения направляет свет на фокусировочный экран. При экспонировании оно поднято."],
  prism: ["Пентапризма", "Пентапризма поворачивает изображение для оптического видоискателя DSLR."],
  screen: ["Экран", "Фокусировочный экран DSLR расположен над зеркалом."],
};

const colors = {
  body: 0x2c3744,
  lens: 0x1d2630,
  iris: 0xe2b56a,
  shutter: 0x8c98a4,
  sensor: 0x5ebbd7,
  mirror: 0xcad7df,
  prism: 0xc49e64,
  screen: 0x86c99a,
};

function mat(id, extra = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: colors[id],
    roughness: 0.45,
    metalness: id === "mirror" ? 0.9 : 0.25,
    ...extra,
  });
  m.userData.baseOpacity = m.opacity;
  return m;
}

function box(id, size, position) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(id));
  m.position.set(...position);
  m.castShadow = true;
  m.userData.part = id;
  return m;
}

function line(points, color, dashed = false) {
  const material = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.1 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
  const result = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
  if (dashed) result.computeLineDistances();
  return result;
}

export function mountCameraSim(root) {
  const host = root.querySelector("[data-canvas]");
  const labelHost = root.querySelector("[data-labels]");
  const toolbar = root.querySelector(".sim-toolbar");
  const partsList = root.querySelector("[data-parts]");
  const title = root.querySelector("[data-title]");
  const text = root.querySelector("[data-text]");
  const explode = root.querySelector("[data-explode]");
  const explodeValue = root.querySelector("[data-explode-val]");
  const raySwitch = root.querySelector("[data-rays]");
  const typeButtons = [...root.querySelectorAll("[data-type]")];

  const scene = new THREE.Scene();
  addStudio(scene, 30);
  const observer = new THREE.PerspectiveCamera(46, 1, 0.05, 100);
  const viewport = createViewport({
    host,
    labelHost,
    scene,
    camera: observer,
    position: new THREE.Vector3(10, 7, -11),
    target: new THREE.Vector3(0, 1.5, 1.5),
    minDistance: 4,
    maxDistance: 34,
  });
  addViewportHelp(root.querySelector(".sim-stage"), viewport);

  const cameraRig = new THREE.Group();
  cameraRig.position.y = 1.7;
  scene.add(cameraRig);
  const target = createChart("checker", "Объект");
  target.scale.setScalar(1.35);
  target.position.set(0, 0, 10);
  scene.add(target);

  const parts = {};
  const homes = {};
  const exploded = {
    body: new THREE.Vector3(-5, 0, 0),
    lens: new THREE.Vector3(0, 0, 5),
    iris: new THREE.Vector3(0, 4.3, 1),
    shutter: new THREE.Vector3(4.8, 2.2, -1.2),
    sensor: new THREE.Vector3(0, -3.5, -3.3),
    mirror: new THREE.Vector3(-4.5, 4.5, -1),
    screen: new THREE.Vector3(0, 5.5, -1.1),
    prism: new THREE.Vector3(0, 8, -1.1),
  };
  const rays = new THREE.Group();
  scene.add(rays);
  let cameraType = "mirrorless";
  let operation = "exposure";
  let selected = "body";

  const operationGroup = document.createElement("div");
  operationGroup.className = "sim-seg";
  operationGroup.setAttribute("role", "group");
  operationGroup.setAttribute("aria-label", "Состояние камеры");
  operationGroup.innerHTML = `
    <button type="button" data-operation="view">Наблюдение</button>
    <button type="button" data-operation="exposure" class="is-on">Экспонирование</button>`;
  toolbar.insertBefore(operationGroup, toolbar.children[1]);
  const operationButtons = [...operationGroup.querySelectorAll("button")];

  function addPart(id, object) {
    object.name = id;
    object.userData.part = id;
    object.traverse((child) => {
      if (child.isMesh) child.userData.part = id;
    });
    homes[id] = object.position.clone();
    parts[id] = object;
    cameraRig.add(object);
    const label = makeLabel(INFO[id][0]);
    label.position.set(0, 1.5, 0);
    object.add(label);
  }

  function makeLens() {
    const g = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 3.1, 32), mat("lens"));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 1.8;
    const front = new THREE.Mesh(
      new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      mat("sensor", { transparent: true, opacity: 0.35, depthWrite: false })
    );
    front.rotation.x = Math.PI / 2;
    front.position.z = 3.35;
    g.add(barrel, front);
    return g;
  }

  function makeIris() {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const blade = box("iris", [0.5, 1.1, 0.08], [0, 0.56, 0]);
      blade.rotation.z = i * Math.PI * 2 / 7 + 0.34;
      const pivot = new THREE.Group();
      pivot.rotation.z = i * Math.PI * 2 / 7;
      pivot.add(blade);
      g.add(pivot);
    }
    return g;
  }

  function rebuild() {
    for (const value of Object.values(parts)) cameraRig.remove(value);
    Object.keys(parts).forEach((key) => delete parts[key]);
    const body = box("body", [7.6, 5.3, cameraType === "dslr" ? 5 : 3.8], [0, 0, -2.1]);
    body.material.transparent = true;
    body.material.opacity = 0.28;
    addPart("body", body);
    addPart("lens", makeLens());
    const iris = makeIris();
    iris.position.set(0, 0, 0.65);
    addPart("iris", iris);
    addPart("shutter", box("shutter", [3.8, 2.6, 0.12], [0, 0, -2.25]));
    const sensor = box("sensor", [3.6, 2.4, 0.12], [0, 0, -2.55]);
    addPart("sensor", sensor);
    if (cameraType === "dslr") {
      const mirror = box("mirror", [3.25, 2.15, 0.08], [0, 0, -1.15]);
      mirror.rotation.x = operation === "view" ? -Math.PI / 4 : -Math.PI / 2;
      addPart("mirror", mirror);
      addPart("screen", box("screen", [3.3, 0.08, 2.2], [0, 2.05, -1.15]));
      const prism = new THREE.Mesh(new THREE.ConeGeometry(1.65, 2.1, 4), mat("prism"));
      prism.position.set(0, 3.25, -1.15);
      prism.rotation.y = Math.PI / 4;
      addPart("prism", prism);
    }
    fillParts();
    updateExplode();
    select(selected in parts ? selected : "body");
    rebuildRays();
  }

  function fillParts() {
    partsList.innerHTML = "";
    for (const id of Object.keys(parts)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sim-part";
      button.dataset.part = id;
      button.textContent = INFO[id][0];
      button.addEventListener("click", () => select(id));
      partsList.append(button);
    }
  }

  function clearOutlines() {
    cameraRig.traverse((node) => {
      if (!node.isMesh) return;
      for (const child of [...node.children]) {
        if (child.userData.outline) {
          node.remove(child);
          child.geometry.dispose();
          child.material.dispose();
        }
      }
    });
  }

  function select(id) {
    if (!parts[id]) return;
    selected = id;
    title.textContent = INFO[id][0];
    text.textContent = INFO[id][1];
    partsList.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.part === id);
    });
    clearOutlines();
    for (const [key, part] of Object.entries(parts)) {
      part.traverse((node) => {
        if (!node.isMesh) return;
        node.material.transparent = true;
        node.material.opacity = key === id ? (node.material.userData.baseOpacity ?? 1) : 0.5;
        node.material.depthWrite = key === id;
        if (key !== id) return;
        const outline = new THREE.LineSegments(
          new THREE.EdgesGeometry(node.geometry, 24),
          new THREE.LineBasicMaterial({ color: 0xffcf78, depthTest: false })
        );
        outline.userData.outline = true;
        outline.renderOrder = 20;
        node.add(outline);
      });
    }
  }

  function updateExplode() {
    const t = Number(explode.value);
    explodeValue.textContent = `${Math.round(t * 100)} %`;
    for (const [id, part] of Object.entries(parts)) {
      part.position.lerpVectors(homes[id], exploded[id] ?? homes[id], t);
      const label = part.children.find((child) => child.userData.label);
      if (label) label.visible = t > 0.15 || id === selected;
    }
  }

  function sensorHit(P, fDisplay = 2.55) {
    const S = new THREE.Vector3(0, 1.7, 0);
    const dir = P.clone().sub(S);
    return S.clone().addScaledVector(dir, -fDisplay / dir.z);
  }

  function rebuildRays() {
    rays.clear();
    if (!raySwitch.checked) return;
    const S = new THREE.Vector3(0, 1.7, 0);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffcf78 })
    );
    marker.position.copy(S);
    marker.add(makeLabel("S = N = N′"));
    rays.add(marker);
    const points = boundsCorners(target).filter((_, index) => [0, 2, 5, 7].includes(index));
    for (const P of points) {
      rays.add(line([P, S], 0x6ec3d8));
      if (cameraType === "dslr" && operation === "view") {
        const mirror = new THREE.Vector3(S.x + (P.x - S.x) * -0.12, 1.7 + (P.y - S.y) * -0.12, -1.15);
        const focus = new THREE.Vector3(mirror.x, 3.75, mirror.z);
        rays.add(line([S, mirror, focus], 0xffcf78));
      } else {
        const hit = sensorHit(P);
        rays.add(line([S, hit], 0xffcf78));
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffcf78 })
        );
        dot.position.copy(hit);
        rays.add(dot);
      }
    }
  }

  typeButtons.forEach((button) => button.addEventListener("click", () => {
    cameraType = button.dataset.type;
    typeButtons.forEach((b) => b.classList.toggle("is-on", b === button));
    if (cameraType === "mirrorless") operation = "exposure";
    operationButtons.forEach((b) => b.classList.toggle("is-on", b.dataset.operation === operation));
    operationButtons[0].disabled = cameraType === "mirrorless";
    rebuild();
  }));
  operationButtons.forEach((button) => button.addEventListener("click", () => {
    operation = button.dataset.operation;
    operationButtons.forEach((b) => b.classList.toggle("is-on", b === button));
    rebuild();
  }));
  explode.addEventListener("input", updateExplode);
  raySwitch.addEventListener("change", rebuildRays);

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
    const hit = raycaster.intersectObjects(Object.values(parts), true)
      .find((item) => item.object.userData.part);
    if (hit) select(hit.object.userData.part);
  });

  rebuild();
  return viewport;
}
