(() => {
  const defs = `
    <defs>
      <marker id="f02-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10Z" fill="context-stroke"/>
      </marker>
      <style>
        .axis{stroke:#555;stroke-width:2;stroke-dasharray:10 8}.lens{fill:#bdeaff;fill-opacity:.78;stroke:#126a91;stroke-width:5}
        .ray-a{fill:none;stroke:#c78312;stroke-width:4}.ray-b{fill:none;stroke:#1677b8;stroke-width:4}
        .ray-c{fill:none;stroke:#21834f;stroke-width:4}.virtual{stroke-dasharray:9 8;opacity:.75}
        .object{stroke:#111;stroke-width:6}.image{stroke:#c7352c;stroke-width:6}.guide{stroke:#777;stroke-width:2;stroke-dasharray:8 7}
        .panel{fill:#fff;stroke:#111;stroke-width:2}
        .label{font:21px 'Segoe UI',sans-serif;fill:#000}.small{font:17px 'Segoe UI',sans-serif;fill:#000}.strong{font:700 25px 'Segoe UI',sans-serif;fill:#000}
      </style>
    </defs>`;

  const lensShape = (x = 640, y = 300, h = 220) =>
    `<path class="lens" d="M${x} ${y - h / 2}Q${x - 90} ${y} ${x} ${y + h / 2}Q${x + 90} ${y} ${x} ${y - h / 2}Z"/>`;

  const makeRange = (min, max, step, value, labelText) => {
    const label = document.createElement("label");
    const caption = document.createElement("span");
    const range = document.createElement("input");
    caption.textContent = labelText;
    range.type = "range";
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = value;
    label.append(caption, range);
    return { label, range, caption };
  };

  const mountSvg = (selector, viewBox, label, content) => {
    document.querySelectorAll(selector).forEach((root) => {
      root.innerHTML = `<svg viewBox="${viewBox}" role="img" aria-label="${label}">${defs}<rect width="100%" height="100%" fill="#fff"/>${content}</svg>`;
    });
  };

  mountSvg("[data-f02-light]", "0 0 1400 680", "Семь физических свойств света", `
    <g transform="translate(20 20)"><rect class="panel" width="440" height="200" rx="15"/>
      <text class="strong" x="20" y="38">Интерференция</text>
      <path class="ray-b" d="M25 95c30-45 60 45 90 0s60-45 90 0s60 45 90 0"/>
      <path class="image" d="M25 140c30-45 60 45 90 0s60-45 90 0s60 45 90 0"/>
      <path class="ray-a" d="M325 115c22-65 44 65 66 0"/><text class="small" x="20" y="185">Усиление или гашение волн</text>
    </g>
    <g transform="translate(480 20)"><rect class="panel" width="440" height="200" rx="15"/>
      <text class="strong" x="20" y="38">Дифракция</text>
      <path class="ray-b" d="M25 75h145M25 110h145M25 145h145"/><path d="M188 55v45M188 120v55" stroke="#111" stroke-width="5"/>
      <path class="ray-b" d="M200 110a55 55 0 0 1 55 55M200 110a105 105 0 0 1 105 105M200 110a155 155 0 0 1 155 155"/>
      <text class="small" x="20" y="185">Волна расходится за узкой щелью</text>
    </g>
    <g transform="translate(940 20)"><rect class="panel" width="440" height="200" rx="15"/>
      <text class="strong" x="20" y="38">Дисперсия</text>
      <path d="M25 110h130" stroke="#111" stroke-width="5"/><path d="M165 55l100 125 50-125z" fill="#edf7fa" stroke="#111" stroke-width="3"/>
      <path class="image" d="M265 110l145-35"/><path class="ray-c" d="M265 112l145 0"/><path class="ray-b" d="M265 114l145 42"/>
      <text class="small" x="20" y="185">n = n(λ): цвета преломляются по-разному</text>
    </g>
    <g transform="translate(20 240)"><rect class="panel" width="325" height="200" rx="15"/>
      <text class="strong" x="20" y="38">Поляризация</text>
      <path d="M35 70l35 35M35 105l35-35M52 62v52M27 88h50M90 70l35 35M90 105l35-35" stroke="#444" stroke-width="3"/>
      <rect x="145" y="55" width="25" height="110" fill="#ddd" stroke="#111" stroke-width="3"/>
      <path class="ray-b" d="M190 115c20-60 40 60 60 0s40-60 60 0"/>
      <text class="small" x="20" y="185">Одно направление колебаний</text>
    </g>
    <g transform="translate(365 240)"><rect class="panel" width="325" height="200" rx="15"/>
      <text class="strong" x="20" y="38">Отражение</text>
      <path d="M20 145h285M163 50v110" stroke="#111" stroke-width="3"/>
      <path class="ray-b" d="M55 55l108 90"/><path class="image" d="M163 145l108-90"/>
      <text class="small" x="20" y="185">Угол отражения равен углу падения</text>
    </g>
    <g transform="translate(710 240)"><rect class="panel" width="325" height="200" rx="15"/>
      <text class="strong" x="20" y="38">Преломление</text>
      <path d="M20 112h285M163 48v125" stroke="#111" stroke-width="3"/>
      <path class="ray-b" d="M55 50l108 62 45 73"/><text class="small" x="20" y="185">n₁ sin α = n₂ sin β</text>
    </g>
    <g transform="translate(1055 240)"><rect class="panel" width="325" height="200" rx="15"/>
      <text class="strong" x="20" y="38">Рассеивание</text>
      <path class="ray-b" d="M20 112h110"/><circle cx="160" cy="112" r="16" fill="#ddd" stroke="#111" stroke-width="3"/>
      <path class="ray-b" d="M173 102l70-50M178 112h105M173 122l70 50M153 98l-18-42M153 126l-18 42"/>
      <text class="small" x="20" y="185">Луч меняет направление</text>
    </g>
    <rect x="20" y="460" width="1360" height="195" rx="15" fill="#f5f5f5" stroke="#111" stroke-width="2"/>
    <text class="strong" x="45" y="505">Геометрическая оптика заменяет волну лучом, когда размеры системы намного больше длины волны λ</text>
    <path class="ray-b" d="M65 575c45-75 90 75 135 0s90-75 135 0s90 75 135 0"/>
    <path d="M530 535v100" stroke="#111" stroke-width="6"/><path class="ray-a" d="M565 585h300"/>
    <path d="M930 520l85 125 55-125z" fill="#fff" stroke="#111" stroke-width="3"/>
    <path class="image" d="M1018 585l230-50"/><path class="ray-c" d="M1018 585h230"/><path class="ray-b" d="M1018 585l230 50"/>`);

  mountSvg("[data-f02-objective]", "0 0 1400 650", "Фотографический объектив", `
    <ellipse cx="720" cy="585" rx="475" ry="34" fill="#000" opacity=".15"/>
    <path d="M390 150H985l180 85v270l-180 75H390z" fill="#25282d" stroke="#000" stroke-width="6"/>
    <path d="M955 165l170 75v260l-170 65z" fill="#15171a" stroke="#000" stroke-width="5"/>
    <ellipse cx="390" cy="365" rx="215" ry="215" fill="#15171a" stroke="#000" stroke-width="8"/>
    <ellipse cx="390" cy="365" rx="170" ry="173" fill="#06101a" stroke="#666" stroke-width="14"/>
    <ellipse cx="390" cy="365" rx="138" ry="142" fill="#1d668e" stroke="#000" stroke-width="8"/>
    <ellipse cx="350" cy="320" rx="42" ry="75" fill="#fff" opacity=".24" transform="rotate(35 350 320)"/>
    <path d="M540 158v414M585 158v414M805 158v414M850 158v414" stroke="#777" stroke-width="5"/>
    <path d="M1165 245l95 34v170l-95 43z" fill="#c5c5c5" stroke="#111" stroke-width="5"/>
    <text class="strong" x="85" y="70">Передняя линза</text><path d="M250 82l55 110" stroke="#111" stroke-width="3"/>
    <text class="strong" x="590" y="70">Кольцо фокусировки</text><path d="M720 82v72" stroke="#111" stroke-width="3"/>
    <text class="strong" x="1110" y="70">Байонет</text><path d="M1170 82l55 185" stroke="#111" stroke-width="3"/>`);

  mountSvg("[data-f02-parts]", "0 0 1050 620", "Продольный разрез объектива", `
    <path class="axis" d="M30 310H1020"/><path d="M105 135H835l105 55v240l-105 55H105z" fill="#30343a" stroke="#000" stroke-width="5"/>
    <path d="M145 175h670l65 38v194l-65 38H145z" fill="#fff" stroke="#111" stroke-width="3"/>
    <path class="lens" d="M250 180q-70 130 0 260q75-130 0-260zM420 180q65 130 0 260q-60-130 0-260zM600 190q-65 120 0 240q70-120 0-240zM760 190q70 120 0 240q-60-120 0-240z"/>
    <path d="M515 165l65 120h-50l-55-105M515 455l65-120h-50l-55 105" fill="#111"/>
    <circle cx="550" cy="310" r="28" fill="#fff" stroke="#111" stroke-width="7"/>
    <rect x="938" y="215" width="22" height="190" fill="#bbb" stroke="#111" stroke-width="4"/><rect x="995" y="195" width="13" height="230" fill="#4d8da8"/>
    <path class="ray-a" d="M30 220l220 25 170 28 130 37 210 55 235 35M30 400l220-25 170-28 130-37 210-55 235-35"/>
    <text class="strong" x="145" y="95">Линзы</text><text class="strong" x="465" y="95">Диафрагма</text><text class="strong" x="735" y="95">Оправа</text><text class="strong" x="915" y="535">Матрица</text>`);

  mountSvg("[data-f02-parameters]", "0 0 1050 620", "Основные параметры объектива", `
    <path class="axis" d="M30 310H1015"/><path class="lens" d="M450 75q-125 235 0 470q125-235 0-470z"/>
    <circle cx="450" cy="310" r="72" fill="#fff" stroke="#111" stroke-width="7"/><rect x="820" y="95" width="20" height="430" fill="#4d8da8" stroke="#111" stroke-width="3"/>
    <path class="ray-a" d="M30 120l420 190 370 155M30 500l420-190 370-155M30 310h790"/>
    <path d="M450 570h370M410 238v144" stroke="#111" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="590" y="605">f — Фокусное расстояние</text><text class="strong" x="345" y="320">D</text>
    <text class="strong" x="205" y="215">2ω — Угол поля зрения</text>
    <g transform="translate(865 155)" fill="#111"><rect width="6" height="310"/><rect x="15" width="6" height="310"/><rect x="38" width="4" height="310"/><rect x="49" width="4" height="310"/><rect x="68" width="3" height="310"/><rect x="76" width="3" height="310"/><rect x="92" width="2" height="310"/><rect x="98" width="2" height="310"/></g>
    <text class="label" x="855" y="505">Разрешение</text>`);

  mountSvg("[data-f02-lens]", "0 0 1400 610", "Линза со сферическими поверхностями", `
    <path class="axis" d="M45 310H1350"/><path class="lens" d="M670 45q-230 265 0 530q230-265 0-530z"/>
    <circle cx="450" cy="310" r="9" fill="#111"/><circle cx="890" cy="310" r="9" fill="#111"/>
    <path class="guide" d="M450 310L670 45M450 310l220 265M890 310L670 45M890 310L670 575"/>
    <path class="ray-a" d="M45 150h540l170 55 375 105M45 310h1085M45 470h540l170-55 375-105"/>
    <circle cx="1130" cy="310" r="10" fill="#c7352c"/><text class="strong" x="425" y="285">C₁</text><text class="strong" x="865" y="285">C₂</text><text class="strong" x="1112" y="285">F′</text>
    <text class="label" x="55" y="565">C₁ и C₂ — центры кривизны сферических поверхностей</text>`);

  mountSvg("[data-f02-lens-types]", "0 0 1400 650", "Шесть типов сферических линз", `
    <rect x="25" y="20" width="665" height="610" rx="16" fill="#f7fbfd" stroke="#111" stroke-width="3"/>
    <rect x="710" y="20" width="665" height="610" rx="16" fill="#fafafa" stroke="#111" stroke-width="3"/>
    <text class="strong" x="55" y="65">Собирающие линзы</text><text class="strong" x="740" y="65">Рассеивающие линзы</text>
    <g transform="translate(70 110)"><path class="lens" d="M90 30q-65 125 0 250q65-125 0-250z"/><text class="label" x="0" y="325">Двояковыпуклая</text></g>
    <g transform="translate(285 110)"><path class="lens" d="M60 30v250q95-125 0-250z"/><text class="label" x="0" y="325">Плоско-выпуклая</text></g>
    <g transform="translate(500 110)"><path class="lens" d="M35 30q80 125 0 250q120-125 0-250z"/><text class="label" x="-5" y="325">Собирающий мениск</text></g>
    <g transform="translate(755 110)"><path class="lens" d="M40 30q65 125 0 250h90q-65-125 0-250z"/><text class="label" x="0" y="325">Двояковогнутая</text></g>
    <g transform="translate(970 110)"><path class="lens" d="M45 30v250h80q-70-125 0-250z"/><text class="label" x="0" y="325">Плоско-вогнутая</text></g>
    <g transform="translate(1180 110)"><path class="lens" d="M30 30q120 125 0 250q80-125 0-250z"/><text class="label" x="-10" y="325">Рассеивающий мениск</text></g>
    <path class="ray-c" d="M80 545h565"/><path class="image" d="M750 545h565"/>
    <text class="label" x="170" y="585">Параллельный пучок сходится</text><text class="label" x="850" y="585">Параллельный пучок расходится</text>`);

  mountSvg("[data-f02-static-lens]", "0 0 1400 700", "Построение изображения тонкой линзой", `
    <path class="axis" d="M40 350H1360"/>${lensShape(700, 350, 580)}
    <circle cx="460" cy="350" r="9" fill="#111"/><circle cx="940" cy="350" r="9" fill="#111"/>
    <text class="strong" x="442" y="325">F</text><text class="strong" x="922" y="325">F′</text>
    <path class="object" d="M150 350V130" marker-end="url(#f02-arrow)"/><text class="strong" x="75" y="395">Предмет</text>
    <path class="image" d="M1126 350V520" marker-end="url(#f02-arrow)"/><text class="strong" x="1040" y="570">Изображение</text>
    <path class="ray-a" d="M150 130H700L1126 520"/>
    <path class="ray-b" d="M150 130L700 350L1126 520"/>
    <path class="ray-c" d="M150 130L460 350L700 520H1126"/>
    <text class="label" x="215" y="105">Параллельный луч → через F′</text>
    <text class="label" x="340" y="295">Луч через оптический центр</text>
    <text class="label" x="745" y="555">Луч через F → параллельно оси</text>`);

  mountSvg("[data-f02-focal]", "0 0 1400 560", "Главное фокусное расстояние", `
    <path class="axis" d="M45 285H1350"/>
    <path class="lens" d="M550 55q-125 230 0 460h210q125-230 0-460z"/>
    <path d="M595 40v490M715 40v490" stroke="#126a91" stroke-width="5"/>
    <text class="strong" x="575" y="35">H</text><text class="strong" x="695" y="35">H′</text>
    <path class="ray-a" d="M45 125h550l120 45 405 115M45 285h1075M45 445h550l120-45 405-115"/>
    <circle cx="1120" cy="285" r="10" fill="#c7352c"/><text class="strong" x="1105" y="260">F′</text>
    <path d="M715 515h405" stroke="#111" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="835" y="550">H′F′ = f</text>
    <text class="label" x="800" y="75">Задняя главная плоскость</text>`);

  mountSvg("[data-f02-crop]", "0 0 1280 430", "Кроп-фактор и размер кадрового окна", `
    <circle cx="430" cy="220" r="190" fill="#eef5f8" stroke="#777" stroke-width="3"/>
    <path d="M255 75l350 290M255 365L605 75M430 30v380M240 220h380" stroke="#b7c3ca" stroke-width="3"/>
    <rect x="220" y="80" width="420" height="280" fill="none" stroke="#1677b8" stroke-width="7"/>
    <rect x="290" y="127" width="280" height="186" fill="#c7352c" fill-opacity=".1" stroke="#c7352c" stroke-width="7"/>
    <text class="strong" x="85" y="55">Один объектив создаёт один круг изображения</text>
    <text class="strong" x="690" y="105" fill="#1677b8">Кадр 24×36 мм</text>
    <path d="M680 115L610 95" stroke="#1677b8" stroke-width="4"/>
    <text class="strong" x="690" y="185" fill="#c7352c">Меньшая матрица</text>
    <path d="M680 195L570 150" stroke="#c7352c" stroke-width="4"/>
    <text class="label" x="690" y="255">Меньшая матрица записывает только</text>
    <text class="label" x="690" y="285">центральную часть того же изображения.</text>
    <text class="label" x="690" y="340">Поле зрения становится уже.</text>
    <text class="label" x="690" y="375">Фокусное расстояние не изменяется.</text>`);

  mountSvg("[data-f02-efr]", "0 0 1280 430", "Одинаковое поле зрения при разных форматах кадра", `
    <rect class="panel" x="20" y="20" width="600" height="390" rx="15"/>
    <rect class="panel" x="660" y="20" width="600" height="390" rx="15"/>
    <text class="strong" x="45" y="60">Кадр 24×36 мм</text>
    <text class="strong" x="685" y="60">Матрица с кроп-фактором 1,5</text>
    <g>
      <path class="lens" d="M370 125q-65 90 0 180q65-90 0-180z"/>
      <rect x="530" y="105" width="12" height="220" fill="#4d8da8"/>
      <path class="ray-a" d="M55 90l315 125 160 95M55 340l315-125 160-95"/>
      <text class="label" x="220" y="365">Фокусное расстояние 50 мм</text>
      <text class="small" x="205" y="392">Эквивалентное фокусное расстояние 50 мм</text>
    </g>
    <g transform="translate(640 0)">
      <path class="lens" d="M370 125q-65 90 0 180q65-90 0-180z"/>
      <rect x="500" y="140" width="12" height="150" fill="#c7352c"/>
      <path class="ray-a" d="M55 90l315 125 130 65M55 340l315-125 130-65"/>
      <text class="label" x="205" y="365">Фокусное расстояние 33 мм</text>
      <text class="small" x="195" y="392">Эквивалентное фокусное расстояние 50 мм</text>
    </g>
    <text class="strong" x="505" y="95">Одинаковый угол поля зрения</text>`);

  mountSvg("[data-f02-diffraction]", "0 0 620 470", "Дифракция на открытой и закрытой диафрагме", `
    <text class="strong" x="35" y="45">Большое отверстие</text>
    <text class="strong" x="35" y="275">Малое отверстие</text>
    <g transform="translate(0 20)">
      <path d="M55 85h190M55 125h190M55 165h190" stroke="#1677b8" stroke-width="4"/>
      <path d="M265 70v55M265 145v55" stroke="#111" stroke-width="8"/>
      <path class="ray-b" d="M270 135l210-20M270 135l210 20"/>
      <rect x="490" y="70" width="8" height="130" fill="#444"/>
      <circle cx="494" cy="135" r="13" fill="#1677b8" opacity=".75"/>
      <text class="small" x="55" y="235">Узкое дифракционное пятно</text>
    </g>
    <g transform="translate(0 230)">
      <path d="M55 85h190M55 125h190M55 165h190" stroke="#1677b8" stroke-width="4"/>
      <path d="M265 70v62M265 138v62" stroke="#111" stroke-width="8"/>
      <path class="ray-b" d="M270 135l210-65M270 135l210 65"/>
      <rect x="490" y="70" width="8" height="130" fill="#444"/>
      <circle cx="494" cy="135" r="38" fill="#1677b8" opacity=".38"/>
      <circle cx="494" cy="135" r="21" fill="#1677b8" opacity=".65"/>
      <text class="small" x="55" y="230">Меньше отверстие → шире пятно</text>
    </g>
    <text class="strong" x="350" y="35">Радиус пятна Эри</text>
    <text class="label" x="350" y="60">r ≈ 1,22 · λ · n₀</text>
    <text class="small" x="350" y="82">r — радиус первого минимума</text>
    <text class="small" x="350" y="103">λ — длина волны</text>
    <text class="small" x="350" y="124">n₀ — диафрагменное число</text>`);

  document.querySelectorAll("[data-f02-image-slider]").forEach((root) => {
    root.classList.add("f02-interactive", "f02-image-slider");
    const controls = document.createElement("div");
    controls.className = "f02-controls";
    const { label, range, caption } = makeRange(1, 3, 1, 1, "");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    readout.setAttribute("aria-live", "polite");
    const image = document.createElement("img");
    const stages = [
      {
        name: "1 / 3 · Без оптической системы",
        text: "Лучи от каждой точки предмета расходятся и перекрываются на экране: резкого изображения нет.",
        src: "images/s11_01.png",
        alt: "Предмет освещён источником; без оптической системы лучи перекрываются на экране"
      },
      {
        name: "2 / 3 · Камера-обскура",
        text: "Малое отверстие ограничивает пучки лучей и формирует перевёрнутое изображение без линзы.",
        src: "images/s11_03.png",
        alt: "Камера-обскура формирует перевёрнутое изображение через малое отверстие"
      },
      {
        name: "3 / 3 · Собирающая линза",
        text: "Линза собирает лучи от каждой точки предмета в соответствующей точке действительного изображения.",
        src: "images/s11_02.png",
        alt: "Собирающая линза строит перевёрнутое действительное изображение предмета на экране"
      }
    ];
    const render = () => {
      const stage = stages[Number(range.value) - 1];
      caption.textContent = stage.name;
      readout.textContent = stage.text;
      image.src = stage.src;
      image.alt = stage.alt;
    };
    controls.append(label, readout);
    root.append(controls, image);
    range.addEventListener("input", render);
    render();
  });

  document.querySelectorAll("[data-f02-build]").forEach((root) => {
    root.classList.add("f02-interactive");
    const controls = document.createElement("div");
    controls.className = "f02-controls";
    const { label, range, caption } = makeRange(1, 3, 1, 1, "");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    readout.setAttribute("aria-live", "polite");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 560");
    svg.setAttribute("role", "img");
    controls.append(label, readout);
    root.append(controls, svg);

    const stages = [
      ["1 / 3 · Луч, параллельный оси", "После линзы луч проходит через задний фокус F′."],
      ["2 / 3 · Луч через оптический центр", "В модели тонкой линзы центральный луч не меняет направления."],
      ["3 / 3 · Изображение предмета", "Пересечение характерных лучей задаёт вершину перевёрнутого действительного изображения."]
    ];
    const render = () => {
      const stage = Number(range.value);
      caption.textContent = stages[stage - 1][0];
      readout.textContent = stages[stage - 1][1];
      const ray1 = `<path class="ray-a" d="M150 170H640L1000 447"/><text class="label" x="300" y="151">Параллельно главной оптической оси</text>`;
      const ray2 = `<path class="ray-b" d="M150 170L640 330L1000 447"/><text class="label" x="365" y="285">Через оптический центр</text>`;
      const ray3 = `<path class="ray-c" d="M150 170L432 330L640 448H1000"/><text class="label" x="700" y="477">После линзы — параллельно оси</text>`;
      svg.innerHTML = `${defs}
        <rect width="1280" height="560" fill="#fff"/>
        <path class="axis" d="M45 330H1235"/>
        ${lensShape(640, 330, 340)}
        <circle cx="432" cy="330" r="7" fill="#111"/><circle cx="848" cy="330" r="7" fill="#111"/>
        <text class="strong" x="415" y="310">F</text><text class="strong" x="832" y="310">F′</text>
        <path class="object" d="M150 330V175" marker-end="url(#f02-arrow)"/>
        <text class="strong" x="80" y="365">Предмет</text>
        ${stage >= 1 ? ray1 : ""}${stage >= 2 ? ray2 : ""}${stage >= 3 ? ray3 : ""}
        ${stage >= 3 ? `<path class="image" d="M1000 330V442" marker-end="url(#f02-arrow)"/><text class="strong" x="940" y="485">Изображение</text><circle cx="1000" cy="447" r="8" fill="#c7352c"/>` : ""}
        <text class="label" x="548" y="530">Собирающая тонкая линза</text>`;
    };
    range.addEventListener("input", render);
    render();
  });

  document.querySelectorAll("[data-f02-elements]").forEach((root) => {
    root.classList.add("f02-interactive");
    const controls = document.createElement("div");
    controls.className = "f02-chip-row";
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    readout.setAttribute("aria-live", "polite");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 520");
    root.append(controls, readout, svg);
    const items = {
      axis: ["Главная оптическая ось", "Прямая, относительно которой оптическая система обладает осевой симметрией."],
      vertices: ["Вершины поверхностей", "V₁ и V₂ — точки пересечения преломляющих поверхностей с главной оптической осью."],
      planes: ["Главные плоскости", "H и H′ — сопряжённые плоскости единичного линейного увеличения в модели толстой системы."],
      nodes: ["Узловые точки", "N и N′ — сопряжённые точки, для которых входящий и выходящий лучи параллельны."],
      foci: ["Фокусы", "F и F′ — точки, сопряжённые с бесконечно удалёнными осевыми точками."],
      focalPlanes: ["Фокальные плоскости", "Передняя и задняя фокальные плоскости проходят через F и F′ перпендикулярно оси."]
    };
    let selected = "axis";
    Object.entries(items).forEach(([key, [name]]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "f02-chip";
      button.textContent = name;
      button.addEventListener("click", () => {
        selected = key;
        render();
      });
      button.dataset.key = key;
      controls.append(button);
    });

    const emphasis = (key) => key === selected ? "#c7352c" : "#777";
    const opacity = (key) => key === selected ? 1 : .32;
    const render = () => {
      controls.querySelectorAll("button").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.key === selected);
      });
      readout.textContent = items[selected][1];
      svg.innerHTML = `${defs}
        <rect width="1280" height="520" fill="#fff"/>
        <g opacity="${opacity("axis")}">
          <path d="M45 270H1235" stroke="${emphasis("axis")}" stroke-width="5"/>
          <text class="strong" x="45" y="245" fill="${emphasis("axis")}">Главная оптическая ось</text>
        </g>
        <path class="lens" d="M560 80Q440 270 560 460H740Q860 270 740 80Z"/>
        <g opacity="${opacity("vertices")}" fill="${emphasis("vertices")}">
          <circle cx="560" cy="270" r="10"/><circle cx="740" cy="270" r="10"/>
          <text class="strong" x="520" y="315">V₁</text><text class="strong" x="725" y="315">V₂</text>
        </g>
        <g opacity="${opacity("planes")}" stroke="${emphasis("planes")}" fill="${emphasis("planes")}">
          <path d="M605 55V475M695 55V475" stroke-width="5"/>
          <text class="strong" x="585" y="42">H</text><text class="strong" x="675" y="42">H′</text>
        </g>
        <g opacity="${opacity("nodes")}" fill="${emphasis("nodes")}">
          <circle cx="625" cy="270" r="10"/><circle cx="675" cy="270" r="10"/>
          <text class="strong" x="606" y="245">N</text><text class="strong" x="660" y="245">N′</text>
        </g>
        <g opacity="${opacity("foci")}" fill="${emphasis("foci")}">
          <circle cx="360" cy="270" r="11"/><circle cx="940" cy="270" r="11"/>
          <text class="strong" x="342" y="245">F</text><text class="strong" x="922" y="245">F′</text>
        </g>
        <g opacity="${opacity("focalPlanes")}" stroke="${emphasis("focalPlanes")}" fill="${emphasis("focalPlanes")}">
          <path d="M360 95V445M940 95V445" stroke-width="4" stroke-dasharray="10 8"/>
          <text class="label" x="245" y="490">Передняя фокальная плоскость</text>
          <text class="label" x="895" y="490">Задняя фокальная плоскость</text>
        </g>`;
    };
    render();
  });

  document.querySelectorAll("[data-f02-object-distance]").forEach((root) => {
    root.classList.add("f02-interactive");
    const controls = document.createElement("div");
    controls.className = "f02-controls";
    const { label, range, caption } = makeRange(.6, 4, .01, 3, "");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    readout.setAttribute("aria-live", "polite");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 560");
    svg.setAttribute("role", "img");
    controls.append(label, readout);
    root.append(controls, svg);

    const lineToX = (x1, y1, x2, y2, x) => y1 + (y2 - y1) * (x - x1) / (x2 - x1);
    const render = () => {
      const a = Number(range.value);
      const lensX = 650;
      const axisY = 310;
      const unit = 125;
      const h = 125;
      const xObject = lensX - a * unit;
      const yObject = axisY - h;
      const atFocus = Math.abs(a - 1) < .025;
      const b = atFocus ? Infinity : a / (a - 1);
      const magnification = atFocus ? Infinity : -b / a;
      const xImage = atFocus ? Infinity : lensX + b * unit;
      const yImage = atFocus ? Infinity : axisY - magnification * h;
      const rightX = 1250;
      const ray1Y = lineToX(lensX, yObject, lensX + unit, axisY, rightX);
      const ray2Y = lineToX(xObject, yObject, lensX, axisY, rightX);
      const ray3AtLens = lineToX(xObject, yObject, lensX - unit, axisY, lensX);
      let state;
      if (atFocus) state = "Предмет в передней фокальной плоскости: выходящие лучи параллельны, изображение находится на бесконечности.";
      else if (a < 1) state = "Предмет между линзой и F: изображение мнимое, прямое и увеличенное; оно находится со стороны предмета.";
      else if (Math.abs(a - 2) < .04) state = "Предмет в 2F: изображение действительное, перевёрнутое и того же размера, в 2F′.";
      else if (a < 2) state = "Предмет между F и 2F: изображение действительное, перевёрнутое и увеличенное, дальше 2F′.";
      else state = "Предмет дальше 2F: изображение действительное, перевёрнутое и уменьшенное, между F′ и 2F′.";
      caption.textContent = `Расстояние до предмета: a = ${a.toFixed(2)}f`;
      readout.textContent = `${state}${Number.isFinite(b) ? `  a′ = ${Math.abs(b).toFixed(2)}f, β = ${magnification.toFixed(2)}.` : ""}`;

      const imageVisible = Number.isFinite(xImage) && xImage > 35 && xImage < 1245 && yImage > 25 && yImage < 535;
      const backward = !atFocus && b < 0 ? `
        <path class="ray-a virtual" d="M650 ${yObject}L${xImage} ${yImage}"/>
        <path class="ray-b virtual" d="M650 ${axisY}L${xImage} ${yImage}"/>` : "";
      const imageArrow = imageVisible ? `
        <path class="image" d="M${xImage} ${axisY}V${yImage}" marker-end="url(#f02-arrow)"/>
        <text class="strong" x="${xImage + 14}" y="${Math.max(45, Math.min(520, yImage))}">${b > 0 ? "Действительное" : "Мнимое"} изображение</text>` : "";
      const edgeNote = !imageVisible && !atFocus ? `<text class="strong" x="870" y="535">Изображение находится за границей схемы</text>` : "";

      svg.innerHTML = `${defs}
        <rect width="1280" height="560" fill="#fff"/>
        <path class="axis" d="M30 310H1250"/>
        <path class="guide" d="M400 75V500M525 75V500M775 75V500M900 75V500"/>
        <text class="label" x="378" y="55">2F</text><text class="label" x="512" y="55">F</text>
        <text class="label" x="760" y="55">F′</text><text class="label" x="875" y="55">2F′</text>
        ${lensShape(lensX, axisY, 405)}
        <path class="object" d="M${xObject} ${axisY}V${yObject}" marker-end="url(#f02-arrow)"/>
        <text class="strong" x="${Math.max(35, xObject - 55)}" y="${axisY + 40}">Предмет</text>
        <path class="ray-a" d="M${xObject} ${yObject}H${lensX}L${rightX} ${ray1Y}"/>
        <path class="ray-b" d="M${xObject} ${yObject}L${rightX} ${ray2Y}"/>
        <path class="ray-c" d="M${xObject} ${yObject}L${lensX} ${ray3AtLens}H${rightX}"/>
        ${backward}${imageArrow}${edgeNote}
        <circle cx="${lensX - unit}" cy="${axisY}" r="7" fill="#111"/>
        <circle cx="${lensX + unit}" cy="${axisY}" r="7" fill="#111"/>`;
    };
    range.addEventListener("input", render);
    render();
  });
})();
