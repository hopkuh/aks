const UAVS = {
  copter: {
    id: "copter",
    name: "Коптер",
    note: "Висение, малый охват. На БВС в план кладут Pₓ ≥ 80%, Pᵧ ≥ 60%.",
    fMm: 8.8,
    lxMm: 13.2,
    lyMm: 8.8,
    pxCount: 5472,
    pyCount: 3648,
    V: 8,
    px: 0.8,
    py: 0.6,
  },
  wing: {
    id: "wing",
    name: "Крыло",
    note: "Площадная съёмка: дольше в воздухе, min скорость, нужен коридор. Тот же закон GSD.",
    fMm: 35,
    lxMm: 36,
    lyMm: 24,
    pxCount: 7952,
    pyCount: 5304,
    V: 18,
    px: 0.8,
    py: 0.6,
  },
  copterFF: {
    id: "copterFF",
    name: "Коптер · полный кадр",
    note: "Тяжёлая полезная нагрузка: больше захват при том же GSD, выше Hф при длинном f.",
    fMm: 35,
    lxMm: 36,
    lyMm: 24,
    pxCount: 8192,
    pyCount: 5464,
    V: 10,
    px: 0.8,
    py: 0.7,
  },
};

const SITES = {
  field: {
    name: "Поле 400×300 м",
    poly: [
      [0, 0],
      [400, 0],
      [400, 300],
      [0, 300],
    ],
  },
  quarry: {
    name: "Карьер",
    poly: [
      [40, 60],
      [180, 20],
      [360, 50],
      [420, 160],
      [380, 280],
      [220, 320],
      [70, 260],
      [20, 150],
    ],
  },
  road: {
    name: "Полоса 800×80 м",
    poly: [
      [0, 40],
      [800, 40],
      [800, 120],
      [0, 120],
    ],
  },
};

function bbox(poly) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

function inside(poly, x, y) {
  let n = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (hit) n = !n;
  }
  return n;
}

function pixelMm(uav) {
  return uav.lxMm / uav.pxCount;
}

function plan(uav, gsdM, px, py, poly) {
  const pM = pixelMm(uav) / 1000;
  const fM = uav.fMm / 1000;
  const H = (gsdM * fM) / pM;
  const m = H / fM;
  const Lx = (uav.lxMm / 1000) * m;
  const Ly = (uav.lyMm / 1000) * m;
  const Bx = Lx * (1 - px);
  const By = Ly * (1 - py);
  const box = bbox(poly);
  const alongX = box.w >= box.h;
  const marginA = 0.45 * (alongX ? Lx : Ly);
  const marginC = 0.35 * (alongX ? Ly : Lx);
  const a0 = (alongX ? box.x0 : box.y0) - marginA;
  const a1 = (alongX ? box.x1 : box.y1) + marginA;
  const c0 = (alongX ? box.y0 : box.x0) - marginC;
  const c1 = (alongX ? box.y1 : box.x1) + marginC;
  const Balong = alongX ? Bx : By;
  const Bacross = alongX ? By : Bx;
  const Lal = alongX ? Lx : Ly;
  const Lac = alongX ? Ly : Lx;
  const routes = [];
  const nR = Math.max(1, Math.ceil((c1 - c0 - Lac) / Bacross) + 1);
  for (let i = 0; i < nR; i++) {
    const c = c0 + Lac / 2 + i * Bacross;
    const shots = [];
    const nS = Math.max(2, Math.ceil((a1 - a0 - Lal) / Balong) + 1);
    for (let j = 0; j < nS; j++) {
      const a = a0 + Lal / 2 + j * Balong;
      const x = alongX ? a : c;
      const y = alongX ? c : a;
      shots.push({ x, y });
    }
    routes.push({ c, shots });
  }
  const nPhoto = routes.reduce((s, r) => s + r.shots.length, 0);
  const pathM = nR * (a1 - a0) + Math.max(0, nR - 1) * Bacross;
  const tMin = pathM / uav.V / 60;
  const tau = Balong / uav.V;
  const dense = nPhoto > 450;
  return {
    H,
    m,
    Lx,
    Ly,
    Bx,
    By,
    alongX,
    routes,
    nR,
    nPhoto,
    tMin,
    tau,
    gsdM,
    pMm: pixelMm(uav),
    dense,
  };
}

function almostCollinear(pts) {
  if (pts.length < 3) return false;
  const a = pts[0];
  const b = pts[1];
  const den = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return pts.every((p) => Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / den < 12);
}

function fmtLen(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} км`;
  if (m >= 10) return `${m.toFixed(1)} м`;
  if (m >= 1) return `${m.toFixed(2)} м`;
  return `${(m * 100).toFixed(1)} см`;
}

export function mountAfsSim(root) {
  const canvas = root.querySelector("[data-afs-map]");
  const read = root.querySelector("[data-afs-read]");
  const list = root.querySelector("[data-afs-pts]");
  const gsdEl = root.querySelector("[data-afs-gsd]");
  const pxEl = root.querySelector("[data-afs-px]");
  const pyEl = root.querySelector("[data-afs-py]");
  const gsdVal = root.querySelector("[data-afs-gsdval]");
  const pxVal = root.querySelector("[data-afs-pxval]");
  const pyVal = root.querySelector("[data-afs-pyval]");
  const uavBtns = [...root.querySelectorAll("[data-afs-uav]")];
  const siteBtns = [...root.querySelectorAll("[data-afs-site]")];
  const modeBtns = [...root.querySelectorAll("[data-afs-mode]")];
  const ctx = canvas.getContext("2d");

  let uav = UAVS.copter;
  let siteId = "field";
  let gsdCm = 5;
  let px = uav.px;
  let py = uav.py;
  let mode = "gcp";
  let points = [];
  let hover = null;
  let geom = null;
  let view = { s: 1, cx: 0, cy: 0, w: 400, h: 400 };

  const poly = () => SITES[siteId].poly;

  const worldOf = (ev) => {
    const r = canvas.getBoundingClientRect();
    const mx = ev.clientX - r.left;
    const my = ev.clientY - r.top;
    return {
      x: view.cx + (mx - view.w / 2) / view.s,
      y: view.cy - (my - view.h / 2) / view.s,
    };
  };

  const setView = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 8 || h < 8) return false;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const box = bbox(poly());
    const pad = Math.max(box.w, box.h) * 0.22 + 48;
    view = {
      s: Math.min(w / (box.w + 2 * pad), h / (box.h + 2 * pad)),
      cx: box.x0 + box.w / 2,
      cy: box.y0 + box.h / 2,
      w,
      h,
    };
    return true;
  };

  const toPx = (x, y) => ({
    x: view.w / 2 + (x - view.cx) * view.s,
    y: view.h / 2 - (y - view.cy) * view.s,
  });

  const drawFoot = (shot, col) => {
    const hw = geom.Lx / 2;
    const hh = geom.Ly / 2;
    const a = toPx(shot.x - hw, shot.y - hh);
    const b = toPx(shot.x + hw, shot.y + hh);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    ctx.globalAlpha = 1;
  };

  const syncRead = () => {
    if (!geom) return;
    const nGcp = points.filter((p) => p.kind === "gcp").length;
    const nChk = points.filter((p) => p.kind === "chk").length;
    let pvo = "Для уравнивания нужно не меньше трёх опорных, не на одной прямой. Контрольные в уравнивание не входят.";
    if (nGcp < 3) pvo = "Опорных меньше трёх — внешнее ориентирование модели ещё нечем закрепить.";
    else if (almostCollinear(points.filter((p) => p.kind === "gcp"))) pvo = "Опорные почти на одной прямой — блок не закрепить в плане.";
    else if (nChk === 0) pvo = "Контрольных нет: нечем независимо проверить блок после уравнивания.";

    gsdVal.textContent = `${gsdCm.toFixed(1).replace(".", ",")} см`;
    pxVal.textContent = `${Math.round(px * 100)} %`;
    pyVal.textContent = `${Math.round(py * 100)} %`;

    read.innerHTML = `
      <p><strong>${uav.name}</strong> · ${SITES[siteId].name}</p>
      <p>H<sub>ф</sub> = ${fmtLen(geom.H)} · 1:m ≈ 1:${Math.round(geom.m).toLocaleString("ru-RU")}</p>
      <p>GSD = p · H<sub>ф</sub> / f · p = ${geom.pMm.toFixed(4)} мм · f = ${uav.fMm} мм</p>
      <p>L<sub>x</sub> = ${fmtLen(geom.Lx)} · L<sub>y</sub> = ${fmtLen(geom.Ly)}</p>
      <p>B<sub>x</sub> = L<sub>x</sub>(1−P<sub>x</sub>) = ${fmtLen(geom.Bx)} · B<sub>y</sub> = ${fmtLen(geom.By)}</p>
      <p>Маршрутов ${geom.nR} · кадров ${geom.nPhoto} · τ = ${geom.tau.toFixed(2)} с · полёт ≈ ${geom.tMin.toFixed(1)} мин при V = ${uav.V} м/с</p>
      ${geom.dense ? "<p class='muted'>Кадров слишком много для схемы захватов — показаны оси маршрутов и центры.</p>" : ""}
      <p class="muted">${uav.note}</p>
      <p>${pvo}</p>
    `;

    const gcps = points.filter((p) => p.kind === "gcp");
    const chks = points.filter((p) => p.kind === "chk");
    list.innerHTML = `
      <p class="sim-kicker">Опорные · ${gcps.length}</p>
      ${gcps.map((p) => `<div>О${p.n} · ${p.x.toFixed(1)}, ${p.y.toFixed(1)} м</div>`).join("") || "<div class='muted'>клик по плану</div>"}
      <p class="sim-kicker">Контрольные · ${chks.length}</p>
      ${chks.map((p) => `<div>К${p.n} · ${p.x.toFixed(1)}, ${p.y.toFixed(1)} м</div>`).join("") || "<div class='muted'>переключите режим и кликните</div>"}
    `;
  };

  const paint = (withRead = true) => {
    if (!setView()) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#10151c";
    ctx.fillRect(0, 0, w, h);

    geom = plan(uav, gsdCm / 100, px, py, poly());

    ctx.save();
    ctx.beginPath();
    poly().forEach(([x, y], i) => {
      const p = toPx(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(134,201,154,0.12)";
    ctx.fill();
    ctx.strokeStyle = "#86c99a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    for (const route of geom.routes) {
      const a = route.shots[0];
      const b = route.shots[route.shots.length - 1];
      const pa = toPx(a.x, a.y);
      const pb = toPx(b.x, b.y);
      ctx.strokeStyle = "#e2b56a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      for (const sh of route.shots) {
        if (!geom.dense) drawFoot(sh, "rgba(110,195,216,0.9)");
        const p = toPx(sh.x, sh.y);
        ctx.fillStyle = "#6ec3d8";
        ctx.beginPath();
        ctx.arc(p.x, p.y, geom.dense ? 1.6 : 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const barM = view.s * 100 >= 48 ? 100 : view.s * 50 >= 48 ? 50 : 20;
    const barPx = barM * view.s;
    const bx0 = 16;
    const by0 = h - 22;
    ctx.strokeStyle = "#e9eef4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx0, by0);
    ctx.lineTo(bx0 + barPx, by0);
    ctx.moveTo(bx0, by0 - 5);
    ctx.lineTo(bx0, by0 + 5);
    ctx.moveTo(bx0 + barPx, by0 - 5);
    ctx.lineTo(bx0 + barPx, by0 + 5);
    ctx.stroke();
    ctx.fillStyle = "#e9eef4";
    ctx.font = "11px Segoe UI, sans-serif";
    ctx.fillText(`${barM} м`, bx0 + barPx + 8, by0 + 4);

    for (const pt of points) {
      const p = toPx(pt.x, pt.y);
      ctx.fillStyle = pt.kind === "gcp" ? "#e2b56a" : "#6ec3d8";
      ctx.strokeStyle = "#141b24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (pt.kind === "gcp") {
        ctx.moveTo(p.x, p.y - 8);
        ctx.lineTo(p.x + 7, p.y + 6);
        ctx.lineTo(p.x - 7, p.y + 6);
        ctx.closePath();
      } else {
        ctx.rect(p.x - 6, p.y - 6, 12, 12);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e9eef4";
      ctx.font = "11px Segoe UI, sans-serif";
      ctx.fillText(pt.kind === "gcp" ? `О${pt.n}` : `К${pt.n}`, p.x + 8, p.y - 6);
    }

    if (hover) {
      const p = toPx(hover.x, hover.y);
      ctx.strokeStyle = "rgba(233,238,244,0.4)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (withRead) syncRead();
  };

  const hitPt = (x, y) => {
    const tol = 8 / view.s;
    return points.find((p) => Math.hypot(p.x - x, p.y - y) < Math.max(tol, 4));
  };

  canvas.addEventListener("mousemove", (ev) => {
    hover = worldOf(ev);
    paint(false);
  });
  canvas.addEventListener("mouseleave", () => {
    hover = null;
    paint();
  });
  canvas.addEventListener("click", (ev) => {
    const w = worldOf(ev);
    const hit = hitPt(w.x, w.y);
    if (hit) {
      points = points.filter((p) => p !== hit);
      paint();
      return;
    }
    if (!inside(poly(), w.x, w.y)) return;
    const kind = mode;
    const n = points.filter((p) => p.kind === kind).length + 1;
    points.push({ kind, n, x: w.x, y: w.y });
    paint();
  });

  uavBtns.forEach((b) => {
    b.addEventListener("click", () => {
      uav = UAVS[b.dataset.afsUav] || UAVS.copter;
      px = uav.px;
      py = uav.py;
      pxEl.value = String(Math.round(px * 100));
      pyEl.value = String(Math.round(py * 100));
      uavBtns.forEach((x) => x.classList.toggle("is-on", x === b));
      paint();
    });
  });
  siteBtns.forEach((b) => {
    b.addEventListener("click", () => {
      siteId = b.dataset.afsSite;
      points = [];
      siteBtns.forEach((x) => x.classList.toggle("is-on", x === b));
      paint();
    });
  });
  modeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.afsMode;
      modeBtns.forEach((x) => x.classList.toggle("is-on", x === b));
    });
  });
  gsdEl.addEventListener("input", () => {
    gsdCm = Number(gsdEl.value);
    paint();
  });
  pxEl.addEventListener("input", () => {
    px = Number(pxEl.value) / 100;
    paint();
  });
  pyEl.addEventListener("input", () => {
    py = Number(pyEl.value) / 100;
    paint();
  });
  root.querySelector("[data-afs-auto]").addEventListener("click", () => {
    const box = bbox(poly());
    const ix = box.w * 0.12;
    const iy = box.h * 0.12;
    const gcp = [
      [box.x0 + ix, box.y0 + iy],
      [box.x1 - ix, box.y0 + iy],
      [box.x1 - ix, box.y1 - iy],
      [box.x0 + ix, box.y1 - iy],
      [box.x0 + box.w / 2, box.y0 + box.h / 2],
    ];
    const chk = [
      [box.x0 + box.w / 2, box.y0 + iy],
      [box.x1 - ix, box.y0 + box.h / 2],
      [box.x0 + box.w / 2, box.y1 - iy],
      [box.x0 + ix, box.y0 + box.h / 2],
    ];
    points = [];
    gcp.forEach(([x, y], i) => {
      if (inside(poly(), x, y)) points.push({ kind: "gcp", n: i + 1, x, y });
    });
    chk.forEach(([x, y], i) => {
      if (inside(poly(), x, y)) points.push({ kind: "chk", n: i + 1, x, y });
    });
    points.forEach((p, i, arr) => {
      p.n = arr.filter((q) => q.kind === p.kind && arr.indexOf(q) <= i).length;
    });
    paint();
  });
  root.querySelector("[data-afs-clear]").addEventListener("click", () => {
    points = [];
    paint();
  });

  const ro = new ResizeObserver(paint);
  ro.observe(canvas);
  paint();
  return { resize: paint };
}
