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
      </style>
    </defs>`;

  const mount = (selector, viewBox, label, content) => {
    document.querySelectorAll(selector).forEach((root) => {
      root.innerHTML = `<svg viewBox="${viewBox}" role="img" aria-label="${label}">${defs}<rect width="100%" height="100%" fill="#fff"/>${content}</svg>`;
    });
  };

  // Smooth raised-cosine bell for real shutter; shorter rectangle for ideal — same centre time
  const y0 = 420;
  const yTop = 90;
  const cx = 640;
  const idealHalf = 140;
  const realHalf = 260;
  const realPts = [];
  for (let i = 0; i <= 48; i += 1) {
    const t = i / 48;
    const x = cx - realHalf + t * realHalf * 2;
    // raised cosine: 0 at edges, 1 at centre
    const u = (x - cx) / realHalf;
    const amp = 0.5 * (1 + Math.cos(Math.PI * Math.max(-1, Math.min(1, u))));
    const y = y0 - amp * (y0 - yTop);
    realPts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const realPath = `${realPts.join("")}L${cx + realHalf} ${y0}L${cx - realHalf} ${y0}Z`;

  mount("[data-f03a-efficiency]", "0 0 1280 520", "КПД затвора: идеальный и реальный", `
    <text class="strong" x="40" y="42">Пропускание света во времени</text>
    <path class="axis" d="M100 420H1200M100 420V60"/>
    <text class="small" x="1180" y="450">t</text>
    <text class="small" x="40" y="70">100%</text>
    <text class="small" x="55" y="420">0</text>
    <path d="M100 90H1200" stroke="#ccc" stroke-width="1" stroke-dasharray="6 6"/>

    <!-- Real (longer, smooth bell) drawn first so ideal sits on top -->
    <path d="${realPath}" fill="#c7352c" fill-opacity=".2" stroke="#c7352c" stroke-width="3.5"/>
    <!-- Ideal rectangle, same centre, shorter -->
    <path d="M${cx - idealHalf} ${y0}V${yTop}H${cx + idealHalf}V${y0}Z" fill="#1677b8" fill-opacity=".28" stroke="#1677b8" stroke-width="3.5"/>

    <text class="strong" x="170" y="70" style="fill:#1677b8">Идеальный</text>
    <text class="small" x="170" y="95" style="fill:#1677b8">короче · мгновенно вверх и вниз</text>
    <text class="strong" x="900" y="70" style="fill:#c7352c">Реальный</text>
    <text class="small" x="900" y="95" style="fill:#c7352c">длиннее · плавный подъём и спуск</text>

    <path d="M${cx - realHalf} 490H${cx + realHalf}" stroke="#c7352c" stroke-width="2" marker-start="url(#f03a-arrow)" marker-end="url(#f03a-arrow)"/>
    <text class="small" x="${cx - 30}" y="512" style="fill:#c7352c">t полн</text>
    <path d="M${cx - idealHalf} 40H${cx + idealHalf}" stroke="#1677b8" stroke-width="2" marker-start="url(#f03a-arrow)" marker-end="url(#f03a-arrow)"/>
    <text class="small" x="${cx - 50}" y="32" style="fill:#1677b8">t эфф (полный свет)</text>
  `);

  mount("[data-f03a-location]", "0 0 720 480", "Расположение фокального и апертурного затворов", `
    <!-- Focal -->
    <text class="strong" x="40" y="32">Фокальный</text>
    <path d="M30 160H330" stroke="#bbb" stroke-width="2" stroke-dasharray="8 6"/>
    <path d="M100 80Q70 160 100 240Q130 160 100 80Z" fill="#bdeaff" stroke="#126a91" stroke-width="3"/>
    <text class="small" x="70" y="265">объектив</text>
    <rect x="220" y="100" width="16" height="120" fill="#c7352c" stroke="#8a1f18" stroke-width="2"/>
    <text class="small" x="200" y="90">затвор</text>
    <rect x="260" y="90" width="14" height="140" fill="#4d8da8"/>
    <text class="small" x="245" y="265">матрица</text>
    <!-- rays through lens to shutter/sensor -->
    <path d="M30 100L100 130L220 145L260 150" fill="none" stroke="#c78312" stroke-width="2.5"/>
    <path d="M30 160L100 160L220 160L260 160" fill="none" stroke="#c78312" stroke-width="2.5"/>
    <path d="M30 220L100 190L220 175L260 170" fill="none" stroke="#c78312" stroke-width="2.5"/>

    <!-- Aperture -->
    <text class="strong" x="380" y="32">Апертурный</text>
    <path d="M370 160H690" stroke="#bbb" stroke-width="2" stroke-dasharray="8 6"/>
    <path d="M420 80Q395 160 420 240Q445 160 420 80Z" fill="#bdeaff" stroke="#126a91" stroke-width="3"/>
    <rect x="465" y="125" width="20" height="70" rx="3" fill="#c7352c" stroke="#8a1f18" stroke-width="2"/>
    <text class="small" x="450" y="112">затвор</text>
    <path d="M520 80Q495 160 520 240Q545 160 520 80Z" fill="#bdeaff" stroke="#126a91" stroke-width="3"/>
    <text class="small" x="450" y="265">объектив</text>
    <rect x="620" y="90" width="14" height="140" fill="#4d8da8"/>
    <text class="small" x="605" y="265">матрица</text>
    <path d="M370 100L420 130L465 145L485 150L520 150L620 150" fill="none" stroke="#c78312" stroke-width="2.5"/>
    <path d="M370 160L420 160L465 160L485 160L520 160L620 160" fill="none" stroke="#c78312" stroke-width="2.5"/>
    <path d="M370 220L420 190L465 175L485 170L520 170L620 170" fill="none" stroke="#c78312" stroke-width="2.5"/>

    <text class="label" x="40" y="320">Лучи идут через объектив; фокальный затвор — у матрицы, апертурный — между линзами.</text>
    <text class="label" x="40" y="355">Шторки стараются ставить ближе к апертурной или фокальной плоскости.</text>
  `);
})();
