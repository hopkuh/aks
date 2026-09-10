import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { addOrbitHint } from "./sim-orbit.js";

const PARTS = {
  body: {
    title: "Тушка",
    text: "Несветопроницаемый корпус. Держит байонет, затвор, матрицу и электронику в фиксированной геометрии. Это не «просто коробка»: от жёсткости корпуса зависит, не гуляет ли рабочий отрезок.",
  },
  lens: {
    title: "Объектив",
    text: "Оптическая система, которая строит действительное изображение на матрице. Фокусное расстояние — параметр оптики, не камеры. На модели упрощён до двух групп линз.",
  },
  iris: {
    title: "Диафрагма",
    text: "Регулируемое отверстие внутри объектива. Закрыли — меньше света и больше глубина резкости; открыли — наоборот. Число вроде f/8 — диафрагменное число K.",
  },
  shutter: {
    title: "Затвор",
    text: "Задаёт выдержку: сколько времени свет падает на матрицу. Здесь шторки у фокальной плоскости. На коротких выдержках кадр открывает бегущая щель, не весь сразу.",
  },
  sensor: {
    title: "Матрица",
    text: "Светоприёмник в фокальной плоскости. Размер кадра — миллиметры, не мегапиксели. Отсюда кроп-фактор и поле зрения объектива.",
  },
  processor: {
    title: "Процессор",
    text: "АЦП, демозаика фильтра Байера, сжатие, запись файла. Геометрию кадра он не задаёт — он обрабатывает то, что уже попало на матрицу.",
  },
  memory: {
    title: "Память",
    text: "Карта, куда пишется кадр. Для фотограмметрии важнее формат и сжатие, чем скорость карты: JPEG с потерями ломает отождествление.",
  },
  battery: {
    title: "Аккумулятор",
    text: "Питание затвора, матрицы, процессора и экрана. У беззеркалки экран и электронный видоискатель едят заряд постоянно.",
  },
  screen: {
    title: "Экран",
    text: "Смотрите уже картинку с матрицы (Live View) или превью снятого кадра. Это не видоискатель: при ярком солнце и на БВС часто бесполезен.",
  },
  viewfinder: {
    title: "Видоискатель",
    text: "У зеркалки — оптический: свет идёт через объектив, зеркало и пентапризму в глаз, матрица в этот момент закрыта зеркалом. У беззеркалки — электронный: вы смотрите то же, что пишет матрица.",
  },
  mirror: {
    title: "Зеркало",
    text: "Только зеркалка. Под 45° отводит свет в пентапризму. В момент съёмки откидывается — отсюда вибрация и пауза автофокуса. В аэросъёмке механика зеркала ещё и источник тряски.",
  },
  prism: {
    title: "Пентапризма",
    text: "Только зеркалка. Оборачивает изображение оптического видоискателя, чтобы смотреть «как есть», а не вверх ногами.",
  },
};

const COL = {
  body: 0x2a3544,
  bodyHi: 0x3a4a5c,
  metal: 0x8a9bb0,
  gold: 0xe2b56a,
  cyan: 0x6ec3d8,
  glass: 0x8fd4e8,
  ok: 0x86c99a,
  warn: 0xe07a73,
  screen: 0x1a3048,
  dark: 0x141b24,
};

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.28,
    roughness: 0.42,
    ...extra,
  });
}

function glassMat() {
  const m = new THREE.MeshStandardMaterial({
    color: COL.glass,
    metalness: 0.05,
    roughness: 0.12,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  m.userData.glass = true;
  return m;
}

function makeLabel(text) {
  const el = document.createElement("div");
  el.className = "sim-label";
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.visible = false;
  return obj;
}

function addBox(parent, w, h, d, material, x, y, z, id) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (id) mesh.userData.part = id;
  parent.add(mesh);
  return mesh;
}

function addCyl(parent, rTop, rBot, h, material, x, y, z, id, axis = "z") {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 32), material);
  if (axis === "z") mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  if (id) mesh.userData.part = id;
  parent.add(mesh);
  return mesh;
}

export function mountCameraSim(root) {
  const canvasHost = root.querySelector("[data-canvas]");
  const labelHost = root.querySelector("[data-labels]");
  const listEl = root.querySelector("[data-parts]");
  const titleEl = root.querySelector("[data-title]");
  const textEl = root.querySelector("[data-text]");
  const explodeEl = root.querySelector("[data-explode]");
  const explodeVal = root.querySelector("[data-explode-val]");
  const raysEl = root.querySelector("[data-rays]");
  const typeBtns = [...root.querySelectorAll("[data-type]")];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151c);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(18, 10, 22);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasHost.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "sim-label-layer";
  labelHost.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.4, 0);
  controls.minDistance = 8;
  controls.maxDistance = 48;

  scene.add(new THREE.HemisphereLight(0xcfe4f4, 0x1a222c, 0.9));
  const key = new THREE.DirectionalLight(0xfff4e0, 1.15);
  key.position.set(8, 14, 10);
  key.castShadow = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6ec3d8, 0.35);
  fill.position.set(-10, 4, -6);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(28, 48),
    new THREE.MeshStandardMaterial({ color: 0x171e27, roughness: 1, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6.2;
  floor.receiveShadow = true;
  scene.add(floor);

  const rig = new THREE.Group();
  scene.add(rig);

  const parts = {};
  const homes = {};
  const exploded = {};
  const labels = {};
  let mode = "mirrorless";
  let explode = 0;
  let selected = "body";
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function tag(obj, id) {
    obj.traverse((n) => {
      if (n.isMesh) n.userData.part = id;
    });
  }

  function register(id, group, homePos, expPos) {
    parts[id] = group;
    homes[id] = homePos.clone();
    exploded[id] = expPos.clone();
    group.position.copy(homePos);
    const lab = makeLabel(PARTS[id].title);
    lab.position.set(0, 1.2, 0);
    group.add(lab);
    labels[id] = lab;
    rig.add(group);
    tag(group, id);
  }

  function buildIris(group) {
    const blades = 6;
    for (let i = 0; i < blades; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 0.06, 0.42),
        mat(COL.gold)
      );
      const a = (i / blades) * Math.PI * 2;
      blade.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0);
      blade.rotation.z = a + 0.45;
      group.add(blade);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.08, 10, 28), mat(COL.metal));
    group.add(ring);
  }

  function buildLens() {
    const g = new THREE.Group();
    addCyl(g, 1.55, 1.7, 1.2, mat(COL.bodyHi), 0, 0, 0.2, "lens");
    addCyl(g, 1.7, 1.85, 2.4, mat(0x1e2733), 0, 0, 1.8, "lens");
    addCyl(g, 1.85, 1.7, 1.1, mat(COL.bodyHi), 0, 0, 3.4, "lens");
    const glass1 = new THREE.Mesh(new THREE.SphereGeometry(1.45, 24, 16, 0, Math.PI * 2, 0, 1.1), glassMat());
    glass1.rotation.x = Math.PI / 2;
    glass1.position.z = 3.85;
    g.add(glass1);
    const glass2 = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 16, 0, Math.PI * 2, 0, 1.0), glassMat());
    glass2.rotation.x = -Math.PI / 2;
    glass2.position.z = 0.55;
    g.add(glass2);
    addCyl(g, 1.95, 1.95, 0.22, mat(COL.gold, { metalness: 0.7 }), 0, 0, 0, "lens");
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), mat(COL.gold));
    mark.position.set(0, 1.95, 1.6);
    g.add(mark);
    return g;
  }

  function buildBody(isDslr) {
    const g = new THREE.Group();
    const depth = isDslr ? 5.6 : 4.2;
    addBox(g, 10.6, 7.2, depth, mat(COL.body), 0.3, 0.1, -depth / 2 - 0.05, "body");
    addBox(g, 3.6, 8.4, depth + 0.4, mat(COL.bodyHi), -5.4, -0.4, -depth / 2, "body");
    addCyl(g, 2.05, 2.05, 0.35, mat(COL.metal, { metalness: 0.65 }), 0, 0.2, 0.12, "body");
    const hole = new THREE.Mesh(
      new THREE.CircleGeometry(1.55, 28),
      new THREE.MeshBasicMaterial({ color: COL.dark })
    );
    hole.position.z = 0.32;
    g.add(hole);
    addBox(g, 1.6, 0.35, 1.2, mat(COL.metal), 0, 3.85, -1.1, "body");
    return g;
  }

  function buildShutter() {
    const g = new THREE.Group();
    addBox(g, 4.2, 2.9, 0.12, mat(0x3a4554), 0, 0, 0, "shutter");
    addBox(g, 4.0, 1.15, 0.08, mat(COL.metal), 0, 0.7, 0.08, "shutter");
    addBox(g, 4.0, 1.15, 0.08, mat(0x5a6574), 0, -0.7, 0.08, "shutter");
    return g;
  }

  function buildSensor() {
    const g = new THREE.Group();
    addBox(g, 4.4, 3.2, 0.18, mat(0x1a222c), 0, 0, 0, "sensor");
    const canvas = document.createElement("canvas");
    canvas.width = 36 * 8;
    canvas.height = 24 * 8;
    const ctx = canvas.getContext("2d");
    const cols = ["#1f6b4a", "#c44c3a", "#2a6fbf", "#1f6b4a"];
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 36; x++) {
        const i = (x % 2) + (y % 2) * 2;
        ctx.fillStyle = cols[i];
        ctx.fillRect(x * 8, y * 8, 8, 8);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const chip = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.4),
      new THREE.MeshStandardMaterial({ map: tex, metalness: 0.1, roughness: 0.35 })
    );
    chip.position.z = 0.1;
    g.add(chip);
    addBox(g, 5.2, 4.0, 0.35, mat(COL.cyan, { metalness: 0.45 }), 0, 0, -0.28, "sensor");
    return g;
  }

  function buildProcessor() {
    const g = new THREE.Group();
    addBox(g, 2.4, 0.28, 2.4, mat(COL.ok, { metalness: 0.4 }), 0, 0, 0, "processor");
    addBox(g, 1.1, 0.18, 1.1, mat(0x11161c), 0, 0.2, 0, "processor");
    for (const s of [-0.9, 0.9]) {
      addBox(g, 0.12, 0.08, 2.1, mat(COL.gold, { metalness: 0.8 }), s, 0.05, 0, "processor");
      addBox(g, 2.1, 0.08, 0.12, mat(COL.gold, { metalness: 0.8 }), 0, 0.05, s, "processor");
    }
    return g;
  }

  function buildMemory() {
    const g = new THREE.Group();
    addBox(g, 1.4, 0.18, 1.9, mat(COL.gold), 0, 0, 0, "memory");
    addBox(g, 1.1, 0.05, 0.4, mat(COL.metal), 0, 0.12, 0.6, "memory");
    return g;
  }

  function buildBattery() {
    const g = new THREE.Group();
    addBox(g, 2.2, 4.4, 1.5, mat(COL.ok, { roughness: 0.55 }), 0, 0, 0, "battery");
    addBox(g, 1.6, 0.2, 0.7, mat(COL.gold), 0, 2.3, 0.2, "battery");
    return g;
  }

  function buildScreen() {
    const g = new THREE.Group();
    addBox(g, 7.2, 4.8, 0.28, mat(COL.bodyHi), 0, 0, 0, "screen");
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 4.0),
      new THREE.MeshStandardMaterial({
        color: 0x6ec3d8,
        emissive: 0x163048,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
    );
    pane.position.z = 0.16;
    g.add(pane);
    return g;
  }

  function buildEvf() {
    const g = new THREE.Group();
    addBox(g, 2.4, 1.8, 2.6, mat(COL.bodyHi), 0, 0, 0, "viewfinder");
    addCyl(g, 0.7, 0.85, 0.7, mat(0x11161c), 0, 0.1, 1.5, "viewfinder");
    return g;
  }

  function buildMirror() {
    const g = new THREE.Group();
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2.4),
      new THREE.MeshStandardMaterial({
        color: 0xc5d2e0,
        metalness: 0.92,
        roughness: 0.08,
        side: THREE.DoubleSide,
      })
    );
    m.rotation.x = -Math.PI / 4;
    g.add(m);
    return g;
  }

  function buildPrism() {
    const g = new THREE.Group();
    const geo = new THREE.ConeGeometry(1.8, 2.2, 4);
    const mesh = new THREE.Mesh(geo, mat(COL.gold, { metalness: 0.45, roughness: 0.25 }));
    mesh.rotation.y = Math.PI / 4;
    g.add(mesh);
    addBox(g, 2.6, 0.35, 2.2, mat(COL.bodyHi), 0, -1.15, 0.1, "prism");
    return g;
  }

  const rays = new THREE.Group();
  scene.add(rays);
  function rebuildRays() {
    rays.clear();
    if (!raysEl.checked) return;
    const matLine = new THREE.LineBasicMaterial({ color: 0x6ec3d8, transparent: true, opacity: 0.85 });
    const origin = new THREE.Vector3(0, 0.2, 8.5);
    const targets = [
      new THREE.Vector3(-1.6, 1.0, sensorZ()),
      new THREE.Vector3(1.6, 1.0, sensorZ()),
      new THREE.Vector3(-1.6, -1.0, sensorZ()),
      new THREE.Vector3(1.6, -1.0, sensorZ()),
      new THREE.Vector3(0, 0.2, sensorZ()),
    ];
    for (const t of targets) {
      const geo = new THREE.BufferGeometry().setFromPoints([origin, t]);
      rays.add(new THREE.Line(geo, matLine));
    }
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshBasicMaterial({ color: COL.gold })
    );
    pupil.position.set(0, 0.2, 0.4);
    rays.add(pupil);
  }

  function sensorZ() {
    return mode === "dslr" ? -4.6 : -3.2;
  }

  function clearRig() {
    while (rig.children.length) rig.remove(rig.children[0]);
    for (const k of Object.keys(parts)) delete parts[k];
  }

  function assemble() {
    clearRig();
    const dslr = mode === "dslr";
    const flange = dslr ? 4.4 : 2.0;

    register("body", buildBody(dslr), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
    register("lens", buildLens(), new THREE.Vector3(0, 0.2, 0.4), new THREE.Vector3(0, 0.2, 8.2));
    const iris = new THREE.Group();
    buildIris(iris);
    register("iris", iris, new THREE.Vector3(0, 0.2, 2.2), new THREE.Vector3(0, 5.8, 3.4));
    register("shutter", buildShutter(), new THREE.Vector3(0, 0.2, -0.55), new THREE.Vector3(6.4, 3.2, -0.4));
    register(
      "sensor",
      buildSensor(),
      new THREE.Vector3(0, 0.2, -flange),
      new THREE.Vector3(0, -5.4, -flange - 1.2)
    );
    register(
      "processor",
      buildProcessor(),
      new THREE.Vector3(2.4, -2.4, -flange - 0.6),
      new THREE.Vector3(7.2, -5.8, -2.2)
    );
    register("memory", buildMemory(), new THREE.Vector3(5.4, -1.2, -1.8), new THREE.Vector3(10.5, -1.2, -1.8));
    register("battery", buildBattery(), new THREE.Vector3(-5.4, -1.6, -1.6), new THREE.Vector3(-11.2, -3.8, -1.6));
    register(
      "screen",
      buildScreen(),
      new THREE.Vector3(0.4, 0.3, dslr ? -5.95 : -4.45),
      new THREE.Vector3(0.4, 0.3, dslr ? -11.2 : -9.6)
    );

    if (dslr) {
      register("mirror", buildMirror(), new THREE.Vector3(0, 0.15, -1.15), new THREE.Vector3(0, 6.4, -1.0));
      register("prism", buildPrism(), new THREE.Vector3(0, 4.7, -1.6), new THREE.Vector3(0, 9.6, -1.6));
      register("viewfinder", buildEvf(), new THREE.Vector3(0, 5.6, 0.4), new THREE.Vector3(0, 10.4, 2.4));
    } else {
      register("viewfinder", buildEvf(), new THREE.Vector3(0, 4.55, -1.5), new THREE.Vector3(0, 8.6, -1.5));
    }

    applyExplode();
    fillList();
    rebuildRays();
    selectPart(selected in PARTS && parts[selected] ? selected : "body", false);
  }

  function applyExplode() {
    const t = explode;
    for (const id of Object.keys(parts)) {
      parts[id].position.lerpVectors(homes[id], exploded[id], t);
      if (labels[id]) labels[id].visible = t > 0.18 || id === selected;
    }
    if (explodeVal) explodeVal.textContent = `${Math.round(t * 100)} %`;
  }

  function fillList() {
    const order = Object.keys(parts);
    listEl.innerHTML = "";
    for (const id of order) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sim-part";
      b.dataset.part = id;
      b.textContent = PARTS[id].title;
      if (id === selected) b.classList.add("is-on");
      b.addEventListener("click", () => selectPart(id, true));
      listEl.append(b);
    }
  }

  function clearOutlines() {
    const dump = [];
    rig.traverse((n) => {
      if (n.userData.isOutline) dump.push(n);
    });
    for (const n of dump) {
      n.parent?.remove(n);
      n.geometry?.dispose();
    }
  }

  function outlinePart(id) {
    clearOutlines();
    const g = parts[id];
    if (!g) return;
    g.traverse((n) => {
      if (!n.isMesh || !n.geometry || n.userData.isOutline) return;
      const e = new THREE.LineSegments(
        new THREE.EdgesGeometry(n.geometry, 28),
        new THREE.LineBasicMaterial({ color: COL.gold, depthTest: false })
      );
      e.userData.isOutline = true;
      e.renderOrder = 20;
      n.add(e);
    });
  }

  function setPartOpacity(id) {
    for (const [k, g] of Object.entries(parts)) {
      const on = k === id;
      g.traverse((n) => {
        if (!n.isMesh || !n.material || n.userData.isOutline) return;
        const mats = Array.isArray(n.material) ? n.material : [n.material];
        for (const m of mats) {
          if (m.userData.glass) {
            m.opacity = on ? 0.38 : 0.16;
            continue;
          }
          m.transparent = true;
          m.opacity = on ? 1 : 0.5;
          m.depthWrite = on;
          m.needsUpdate = true;
        }
      });
    }
  }

  function selectPart(id, fromUser) {
    if (!PARTS[id] || !parts[id]) return;
    selected = id;
    titleEl.textContent = PARTS[id].title;
    textEl.textContent = PARTS[id].text;
    listEl.querySelectorAll(".sim-part").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.part === id);
    });
    setPartOpacity(id);
    outlinePart(id);
    for (const k of Object.keys(labels)) {
      if (labels[k]) labels[k].visible = explode > 0.18 || k === id;
    }
    if (fromUser) parts[id].parent.updateMatrixWorld(true);
  }

  function resize() {
    const w = canvasHost.clientWidth;
    const h = canvasHost.clientHeight;
    if (w < 8 || h < 8) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
  }

  function onPointer(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(rig.children, true);
    const hit = hits.find((h) => h.object.userData.part);
    if (hit) selectPart(hit.object.userData.part, true);
  }

  typeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.type;
      typeBtns.forEach((b) => b.classList.toggle("is-on", b === btn));
      if (mode === "mirrorless" && (selected === "mirror" || selected === "prism")) selected = "viewfinder";
      assemble();
    });
  });

  explodeEl.addEventListener("input", () => {
    explode = Number(explodeEl.value);
    applyExplode();
  });
  raysEl.addEventListener("change", rebuildRays);

  let ptrDown = null;
  renderer.domElement.addEventListener("pointerdown", (ev) => {
    ptrDown = { x: ev.clientX, y: ev.clientY };
  });
  renderer.domElement.addEventListener("pointerup", (ev) => {
    if (!ptrDown) return;
    if (Math.hypot(ev.clientX - ptrDown.x, ev.clientY - ptrDown.y) < 6) onPointer(ev);
    ptrDown = null;
  });

  addOrbitHint(root.querySelector(".sim-stage"));

  const ro = new ResizeObserver(resize);
  ro.observe(canvasHost);

  assemble();
  resize();

  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
  };
}
