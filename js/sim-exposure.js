const STOPS = {
  K: [1.4, 2, 2.8, 4, 5.6, 8, 11, 16],
  t: [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1],
  iso: [100, 200, 400, 800, 1600, 3200, 6400],
};

const SCENES = {
  table: {
    name: "Стол",
    ev100: 9,
    fMm: 50,
    camH: 0.32,
    hint: "Вентилятор крутится, пока не сняли кадр. Длинная выдержка размажет лопасти; ISO — шум фона.",
    items: [
      { kind: "cup", X: -0.22, Z: 0.75, h: 0.12, col: "#c47a6a" },
      { kind: "fan", X: 0.02, Z: 0.95, h: 0.28, col: "#6ec3d8", spin: 14 },
      { kind: "book", X: 0.28, Z: 1.15, h: 0.04, col: "#e2b56a" },
      { kind: "vase", X: -0.08, Z: 1.65, h: 0.32, col: "#86c99a" },
    ],
  },
  street: {
    name: "Улица",
    ev100: 13,
    fMm: 35,
    camH: 1.45,
    hint: "Машина едет, человек идёт. Короткая выдержка замораживает; длинная даёт смаз по направлению движения.",
    items: [
      { kind: "house", X: -4.2, Z: 16, h: 6.2, w: 7, col: "#8aa0b4" },
      { kind: "person", X: -1.4, Z: 8, h: 1.72, col: "#e2b56a", vX: 1.2 },
      { kind: "car", X: 3.5, Z: 11, h: 1.5, w: 4.2, col: "#e07a73", vX: -9 },
    ],
  },
};

function nearest(list, v) {
  return list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
}

function fmtT(t) {
  if (t >= 1) return `${t.toFixed(t >= 2 ? 0 : 1)} с`;
  return `1/${Math.round(1 / t)} с`;
}

function ev100(K, t) {
  return Math.log2((K * K) / t);
}

function brightness(K, t, iso, targetEv) {
  const ev = ev100(K, t) - Math.log2(iso / 100);
  return ev - targetEv;
}

function project(X, Y, Z, w, h, fMm, sw, sh, camH) {
  const u = (fMm / sw) * (X / Z);
  const v = (fMm / sh) * ((Y - camH) / Z);
  return { x: w / 2 + u * w, y: h / 2 - v * h };
}

function drawCup(ctx, x, y0, y1, col) {
  const s = y0 - y1;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x, y1 + 0.15 * s, 0.38 * s, 0.12 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 0.34 * s, y1 + 0.15 * s, 0.68 * s, 0.7 * s);
}

function drawBook(ctx, x, y0, y1, col) {
  const s = Math.max(8, y0 - y1);
  ctx.fillStyle = col;
  ctx.fillRect(x - 1.6 * s, y0 - s, 3.2 * s, s);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(x - 1.6 * s, y0 - 1.25 * s, 3.2 * s, 0.25 * s);
}

function drawVase(ctx, x, y0, y1, col) {
  const s = y0 - y1;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - 0.22 * s, y0);
  ctx.lineTo(x - 0.32 * s, y1);
  ctx.lineTo(x + 0.32 * s, y1);
  ctx.lineTo(x + 0.22 * s, y0);
  ctx.closePath();
  ctx.fill();
}

function drawPerson(ctx, x, y0, y1, col) {
  const s = y0 - y1;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x, y1 + 0.1 * s, 0.09 * s, 0.1 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 0.13 * s, y1 + 0.2 * s, 0.26 * s, 0.38 * s);
  ctx.fillRect(x - 0.12 * s, y1 + 0.58 * s, 0.1 * s, 0.42 * s);
  ctx.fillRect(x + 0.02 * s, y1 + 0.58 * s, 0.1 * s, 0.42 * s);
}

function drawCar(ctx, x0, y0, x1, y1, col) {
  const w = x1 - x0;
  const h = y0 - y1;
  ctx.fillStyle = col;
  ctx.fillRect(x0, y0 - 0.48 * h, w, 0.32 * h);
  ctx.fillRect(x0 + 0.22 * w, y1, 0.5 * w, 0.52 * h);
  ctx.fillStyle = "#1a222c";
  ctx.beginPath();
  ctx.arc(x0 + 0.22 * w, y0 - 0.14 * h, 0.14 * h, 0, Math.PI * 2);
  ctx.arc(x0 + 0.78 * w, y0 - 0.14 * h, 0.14 * h, 0, Math.PI * 2);
  ctx.fill();
}

function drawHouse(ctx, x0, y0, x1, y1, col) {
  const w = x1 - x0;
  const h = y0 - y1;
  ctx.fillStyle = col;
  ctx.fillRect(x0, y1 + 0.28 * h, w, 0.72 * h);
  ctx.fillStyle = "#e07a73";
  ctx.beginPath();
  ctx.moveTo(x0 - 0.04 * w, y1 + 0.28 * h);
  ctx.lineTo(x0 + w / 2, y1);
  ctx.lineTo(x1 + 0.04 * w, y1 + 0.28 * h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(x0 + 0.44 * w, y0 - 0.32 * h, 0.14 * w, 0.32 * h);
  ctx.fillStyle = "#6ec3d8";
  ctx.fillRect(x0 + 0.12 * w, y1 + 0.42 * h, 0.16 * w, 0.14 * h);
  ctx.fillRect(x0 + 0.7 * w, y1 + 0.42 * h, 0.16 * w, 0.14 * h);
}

function drawFan(ctx, x, y0, y1, col, angle) {
  const s = y0 - y1;
  ctx.fillStyle = "#4a5564";
  ctx.fillRect(x - 0.12 * s, y0 - 0.18 * s, 0.24 * s, 0.18 * s);
  ctx.strokeStyle = "#8a9bb0";
  ctx.lineWidth = Math.max(2, 0.04 * s);
  ctx.beginPath();
  ctx.moveTo(x, y0 - 0.16 * s);
  ctx.lineTo(x, y1 + 0.22 * s);
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y1 + 0.22 * s);
  ctx.rotate(angle);
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.88;
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0.28 * s, 0, 0.28 * s, 0.08 * s, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#e2b56a";
  ctx.beginPath();
  ctx.arc(x, y1 + 0.22 * s, 0.07 * s, 0, Math.PI * 2);
  ctx.fill();
}

function pingpong(x0, v, t, a, b) {
  const L = b - a;
  if (L <= 0 || !v) return x0;
  let d = (x0 - a + v * t) % (2 * L);
  if (d < 0) d += 2 * L;
  return d < L ? a + d : b - (d - L);
}

function itemPose(it, time) {
  const X = it.vX ? pingpong(it.X, it.vX, time, -5.5, 5.5) : it.X;
  return { ...it, X, ang: (it.spin || 0) * time };
}

export function mountExposureSim(root) {
  const canvas = root.querySelector("[data-exp-photo]");
  const read = root.querySelector("[data-exp-read]");
  const kEl = root.querySelector("[data-exp-k]");
  const tEl = root.querySelector("[data-exp-t]");
  const isoEl = root.querySelector("[data-exp-iso]");
  const kVal = root.querySelector("[data-exp-kval]");
  const tVal = root.querySelector("[data-exp-tval]");
  const isoVal = root.querySelector("[data-exp-isoval]");
  const modeBtns = [...root.querySelectorAll("[data-exp-mode]")];
  const sceneBtns = [...root.querySelectorAll("[data-exp-scene]")];
  const snapBtn = root.querySelector("[data-exp-snap]");
  const liveBtn = root.querySelector("[data-exp-live]");
  const ctx = canvas.getContext("2d");

  let mode = "M";
  let sceneId = "table";
  let K = 2.8;
  let t = 1 / 125;
  let iso = 100;
  let frozen = null;
  let t0 = performance.now();

  const nowSec = () => (frozen ?? (performance.now() - t0) / 1000);

  const targetPair = (sc) => {
    const want = sc.ev100;
    if (mode === "A") {
      t = nearest(STOPS.t, (K * K) / 2 ** (want + Math.log2(iso / 100)));
    } else if (mode === "S") {
      K = nearest(STOPS.K, Math.sqrt(t * 2 ** (want + Math.log2(iso / 100))));
    } else if (mode === "P") {
      K = 5.6;
      t = nearest(STOPS.t, (K * K) / 2 ** (want + Math.log2(iso / 100)));
    }
  };

  const drawItem = (it, w, h, sc, fMm, blur, samples) => {
    const camH = sc.camH;
    const sw = 36;
    const sh = 24;
    const n = Math.max(1, samples);
    ctx.save();
    ctx.globalAlpha = 1 / n;
    for (let i = 0; i < n; i++) {
      const frac = n === 1 ? 0 : i / (n - 1) - 0.5;
      const pose = itemPose(it, nowSec() + frac * (frozen != null ? t : 0));
      ctx.filter = blur > 0.45 && n === 1 ? `blur(${Math.min(16, blur)}px)` : "none";
      if (it.kind === "cup") {
        const a = project(pose.X, 0, pose.Z, w, h, fMm, sw, sh, camH);
        const b = project(pose.X, it.h, pose.Z, w, h, fMm, sw, sh, camH);
        drawCup(ctx, a.x, a.y, b.y, it.col);
      } else if (it.kind === "book") {
        const a = project(pose.X, 0, pose.Z, w, h, fMm, sw, sh, camH);
        const b = project(pose.X, Math.max(it.h, 0.04), pose.Z, w, h, fMm, sw, sh, camH);
        drawBook(ctx, a.x, a.y, b.y, it.col);
      } else if (it.kind === "vase") {
        const a = project(pose.X, 0, pose.Z, w, h, fMm, sw, sh, camH);
        const b = project(pose.X, it.h, pose.Z, w, h, fMm, sw, sh, camH);
        drawVase(ctx, a.x, a.y, b.y, it.col);
      } else if (it.kind === "fan") {
        const a = project(pose.X, 0, pose.Z, w, h, fMm, sw, sh, camH);
        const b = project(pose.X, it.h, pose.Z, w, h, fMm, sw, sh, camH);
        drawFan(ctx, a.x, a.y, b.y, it.col, pose.ang);
      } else if (it.kind === "person") {
        const a = project(pose.X, 0, pose.Z, w, h, fMm, sw, sh, camH);
        const b = project(pose.X, it.h, pose.Z, w, h, fMm, sw, sh, camH);
        drawPerson(ctx, a.x, a.y, b.y, it.col);
      } else if (it.kind === "car") {
        const hw = (it.w || 4) / 2;
        const a = project(pose.X - hw, 0, pose.Z, w, h, fMm, sw, sh, camH);
        const b = project(pose.X + hw, it.h, pose.Z, w, h, fMm, sw, sh, camH);
        drawCar(ctx, a.x, a.y, b.x, b.y, it.col);
      } else if (it.kind === "house") {
        const hw = (it.w || 6) / 2;
        const a = project(pose.X - hw, 0, pose.Z, w, h, fMm, sw, sh, camH);
        const b = project(pose.X + hw, it.h, pose.Z, w, h, fMm, sw, sh, camH);
        drawHouse(ctx, a.x, a.y, b.x, b.y, it.col);
      }
    }
    ctx.restore();
  };

  const paint = () => {
    const sc = SCENES[sceneId];
    if (mode !== "M") targetPair(sc);
    kEl.value = String(STOPS.K.indexOf(nearest(STOPS.K, K)));
    tEl.value = String(STOPS.t.indexOf(nearest(STOPS.t, t)));
    isoEl.value = String(STOPS.iso.indexOf(nearest(STOPS.iso, iso)));
    K = nearest(STOPS.K, K);
    t = nearest(STOPS.t, t);
    iso = nearest(STOPS.iso, iso);
    kVal.textContent = `f/${K}`;
    tVal.textContent = fmtT(t);
    isoVal.textContent = String(iso);

    const err = brightness(K, t, iso, sc.ev100);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 8 || h < 8) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const lift = 0.42 * 2 ** (-err);
    const sky = `rgb(${Math.round(36 * lift + 18)},${Math.round(48 * lift + 22)},${Math.round(62 * lift + 26)})`;
    const gnd = `rgb(${Math.round(40 * lift)},${Math.round(36 * lift)},${Math.round(28 * lift)})`;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, sky);
    g.addColorStop(0.55, sky);
    g.addColorStop(0.55, gnd);
    g.addColorStop(1, gnd);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const isShot = frozen != null;
    const items = [...sc.items].sort((a, b) => b.Z - a.Z);
    for (const it of items) {
      const moving = Math.abs(it.vX || 0) > 0.01 || Math.abs(it.spin || 0) > 0.01;
      const samples = isShot && moving ? Math.min(14, 2 + Math.round(t * 40 * (Math.abs(it.vX || 0) + Math.abs(it.spin || 0) * 0.15))) : 1;
      const dofBlur = 0;
      drawItem(it, w, h, sc, sc.fMm, dofBlur, samples);
    }

    if (iso > 200 && frozen != null) {
      const amp = Math.min(48, Math.sqrt(iso / 100) * 6);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * amp;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
      ctx.putImageData(img, 0, 0);
    }

    ctx.fillStyle = isShot ? "#e2b56a" : "#86c99a";
    ctx.font = "bold 13px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(isShot ? `КАДР · ${fmtT(t)} · ISO ${iso}` : "LIVE · объекты движутся", 12, 22);

    const stop = err;
    const stopTxt = `${stop >= 0 ? "+" : ""}${stop.toFixed(1)} EV`;
    let verdict = "экспозиция в норме";
    if (stop < -1.2) verdict = "недодержка: тени провалятся, шум полезет раньше";
    if (stop > 1.2) verdict = "передержка: света клиппятся";
    read.innerHTML = `
      <p><strong>${stopTxt}</strong> · ${verdict}</p>
      <p>EV<sub>100</sub> сцены ≈ ${sc.ev100} · камера ${ev100(K, t).toFixed(1)} при ISO ${iso}</p>
      <p>f = ${sc.fMm} мм · ${sc.hint}</p>
      <p class="muted">${isShot ? "Это снятый кадр: смаз = путь объекта за выдержку t. «Live» — снова смотреть, как движется сцена." : "Пока live — затвор не сработал, смаза нет. Кнопка «Кадр» фиксирует момент и считает смаз по t."}</p>
    `;
    if (snapBtn) snapBtn.classList.toggle("is-on", isShot);
    if (liveBtn) liveBtn.classList.toggle("is-on", !isShot);
  };

  const onK = () => {
    K = STOPS.K[Number(kEl.value)];
    paint();
  };
  const onT = () => {
    t = STOPS.t[Number(tEl.value)];
    paint();
  };
  const onIso = () => {
    iso = STOPS.iso[Number(isoEl.value)];
    paint();
  };
  kEl.addEventListener("input", onK);
  tEl.addEventListener("input", onT);
  isoEl.addEventListener("input", onIso);

  const lockSliders = () => {
    kEl.disabled = mode === "S" || mode === "P";
    tEl.disabled = mode === "A" || mode === "P";
    isoEl.disabled = false;
  };

  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.expMode;
      modeBtns.forEach((x) => x.classList.toggle("is-on", x === b));
      lockSliders();
      paint();
    });
  });
  sceneBtns.forEach((b) => {
    b.addEventListener("click", () => {
      sceneId = b.dataset.expScene;
      frozen = null;
      t0 = performance.now();
      sceneBtns.forEach((x) => x.classList.toggle("is-on", x === b));
      paint();
    });
  });
  snapBtn?.addEventListener("click", () => {
    frozen = (performance.now() - t0) / 1000;
    paint();
  });
  liveBtn?.addEventListener("click", () => {
    const hold = frozen ?? (performance.now() - t0) / 1000;
    frozen = null;
    t0 = performance.now() - hold * 1000;
    paint();
  });

  kEl.max = String(STOPS.K.length - 1);
  tEl.max = String(STOPS.t.length - 1);
  isoEl.max = String(STOPS.iso.length - 1);
  kEl.value = "2";
  tEl.value = "6";
  isoEl.value = "0";
  lockSliders();

  const ro = new ResizeObserver(paint);
  ro.observe(canvas);

  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (frozen == null) paint();
  };
  tick();
  paint();
  return {
    resize: paint,
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
