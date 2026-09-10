import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export function makeLabel(text, color = "#e2b56a") {
  const el = document.createElement("span");
  el.className = "sim-label";
  el.style.borderColor = color;
  el.textContent = text;
  const object = new CSS2DObject(el);
  object.userData.label = true;
  return object;
}

export function createViewport({
  host,
  labelHost = null,
  scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera(48, 1, 0.05, 300),
  target = new THREE.Vector3(),
  position = new THREE.Vector3(8, 6, 10),
  minDistance = 1,
  maxDistance = 80,
  onFrame = null,
}) {
  camera.position.copy(position);
  scene.background ??= new THREE.Color(0x10151c);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "sim-webgl";
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.style.pointerEvents = "auto";
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label", "Интерактивная 3D-сцена");
  host.appendChild(renderer.domElement);
  host.style.pointerEvents = "auto";

  let labelRenderer = null;
  if (labelHost) {
    labelHost.style.pointerEvents = "none";
    labelHost.setAttribute("aria-hidden", "true");
    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = "sim-label-layer";
    labelRenderer.domElement.style.pointerEvents = "none";
    labelHost.appendChild(labelRenderer.domElement);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.copy(target);
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.screenSpacePanning = true;
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  renderer.domElement.addEventListener("pointerdown", () => {
    renderer.domElement.focus({ preventScroll: true });
  });
  renderer.domElement.addEventListener("contextmenu", (event) => event.preventDefault());

  const initial = {
    position: position.clone(),
    target: target.clone(),
  };
  let running = false;
  let raf = 0;
  let last = performance.now();
  let renderedWidth = 0;
  let renderedHeight = 0;

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 8 || h < 8) return false;
    if (w === renderedWidth && h === renderedHeight) return true;
    renderedWidth = w;
    renderedHeight = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labelRenderer?.setSize(w, h);
    return true;
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!resize()) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    onFrame?.(dt, now / 1000);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer?.render(scene, camera);
  }

  function wake() {
    if (running) {
      resize();
      return;
    }
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function sleep() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function resetView() {
    camera.position.copy(initial.position);
    controls.target.copy(initial.target);
    controls.update();
    resize();
  }

  const ro = new ResizeObserver(() => {
    if (host.offsetParent !== null) resize();
  });
  ro.observe(host);

  function dispose() {
    sleep();
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    labelRenderer?.domElement.remove();
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    resize,
    wake,
    sleep,
    resetView,
    dispose,
  };
}

export function addViewportHelp(stage, viewport) {
  const box = document.createElement("div");
  box.className = "sim-orbit-hint";
  box.innerHTML = "<span>ЛКМ — вращать · ПКМ — сдвиг · колесо — масштаб</span>";
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Сбросить вид";
  reset.addEventListener("click", (event) => {
    event.stopPropagation();
    viewport.resetView();
  });
  box.append(reset);
  const parameterPanel = stage.querySelector(".sim-toolbar") ||
    stage.closest(".sim-dof-views")?.querySelector(".sim-toolbar--static");
  if (parameterPanel) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = "Скрыть параметры";
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const hidden = parameterPanel.classList.toggle("is-hidden");
      toggle.textContent = hidden ? "Показать параметры" : "Скрыть параметры";
    });
    box.append(toggle);
  }
  stage.append(box);
}
