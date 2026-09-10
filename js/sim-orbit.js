export function addOrbitHint(stage) {
  if (!stage || stage.querySelector(".sim-orbit-hint")) return;
  const el = document.createElement("div");
  el.className = "sim-orbit-hint";
  el.textContent = "ЛКМ — вращать · ПКМ — сдвиг · колесо — масштаб";
  stage.appendChild(el);
}
