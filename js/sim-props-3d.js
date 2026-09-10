import * as THREE from "three";

function std(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.12,
    ...extra,
  });
}

export function makePerson(color = 0xe2b56a) {
  const g = new THREE.Group();
  g.userData.kind = "person";
  const skin = std(color);
  const dark = std(0x2a3544);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), skin);
  head.position.y = 1.58;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 0.22), skin);
  torso.position.y = 1.18;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), dark);
  legL.position.set(-0.09, 0.35, 0);
  const legR = legL.clone();
  legR.position.x = 0.09;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), skin);
  armL.position.set(-0.24, 1.15, 0);
  const armR = armL.clone();
  armR.position.x = 0.24;
  for (const m of [head, torso, legL, legR, armL, armR]) {
    m.castShadow = true;
    g.add(m);
  }
  g.userData.height = 1.72;
  return g;
}

export function makeHouse(color = 0x8aa0b4) {
  const g = new THREE.Group();
  g.userData.kind = "house";
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.4), std(color));
  wall.position.y = 1.2;
  wall.castShadow = true;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.35, 1.2, 4),
    std(0xe07a73, { roughness: 0.7 })
  );
  roof.position.y = 3.0;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.08), std(0x3a2a18));
  door.position.set(0, 0.55, 1.22);
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.45, 0.06),
    std(0x6ec3d8, { emissive: 0x163048, emissiveIntensity: 0.35 })
  );
  const w1 = win.clone();
  w1.position.set(-0.85, 1.55, 1.22);
  const w2 = win.clone();
  w2.position.set(0.85, 1.55, 1.22);
  g.add(wall, roof, door, w1, w2);
  g.userData.height = 3.6;
  return g;
}

export function makeCar(color = 0xe07a73) {
  const g = new THREE.Group();
  g.userData.kind = "car";
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 1.5), std(color));
  body.position.y = 0.55;
  body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.35), std(0x2a3544));
  cabin.position.set(-0.2, 1.12, 0);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.38, 1.38),
    std(0x6ec3d8, { transparent: true, opacity: 0.35 })
  );
  glass.position.copy(cabin.position);
  const mkWheel = (x, z) => {
    const w = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16),
      std(0x1a222c, { roughness: 0.8 })
    );
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.32, z);
    return w;
  };
  g.add(body, cabin, glass, mkWheel(-1.1, 0.7), mkWheel(-1.1, -0.7), mkWheel(1.15, 0.7), mkWheel(1.15, -0.7));
  g.userData.height = 1.5;
  return g;
}

export function makeFan(color = 0x6ec3d8) {
  const g = new THREE.Group();
  g.userData.kind = "fan";
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.06, 20), std(0x3a4a5c));
  base.position.y = 0.03;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 10), std(0x8a9bb0));
  stem.position.y = 0.18;
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), std(color));
  hub.position.y = 0.34;
  const blades = new THREE.Group();
  blades.position.y = 0.34;
  const bladeMat = std(color, { transparent: true, opacity: 0.85 });
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.1), bladeMat);
    b.position.x = 0.16;
    const hold = new THREE.Group();
    hold.rotation.y = (i / 3) * Math.PI * 2;
    hold.add(b);
    blades.add(hold);
  }
  g.add(base, stem, hub, blades);
  g.userData.blades = blades;
  g.userData.height = 0.4;
  return g;
}

export function cornersOf(obj) {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const min = box.min;
  const max = box.max;
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
