import * as THREE from "three";

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.58,
    metalness: 0.08,
    ...extra,
  });
}

function mesh(geometry, mat, name = "") {
  const result = new THREE.Mesh(geometry, mat);
  result.name = name;
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

export function addStudio(scene, size = 30) {
  scene.add(new THREE.HemisphereLight(0xd8ebff, 0x20242b, 1.25));
  const key = new THREE.DirectionalLight(0xfff1d2, 2.2);
  key.position.set(-7, 12, -5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x7fc7ff, 0.65);
  fill.position.set(8, 5, 2);
  scene.add(fill);
  const floor = mesh(
    new THREE.PlaneGeometry(size, size),
    material(0x5f666b, { roughness: 0.9 }),
    "пол"
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(size, size, 0xd8d8d8, 0x81878c);
  grid.position.y = 0.004;
  scene.add(grid);
  return { floor, grid };
}

export function createPerson(color = 0xe2b56a) {
  const g = new THREE.Group();
  g.name = "Человек";
  const skin = material(0xd6a079);
  const shirt = material(color);
  const dark = material(0x263445);
  const head = mesh(new THREE.SphereGeometry(0.13, 20, 16), skin);
  head.position.y = 1.63;
  const torso = mesh(new THREE.CapsuleGeometry(0.19, 0.52, 5, 12), shirt);
  torso.position.y = 1.18;
  const limb = (x, y, h, mat) => {
    const m = mesh(new THREE.CapsuleGeometry(0.065, h, 4, 8), mat);
    m.position.set(x, y, 0);
    return m;
  };
  const leftLeg = limb(-0.1, 0.42, 0.58, dark);
  const rightLeg = limb(0.1, 0.42, 0.58, dark);
  const leftArm = limb(-0.27, 1.2, 0.43, skin);
  const rightArm = limb(0.27, 1.2, 0.43, skin);
  g.add(head, torso, leftLeg, rightLeg, leftArm, rightArm);
  g.userData.height = 1.76;
  return g;
}

export function createCar(color = 0xe05f53) {
  const g = new THREE.Group();
  g.name = "Машина";
  const body = mesh(new THREE.BoxGeometry(3.8, 0.65, 1.65), material(color));
  body.position.y = 0.62;
  const hood = mesh(new THREE.BoxGeometry(1.15, 0.3, 1.58), material(color));
  hood.position.set(1.25, 1.03, 0);
  const cabin = mesh(
    new THREE.BoxGeometry(1.65, 0.65, 1.48),
    material(0x273848, { metalness: 0.25 })
  );
  cabin.position.set(-0.25, 1.18, 0);
  const wheelMat = material(0x15181c, { roughness: 0.95 });
  for (const x of [-1.18, 1.18]) {
    for (const z of [-0.84, 0.84]) {
      const wheel = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 20), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.37, z);
      g.add(wheel);
    }
  }
  g.add(body, hood, cabin);
  g.userData.height = 1.52;
  return g;
}

export function createHouse(color = 0xc7c0ae) {
  const g = new THREE.Group();
  g.name = "Дом";
  const wall = mesh(new THREE.BoxGeometry(4.2, 2.7, 3.2), material(color));
  wall.position.y = 1.35;
  const roof = mesh(
    new THREE.ConeGeometry(3.05, 1.5, 4),
    material(0x934b3f, { roughness: 0.82 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 3.45;
  const door = mesh(new THREE.BoxGeometry(0.7, 1.45, 0.08), material(0x4a3427));
  door.position.set(0, 0.73, -1.64);
  const windowMat = material(0x78bcd7, {
    emissive: 0x163744,
    emissiveIntensity: 0.35,
    metalness: 0.35,
  });
  for (const x of [-1.25, 1.25]) {
    const win = mesh(new THREE.BoxGeometry(0.78, 0.62, 0.06), windowMat);
    win.position.set(x, 1.72, -1.65);
    g.add(win);
  }
  g.add(wall, roof, door);
  g.userData.height = 4.2;
  return g;
}

export function createFan() {
  const g = new THREE.Group();
  g.name = "Вентилятор";
  const base = mesh(new THREE.CylinderGeometry(0.36, 0.46, 0.12, 24), material(0x4c5967));
  base.position.y = 0.06;
  const stem = mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.2, 12), material(0x8d9baa));
  stem.position.y = 0.68;
  const rotor = new THREE.Group();
  rotor.name = "rotor";
  rotor.position.set(0, 1.34, 0);
  rotor.rotation.y = Math.PI / 2;
  const hub = mesh(new THREE.SphereGeometry(0.12, 16, 12), material(0xe2b56a));
  rotor.add(hub);
  const bladeMat = material(0x6ec3d8);
  for (let i = 0; i < 5; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = i * Math.PI * 2 / 5;
    const blade = mesh(new THREE.BoxGeometry(0.12, 0.75, 0.055), bladeMat);
    blade.position.y = 0.42;
    blade.rotation.z = -0.18;
    pivot.add(blade);
    rotor.add(pivot);
  }
  g.add(base, stem, rotor);
  g.userData.rotor = rotor;
  g.userData.height = 1.75;
  return g;
}

function chartTexture(kind, size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  x.fillStyle = "#f4f4ed";
  x.fillRect(0, 0, size, size);
  if (kind === "checker") {
    const n = 10;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      x.fillStyle = (i + j) % 2 ? "#161616" : "#f4f4ed";
      x.fillRect(i * size / n, j * size / n, size / n, size / n);
    }
  } else if (kind === "star") {
    x.translate(size / 2, size / 2);
    for (let i = 0; i < 72; i++) {
      x.fillStyle = i % 2 ? "#111" : "#f7f7f0";
      x.beginPath();
      x.moveTo(0, 0);
      x.arc(0, 0, size * 0.45, i * Math.PI / 36, (i + 1) * Math.PI / 36);
      x.fill();
    }
    x.fillStyle = "#e2b56a";
    x.beginPath();
    x.arc(0, 0, 8, 0, Math.PI * 2);
    x.fill();
  } else if (kind === "bars") {
    const groups = [4, 8, 16, 28, 44];
    groups.forEach((count, row) => {
      const y = 25 + row * 92;
      const cell = (size - 50) / count;
      for (let i = 0; i < count; i++) {
        x.fillStyle = i % 2 ? "#fff" : "#111";
        x.fillRect(25 + i * cell, y, cell, 60);
      }
    });
  } else {
    const colors = ["#050505", "#383838", "#707070", "#a8a8a8", "#ddd", "#fff"];
    colors.forEach((col, i) => {
      x.fillStyle = col;
      x.fillRect(i * size / colors.length, 0, size / colors.length, size / 2);
    });
    const swatches = ["#c74039", "#4d9a52", "#386ab2", "#e2b64f", "#a94d9a", "#4ea6a8"];
    swatches.forEach((col, i) => {
      x.fillStyle = col;
      x.fillRect(i * size / swatches.length, size / 2, size / swatches.length, size / 2);
    });
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createChart(kind, title) {
  const g = new THREE.Group();
  g.name = title;
  const board = mesh(
    new THREE.BoxGeometry(2.2, 2.2, 0.09),
    material(0x252a31)
  );
  board.position.y = 1.28;
  const face = mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({ map: chartTexture(kind), side: THREE.DoubleSide })
  );
  face.position.set(0, 1.28, -0.051);
  face.rotation.y = Math.PI;
  g.add(board, face);
  g.userData.height = 2.4;
  return g;
}

export function createTestPallet() {
  const pallet = new THREE.Group();
  pallet.name = "Палетка с четырьмя тест-объектами";
  const backing = mesh(
    new THREE.BoxGeometry(3.75, 1.15, 0.13),
    material(0x343b43, { roughness: 0.82 }),
    "Основание палетки"
  );
  backing.position.set(0, 0.72, 0.05);
  const foot = mesh(
    new THREE.BoxGeometry(3.95, 0.15, 0.72),
    material(0x6d563d, { roughness: 0.92 }),
    "Опора палетки"
  );
  foot.position.y = 0.075;
  pallet.add(backing, foot);

  const definitions = [
    ["checker", "checker", "Шахматная мира"],
    ["star", "star", "Радиальная мира"],
    ["bars", "bars", "Штриховая мира"],
    ["tones", "tones", "Серая и цветовая шкалы"],
  ];
  const charts = {};
  definitions.forEach(([id, kind, title], index) => {
    const chart = createChart(kind, title);
    chart.scale.setScalar(0.35);
    chart.position.set(-1.35 + index * 0.9, 0.22, -0.04);
    pallet.add(chart);
    charts[id] = chart;
  });
  pallet.userData.charts = charts;
  return pallet;
}

export function createMeterRuler(height = 3) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 768;
  const x = c.getContext("2d");
  x.fillStyle = "#f4f0dd";
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "#1b2026";
  x.fillStyle = "#1b2026";
  x.font = "24px sans-serif";
  for (let i = 0; i <= 30; i++) {
    const y = c.height - i * c.height / 30;
    x.lineWidth = i % 10 === 0 ? 5 : 2;
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(i % 10 === 0 ? 90 : i % 5 === 0 ? 65 : 38, y);
    x.stroke();
    if (i % 10 === 0) x.fillText(`${i / 10} м`, 12, Math.max(25, y - 5));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ruler = mesh(
    new THREE.PlaneGeometry(0.5, height),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
  );
  ruler.position.y = height / 2;
  ruler.rotation.y = Math.PI;
  ruler.name = "Метровая линейка";
  return ruler;
}

export function createCalibrationScene(scene) {
  addStudio(scene, 36);
  const objects = {};
  const add = (id, object, position, rotationY = 0) => {
    object.position.copy(position);
    object.rotation.y = rotationY;
    object.userData.id = id;
    scene.add(object);
    objects[id] = object;
  };
  const palletLayout = [
    { id: "palletNear", position: new THREE.Vector3(-1.9, 0, 6) },
    { id: "palletMiddle", position: new THREE.Vector3(1.6, 0, 10) },
    { id: "palletFar", position: new THREE.Vector3(5.8, 0, 14) },
  ];
  objects.pallets = [];
  palletLayout.forEach(({ id, position }, index) => {
    const pallet = createTestPallet();
    add(id, pallet, position);
    pallet.userData.distanceM = position.z;
    objects.pallets.push(pallet);
    if (index === 1) Object.assign(objects, pallet.userData.charts);
  });
  add("ruler", createMeterRuler(3), new THREE.Vector3(-5.2, 0, 10.95));
  add("personNear", createPerson(0xe2b56a), new THREE.Vector3(-2.4, 0, 4.2));
  add("personFar", createPerson(0x86c99a), new THREE.Vector3(4.2, 0, 13.2));
  add("car", createCar(), new THREE.Vector3(1.3, 0, 7.1), Math.PI / 2);
  add("fan", createFan(), new THREE.Vector3(-0.8, 0, 5.0));
  const house = createHouse();
  house.scale.setScalar(0.8);
  add("house", house, new THREE.Vector3(-6.6, 0, 15.2));
  return objects;
}

export function boundsCorners(object) {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  const { min, max } = box;
  return [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(min.x, max.y, max.z),
    new THREE.Vector3(max.x, max.y, max.z),
  ];
}
