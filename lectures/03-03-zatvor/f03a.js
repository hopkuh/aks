(() => {
  const defs = `
    <defs>
      <marker id="f03a-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10Z" fill="context-stroke"/>
      </marker>
      <style>
        .label{font:20px 'Segoe UI',sans-serif;fill:#111}
        .small{font:16px 'Segoe UI',sans-serif;fill:#333}
        .strong{font:700 22px 'Segoe UI',sans-serif;fill:#111}
        .axis{stroke:#555;stroke-width:2}
        .ideal{fill:#1677b8;fill-opacity:.22;stroke:#1677b8;stroke-width:3}
        .real{fill:#c7352c;fill-opacity:.18;stroke:#c7352c;stroke-width:3}
      </style>
    </defs>`;

  const mount = (selector, viewBox, label, content) => {
    document.querySelectorAll(selector).forEach((root) => {
      root.innerHTML = `<svg viewBox="${viewBox}" role="img" aria-label="${label}">${defs}<rect width="100%" height="100%" fill="#fff"/>${content}</svg>`;
    });
  };

  // Ideal rectangular transmission vs real open/close ramps
  mount("[data-f03a-efficiency]", "0 0 1280 520", "КПД затвора: идеальный и реальный", `
    <text class="strong" x="40" y="42">Пропускание света во времени</text>
    <!-- axes -->
    <path class="axis" d="M100 420H1200M100 420V60"/>
    <text class="small" x="1180" y="450">t</text>
    <text class="small" x="40" y="70">100%</text>
    <text class="small" x="55" y="420">0</text>
    <path d="M100 90H1200" stroke="#ccc" stroke-width="1" stroke-dasharray="6 6"/>

    <!-- Ideal: instant open/close rectangle -->
    <path class="ideal" d="M320 420V90H760V420Z"/>
    <text class="strong" x="430" y="70" style="fill:#1677b8">Идеальный</text>
    <text class="small" x="360" y="455">мгновенно открыт · мгновенно закрыт</text>

    <!-- Real: trapezoid with open and close ramps -->
    <path class="real" d="M480 420L560 90H900L980 420Z"/>
    <text class="strong" x="860" y="70" style="fill:#c7352c">Реальный</text>
    <text class="small" x="700" y="480">открытие · полное пропускание · закрытие</text>

    <!-- dimension marks for effective vs full -->
    <path d="M480 500H980" stroke="#c7352c" stroke-width="2" marker-start="url(#f03a-arrow)" marker-end="url(#f03a-arrow)"/>
    <text class="small" x="680" y="518" style="fill:#c7352c">t полн</text>
    <path d="M560 40H900" stroke="#1677b8" stroke-width="2" marker-start="url(#f03a-arrow)" marker-end="url(#f03a-arrow)"/>
    <text class="small" x="680" y="32" style="fill:#1677b8">t эфф (полный свет)</text>

    <text class="label" x="100" y="500">КПД ниже, когда доля времени на открытие и закрытие велика (короткие выдержки у центрального затвора).</text>
  `);

  // Location: focal vs aperture relative to lens and sensor
  mount("[data-f03a-location]", "0 0 720 520", "Расположение фокального и апертурного затворов", `
    <!-- Focal shutter -->
    <text class="strong" x="40" y="36">Фокальный</text>
    <path d="M40 120H300" stroke="#999" stroke-width="2" stroke-dasharray="8 6"/>
    <!-- lens -->
    <path d="M120 70Q90 150 120 230Q150 150 120 70Z" fill="#bdeaff" stroke="#126a91" stroke-width="3"/>
    <text class="small" x="95" y="250">объектив</text>
    <!-- focal shutter just before sensor -->
    <rect x="230" y="95" width="18" height="110" fill="#c7352c" stroke="#8a1f18" stroke-width="2"/>
    <text class="small" x="210" y="88">затвор</text>
    <!-- sensor -->
    <rect x="270" y="85" width="14" height="130" fill="#4d8da8"/>
    <text class="small" x="255" y="250">матрица</text>
    <path d="M40 150H120M120 150H230M248 150H270" stroke="#c78312" stroke-width="3"/>

    <!-- Aperture shutter -->
    <text class="strong" x="380" y="36">Апертурный</text>
    <path d="M380 120H660" stroke="#999" stroke-width="2" stroke-dasharray="8 6"/>
    <!-- front lens group -->
    <path d="M430 70Q405 150 430 230Q455 150 430 70Z" fill="#bdeaff" stroke="#126a91" stroke-width="3"/>
    <!-- shutter in middle -->
    <rect x="470" y="115" width="22" height="70" rx="4" fill="#c7352c" stroke="#8a1f18" stroke-width="2"/>
    <text class="small" x="455" y="100">затвор</text>
    <!-- rear lens group -->
    <path d="M520 70Q495 150 520 230Q545 150 520 70Z" fill="#bdeaff" stroke="#126a91" stroke-width="3"/>
    <text class="small" x="470" y="250">объектив</text>
    <!-- sensor -->
    <rect x="610" y="85" width="14" height="130" fill="#4d8da8"/>
    <text class="small" x="595" y="250">матрица</text>
    <path d="M380 150H430M430 150H470M492 150H520M520 150H610" stroke="#c78312" stroke-width="3"/>

    <text class="label" x="40" y="320">Фокальный — у кадрового окна. Апертурный — между линзами, у диафрагмы.</text>
    <text class="label" x="40" y="360">Шторки стараются ставить ближе к апертурной или фокальной плоскости.</text>
  `);
})();
