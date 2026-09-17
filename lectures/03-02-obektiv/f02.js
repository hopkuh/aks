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

  mountSvg("[data-f02-static-lens]", "0 0 1400 700", "Построение действительного и мнимого изображения", `
    <text class="strong" x="40" y="42">Действительное, перевёрнутое — предмет за 2F</text>
    <path class="axis" d="M40 220H680"/>${lensShape(360, 220, 300)}
    <circle cx="220" cy="220" r="7" fill="#111"/><circle cx="500" cy="220" r="7" fill="#111"/>
    <text class="strong" x="205" y="198">F</text><text class="strong" x="485" y="198">F′</text>
    <path class="object" d="M80 220V110" marker-end="url(#f02-arrow)"/>
    <text class="small" x="45" y="250">Предмет</text>
    <path class="image" d="M600 220V310" marker-end="url(#f02-arrow)"/>
    <text class="small" x="520" y="340">Изображение</text>
    <path class="ray-a" d="M80 110H360L600 310"/>
    <path class="ray-b" d="M80 110L360 220L600 310"/>
    <text class="label" x="100" y="90">∥ оси → через F′</text>
    <text class="label" x="240" y="200">через центр</text>

    <text class="strong" x="740" y="42">Мнимое, прямое, увеличенное — предмет между линзой и F</text>
    <path class="axis" d="M740 280H1360"/>${lensShape(1100, 280, 320)}
    <circle cx="960" cy="280" r="7" fill="#111"/><circle cx="1240" cy="280" r="7" fill="#111"/>
    <text class="strong" x="945" y="258">F</text><text class="strong" x="1225" y="258">F′</text>
    <path class="object" d="M1020 280V220" marker-end="url(#f02-arrow)"/>
    <text class="small" x="990" y="310">Предмет</text>
    <path class="image" d="M913 280V140" marker-end="url(#f02-arrow)" stroke-dasharray="9 8"/>
    <text class="small" x="755" y="130">Мнимое изображение</text>
    <path class="ray-a" d="M1020 220H1100"/>
    <path class="ray-a" d="M1100 220L1340 323"/>
    <path class="ray-a virtual" d="M1100 220L913 140"/>
    <path class="ray-b" d="M913 140L1100 280L1320 355"/>
    <text class="label" x="1125" y="360">после линзы лучи расходятся</text>
    <text class="label" x="780" y="195">продолжения назад → мнимое</text>

    <text class="label" x="40" y="520">Достаточно двух лучей: параллельного оси (после линзы идёт через F′) и луча через оптический центр.</text>
    <text class="label" x="40" y="555">Для мнимого изображения пересечение ищут по пунктирным продолжениям расходящихся лучей влево.</text>
    <text class="label" x="40" y="590">Луч «через F → параллельно оси» на этих схемах не используют.</text>
  `);

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

  mountSvg("[data-f02-f-compare]", "0 0 1280 520", "Фокусное объектива и фокусное снимка", `
    <rect x="20" y="18" width="610" height="480" rx="14" class="panel"/>
    <rect x="650" y="18" width="610" height="480" rx="14" class="panel"/>
    <text class="strong" x="48" y="55">f объектива</text>
    <text class="small" x="48" y="82">от узловой точки N′ до фокуса F′</text>
    <path class="axis" d="M60 260H600"/>
    <path class="lens" d="M250 100q-55 160 0 320q55-160 0-320z"/>
    <circle cx="270" cy="260" r="7" fill="#111"/><text class="strong" x="255" y="240">N′</text>
    <path class="ray-a" d="M60 140H250L430 260M60 200H250L430 260M60 260H430M60 320H250L430 260M60 380H250L430 260"/>
    <circle cx="430" cy="260" r="8" fill="#c7352c"/><text class="strong" x="418" y="238">F′</text>
    <path d="M430 110V410" stroke="#777" stroke-width="2" stroke-dasharray="7 5"/>
    <text class="small" x="440" y="130">фокальная</text>
    <text class="small" x="440" y="152">плоскость</text>
    <path d="M270 340H430" stroke="#111" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="320" y="370">f</text>
    <text class="label" x="48" y="460">Свойство объектива как изделия.</text>
    <text class="label" x="48" y="485">Не зависит от положения матрицы.</text>

    <text class="strong" x="678" y="55">c снимка (фотограмметрия)</text>
    <text class="small" x="678" y="82">от центра проекции S до плоскости снимка</text>
    <path class="axis" d="M690 260H1230"/>
    <path class="lens" d="M850 110q-50 150 0 300q50-150 0-300z"/>
    <circle cx="870" cy="260" r="7" fill="#111"/><text class="strong" x="848" y="240">S ≡ N′</text>
    <rect x="1120" y="120" width="12" height="280" fill="#4d8da8"/>
    <text class="small" x="1140" y="145">плоскость</text>
    <text class="small" x="1140" y="167">снимка</text>
    <path class="ray-b" d="M700 140L870 260L1126 150M700 260H1126M700 380L870 260L1126 370"/>
    <circle cx="1126" cy="260" r="6" fill="#c7352c"/>
    <path d="M870 340H1120" stroke="#c7352c" stroke-width="4" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="960" y="375">c ≈ f снимка</text>
    <text class="label" x="678" y="460">Именно c берут в пересечении лучей.</text>
    <text class="label" x="678" y="485">Уточняют калибровкой вместе с cₓ, cᵧ.</text>
  `);

  mountSvg("[data-f02-card-optics]", "0 0 1280 620", "Карточка оптики", `
    <rect width="1280" height="620" fill="#fff"/>
    <path class="axis" d="M40 300H1240"/>
    <!-- thick lens -->
    <path class="lens" d="M500 90q-50 210 0 420h140q50-210 0-420z"/>
    <path d="M520 70V530" stroke="#126a91" stroke-width="5"/>
    <path d="M620 70V530" stroke="#126a91" stroke-width="5"/>
    <text class="strong" x="500" y="55">H · N</text>
    <text class="strong" x="600" y="55">H′ · N′ · S</text>
    <!-- foci -->
    <circle cx="340" cy="300" r="9" fill="#111"/>
    <text class="strong" x="322" y="275">F</text>
    <circle cx="800" cy="300" r="9" fill="#c7352c"/>
    <text class="strong" x="782" y="275">F′</text>
    <circle cx="620" cy="300" r="10" fill="#111"/>
    <!-- object / image / sensor -->
    <path class="object" d="M120 300V160" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="95" y="145">A</text>
    <rect x="1048" y="110" width="14" height="380" fill="#4d8da8"/>
    <path class="image" d="M1055 300V430" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="1075" y="445">A′</text>
    <!-- two clear rays only -->
    <path class="ray-a" d="M120 160H520L620 195L1055 430"/>
    <path class="ray-b" d="M120 160L520 300L620 300L1055 430"/>
    <!-- dimensions inside frame -->
    <path d="M620 360H800" stroke="#111" stroke-width="4" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="670" y="395">f</text>
    <path d="M620 500H1055" stroke="#c7352c" stroke-width="4" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="780" y="545" style="fill:#c7352c">a′</text>
    <path d="M620 120H1048" stroke="#1677b8" stroke-width="4" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="780" y="105" style="fill:#1677b8">c</text>
    <!-- legend box inside -->
    <rect x="40" y="520" width="420" height="80" rx="10" fill="#f4f8fb" stroke="#111" stroke-width="2"/>
    <text class="label" x="55" y="550">f — главное · H′ → F′</text>
    <text class="label" x="55" y="578">a′ — сопряжённое · H′ → A′</text>
    <text class="label" x="250" y="550" style="fill:#1677b8">c — снимок · S → матрица</text>
    <text class="small" x="250" y="578">в воздухе N≡H, N′≡H′≡S</text>
  `);

  mountSvg("[data-f02-fov-triangle]", "0 0 560 480", "Прямоугольные треугольники поля зрения", `
    <text class="strong" x="28" y="40">tan ω = (d/2) / f</text>
    <!-- optical axis -->
    <path class="axis" d="M40 240H520"/>
    <!-- sensor plane -->
    <path d="M420 70V410" stroke="#4d8da8" stroke-width="8"/>
    <text class="small" x="432" y="60">кадр</text>
    <!-- apex S -->
    <circle cx="120" cy="240" r="8" fill="#111"/>
    <text class="strong" x="70" y="230">S</text>
    <!-- upper right triangle: S -- f --> sensor mid, up d/2 --> edge --> back to S -->
    <path d="M120 240H420V95Z" fill="#1677b8" fill-opacity=".08" stroke="none"/>
    <path d="M120 240H420V385Z" fill="#c7352c" fill-opacity=".08" stroke="none"/>
    <!-- edge rays -->
    <path d="M120 240L420 95" stroke="#1677b8" stroke-width="4"/>
    <path d="M120 240L420 385" stroke="#c7352c" stroke-width="4"/>
    <!-- right angle marks -->
    <path d="M400 240V220H420" fill="none" stroke="#111" stroke-width="2"/>
    <path d="M400 240V260H420" fill="none" stroke="#111" stroke-width="2"/>
    <!-- f dimension -->
    <path d="M120 430H420" stroke="#111" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="255" y="462">f</text>
    <!-- d dimension on sensor -->
    <path d="M455 95V385" stroke="#111" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="470" y="250">d</text>
    <!-- half d marks -->
    <text class="small" x="430" y="175">d/2</text>
    <text class="small" x="430" y="320">d/2</text>
    <!-- angle arcs at S -->
    <path d="M175 240A55 55 0 0 0 168 198" fill="none" stroke="#1677b8" stroke-width="3"/>
    <path d="M175 240A55 55 0 0 1 168 282" fill="none" stroke="#c7352c" stroke-width="3"/>
    <text class="strong" x="230" y="205" style="fill:#1677b8">ω</text>
    <text class="strong" x="230" y="295" style="fill:#c7352c">ω</text>
    <text class="label" x="28" y="90">полный угол поля = 2ω</text>
  `);

  mountSvg("[data-f02-crop]", "0 0 1280 430", "Кроп-фактор и размер кадрового окна", `
    <rect x="220" y="80" width="420" height="280" fill="#f5f8fa" stroke="#1677b8" stroke-width="7"/>
    <rect x="290" y="127" width="280" height="186" fill="#fff" stroke="#111" stroke-width="5"/>
    <text class="strong" x="85" y="55">Один объектив создаёт один круг изображения</text>
    <circle cx="430" cy="220" r="188" fill="none" stroke="#777" stroke-width="3" stroke-dasharray="10 8"/>
    <text class="strong" x="690" y="105" fill="#1677b8">Кадр 24×36 мм</text>
    <path d="M680 115L610 95" stroke="#1677b8" stroke-width="4"/>
    <text class="strong" x="690" y="185">Меньшая матрица</text>
    <path d="M680 195L570 150" stroke="#111" stroke-width="4"/>
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
    const { label, range, caption } = makeRange(1, 8, 1, 1, "");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    readout.setAttribute("aria-live", "polite");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 560");
    svg.setAttribute("role", "img");
    controls.append(label, readout);
    root.append(controls, svg);

    // Geometry: lens at Lx=640, axis y=320, f=200 → F=440, F'=840
    const Lx = 640;
    const Ay = 320;
    const f = 200;
    const Fx = Lx - f;
    const Fpx = Lx + f;
    // curvature centers for illustration
    const C1x = Lx - 90;
    const C2x = Lx + 90;
    const Rdraw = 250;
    // object tip
    const Ox = 160;
    const Oy = 170;
    // image tip from ray1∩ray2: parallel→F' and through center
    // ray1 after lens: from (Lx, Oy) toward F' then continue; tip at intersection with ray2
    // ray2: line Ox,Oy → Lx,Ay extended
    // For parallel ray: before lens y=Oy, after lens goes through F'
    // Parametrize after lens: (Lx, Oy) to (Fpx, Ay) direction, extend to meet central ray
    // Central ray: (Ox,Oy)-(Lx,Ay), slope = (Ay-Oy)/(Lx-Ox)
    const s2 = (Ay - Oy) / (Lx - Ox);
    // After lens parallel ray slope toward F': (Ay-Oy)/(Fpx-Lx)
    const s1 = (Ay - Oy) / (Fpx - Lx);
    // Line1: y - Oy = s1*(x - Lx)
    // Line2: y - Oy = s2*(x - Ox)  wait central through (Lx,Ay): y - Ay = s2*(x - Lx)
    // Intersection: Oy + s1*(x-Lx) = Ay + s2*(x-Lx)
    // (s1-s2)*(x-Lx) = Ay - Oy
    const Ix = Lx + (Ay - Oy) / (s1 - s2);
    const Iy = Ay + s2 * (Ix - Lx);

    const stages = [
      "Линза и оптическая ось",
      "Радиусы кривизны R₁, R₂",
      "Фокусы F и F′",
      "Радиусы убираем — остаются ось, линза, фокусы",
      "Появляется предмет",
      "1-й луч: параллельно оси → через F′",
      "2-й луч: через оптический центр",
      "3-й луч + изображение в пересечении"
    ];

    const render = () => {
      const stage = Number(range.value);
      caption.textContent = `${stage} / 8`;
      readout.textContent = stages[stage - 1];

      const lens = lensShape(Lx, Ay, 340);
      const axis = `<path class="axis" d="M40 ${Ay}H1240"/>`;
      const radii = `
        <circle cx="${C1x}" cy="${Ay}" r="${Rdraw}" fill="none" stroke="#126a91" stroke-width="2" stroke-dasharray="8 6" opacity=".7"/>
        <circle cx="${C2x}" cy="${Ay}" r="${Rdraw}" fill="none" stroke="#126a91" stroke-width="2" stroke-dasharray="8 6" opacity=".7"/>
        <circle cx="${C1x}" cy="${Ay}" r="6" fill="#126a91"/><circle cx="${C2x}" cy="${Ay}" r="6" fill="#126a91"/>
        <text class="strong" x="${C1x - 18}" y="${Ay - 14}">C₁</text>
        <text class="strong" x="${C2x - 8}" y="${Ay - 14}">C₂</text>
        <path d="M${C1x} ${Ay}L${Lx - 55} ${Ay - 120}" stroke="#126a91" stroke-width="2"/>
        <path d="M${C2x} ${Ay}L${Lx + 55} ${Ay - 120}" stroke="#126a91" stroke-width="2"/>
        <text class="label" x="${(C1x + Lx) / 2 - 40}" y="${Ay - 130}">R₁</text>
        <text class="label" x="${(C2x + Lx) / 2}" y="${Ay - 130}">R₂</text>`;
      const foci = `
        <circle cx="${Fx}" cy="${Ay}" r="8" fill="#111"/><circle cx="${Fpx}" cy="${Ay}" r="8" fill="#111"/>
        <text class="strong" x="${Fx - 18}" y="${Ay - 16}">F</text>
        <text class="strong" x="${Fpx - 12}" y="${Ay - 16}">F′</text>`;
      const object = `
        <path class="object" d="M${Ox} ${Ay}V${Oy}" marker-end="url(#f02-arrow)"/>
        <text class="strong" x="${Ox - 70}" y="${Ay + 36}">предмет</text>`;
      const ray1 = `
        <path class="ray-a" d="M${Ox} ${Oy}H${Lx}L${Ix} ${Iy}"/>
        <text class="label" x="${Ox + 40}" y="${Oy - 16}">∥ оси</text>`;
      const ray2 = `
        <path class="ray-b" d="M${Ox} ${Oy}L${Ix} ${Iy}"/>
        <text class="label" x="${(Ox + Lx) / 2 - 20}" y="${(Oy + Ay) / 2 + 28}">через центр</text>`;
      // 3rd ray: through F, then parallel to axis after lens
      const y3 = Oy + (Ay - Oy) * (Lx - Ox) / (Fx - Ox);
      const ray3 = `
        <path class="ray-c" d="M${Ox} ${Oy}L${Fx} ${Ay}L${Lx} ${y3}H${Ix}"/>
        <text class="label" x="${Lx + 24}" y="${y3 + 28}">после линзы ∥ оси</text>`;
      const image = `
        <path class="image" d="M${Ix} ${Ay}V${Iy}" marker-end="url(#f02-arrow)"/>
        <circle cx="${Ix}" cy="${Iy}" r="8" fill="#c7352c"/>
        <text class="strong" x="${Ix - 40}" y="${Iy + 40}">изображение</text>`;

      const showRadii = stage === 2 || stage === 3;
      const showFoci = stage >= 3;
      const showObject = stage >= 5;
      const showR1 = stage >= 6;
      const showR2 = stage >= 7;
      const showR3 = stage >= 8;
      const showImage = stage >= 8;

      svg.innerHTML = `${defs}
        <rect width="1280" height="560" fill="#fff"/>
        ${axis}
        ${lens}
        ${showRadii ? radii : ""}
        ${showFoci ? foci : ""}
        ${showObject ? object : ""}
        ${showR1 ? ray1 : ""}
        ${showR2 ? ray2 : ""}
        ${showR3 ? ray3 : ""}
        ${showImage ? image : ""}`;
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
      const h = a < 1 ? 70 : 125;
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
      let state;
      if (atFocus) state = "Предмет в передней фокальной плоскости: выходящие лучи параллельны, изображение находится на бесконечности.";
      else if (a < 1) state = "Предмет между линзой и F: изображение мнимое, прямое и увеличенное; оно находится со стороны предмета.";
      else if (Math.abs(a - 2) < .04) state = "Предмет в 2F: изображение действительное, перевёрнутое и того же размера, в 2F′.";
      else if (a < 2) state = "Предмет между F и 2F: изображение действительное, перевёрнутое и увеличенное, дальше 2F′.";
      else state = "Предмет дальше 2F: изображение действительное, перевёрнутое и уменьшенное, между F′ и 2F′.";
      caption.textContent = `Расстояние до предмета: a = ${a.toFixed(2)}f`;
      readout.textContent = `${state}${Number.isFinite(b) ? `  a′ = ${Math.abs(b).toFixed(2)}f, β = ${magnification.toFixed(2)}.` : ""}`;

      const imageVisible = Number.isFinite(xImage) && xImage > 35 && xImage < 1245 && yImage > 25 && yImage < 535;
      const isVirtual = !atFocus && b < 0;
      const backward = isVirtual ? `
        <path class="ray-a virtual" d="M${lensX} ${yObject}L${xImage} ${yImage}"/>
        <path class="ray-b virtual" d="M${lensX} ${axisY}L${xImage} ${yImage}"/>` : "";
      const imageArrow = imageVisible ? `
        <path class="image" d="M${xImage} ${axisY}V${yImage}" marker-end="url(#f02-arrow)"${isVirtual ? ' stroke-dasharray="9 8"' : ""}/>
        <text class="strong" x="${xImage + 14}" y="${Math.max(45, Math.min(520, yImage))}">${isVirtual ? "Мнимое" : "Действительное"} изображение</text>` : "";
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
        ${backward}${imageArrow}${edgeNote}
        <circle cx="${lensX - unit}" cy="${axisY}" r="7" fill="#111"/>
        <circle cx="${lensX + unit}" cy="${axisY}" r="7" fill="#111"/>`;
    };
    range.addEventListener("input", render);
    render();
  });

  document.querySelectorAll("[data-f02-projections]").forEach((root) => {
    root.classList.add("f02-interactive");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    readout.textContent = "Перетащите красные точки. Слева лучи проходят через центр S. Справа лучи остаются параллельными и перпендикулярными плоскости проекций.";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 520");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Сравнение центральной и ортогональной проекций");
    root.append(readout, svg);
    const points = [
      { x: 170, y: 140 },
      { x: 250, y: 280 },
      { x: 150, y: 380 }
    ];
    let active = -1;
    const sPoint = { x: 360, y: 260 };
    const projectCentral = (p) => {
      const planeX = 560;
      const t = (planeX - sPoint.x) / ((p.x - sPoint.x) || 1e-6);
      return { x: planeX, y: sPoint.y + (p.y - sPoint.y) * t };
    };
    const render = () => {
      const centralRays = points.map((p, i) => {
        const q = projectCentral(p);
        return `<path d="M${p.x} ${p.y}L${sPoint.x} ${sPoint.y}L${q.x} ${q.y}" stroke="#1677b8" stroke-width="3" fill="none"/>
          <circle cx="${q.x}" cy="${q.y}" r="5" fill="#c7352c"/>
          <text class="small" x="${q.x + 8}" y="${q.y + 4}">${i + 1}</text>`;
      }).join("");
      const orthoRays = points.map((p, i) => {
        const ox = p.x + 640;
        return `<path d="M${ox} ${p.y}H1160" stroke="#21834f" stroke-width="3"/>
          <circle cx="1160" cy="${p.y}" r="5" fill="#c7352c"/>
          <text class="small" x="1172" y="${p.y + 4}">${i + 1}</text>`;
      }).join("");
      const leftPoly = `<path d="${points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join("")}Z" fill="#e2b56a" fill-opacity=".28" stroke="#111" stroke-width="3"/>`;
      const rightPoly = `<path d="${points.map((p, i) => `${i ? "L" : "M"}${p.x + 640} ${p.y}`).join("")}Z" fill="#e2b56a" fill-opacity=".28" stroke="#111" stroke-width="3"/>`;
      svg.innerHTML = `${defs}
        <rect width="1280" height="520" fill="#fff"/>
        <rect x="18" y="18" width="604" height="484" rx="14" class="panel"/>
        <rect x="658" y="18" width="604" height="484" rx="14" class="panel"/>
        <text class="strong" x="42" y="58">Центральная проекция</text>
        <text class="strong" x="682" y="58">Ортогональная проекция</text>
        <path d="M560 70V450" stroke="#111" stroke-width="5"/>
        <path d="M1160 70V450" stroke="#111" stroke-width="5"/>
        <circle data-point="S" cx="${sPoint.x}" cy="${sPoint.y}" r="10" fill="#111" style="cursor:grab"/>
        <text class="strong" x="${sPoint.x - 30}" y="${sPoint.y - 14}">S</text>
        <text class="small" x="500" y="490">плоскость проекций π · точки 1–3 и S можно двигать</text>
        <text class="small" x="980" y="490">лучи ⊥ плоскости проекций</text>
        ${centralRays}${orthoRays}${leftPoly}${rightPoly}
        ${points.map((p, i) => `<circle data-point="${i}" cx="${p.x}" cy="${p.y}" r="8" fill="#c7352c" stroke="#fff" stroke-width="3" style="cursor:grab"/><text class="small" x="${p.x + 10}" y="${p.y - 8}">${i + 1}</text>`).join("")}`;
    };
    const localPoint = (event) => {
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    svg.addEventListener("pointerdown", (event) => {
      const point = event.target.closest("[data-point]");
      if (!point) return;
      active = point.dataset.point === "S" ? "S" : Number(point.dataset.point);
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove", (event) => {
      if (active === -1) return;
      const p = localPoint(event);
      if (active === "S") {
        sPoint.x = Math.max(320, Math.min(420, p.x));
        sPoint.y = Math.max(120, Math.min(400, p.y));
      } else {
        points[active].x = Math.max(70, Math.min(300, p.x));
        points[active].y = Math.max(90, Math.min(430, p.y));
      }
      render();
    });
    svg.addEventListener("pointerup", () => { active = -1; });
    render();
  });

  document.querySelectorAll("[data-f02-projections-3d]").forEach((root) => {
    root.classList.add("f02-interactive");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    readout.textContent = "Зелёный квадрат лежит на местности под снимком. Слева — центральная проекция (красный квадрат меньше). Справа — ортогональная (красный = зелёному). Перетащите S.";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 560");
    root.append(readout, svg);

    const leftOx = 300;
    const rightOx = 940;
    const photoH = 150;
    const iso = (x, y, z, ox) => ({
      x: ox + x * 0.9 - z * 0.9,
      y: 360 - y * 0.95 - z * 0.45
    });

    // Квадрат на местности (y = 0), строго под плоскостью снимка
    const half = 65;
    const z0 = 35;
    const ground = [
      { x: -half, z: z0 },
      { x: half, z: z0 },
      { x: half, z: z0 + 2 * half },
      { x: -half, z: z0 + 2 * half }
    ];
    let S = { x: 0, y: 230, z: z0 + half };
    let dragging = false;

    const projectCentral = (gx, gz) => {
      // Луч местность → S пересекает горизонтальный снимок y = photoH
      const t = photoH / S.y;
      return {
        x: gx * (1 - t) + S.x * t,
        y: photoH,
        z: gz * (1 - t) + S.z * t
      };
    };

    const poly = (pts, ox, yOf) => pts.map((p, i) => {
      const q = iso(p.x, yOf(p), p.z, ox);
      return `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    }).join("") + "Z";

    const render = () => {
      const frame = [
        { x: -100, z: 10 }, { x: 100, z: 10 }, { x: 100, z: 190 }, { x: -100, z: 190 }
      ];
      const central = ground.map((p) => projectCentral(p.x, p.z));
      const Sscr = iso(S.x, S.y, S.z, leftOx);

      const rays = ground.map((p) => {
        const P = iso(p.x, 0, p.z, leftOx);
        const Q = projectCentral(p.x, p.z);
        const Qs = iso(Q.x, Q.y, Q.z, leftOx);
        return `<path d="M${P.x.toFixed(1)} ${P.y.toFixed(1)} L${Sscr.x.toFixed(1)} ${Sscr.y.toFixed(1)}" stroke="#1677b8" stroke-width="2" fill="none"/>
          <circle cx="${Qs.x.toFixed(1)}" cy="${Qs.y.toFixed(1)}" r="3.5" fill="#c7352c"/>`;
      }).join("");

      const orthoRays = ground.map((p) => {
        const P = iso(p.x, 0, p.z, rightOx);
        const Q = iso(p.x, photoH, p.z, rightOx);
        return `<path d="M${P.x.toFixed(1)} ${P.y.toFixed(1)} L${Q.x.toFixed(1)} ${Q.y.toFixed(1)}" stroke="#21834f" stroke-width="2"/>`;
      }).join("");

      svg.innerHTML = `${defs}<rect width="1280" height="560" fill="#fff"/>
        <rect x="18" y="18" width="620" height="524" rx="14" class="panel"/>
        <rect x="658" y="18" width="604" height="524" rx="14" class="panel"/>
        <text class="strong" x="42" y="52">Центральная проекция</text>
        <text class="strong" x="682" y="52">Ортогональная проекция</text>
        <path d="${poly(frame, leftOx, () => photoH)}" fill="#e8f2f8" stroke="#111" stroke-width="2"/>
        <path d="${poly(frame, rightOx, () => photoH)}" fill="#e8f2f8" stroke="#111" stroke-width="2"/>
        <path d="${poly(ground, leftOx, () => 0)}" fill="#c8e6c0" stroke="#21834f" stroke-width="3"/>
        <path d="${poly(ground, rightOx, () => 0)}" fill="#c8e6c0" stroke="#21834f" stroke-width="3"/>
        ${rays}${orthoRays}
        <path d="${poly(central, leftOx, (p) => p.y)}" fill="#c7352c" fill-opacity=".45" stroke="#c7352c" stroke-width="3"/>
        <path d="${poly(ground, rightOx, () => photoH)}" fill="#c7352c" fill-opacity=".45" stroke="#c7352c" stroke-width="3"/>
        <circle data-s="1" cx="${Sscr.x.toFixed(1)}" cy="${Sscr.y.toFixed(1)}" r="13" fill="#111" style="cursor:grab"/>
        <text class="strong" x="${(Sscr.x - 16).toFixed(1)}" y="${(Sscr.y - 18).toFixed(1)}">S</text>
        <text class="small" x="40" y="502">зелёный — квадрат на местности (под снимком)</text>
        <text class="small" x="40" y="528">красный слева — уменьшенное изображение на снимке · тяните S</text>
        <text class="small" x="680" y="520">красный справа — тот же квадрат (ортогональ не меняет размер)</text>`;
    };

    const localPoint = (event) => {
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    // Обратная изометрия при фиксированной высоте y: из экранных (sx,sy) → (x,z)
    const fromIsoAtY = (sx, sy, y, ox) => {
      const u = sx - ox;
      const v = 360 - sy - y * 0.95;
      // u = 0.9x - 0.9z; v = 0.45z  →  z = v/0.45; x = u/0.9 + z
      const z = v / 0.45;
      const x = u / 0.9 + z;
      return { x, z };
    };

    svg.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("[data-s]")) return;
      dragging = true;
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const p = localPoint(event);
      // Вертикаль экрана задаёт высоту S; горизонталь — положение в плане
      S.y = Math.max(photoH + 40, Math.min(300, (360 - p.y - S.z * 0.45) / 0.95));
      const plan = fromIsoAtY(p.x, p.y, S.y, leftOx);
      S.x = Math.max(-95, Math.min(95, plan.x));
      S.z = Math.max(20, Math.min(180, plan.z));
      // Пересчёт y после уточнения z, чтобы S оставался под курсором
      S.y = Math.max(photoH + 40, Math.min(300, (360 - p.y - S.z * 0.45) / 0.95));
      render();
    });
    svg.addEventListener("pointerup", () => { dragging = false; });
    svg.addEventListener("pointercancel", () => { dragging = false; });
    render();
  });

  document.querySelectorAll("[data-f02-camera-geometry]").forEach((root) => {
    root.classList.add("f02-interactive");
    const formats = [
      { name: "FF 24×36", lx: 36, label: "Full Frame" },
      { name: "APS-C 1,5×", lx: 23.5, label: "APS-C (Nikon/Sony)" },
      { name: "APS-C 1,6×", lx: 22.3, label: "APS-C (Canon)" },
      { name: "4/3", lx: 17.3, label: "Micro Four Thirds" },
      { name: '1"', lx: 13.2, label: "1 дюйм" },
      { name: '1/2,3"', lx: 6.17, label: "1/2,3 дюйма" }
    ];
    const controls = document.createElement("div");
    controls.className = "f02-controls f02-format-controls";
    const chipRow = document.createElement("div");
    chipRow.className = "f02-chip-row";
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 500");
    controls.append(chipRow, readout);
    root.append(controls, svg);
    const fFF = 50;
    const lxFF = 36;
    const beta = 2 * Math.atan((lxFF / 2) / fFF);
    let selected = 0;
    formats.forEach((format, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "f02-chip";
      button.textContent = format.name;
      button.addEventListener("click", () => {
        selected = index;
        render();
      });
      button.dataset.index = String(index);
      chipRow.append(button);
    });
    const render = () => {
      chipRow.querySelectorAll("button").forEach((button, index) => {
        button.classList.toggle("is-active", index === selected);
      });
      const format = formats[selected];
      const lx = format.lx;
      const f = lx / (2 * Math.tan(beta / 2));
      const crop = lxFF / lx;
      const betaDeg = (beta * 180) / Math.PI;
      readout.innerHTML = `${format.label}: l<sub>x</sub> = <strong>${lx.toFixed(2)} мм</strong> · f = <strong>${f.toFixed(1)} мм</strong> · β = <strong>${betaDeg.toFixed(1)}°</strong> · кроп ≈ <strong>${crop.toFixed(2)}</strong>`;
      const Sx = 480;
      const scale = 8.2;
      const sensorX = Sx + f * scale;
      const half = (lx / 2) * scale;
      const tip = 70;
      svg.innerHTML = `${defs}<rect width="1280" height="500" fill="#fff"/>
        <path class="axis" d="M40 250H1240"/>
        <circle cx="${Sx}" cy="250" r="11" fill="#111"/>
        <path class="lens" d="M${Sx} 110q-60 140 0 280q60-140 0-280z"/>
        <path d="M${sensorX} ${250 - half}V${250 + half}" stroke="#4d8da8" stroke-width="12"/>
        <path class="ray-a" d="M${tip} ${250 - Math.tan(beta / 2) * (Sx - tip)}L${Sx} 250L${sensorX} ${250 + half}"/>
        <path class="ray-a" d="M${tip} ${250 + Math.tan(beta / 2) * (Sx - tip)}L${Sx} 250L${sensorX} ${250 - half}"/>
        <path d="M${Sx} 420H${sensorX}" stroke="#111" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
        <text class="strong" x="${Sx - 30}" y="228">S</text>
        <text class="strong" x="${Sx + 18}" y="238">β</text>
        <text class="strong" x="${(Sx + sensorX) / 2 - 40}" y="455">f = ${f.toFixed(1)} мм</text>
        <text class="label" x="${sensorX + 16}" y="255">lₓ = ${lx.toFixed(2)} мм</text>
        <text class="label" x="40" y="40">При FF: f = 50 мм. Угол β сохраняется при смене формата.</text>`;
    };
    render();
  });

  document.querySelectorAll("[data-f02-dof-rays]").forEach((root) => {
    root.classList.add("f02-interactive");
    const stops = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
    const controls = document.createElement("div");
    controls.className = "f02-controls";
    const { label, range, caption } = makeRange(0, stops.length - 1, 1, 3, "");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 520");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    controls.append(label, readout);
    root.append(controls, svg);
    const rayY = (x1, y1, x2, y2, x) => y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
    const render = () => {
      const n = stops[Number(range.value)];
      const aperture = Math.max(14, 58 / Math.sqrt(n / 1.4));
      caption.textContent = `Диафрагменное число n₀ = ${String(n).replace(".", ",")}`;
      readout.textContent = "Резкими отображаются только объекты в плоскости фокусировки. Остальные отображаются кружком нерезкости; если он мал — изображение кажется резким.";
      const lensX = 700;
      const sensorX = 1020;
      const axisY = 260;
      // Все точки на оси: без «зеркального» разноса вверх/вниз. Кружки на матрице слегка разводят по вертикали только для читаемости.
      const objects = [
        { x: 120, y: axisY, label: "Дальняя", color: "#1677b8", imgX: sensorX - 140, imgY: axisY, showY: axisY + 55 },
        { x: 300, y: axisY, label: "Фокус", color: "#21834f", imgX: sensorX, imgY: axisY, showY: axisY },
        { x: 470, y: axisY, label: "Ближняя", color: "#c7352c", imgX: sensorX + 150, imgY: axisY, showY: axisY - 55 }
      ];
      const rays = objects.map((o, idx) => {
        const topLens = axisY - aperture;
        const botLens = axisY + aperture;
        const yTopAtSensor = rayY(lensX, topLens, o.imgX, o.imgY, sensorX);
        const yBotAtSensor = rayY(lensX, botLens, o.imgX, o.imgY, sensorX);
        let afterTop;
        let afterBot;
        let virtual = "";
        if (o.imgX > sensorX) {
          afterTop = `L${sensorX} ${yTopAtSensor}`;
          afterBot = `L${sensorX} ${yBotAtSensor}`;
          virtual = `<path d="M${lensX} ${topLens}L${o.imgX} ${o.imgY}M${lensX} ${botLens}L${o.imgX} ${o.imgY}" fill="none" stroke="${o.color}" stroke-width="2.5" stroke-dasharray="10 8" opacity=".75"/>
            <circle cx="${o.imgX}" cy="${o.imgY}" r="6" fill="${o.color}" fill-opacity=".25" stroke="${o.color}" stroke-width="2"/>`;
        } else if (o.imgX < sensorX) {
          afterTop = `L${o.imgX} ${o.imgY}L${sensorX} ${yTopAtSensor}`;
          afterBot = `L${o.imgX} ${o.imgY}L${sensorX} ${yBotAtSensor}`;
          virtual = `<circle cx="${o.imgX}" cy="${o.imgY}" r="6" fill="${o.color}" fill-opacity=".25" stroke="${o.color}" stroke-width="2"/>`;
        } else {
          afterTop = `L${sensorX} ${axisY}`;
          afterBot = `L${sensorX} ${axisY}`;
        }
        const labelY = 205;
        return `<circle cx="${o.x}" cy="${o.y}" r="11" fill="${o.color}" stroke="#111" stroke-width="1"/>
          <text class="strong" x="${o.x}" y="${labelY}" text-anchor="middle" style="fill:${o.color}">${o.label}</text>
          <path d="M${o.x} ${o.y}L${lensX} ${topLens}${afterTop}" fill="none" stroke="${o.color}" stroke-width="3.5"/>
          <path d="M${o.x} ${o.y}L${lensX} ${botLens}${afterBot}" fill="none" stroke="${o.color}" stroke-width="3.5"/>
          ${virtual}`;
      }).join("");
      svg.innerHTML = `${defs}<rect width="1280" height="520" fill="#fff"/><path class="axis" d="M30 260H1250"/>
        ${rays}${lensShape(lensX, axisY, 380)}
        <path d="M${lensX - 30} 40V${axisY - aperture}M${lensX - 30} ${axisY + aperture}V480" stroke="#111" stroke-width="14"/>
        <rect x="${sensorX}" y="55" width="14" height="410" fill="#4d8da8"/>
        <text class="strong" x="650" y="36">Диафрагма</text>
        <text class="strong" x="${sensorX + 24}" y="78">Матрица</text>
        <text class="label" x="40" y="500">Кружки нерезкости на матрице — на следующем слайде</text>`;
    };
    range.addEventListener("input", render);
    render();
  });

  mountSvg("[data-f02-macro]", "0 0 700 520", "Обычная и макросъёмка", `
    <text class="strong" x="30" y="45">Обычная съёмка: a большое, a′ ≈ f</text>
    <path class="axis" d="M25 150H675"/>${lensShape(390, 150, 160)}
    <path class="object" d="M55 150V75" marker-end="url(#f02-arrow)"/><rect x="555" y="75" width="10" height="150" fill="#4d8da8"/>
    <path class="ray-a" d="M55 75L390 150L555 187M55 75H390L555 187"/>
    <text class="strong" x="30" y="300">Макросъёмка: предмет ближе, a′ больше</text>
    <path class="axis" d="M25 410H675"/>${lensShape(310, 410, 160)}
    <path class="object" d="M115 410V330" marker-end="url(#f02-arrow)"/><rect x="600" y="320" width="10" height="180" fill="#4d8da8"/>
    <path class="ray-a" d="M115 330L310 410L600 492M115 330H310L600 492"/>
    <path d="M390 485H600" stroke="#c7352c" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="small" x="435" y="475">объектив удалён от матрицы</text>`);

  mountSvg("[data-f02-extension]", "0 0 720 480", "Удлинительное кольцо", `
    <text class="strong" x="30" y="40">Без кольца: фокус на ∞, a′ ≈ f</text>
    <path class="axis" d="M30 150H690"/>${lensShape(320, 150, 140)}
    <rect x="470" y="70" width="12" height="160" fill="#4d8da8"/>
    <path class="ray-a" d="M50 80H320L476 190"/>
    <text class="small" x="480" y="60">матрица</text>
    <path d="M320 230H470" stroke="#111" stroke-width="2" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="small" x="360" y="250">≈ f</text>

    <text class="strong" x="30" y="300">С кольцом: объектив отодвинут, a′ = f(1 + m)</text>
    <path class="axis" d="M30 400H690"/>${lensShape(280, 400, 140)}
    <rect x="430" y="330" width="55" height="140" fill="#eee" stroke="#111" stroke-width="3"/>
    <text class="small" x="435" y="320">кольцо</text>
    <rect x="520" y="310" width="12" height="180" fill="#4d8da8"/>
    <path class="ray-a" d="M90 340H280L526 470"/>
    <path d="M280 470H520" stroke="#c7352c" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="small" x="350" y="465">a′ больше</text>
  `);

  mountSvg("[data-f02-coc-three]", "0 0 1100 420", "Три кружка нерезкости на матрице", `
    <rect x="40" y="40" width="14" height="340" fill="#4d8da8"/>
    <text class="strong" x="70" y="60">Матрица</text>
    <g transform="translate(200 120)">
      <circle cx="80" cy="90" r="8" fill="#21834f" fill-opacity=".9" stroke="#21834f" stroke-width="3"/>
      <text class="strong" x="160" y="70" style="fill:#21834f">Плоскость наводки</text>
      <text class="label" x="160" y="100">кружок ≈ точка</text>
    </g>
    <g transform="translate(200 20)">
      <circle cx="80" cy="90" r="34" fill="#c7352c" fill-opacity=".28" stroke="#c7352c" stroke-width="3"/>
      <text class="strong" x="160" y="70" style="fill:#c7352c">Ближе плоскости наводки</text>
      <text class="label" x="160" y="100">большой кружок нерезкости</text>
    </g>
    <g transform="translate(200 240)">
      <circle cx="80" cy="90" r="26" fill="#1677b8" fill-opacity=".28" stroke="#1677b8" stroke-width="3"/>
      <text class="strong" x="160" y="70" style="fill:#1677b8">Дальше плоскости наводки</text>
      <text class="label" x="160" y="100">кружок; если ≤ c — кажется резким</text>
    </g>
    <text class="label" x="40" y="400">Допустимый кружок нерезкости c задаёт порог: всё, что меньше c, считают резким.</text>
  `);

  mountSvg("[data-f02-f-lens]", "0 0 1280 420", "Фокусное расстояние объектива", `
    <path class="axis" d="M40 220H1240"/>
    <path class="lens" d="M520 60q-90 160 0 320q90-160 0-320z"/>
    <circle cx="560" cy="220" r="8" fill="#111"/><text class="strong" x="548" y="200">N′</text>
    <text class="small" x="500" y="380">задняя узловая точка</text>
    <path class="ray-a" d="M40 100H520L820 220M40 160H520L820 220M40 220H820M40 280H520L820 220M40 340H520L820 220"/>
    <circle cx="820" cy="220" r="9" fill="#c7352c"/><text class="strong" x="805" y="198">F′</text>
    <path d="M560 300H820" stroke="#111" stroke-width="3" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="650" y="330">f объектива</text>
    <path d="M820 80V360" stroke="#777" stroke-width="2" stroke-dasharray="8 6"/>
    <text class="label" x="830" y="100">фокальная плоскость</text>
    <text class="label" x="40" y="400">Параллельные лучи после объектива сходятся в F′. Расстояние N′F′ = f — характеристика объектива.</text>
  `);

  mountSvg("[data-f02-f-camera]", "0 0 1280 420", "Фокусное расстояние камеры в фотограмметрии", `
    <path class="axis" d="M40 220H1240"/>
    <path class="lens" d="M480 70q-80 150 0 300q80-150 0-300z"/>
    <circle cx="520" cy="220" r="8" fill="#111"/><text class="strong" x="500" y="198">S ≡ N′</text>
    <text class="small" x="430" y="380">центр проекции</text>
    <rect x="900" y="70" width="14" height="300" fill="#4d8da8"/>
    <text class="strong" x="930" y="100">плоскость снимка</text>
    <text class="small" x="930" y="125">(матрица)</text>
    <path class="ray-b" d="M80 100L520 220L907 120M80 220H907M80 340L520 220L907 320"/>
    <path d="M520 300H900" stroke="#c7352c" stroke-width="4" marker-start="url(#f02-arrow)" marker-end="url(#f02-arrow)"/>
    <text class="strong" x="640" y="340">f камеры ≈ c</text>
    <circle cx="907" cy="220" r="7" fill="#c7352c"/><text class="strong" x="920" y="215">главная точка (cₓ, cᵧ)</text>
    <text class="label" x="40" y="400">В фотограмметрии берут расстояние от S до плоскости снимка. Оно уточняется калибровкой вместе с cₓ, cᵧ.</text>
  `);

  mountSvg("[data-f02-mtf]", "0 0 620 480", "Мира и MTF", `
    <text class="strong" x="30" y="40">Мира (фрагмент)</text>
    ${[0,1,2,3,4].map((i) => {
      const x = 40 + i * 70;
      const w = 28 - i * 4;
      return `<g transform="translate(${x} 60)">${[0,1,2,3,4,5].map((k) => `<rect x="${k * (w + 2)}" y="0" width="${w}" height="90" fill="${k % 2 ? "#111" : "#fff"}" stroke="#111"/>`).join("")}</g>`;
    }).join("")}
    <text class="small" x="30" y="175">частота штрихов растёт →</text>
    <text class="strong" x="30" y="220">MTF: контраст от частоты</text>
    <path d="M60 420H560M60 420V250" stroke="#111" stroke-width="3"/>
    <path d="M60 260C160 270 280 340 400 390C480 410 540 415 560 418" fill="none" stroke="#1677b8" stroke-width="4"/>
    <text class="small" x="500" y="445">частота, лин/мм</text>
    <text class="small" x="10" y="300" transform="rotate(-90 10 300)">контраст</text>
    <text class="label" x="30" y="470">Чем выше кривая — тем лучше передача деталей.</text>
  `);

  mountSvg("[data-f02-autofocus]", "0 0 1280 320", "Схемы контрастной и фазовой АФ", `
    <g transform="translate(20 10)">
      <rect class="panel" width="600" height="300" rx="12"/>
      <text class="strong" x="24" y="40">Контрастная: поиск максимума</text>
      <path class="axis" d="M40 150H300"/>${lensShape(170, 150, 120)}
      <rect x="300" y="80" width="10" height="140" fill="#4d8da8"/>
      <path class="ray-a" d="M50 95H170L305 130M50 95L170 150L305 170"/>
      <path d="M360 80H560M360 240H560" stroke="#111" stroke-width="2"/>
      <path d="M380 230C420 100 500 100 540 80" fill="none" stroke="#21834f" stroke-width="4"/>
      <circle cx="500" cy="95" r="7" fill="#21834f"/>
      <text class="small" x="370" y="270">контраст ↑ в точке фокуса</text>
    </g>
    <g transform="translate(660 10)">
      <rect class="panel" width="600" height="300" rx="12"/>
      <text class="strong" x="24" y="40">Фазовая: два изображения</text>
      <path class="axis" d="M40 150H260"/>${lensShape(150, 150, 110)}
      <path d="M260 90H310V210H260" fill="#eee" stroke="#111" stroke-width="3"/>
      <path class="ray-b" d="M50 100L150 150L300 115"/>
      <path class="ray-a" d="M50 200L150 150L300 185"/>
      <circle cx="300" cy="115" r="6" fill="#1677b8"/>
      <circle cx="300" cy="185" r="6" fill="#c7352c"/>
      <path d="M360 100V200M480 100V200" stroke="#21834f" stroke-width="4"/>
      <text class="small" x="360" y="250">сдвиг → куда и насколько двигать</text>
    </g>
  `);

  document.querySelectorAll("[data-f02-focus-practice]").forEach((root) => {
    root.classList.add("f02-interactive");
    const controls = document.createElement("div");
    controls.className = "f02-controls";
    const { label, range, caption } = makeRange(-90, 90, 1, 45, "");
    const readout = document.createElement("p");
    readout.className = "f02-readout";
    const modes = document.createElement("div");
    modes.className = "f02-focus-legend";
    modes.innerHTML = `
      <div><strong>Ручная</strong><span>оператор оценивает резкость</span></div>
      <div><strong>Контрастная</strong><span>ищет максимум контраста</span></div>
      <div><strong>Фазовая</strong><span>оценивает знак и величину ошибки</span></div>`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1280 360");
    controls.append(label, readout);
    root.append(controls, svg, modes);
    const render = () => {
      const offset = Number(range.value);
      const blur = Math.max(3, Math.abs(offset) * 0.42);
      caption.textContent = `Смещение фокусирующей группы: ${offset > 0 ? "+" : ""}${offset} усл. ед.`;
      readout.textContent = Math.abs(offset) < 5
        ? "Изображение сфокусировано: кружок нерезкости минимален."
        : "Изображение расфокусировано: переместите группу к положению нулевой ошибки.";
      svg.innerHTML = `${defs}<rect width="1280" height="360" fill="#fff"/><path class="axis" d="M35 190H1240"/>
        <path class="object" d="M80 190V60" marker-end="url(#f02-arrow)"/>
        ${lensShape(580 + offset, 190, 260)}<rect x="1080" y="40" width="14" height="300" fill="#4d8da8"/>
        <path class="ray-a" d="M80 60H${580 + offset}L1080 ${190 - blur}M80 60L${580 + offset} 190L1080 ${190 + blur}"/>
        <circle cx="1087" cy="190" r="${blur}" fill="#c7352c" fill-opacity=".32"/>`;
    };
    range.addEventListener("input", render);
    render();
  });

  mountSvg("[data-f02-chromatic]", "0 0 760 490", "Продольная хроматическая аберрация и цветные кружки", `
    <path class="axis" d="M25 245H735"/><path d="M25 125H330M25 180H330M25 310H330M25 365H330" stroke="#111" stroke-width="4"/>
    ${lensShape(350, 245, 340)}
    <path d="M350 125L515 245M350 365L515 245" stroke="#1677b8" stroke-width="4"/>
    <path d="M350 125L585 245M350 365L585 245" stroke="#21834f" stroke-width="4"/>
    <path d="M350 125L650 245M350 365L650 245" stroke="#c7352c" stroke-width="4"/>
    <rect x="605" y="80" width="10" height="330" fill="#4d8da8"/>
    <g transform="translate(665 95)"><circle cx="35" cy="45" r="34" fill="#c7352c" fill-opacity=".35"/><circle cx="35" cy="45" r="24" fill="#21834f" fill-opacity=".4"/><circle cx="35" cy="45" r="14" fill="#1677b8" fill-opacity=".65"/>
      <circle cx="35" cy="145" r="34" fill="#1677b8" fill-opacity=".35"/><circle cx="35" cy="145" r="24" fill="#21834f" fill-opacity=".4"/><circle cx="35" cy="145" r="14" fill="#c7352c" fill-opacity=".65"/></g>
    <text class="small" x="20" y="45">Белый свет</text><text class="small" x="425" y="45">Спектральные пучки</text><text class="small" x="640" y="455">Цветные кружки</text>`);

  mountSvg("[data-f02-distortion-vectors]", "0 0 640 520", "Поправки дисторсии по полю кадра", (() => {
    const cx = 320;
    const cy = 270;
    const halfW = 220;
    const halfH = 160;
    const pts = [];
    for (let iy = -2; iy <= 2; iy += 1) {
      for (let ix = -3; ix <= 3; ix += 1) {
        const x = cx + ix * (halfW / 3);
        const y = cy + iy * (halfH / 2);
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.hypot(dx, dy);
        if (r < 8) continue;
        const scale = 0.12 + r * 0.00055;
        pts.push({ x, y, vx: dx * scale, vy: dy * scale });
      }
    }
    const arrows = pts.map((p) => {
      const x2 = p.x + p.vx;
      const y2 = p.y + p.vy;
      return `<path d="M${p.x} ${p.y}L${x2} ${y2}" stroke="#c7352c" stroke-width="3" marker-end="url(#f02-arrow)"/>
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#1677b8"/>`;
    }).join("");
    return `
    <text class="strong" x="30" y="40">Поправка в каждой точке своя</text>
    <rect x="${cx - halfW}" y="${cy - halfH}" width="${halfW * 2}" height="${halfH * 2}" fill="#f7f7f7" stroke="#111" stroke-width="4"/>
    <path class="guide" d="M${cx - halfW} ${cy}H${cx + halfW}M${cx} ${cy - halfH}V${cy + halfH}"/>
    ${arrows}
    <text class="small" x="30" y="480">Стрелки — векторы поправки (растут к краям кадра)</text>`;
  })());

  mountSvg("[data-f02-distortion-sources]", "0 0 680 520", "Децентрировка линз и перекос матрицы", `
    <path class="axis" d="M35 170H645"/><path class="lens" d="M250 55q-70 115 0 230q70-115 0-230z"/>
    <path class="lens" d="M430 85q-65 115 0 230q65-115 0-230z" transform="rotate(8 430 200)"/>
    <path d="M430 65V335" stroke="#c7352c" stroke-width="3" stroke-dasharray="8 6"/><text class="strong" x="25" y="35">Децентрировка и наклон линзы</text>
    <path class="axis" d="M35 420H645"/><path class="lens" d="M270 330q-60 90 0 180q60-90 0-180z"/>
    <rect x="535" y="325" width="12" height="190" fill="#4d8da8" transform="rotate(8 541 420)"/>
    <path class="ray-a" d="M35 350L270 420L540 475M35 490L270 420L540 365"/>
    <text class="strong" x="25" y="305">Перекос матрицы</text>`);

  mountSvg("[data-f02-distortion-model]", "0 0 620 520", "Радиальная и тангенциальная дисторсия", (() => {
    const radial = [];
    for (let i = -2; i <= 2; i += 1) {
      for (let j = -2; j <= 2; j += 1) {
        if (i === 0 && j === 0) continue;
        const x = 155 + i * 40;
        const y = 175 + j * 40;
        const dx = i * 8;
        const dy = j * 8;
        radial.push(`<circle cx="${x}" cy="${y}" r="3.5" fill="#1677b8"/><path d="M${x} ${y}L${x + dx} ${y + dy}" stroke="#1677b8" stroke-width="2.5" marker-end="url(#f02-arrow)"/>`);
      }
    }
    const tang = [];
    for (let i = -2; i <= 2; i += 1) {
      for (let j = -2; j <= 2; j += 1) {
        if (i === 0 && j === 0) continue;
        const x = 465 + i * 40;
        const y = 175 + j * 40;
        // тангенциальный сдвиг: перпендикуляр к радиусу + малый радиальный
        const tx = -j * 7 + i * 2;
        const ty = i * 7 + j * 2;
        tang.push(`<circle cx="${x}" cy="${y}" r="3.5" fill="#c7352c"/><path d="M${x} ${y}L${x + tx} ${y + ty}" stroke="#c7352c" stroke-width="2.5" marker-end="url(#f02-arrow)"/>`);
      }
    }
    return `
    <rect x="30" y="50" width="250" height="250" fill="#f8f8f8" stroke="#111" stroke-width="3"/>
    <path class="guide" d="M155 55V295M35 175H275"/>
    ${radial.join("")}
    <text class="strong" x="30" y="35">Радиальная</text>
    <text class="small" x="40" y="325">векторы вдоль радиуса от центра</text>
    <rect x="340" y="50" width="250" height="250" fill="#f8f8f8" stroke="#111" stroke-width="3"/>
    <path class="guide" d="M465 55V295M345 175H585"/>
    ${tang.join("")}
    <text class="strong" x="340" y="35">Тангенциальная</text>
    <text class="small" x="350" y="325">векторы с поворотом (децентрировка)</text>
    <text class="label" x="30" y="380">Общая модель: измеренные координаты = идеальные · L(r) + тангенциальная поправка.</text>
    <text class="strong" x="30" y="430">x′ = x · L(r) + Δxₜ</text>
    <text class="strong" x="30" y="470">y′ = y · L(r) + Δyₜ</text>
    <text class="small" x="30" y="505">где L(r) = 1 + k₁r² + k₂r⁴ + k₃r⁶</text>`;
  })());

  mountSvg("[data-f02-calibration]", "0 0 1280 265", "Четыре метода калибровки камеры", `
    <g transform="translate(20 15)"><rect class="panel" width="290" height="230" rx="12"/><path class="ray-b" d="M25 70h130M25 110h130M25 150h130"/>${lensShape(175, 110, 130)}<rect x="250" y="40" width="8" height="145" fill="#4d8da8"/><text class="small" x="45" y="215">Коллиматор</text></g>
    <g transform="translate(335 15)"><rect class="panel" width="290" height="230" rx="12"/><path d="M25 35H180V190H25Z" fill="#eee" stroke="#111" stroke-width="3"/><g fill="#111">${[55, 95, 135, 175].map((y) => [55, 95, 135].map((x) => `<circle cx="${x}" cy="${y}" r="5"/>`).join("")).join("")}</g><path class="ray-a" d="M190 75L255 115M190 155L255 115"/><text class="small" x="65" y="215">Плоское поле</text></g>
    <g transform="translate(650 15)"><rect class="panel" width="290" height="230" rx="12"/><g fill="#1677b8"><circle cx="45" cy="70" r="8"/><circle cx="120" cy="45" r="8"/><circle cx="95" cy="140" r="8"/><circle cx="175" cy="100" r="8"/></g><path class="ray-a" d="M45 70L255 120M120 45L255 120M95 140L255 120M175 100L255 120"/><text class="small" x="35" y="215">Пространственное поле</text></g>
    <g transform="translate(965 15)"><rect class="panel" width="290" height="230" rx="12"/><path d="M30 155L110 60L190 145L260 55" fill="none" stroke="#111" stroke-width="4"/><circle cx="30" cy="155" r="8"/><circle cx="110" cy="60" r="8"/><circle cx="190" cy="145" r="8"/><circle cx="260" cy="55" r="8"/><text class="small" x="65" y="215">Самокалибровка блока</text></g>`);

  mountSvg("[data-f02-calibration-pipeline]", "0 0 1280 260", "Последовательность калибровки и внесения поправок", `
    ${["Измерение координат", "Оценка параметров", "Поправки координат", "Остаточные ошибки", "Контроль точности"].map((text, i) => `
      <g transform="translate(${20 + i * 252} 55)"><rect width="210" height="120" rx="14" fill="${i === 4 ? "#e9f6ee" : "#f5f5f5"}" stroke="#111" stroke-width="3"/><text class="strong" x="105" y="55" text-anchor="middle">${text.split(" ")[0]}</text><text class="label" x="105" y="88" text-anchor="middle">${text.split(" ").slice(1).join(" ")}</text></g>
      ${i < 4 ? `<path d="M${230 + i * 252} 115H${265 + i * 252}" stroke="#1677b8" stroke-width="5" marker-end="url(#f02-arrow)"/>` : ""}`).join("")}
    <text class="label" x="25" y="225">Поправки применяют к исходным измерениям до фотограмметрического пересечения лучей.</text>`);
})();
