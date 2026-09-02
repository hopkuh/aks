(() => {
  const fmtLen = (m) => {
    const a = Math.abs(m);
    if (a >= 1000) return `${(m / 1000).toFixed(2)} км`;
    if (a >= 1) return `${m.toFixed(2)} м`;
    if (a >= 0.01) return `${(m * 100).toFixed(1)} см`;
    return `${(m * 1000).toFixed(1)} мм`;
  };

  const PRESETS = {
    uav: { H: 120, fMm: 24, pUm: 3.76, label: "БВС · 120 м" },
    air: { H: 1200, fMm: 152, pUm: 6, label: "Самолёт · 1,2 км" },
    sat: { H: 700000, fMm: 8800, pUm: 10, label: "Спутник · 700 км" },
  };

  function mountGsd(root) {
    root.innerHTML = `
      <div class="widget-toolbar">
        <button type="button" data-preset="uav">БВС</button>
        <button type="button" data-preset="air">Самолёт</button>
        <button type="button" data-preset="sat">Спутник</button>
      </div>
      <svg viewBox="0 0 840 360" xmlns="http://www.w3.org/2000/svg" aria-label="Подобные треугольники: пиксель и GSD">
        <rect width="840" height="360" fill="#141b24"/>
        <line x1="40" y1="300" x2="800" y2="300" stroke="#93a1b3" stroke-width="2"/>
        <text x="42" y="322" fill="#93a1b3" font-size="13" font-family="Segoe UI, sans-serif">местность</text>
        <polygon points="420,36 404,64 436,64" fill="#e2b56a"/>
        <text x="444" y="52" fill="#e2b56a" font-size="14" font-family="Segoe UI, sans-serif">S</text>
        <line x1="420" y1="64" x2="420" y2="300" stroke="#6ec3d8" stroke-width="1.5" stroke-dasharray="4 4"/>
        <rect id="focal" x="404" y="88" width="32" height="4" fill="#6ec3d8"/>
        <text id="fLabel" x="442" y="94" fill="#6ec3d8" font-size="13" font-family="Consolas, monospace">f</text>
        <polygon id="pix" points="412,88 428,88 428,92 412,92" fill="#e07a73"/>
        <line id="rayL" x1="412" y1="90" x2="300" y2="300" stroke="#e2b56a" stroke-width="1.5"/>
        <line id="rayR" x1="428" y1="90" x2="540" y2="300" stroke="#e2b56a" stroke-width="1.5"/>
        <line id="gsdBar" x1="300" y1="300" x2="540" y2="300" stroke="#86c99a" stroke-width="6"/>
        <text id="gsdLbl" x="420" y="344" fill="#86c99a" font-size="16" text-anchor="middle" font-family="Consolas, monospace">GSD</text>
        <text id="hLbl" x="432" y="190" fill="#93a1b3" font-size="13" font-family="Consolas, monospace">Hф</text>
      </svg>
      <div class="widget-controls">
        <label>H<sub>ф</sub> <span data-hval></span>
          <input type="range" data-h min="40" max="900000" step="1">
        </label>
        <label>f <span data-fval></span>
          <input type="range" data-f min="8" max="12000" step="1">
        </label>
        <label>пиксель p <span data-pval></span>
          <input type="range" data-p min="1.5" max="20" step="0.01">
        </label>
      </div>
      <p class="widget-readout" data-out></p>
    `;

    const h = root.querySelector("[data-h]");
    const f = root.querySelector("[data-f]");
    const p = root.querySelector("[data-p]");
    const applyPreset = (key) => {
      const pr = PRESETS[key];
      h.value = pr.H;
      f.value = pr.fMm;
      p.value = pr.pUm;
      root.querySelectorAll("[data-preset]").forEach((b) => {
        b.classList.toggle("is-on", b.dataset.preset === key);
      });
      draw();
    };

    const draw = () => {
      const H = Number(h.value);
      const fMm = Number(f.value);
      const pUm = Number(p.value);
      const fM = fMm / 1000;
      const pM = pUm * 1e-6;
      const gsd = (pM * H) / fM;
      const m = H / fM;
      root.querySelector("[data-hval]").textContent = fmtLen(H);
      root.querySelector("[data-fval]").textContent = fMm >= 1000 ? `${(fMm / 1000).toFixed(2)} м` : `${fMm.toFixed(1)} мм`;
      root.querySelector("[data-pval]").textContent = `${pUm.toFixed(2)} мкм`;
      root.querySelector("[data-out]").innerHTML =
        `GSD = p · H<sub>ф</sub> / f = <strong>${fmtLen(gsd)}</strong> · 1:m ≈ 1:${Math.round(m).toLocaleString("ru-RU")}`;

      const half = Math.min(360, 40 + Math.log10(gsd * 1000 + 1) * 90);
      const cx = 420;
      root.querySelector("#rayL").setAttribute("x2", cx - half);
      root.querySelector("#rayR").setAttribute("x2", cx + half);
      root.querySelector("#gsdBar").setAttribute("x1", cx - half);
      root.querySelector("#gsdBar").setAttribute("x2", cx + half);
      root.querySelector("#gsdLbl").textContent = `GSD = ${fmtLen(gsd)}`;
      const fy = 64 + Math.min(50, 8 + Math.log10(fMm) * 12);
      root.querySelector("#focal").setAttribute("y", fy);
      root.querySelector("#fLabel").setAttribute("y", fy + 6);
      root.querySelector("#fLabel").textContent = `f = ${fMm >= 1000 ? (fMm / 1000).toFixed(1) + " м" : fMm.toFixed(0) + " мм"}`;
      const pixW = Math.min(28, 6 + pUm);
      root.querySelector("#pix").setAttribute("points", `${cx - pixW / 2},${fy} ${cx + pixW / 2},${fy} ${cx + pixW / 2},${fy + 5} ${cx - pixW / 2},${fy + 5}`);
      root.querySelector("#rayL").setAttribute("x1", cx - pixW / 2);
      root.querySelector("#rayL").setAttribute("y1", fy + 2);
      root.querySelector("#rayR").setAttribute("x1", cx + pixW / 2);
      root.querySelector("#rayR").setAttribute("y1", fy + 2);
      root.querySelector("#hLbl").textContent = `Hф = ${fmtLen(H)}`;
    };

    root.querySelectorAll("[data-preset]").forEach((b) => {
      b.addEventListener("click", () => applyPreset(b.dataset.preset));
    });
    [h, f, p].forEach((el) => el.addEventListener("input", draw));
    applyPreset("uav");
  }

  function mountNdvi(root) {
    root.innerHTML = `
      <svg viewBox="0 0 840 280" xmlns="http://www.w3.org/2000/svg" aria-label="NDVI из красного и ближнего ИК">
        <rect width="840" height="280" fill="#141b24"/>
        <text x="24" y="28" fill="#93a1b3" font-size="14" font-family="Segoe UI, sans-serif">ρ(λ) · живая растительность vs почва vs вода</text>
        <polyline id="veg" fill="none" stroke="#86c99a" stroke-width="2.5" points=""/>
        <polyline id="soil" fill="none" stroke="#e2b56a" stroke-width="2" points=""/>
        <polyline id="water" fill="none" stroke="#6ec3d8" stroke-width="2" points=""/>
        <line id="redL" x1="200" y1="40" x2="200" y2="230" stroke="#e07a73" stroke-dasharray="3 3"/>
        <line id="nirL" x1="420" y1="40" x2="420" y2="230" stroke="#c9923a" stroke-dasharray="3 3"/>
        <text x="190" y="248" fill="#e07a73" font-size="12">RED</text>
        <text x="408" y="248" fill="#e2b56a" font-size="12">NIR</text>
        <text x="640" y="70" fill="#86c99a" font-size="13">растительность</text>
        <text x="640" y="92" fill="#e2b56a" font-size="13">почва</text>
        <text x="640" y="114" fill="#6ec3d8" font-size="13">вода</text>
      </svg>
      <div class="widget-controls">
        <label>ρ RED <span data-rval></span><input type="range" data-r min="0.02" max="0.6" step="0.01" value="0.08"></label>
        <label>ρ NIR <span data-nval></span><input type="range" data-n min="0.02" max="0.7" step="0.01" value="0.45"></label>
      </div>
      <p class="widget-readout" data-out></p>
    `;
    const r = root.querySelector("[data-r]");
    const n = root.querySelector("[data-n]");
    const vegPts = [];
    const soilPts = [];
    const waterPts = [];
    for (let i = 0; i <= 40; i++) {
      const x = 40 + i * 14;
      const t = i / 40;
      vegPts.push(`${x},${210 - (t < 0.35 ? 40 + t * 20 : 50 + (t - 0.35) * 220)}`);
      soilPts.push(`${x},${210 - (55 + t * 50)}`);
      waterPts.push(`${x},${210 - (70 - t * 55)}`);
    }
    root.querySelector("#veg").setAttribute("points", vegPts.join(" "));
    root.querySelector("#soil").setAttribute("points", soilPts.join(" "));
    root.querySelector("#water").setAttribute("points", waterPts.join(" "));

    const draw = () => {
      const red = Number(r.value);
      const nir = Number(n.value);
      const ndvi = (nir - red) / (nir + red);
      root.querySelector("[data-rval]").textContent = red.toFixed(2);
      root.querySelector("[data-nval]").textContent = nir.toFixed(2);
      let cls = "вода / голая почва";
      if (ndvi > 0.6) cls = "густая зелень";
      else if (ndvi > 0.3) cls = "растительность";
      else if (ndvi > 0.1) cls = "редкая растительность / стерня";
      else if (ndvi > 0) cls = "почва / застройка";
      root.querySelector("[data-out]").innerHTML =
        `NDVI = (NIR − RED) / (NIR + RED) = <strong>${ndvi.toFixed(3)}</strong> · ${cls}`;
    };
    [r, n].forEach((el) => el.addEventListener("input", draw));
    draw();
  }

  function mountBeer(root) {
    root.innerHTML = `
      <svg viewBox="0 0 840 240" xmlns="http://www.w3.org/2000/svg" aria-label="Закон Бугера — Ламберта">
        <rect width="840" height="240" fill="#141b24"/>
        <text x="24" y="28" fill="#93a1b3" font-size="14" font-family="Segoe UI, sans-serif">I = I0 · exp(−τ),  τ = k · s</text>
        <rect x="80" y="70" width="680" height="90" fill="#1e2733" stroke="#2a3544"/>
        <rect id="beam" x="80" y="95" width="680" height="40" fill="#6ec3d8" opacity="0.85"/>
        <text id="tLbl" x="420" y="200" fill="#6ec3d8" font-size="16" text-anchor="middle" font-family="Consolas, monospace"></text>
      </svg>
      <div class="widget-controls">
        <label>путь s, км <span data-sval></span><input type="range" data-s min="0.1" max="30" step="0.1" value="5"></label>
        <label>коэфф. k, км⁻¹ <span data-kval></span><input type="range" data-k min="0.02" max="0.8" step="0.01" value="0.15"></label>
      </div>
      <p class="widget-readout" data-out></p>
    `;
    const sEl = root.querySelector("[data-s]");
    const kEl = root.querySelector("[data-k]");
    const draw = () => {
      const s = Number(sEl.value);
      const k = Number(kEl.value);
      const tau = k * s;
      const T = Math.exp(-tau);
      root.querySelector("[data-sval]").textContent = s.toFixed(1);
      root.querySelector("[data-kval]").textContent = k.toFixed(2);
      root.querySelector("#beam").setAttribute("opacity", String(0.15 + 0.85 * T));
      root.querySelector("#tLbl").textContent = `τ = ${tau.toFixed(2)} · T = ${T.toFixed(3)}`;
      root.querySelector("[data-out]").innerHTML =
        `пропускание атмосферы T = e<sup>−τ</sup> = <strong>${T.toFixed(3)}</strong> (дымка растёт с τ)`;
    };
    [sEl, kEl].forEach((el) => el.addEventListener("input", draw));
    draw();
  }

  function mountDof(root) {
    root.classList.add("widget--dof");
    root.innerHTML = `
      <svg viewBox="0 0 1100 460" xmlns="http://www.w3.org/2000/svg" aria-label="Зона ГРИП от R1 до R2">
        <rect width="1100" height="460" fill="#141b24"/>
        <g data-scene></g>
      </svg>
      <div class="widget-controls widget-controls--compact">
        <label>K <span data-kval></span>
          <input type="range" data-k min="1.4" max="16" step="0.1" value="2.8">
        </label>
        <label>R <span data-rval></span>
          <input type="range" data-r min="0.8" max="8" step="0.1" value="2.5">
        </label>
        <label>f <span data-fval></span>
          <input type="range" data-f min="24" max="135" step="1" value="50">
        </label>
      </div>
      <p class="widget-readout" data-out></p>
    `;
    const kEl = root.querySelector("[data-k]");
    const rEl = root.querySelector("[data-r]");
    const fEl = root.querySelector("[data-f]");
    const scene = root.querySelector("[data-scene]");
    const cMm = 0.02;
    const X0 = 130;
    const X1 = 1060;
    const M0 = 0.4;
    const M1 = 8.2;
    const axisY = 400;
    const topY = 70;
    const xOf = (m) => {
      if (!Number.isFinite(m)) return X1;
      const t = (Math.min(M1, Math.max(M0, m)) - M0) / (M1 - M0);
      return X0 + t * (X1 - X0);
    };
    const draw = () => {
      const K = Number(kEl.value);
      const R = Number(rEl.value);
      const fMm = Number(fEl.value);
      const f = fMm / 1000;
      const Hm = (f * f) / (K * (cMm / 1000)) + f;
      const R1 = (Hm * R) / (Hm + (R - f));
      const denFar = Hm - R + f;
      const farInf = denFar <= 1e-9 || R >= Hm * 0.98;
      const R2 = farInf ? Infinity : (Hm * R) / denFar;
      const Dmm = fMm / K;
      const delta = farInf ? Infinity : Math.max(0, R2 - R1);
      root.querySelector("[data-kval]").textContent = `f/${K.toFixed(1)}`;
      root.querySelector("[data-rval]").textContent = `${R.toFixed(1)} м`;
      root.querySelector("[data-fval]").textContent = `${fMm} мм`;
      const x1 = xOf(R1);
      const xR = xOf(R);
      const x2 = farInf || R2 >= M1 ? X1 : xOf(R2);
      const bandW = Math.max(6, x2 - x1);
      const camX = 64;
      const camY = 150;
      const ticks = [];
      for (let m = 1; m <= 8; m++) {
        const x = xOf(m);
        ticks.push(
          `<line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 9}" stroke="#93a1b3"/>
           <text x="${x}" y="${axisY + 26}" text-anchor="middle" fill="#93a1b3" font-size="13">${m}</text>`
        );
      }
      const deltaTxt = farInf ? "ГРИП → ∞" : `ГРИП = ${delta.toFixed(2)} м`;
      const wide = bandW > 200;
      const dX = wide ? x1 + bandW / 2 : Math.min(X1 - 8, x2 + 14);
      const dAnchor = wide ? "middle" : "start";
      const capR2 = farInf ? "8 6" : "";
      const lineTop = topY + 8;
      const lineBot = axisY - 8;
      scene.innerHTML = `
        <text x="14" y="28" fill="#93a1b3" font-size="15">ось съёмки, метры</text>
        <rect x="${x1}" y="${topY}" width="${bandW}" height="${axisY - topY}" fill="#86c99a" opacity="0.28"/>
        <rect x="${x1}" y="${topY}" width="${bandW}" height="10" fill="#86c99a"/>
        <rect x="${x1}" y="${axisY - 12}" width="${bandW}" height="12" fill="#86c99a"/>
        <line x1="${x1}" y1="${topY}" x2="${x1}" y2="${axisY}" stroke="#86c99a" stroke-width="3"/>
        <line x1="${x2}" y1="${topY}" x2="${x2}" y2="${axisY}" stroke="#86c99a" stroke-width="3" ${capR2 ? `stroke-dasharray="${capR2}"` : ""}/>
        <line x1="${xR}" y1="${topY}" x2="${xR}" y2="${axisY}" stroke="#e2b56a" stroke-width="3" stroke-dasharray="6 5"/>
        <line x1="${x1}" y1="${axisY - 22}" x2="${x2}" y2="${axisY - 22}" stroke="#86c99a" stroke-width="2"/>
        <polygon points="${x1},${axisY - 22} ${x1 + 10},${axisY - 28} ${x1 + 10},${axisY - 16}" fill="#86c99a"/>
        <polygon points="${x2},${axisY - 22} ${x2 - 10},${axisY - 28} ${x2 - 10},${axisY - 16}" fill="#86c99a"/>
        <text x="${xR}" y="${topY + 32}" fill="#e2b56a" font-size="18" font-family="Consolas, monospace" text-anchor="middle">R ${R.toFixed(2)}</text>
        <text x="${dX}" y="${topY + 64}" fill="#86c99a" font-size="32" font-weight="700" font-family="Consolas, monospace" text-anchor="${dAnchor}">${deltaTxt}</text>
        <line x1="${X0}" y1="${axisY}" x2="${X1}" y2="${axisY}" stroke="#93a1b3" stroke-width="2"/>
        ${ticks.join("")}
        <text x="${X1}" y="${axisY + 26}" text-anchor="end" fill="#93a1b3" font-size="13">${farInf ? "∞" : "м"}</text>
        <rect x="${camX - 28}" y="${camY - 22}" width="36" height="44" rx="4" fill="#2a3544" stroke="#e2b56a" stroke-width="2"/>
        <rect x="${camX + 6}" y="${camY - 10}" width="18" height="20" rx="3" fill="#1a222c" stroke="#6ec3d8" stroke-width="2"/>
        <circle cx="${camX + 22}" cy="${camY}" r="5" fill="#141b24" stroke="#6ec3d8"/>
        <text x="${camX - 10}" y="${camY - 30}" fill="#e2b56a" font-size="15" text-anchor="middle">камера</text>
        <text x="${camX - 10}" y="${camY + 52}" fill="#6ec3d8" font-size="13" text-anchor="middle">D = ${Dmm.toFixed(0)} мм · диаметр отверстия</text>
        <path d="M${camX + 24} ${camY} L${xR} ${lineTop}" stroke="#6ec3d8" stroke-width="1.5" opacity="0.95"/>
        <path d="M${camX + 24} ${camY} L${xR} ${lineBot}" stroke="#6ec3d8" stroke-width="1.5" opacity="0.95"/>
      `;
      const r2txt = farInf ? "∞" : `${R2.toFixed(2)} м`;
      const dTxt = farInf ? "∞" : `${delta.toFixed(2)} м`;
      root.querySelector("[data-out]").innerHTML =
        `R₁ = <strong>${R1.toFixed(2)} м</strong> · R₂ = <strong>${r2txt}</strong> · ГРИП = <strong>${dTxt}</strong> · H = ${Hm.toFixed(1)} м · D = f/K · c = 0,02 мм`;
    };
    [kEl, rEl, fEl].forEach((el) => el.addEventListener("input", draw));
    draw();
  }

  const PIPE_STAGES = [
    {
      title: "1 · Первый снимок",
      copy: "Кадровый снимок — центральная проекция объекта на плоскость приёмника: все проектирующие лучи проходят через одну точку S (центр проекции) в пределах одной выдержки. Здания «падают» от точки надира — это геометрия кадра, не брак объектива.",
    },
    {
      title: "2 · Второй снимок",
      copy: "Камеру смещают на базис B. Получают второй кадр той же местности. Перекрытие Px — доля площади, общая с соседним кадром. Без перекрытия нет одноимённых точек, нет стерео, нет блока.",
    },
    {
      title: "3 · Стереопара",
      copy: "Стереопара — два кадровых снимка, полученных с разных точек пространства и имеющие перекрытие. Продольный параллакс p = X1 − X2. Для нормального случая D/f = −B/p: ближе объект — больше |p|. Отождествление одноимённых точек даёт измерение, не «объёмную картинку в очках».",
    },
    {
      title: "4 · ЦММ / DEM",
      copy: "По параллаксу восстанавливают отстояния, после уравнивания блока — высоты в системе координат. ЦММ (цифровая модель местности) описывает видимую поверхность, включая крыши и кроны. ЦМР — земная поверхность. Это ещё не ортофотоплан.",
    },
    {
      title: "5 · Ортофотоплан",
      copy: "Ортофотоплан — фотограмметрическое изображение местности в ортогональной проекции, приведённое к заданным масштабу и СК. Нужны элементы ориентирования и ЦМР/ЦММ той же СК. Накидной монтаж — только контроль покрытия, не метрический продукт.",
    },
    {
      title: "6 · Дешифрирование → карта",
      copy: "Дешифрирование — распознавание объектов по снимку (форме, тону, тени, связи с соседями) и перевод в условные знаки карты или слои ГИС. Индекс NDVI и сегментация CV помогают, но легенду и допуск задаёт ТЗ, не алгоритм.",
    },
  ];

  function mountPipeline(root) {
    root.innerHTML = `
      <div class="widget-toolbar">
        <button type="button" data-play>Пуск</button>
        <button type="button" data-prev>← шаг</button>
        <button type="button" data-next>шаг →</button>
        <span class="widget-dots" data-dots></span>
      </div>
      <svg viewBox="0 0 840 270" xmlns="http://www.w3.org/2000/svg" aria-label="От снимка до карты">
        <rect width="840" height="270" fill="#141b24"/>
        <g data-scene></g>
      </svg>
      <p class="widget-readout" data-title></p>
      <p class="widget-copy" data-copy></p>
    `;
    const dots = root.querySelector("[data-dots]");
    PIPE_STAGES.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.i = String(i);
      dots.appendChild(b);
    });
    let step = 0;
    let timer = 0;
    const scene = root.querySelector("[data-scene]");
    const drawScene = (n) => {
      const camX = n === 0 ? 160 : 310;
      const show2 = n >= 1;
      const stereo = n >= 2;
      const dem = n >= 3;
      const ortho = n >= 4;
      const map = n >= 5;
      const lean = ortho ? 0 : 18;
      scene.innerHTML = `
        <line x1="40" y1="200" x2="800" y2="200" stroke="#93a1b3" stroke-width="2"/>
        <polygon points="${520 + lean},200 ${520 + lean},120 ${580 - lean},120 ${580 - lean},200" fill="${map ? "#6b4e16" : "#3a4a58"}" stroke="#e2b56a"/>
        <rect x="430" y="${ortho ? 148 : 160}" width="70" height="${ortho ? 52 : 40}" fill="${map ? "#4a6b38" : "#2a4a30"}" opacity="${n >= 1 ? 1 : 0.35}"/>
        <polygon points="70,48 54,78 86,78" fill="#e2b56a" transform="translate(${camX - 160},0)"/>
        <text x="${camX}" y="40" fill="#e2b56a" font-size="13" text-anchor="middle">S</text>
        <path d="M${camX} 78 L${540 + (ortho ? 0 : lean)} 200" stroke="#6ec3d8" stroke-width="1.2"/>
        <path d="M${camX} 78 L${560} 120" stroke="#6ec3d8" stroke-width="1.2" opacity="0.7"/>
        ${show2 ? `<polygon points="70,48 54,78 86,78" fill="#6ec3d8" transform="translate(250,0)"/><text x="410" y="40" fill="#6ec3d8" font-size="13" text-anchor="middle">S′</text>
          <path d="M410 78 L${540 - lean} 200" stroke="#e2b56a" stroke-width="1.2" opacity="0.85"/>` : ""}
        <rect x="80" y="214" width="110" height="46" fill="#1e2733" stroke="#e2b56a"/>
        <text x="135" y="242" text-anchor="middle" fill="#e2b56a" font-size="12">кадр 1</text>
        <rect x="210" y="214" width="110" height="46" fill="#1e2733" stroke="${show2 ? "#6ec3d8" : "#2a3544"}"/>
        <text x="265" y="242" text-anchor="middle" fill="${show2 ? "#6ec3d8" : "#445060"}" font-size="12">кадр 2</text>
        ${stereo ? `<line x1="135" y1="214" x2="265" y2="214" stroke="#86c99a" stroke-width="2"/>
          <text x="200" y="208" text-anchor="middle" fill="#86c99a" font-size="11">перекрытие · p</text>` : ""}
        ${dem ? `<polyline fill="none" stroke="#86c99a" stroke-width="2" points="620,200 640,168 660,178 690,140 720,160 760,150 800,200"/>
          <text x="700" y="132" text-anchor="middle" fill="#86c99a" font-size="12">ЦММ</text>` : ""}
        ${ortho ? `<rect x="430" y="214" width="160" height="46" fill="#1e2733" stroke="#86c99a"/>
          <text x="510" y="242" text-anchor="middle" fill="#86c99a" font-size="12">орто · ортогональ</text>` : ""}
        ${map ? `<rect x="620" y="214" width="24" height="16" fill="#6b4e16"/><rect x="648" y="214" width="24" height="16" fill="#4a6b38"/><rect x="676" y="214" width="24" height="16" fill="#3a4a58"/>
          <text x="740" y="226" fill="#93a1b3" font-size="11">здание · растит. · дорога</text>` : ""}
      `;
    };
    const show = (n) => {
      step = (n + PIPE_STAGES.length) % PIPE_STAGES.length;
      const st = PIPE_STAGES[step];
      root.querySelector("[data-title]").textContent = st.title;
      root.querySelector("[data-copy]").textContent = st.copy;
      dots.querySelectorAll("button").forEach((b, i) => b.classList.toggle("is-on", i === step));
      drawScene(step);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = 0;
      }
      root.querySelector("[data-play]").textContent = "Пуск";
    };
    const play = () => {
      if (timer) {
        stop();
        return;
      }
      root.querySelector("[data-play]").textContent = "Пауза";
      timer = setInterval(() => show(step + 1), 2800);
    };
    root.querySelector("[data-play]").addEventListener("click", play);
    root.querySelector("[data-prev]").addEventListener("click", () => {
      stop();
      show(step - 1);
    });
    root.querySelector("[data-next]").addEventListener("click", () => {
      stop();
      show(step + 1);
    });
    dots.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        stop();
        show(Number(b.dataset.i));
      });
    });
    root._pipeStop = stop;
    show(0);
  }

  function mountShutter(root) {
    root.innerHTML = `
      <div class="widget-toolbar">
        <button type="button" data-mode="global">Глобальный</button>
        <button type="button" data-mode="slit">Шторно-щелевой / rolling</button>
        <button type="button" data-play>Пауза</button>
      </div>
      <canvas data-cv width="840" height="270" aria-label="Глобальный и шторно-щелевой затвор"></canvas>
      <div class="widget-controls">
        <label>оборот лопастей <span data-sval></span>
          <input type="range" data-spd min="0.3" max="3.5" step="0.1" value="1.4">
        </label>
      </div>
      <p class="widget-readout" data-title></p>
      <p class="widget-copy" data-copy></p>
    `;
    const canvas = root.querySelector("[data-cv]");
    const ctx = canvas.getContext("2d");
    const spd = root.querySelector("[data-spd]");
    const COPY = {
      global:
        "Глобальный затвор: все пиксели начинают и кончают экспозицию в один момент. Лопасти прямые — геометрия кадра честная. Кадровый снимок по ГОСТ: элементы одномоментно в пределах выдержки.",
      slit:
        "Шторно-щелевой и rolling shutter — один класс: щель или строка бежит по кадру. Время для точки — номинальная выдержка; время пробежать кадр — больше. Лопасти «заваливаются». При АФС каждой строке — свой момент, снимок ближе к сканерному.",
    };
    let mode = "slit";
    let playing = false;
    let raf = 0;
    let last = 0;
    let angle = 0;
    let scan = 0;
    const N = 18;
    const rows = new Array(N).fill(0);
    const flash = { t: 0 };

    const drawProp = (c, cx, cy, ang, blade, hub) => {
      c.save();
      c.translate(cx, cy);
      c.rotate(ang);
      c.fillStyle = blade;
      c.fillRect(-8, -92, 16, 184);
      c.beginPath();
      c.arc(0, 0, 12, 0, Math.PI * 2);
      c.fillStyle = hub;
      c.fill();
      c.restore();
    };

    const paint = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#141b24";
      ctx.fillRect(0, 0, w, h);
      const left = { x: 28, y: 36, w: 370, h: 210 };
      const right = { x: 442, y: 36, w: 370, h: 210 };
      ctx.strokeStyle = "#2a3544";
      ctx.lineWidth = 2;
      ctx.strokeRect(left.x, left.y, left.w, left.h);
      ctx.strokeRect(right.x, right.y, right.w, right.h);
      ctx.fillStyle = "#93a1b3";
      ctx.font = "13px Segoe UI, sans-serif";
      ctx.fillText("мир · сейчас", left.x, 24);
      ctx.fillText("снимок · как записалось", right.x, 24);
      ctx.save();
      ctx.beginPath();
      ctx.rect(left.x, left.y, left.w, left.h);
      ctx.clip();
      ctx.fillStyle = "#1a222c";
      ctx.fillRect(left.x, left.y, left.w, left.h);
      drawProp(ctx, left.x + left.w / 2, left.y + left.h / 2, angle, "#6ec3d8", "#e2b56a");
      ctx.restore();

      const rowH = right.h / N;
      ctx.save();
      ctx.beginPath();
      ctx.rect(right.x, right.y, right.w, right.h);
      ctx.clip();
      ctx.fillStyle = "#1a222c";
      ctx.fillRect(right.x, right.y, right.w, right.h);
      const cxR = right.x + right.w / 2;
      const cyR = right.y + right.h / 2;
      for (let i = 0; i < N; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(right.x, right.y + i * rowH, right.w, rowH + 0.6);
        ctx.clip();
        drawProp(ctx, cxR, cyR, rows[i], "#86c99a", "#e2b56a");
        ctx.restore();
      }
      if (mode === "slit") {
        const y = right.y + scan * right.h;
        ctx.fillStyle = "rgba(226, 181, 106, 0.28)";
        ctx.fillRect(right.x, y - rowH, right.w, rowH * 2.2);
        ctx.fillStyle = "#e2b56a";
        ctx.fillRect(right.x, y, right.w, 3);
      } else if (flash.t > 0) {
        ctx.fillStyle = `rgba(226, 181, 106, ${0.35 * flash.t})`;
        ctx.fillRect(right.x, right.y, right.w, right.h);
      }
      ctx.restore();
    };

    const tick = (now) => {
      if (!playing) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const speed = Number(spd.value);
      angle += speed * Math.PI * 2 * dt * 0.55;
      if (mode === "slit") {
        scan += dt * 0.55;
        if (scan > 1) scan = 0;
        const i = Math.min(N - 1, Math.max(0, Math.floor(scan * N)));
        rows[i] = angle;
      } else {
        flash.t = Math.max(0, flash.t - dt * 2.4);
        scan += dt * 0.55;
        if (scan > 1) {
          scan = 0;
          for (let i = 0; i < N; i++) rows[i] = angle;
          flash.t = 1;
        }
      }
      paint();
      raf = requestAnimationFrame(tick);
    };

    const setMode = (m) => {
      mode = m;
      scan = 0;
      flash.t = 0;
      for (let i = 0; i < N; i++) rows[i] = angle;
      root.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("is-on", b.dataset.mode === m));
      root.querySelector("[data-title]").textContent =
        m === "global" ? "Глобальный затвор — все строки сразу" : "Щель / rolling — строки по очереди";
      root.querySelector("[data-copy]").textContent = COPY[m];
      paint();
    };

    const play = () => {
      if (playing && raf) return;
      playing = true;
      last = 0;
      root.querySelector("[data-play]").textContent = "Пауза";
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      root.querySelector("[data-play]").textContent = "Пуск";
    };

    root.querySelectorAll("[data-mode]").forEach((b) => {
      b.addEventListener("click", () => setMode(b.dataset.mode));
    });
    root.querySelector("[data-play]").addEventListener("click", () => {
      if (playing) stop();
      else play();
    });
    spd.addEventListener("input", () => {
      root.querySelector("[data-sval]").textContent = `${Number(spd.value).toFixed(1)} об / пробег кадра`;
    });
    root.querySelector("[data-sval]").textContent = `${Number(spd.value).toFixed(1)} об / пробег кадра`;
    root._shutterStop = stop;
    root._shutterPlay = play;
    setMode("slit");
  }

  const PRODUCT_LAYERS = [
    {
      key: "tin",
      title: "1 · TIN 3D",
      copy: "Нерегулярная сеть треугольников по точкам поверхности. Каркас рельефа и крыш, ещё без фототекстуры.",
    },
    {
      key: "tex",
      title: "2 · 3D с текстурой",
      copy: "Та же геометрия, на треугольники натянуты фрагменты снимков. Цифровой двойник для осмотра, не ортоплан.",
    },
    {
      key: "dem",
      title: "3 · DEM / ЦМР",
      copy: "Поле высот в регулярной сетке. Цвет — Z, не фото. Нужна для ортотрансформирования и сечения рельефа.",
    },
    {
      key: "ortho",
      title: "4 · Ортофотоплан",
      copy: "Снимок, приведённый к ортогональной проекции и СК. Метрический продукт сдачи, не склейка JPEG.",
    },
  ];

  function mountLayers(root) {
    const srcs = PRODUCT_LAYERS.map((st) => root.dataset[st.key] || "");
    root.innerHTML = `
      <div class="widget-toolbar">
        <button type="button" data-play>Пуск</button>
        <button type="button" data-prev>← слой</button>
        <button type="button" data-next>слой →</button>
        <span class="widget-dots" data-dots></span>
      </div>
      <div class="layers-stage">
        <img data-photo alt="">
        <svg viewBox="0 0 960 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-svg>
          <rect width="960" height="300" fill="#141b24"/>
          <g data-scene></g>
        </svg>
      </div>
      <p class="widget-readout" data-title></p>
      <p class="widget-copy" data-copy></p>
    `;
    const dots = root.querySelector("[data-dots]");
    PRODUCT_LAYERS.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.i = String(i);
      dots.appendChild(b);
    });
    let step = 0;
    let timer = 0;
    const scene = root.querySelector("[data-scene]");
    const photo = root.querySelector("[data-photo]");
    const svg = root.querySelector("[data-svg]");
    const drawScene = (n) => {
      const tin = n >= 0;
      const tex = n >= 1;
      const dem = n >= 2;
      const ortho = n >= 3;
      scene.innerHTML = `
        <polygon points="80,220 200,90 360,200 280,260" fill="${tex ? "#4a6b38" : "none"}" stroke="#6ec3d8" stroke-width="2" opacity="${tin ? 1 : 0.2}"/>
        <polygon points="200,90 360,200 420,80" fill="${tex ? "#6b4e16" : "none"}" stroke="#6ec3d8" stroke-width="2" opacity="${tin ? 1 : 0.2}"/>
        <polygon points="80,220 280,260 160,280" fill="${tex ? "#3a5220" : "none"}" stroke="#6ec3d8" stroke-width="2" opacity="${tin ? 1 : 0.2}"/>
        <text x="220" y="50" fill="#6ec3d8" font-size="14" font-family="Segoe UI, sans-serif">${tex ? "текстура на TIN" : "TIN"}</text>
        ${dem ? `<g>
          <rect x="500" y="70" width="180" height="180" fill="#1e2733" stroke="#86c99a"/>
          <rect x="508" y="200" width="164" height="40" fill="#3a6b4a"/>
          <rect x="508" y="160" width="164" height="40" fill="#6b8f3a"/>
          <rect x="508" y="120" width="164" height="40" fill="#c4a035"/>
          <rect x="508" y="78" width="164" height="42" fill="#e07a73"/>
          <text x="590" y="268" fill="#86c99a" font-size="14" text-anchor="middle" font-family="Segoe UI, sans-serif">DEM · высота</text>
        </g>` : `<rect x="500" y="70" width="180" height="180" fill="#1a222c" stroke="#2a3544"/>
          <text x="590" y="168" fill="#445060" font-size="13" text-anchor="middle" font-family="Segoe UI, sans-serif">DEM</text>`}
        ${ortho ? `<g>
          <rect x="720" y="70" width="200" height="180" fill="#2a4a30" stroke="#e2b56a"/>
          <rect x="740" y="160" width="70" height="70" fill="#6b4e16"/>
          <rect x="830" y="140" width="60" height="40" fill="#4a6b38"/>
          <path d="M730 230 L910 200" stroke="#93a1b3" stroke-width="4"/>
          <text x="820" y="268" fill="#e2b56a" font-size="14" text-anchor="middle" font-family="Segoe UI, sans-serif">орто · план</text>
        </g>` : `<rect x="720" y="70" width="200" height="180" fill="#1a222c" stroke="#2a3544"/>
          <text x="820" y="168" fill="#445060" font-size="13" text-anchor="middle" font-family="Segoe UI, sans-serif">орто</text>`}
      `;
    };
    const show = (n) => {
      step = (n + PRODUCT_LAYERS.length) % PRODUCT_LAYERS.length;
      const st = PRODUCT_LAYERS[step];
      root.querySelector("[data-title]").textContent = st.title;
      root.querySelector("[data-copy]").textContent = st.copy;
      dots.querySelectorAll("button").forEach((b, i) => b.classList.toggle("is-on", i === step));
      const src = srcs[step];
      if (src) {
        photo.src = src;
        photo.alt = st.title;
        photo.hidden = false;
        svg.hidden = true;
      } else {
        photo.hidden = true;
        svg.hidden = false;
        drawScene(step);
      }
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = 0;
      }
      root.querySelector("[data-play]").textContent = "Пуск";
    };
    const play = () => {
      if (timer) {
        stop();
        return;
      }
      root.querySelector("[data-play]").textContent = "Пауза";
      timer = setInterval(() => show(step + 1), 2600);
    };
    root.querySelector("[data-play]").addEventListener("click", play);
    root.querySelector("[data-prev]").addEventListener("click", () => {
      stop();
      show(step - 1);
    });
    root.querySelector("[data-next]").addEventListener("click", () => {
      stop();
      show(step + 1);
    });
    dots.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        stop();
        show(Number(b.dataset.i));
      });
    });
    root._pipeStop = stop;
    show(0);
  }

  const mount = () => {
    document.querySelectorAll("[data-widget='gsd']").forEach((el) => {
      if (!el.dataset.ready) {
        el.dataset.ready = "1";
        el.classList.add("widget");
        mountGsd(el);
      }
    });
    document.querySelectorAll("[data-widget='ndvi']").forEach((el) => {
      if (!el.dataset.ready) {
        el.dataset.ready = "1";
        el.classList.add("widget");
        mountNdvi(el);
      }
    });
    document.querySelectorAll("[data-widget='beer']").forEach((el) => {
      if (!el.dataset.ready) {
        el.dataset.ready = "1";
        el.classList.add("widget");
        mountBeer(el);
      }
    });
    document.querySelectorAll("[data-widget='dof']").forEach((el) => {
      if (!el.dataset.ready) {
        el.dataset.ready = "1";
        el.classList.add("widget");
        mountDof(el);
      }
    });
    document.querySelectorAll("[data-widget='pipeline']").forEach((el) => {
      if (!el.dataset.ready) {
        el.dataset.ready = "1";
        el.classList.add("widget");
        mountPipeline(el);
      }
      const on = el.closest(".slide")?.classList.contains("is-active") ?? true;
      if (!on) el._pipeStop?.();
    });
    document.querySelectorAll("[data-widget='shutter']").forEach((el) => {
      if (!el.dataset.ready) {
        el.dataset.ready = "1";
        el.classList.add("widget");
        mountShutter(el);
      }
      const on = el.closest(".slide")?.classList.contains("is-active") ?? true;
      if (on) el._shutterPlay?.();
      else el._shutterStop?.();
    });
    document.querySelectorAll("[data-widget='layers']").forEach((el) => {
      if (!el.dataset.ready) {
        el.dataset.ready = "1";
        el.classList.add("widget");
        mountLayers(el);
      }
      const on = el.closest(".slide")?.classList.contains("is-active") ?? true;
      if (!on) el._pipeStop?.();
    });
  };

  mount();
  document.addEventListener("slidechange", mount);
})();
