(() => {
  const slides = [...document.querySelectorAll(".slide")];
  if (!slides.length) return;

  const THEME_KEY = "aks-slides-theme";
  const storedTheme = (() => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  })();
  let theme = storedTheme === "light" ? "light" : "dark";
  const themeButton = document.createElement("button");
  themeButton.type = "button";
  themeButton.className = "theme-toggle";

  const applyTheme = (nextTheme, persist = true) => {
    theme = nextTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.slideTheme = theme;
    const light = theme === "light";
    themeButton.textContent = light ? "☾ Тёмная" : "☀ Светлая";
    themeButton.title = light ? "Включить тёмную тему" : "Включить светлую тему";
    themeButton.setAttribute("aria-label", themeButton.title);
    themeButton.setAttribute("aria-pressed", String(light));
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        // Тема продолжит работать в текущей вкладке без сохранения.
      }
    }
  };

  applyTheme(theme, false);
  document.querySelector(".topbar .nav")?.appendChild(themeButton);
  themeButton.addEventListener("click", () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY && (event.newValue === "light" || event.newValue === "dark")) {
      applyTheme(event.newValue, false);
    }
  });

  const AKS = [
    { id: "03-01-fotoapparat", short: "Ф01", title: "Фотоаппарат" },
    { id: "p-cfk", short: "ЦФК", title: "Практика ЦФК" },
    { id: "03-02-obektiv", short: "Ф02", title: "Объектив" },
    { id: "03-03-zatvor", short: "Ф03", title: "Затвор" },
    { id: "03-04-matritsa", short: "Ф05", title: "Матрица" },
    { id: "07-stereo", short: "Ф07", title: "Стерео" },
    { id: "09-fotogrammetriya", short: "Ф09", title: "Фотограмметрия" },
    { id: "08-predmetnoe", short: "Ф08", title: "Предмет" },
    { id: "10-kachestvo-kadra", short: "кадр", title: "Качество кадра" },
    { id: "04-atsp-grafika", short: "Ф05", title: "АЦП" },
    { id: "05-formaty", short: "Ф06", title: "Форматы" },
    { id: "06-cvet", short: "Ф07", title: "Цвет" },
    { id: "a01-vvedenie", short: "А01", title: "Введение" },
    { id: "a02-klassifikaciya-afs", short: "А02", title: "Классификация" },
    { id: "a04-planirovanie", short: "А04", title: "Планирование" },
    { id: "a03-bvs", short: "А03", title: "БВС" },
    { id: "a05-kontrast", short: "А05", title: "Контраст" },
    { id: "a06-kachestvo", short: "А06", title: "Качество АФС" },
    { id: "a10-ivp", short: "А10", title: "ИВП" },
    { id: "a12-sk", short: "А12", title: "СК и орто" },
    { id: "a11-gnss", short: "А11", title: "ГНСС" },
    { id: "optika-sredy", short: "среда", title: "Оптика среды" },
    { id: "p-pilot-afs", short: "пилот", title: "Пилотируемая АФС" },
    { id: "a-atmosfera", short: "атм.", title: "Атмосфера" },
    { id: "a07-deshifrirovanie", short: "А07", title: "Дешифрирование" },
    { id: "a09-rls", short: "А09", title: "РЛС" },
  ];
  const CV = [
    { id: "cv01-rastr", short: "CV01", title: "Растр" },
    { id: "cv02-sootvetstviya", short: "CV02", title: "Соответствия" },
    { id: "cv03-dve-kamery", short: "CV03", title: "Две камеры" },
    { id: "cv04-sfm", short: "CV04", title: "SfM" },
    { id: "cv05-glubina", short: "CV05", title: "Глубина" },
    { id: "cv06-oblako", short: "CV06", title: "Облако" },
    { id: "cv07-predstavleniya", short: "CV07", title: "NeRF / 3DGS" },
  ];

  const folder = (location.pathname.replace(/\\/g, "/").match(/lectures\/([^/]+)\//) || [])[1];
  const seq = CV.some((x) => x.id === folder) ? CV : AKS;
  const idx = seq.findIndex((x) => x.id === folder);
  const prevLec = idx > 0 ? seq[idx - 1] : null;
  const nextLec = idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : null;
  const hub = seq === CV ? "../../cv.html" : "../../index.html";
  const prevHref = prevLec ? `../${prevLec.id}/slides.html#9999` : hub;
  const nextHref = nextLec ? `../${nextLec.id}/slides.html` : hub;
  const prevLabel = prevLec ? `← ${prevLec.short}` : "← к списку";
  const nextLabel = nextLec ? `${nextLec.short} →` : "к списку →";
  const prevTitle = prevLec ? `Предыдущая лекция: ${prevLec.short} · ${prevLec.title}` : "К списку лекций";
  const nextTitle = nextLec ? `Следующая лекция: ${nextLec.short} · ${nextLec.title}` : "К списку лекций";

  const counter = document.getElementById("counter");
  const progress = document.getElementById("progress");
  const help = document.getElementById("help");
  const bar = document.querySelector(".footer-bar");
  let i = 0;

  const fromHash = () => {
    const n = parseInt(location.hash.replace("#", ""), 10);
    return Number.isFinite(n) ? n - 1 : 0;
  };

  const show = (n) => {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
    if (counter) counter.textContent = `${i + 1} / ${slides.length}`;
    if (progress) progress.style.width = `${((i + 1) / slides.length) * 100}%`;
    const hash = `#${i + 1}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
    document.dispatchEvent(new CustomEvent("slidechange", { detail: { index: i } }));
  };

  const goPrev = () => {
    if (i <= 0) {
      location.href = prevHref;
      return;
    }
    show(i - 1);
  };
  const goNext = () => {
    if (i >= slides.length - 1) {
      location.href = nextHref;
      return;
    }
    show(i + 1);
  };

  document.getElementById("prev")?.addEventListener("click", goPrev);
  document.getElementById("next")?.addEventListener("click", goNext);

  if (bar) {
    const mk = (href, text, title, cls) => {
      const a = document.createElement("a");
      a.className = `lec-nav ${cls}`;
      a.href = href;
      a.textContent = text;
      a.title = title;
      return a;
    };
    const prevBtn = document.getElementById("prev");
    bar.insertBefore(mk(prevHref, prevLabel, prevTitle, "lec-nav--prev"), prevBtn || bar.firstChild);
    bar.appendChild(mk(nextHref, nextLabel, nextTitle, "lec-nav--next"));
  }

  if (help) {
    const extra = document.createElement("p");
    extra.innerHTML = "<kbd>←</kbd> на первом слайде и <kbd>→</kbd> на последнем — соседняя лекция<br><kbd>T</kbd> — светлая / тёмная тема";
    help.querySelector(".help-card")?.appendChild(extra);
  }

  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "Home") show(0);
    else if (e.key === "End") show(slides.length - 1);
    else if (e.key === "n" || e.key === "N") document.body.classList.toggle("show-notes");
    else if (e.key === "t" || e.key === "T") applyTheme(theme === "dark" ? "light" : "dark");
    else if (e.key === "f" || e.key === "F") {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    } else if (e.key === "?" || e.key === "h" || e.key === "H") {
      help?.classList.toggle("is-open");
    } else if (e.key === "Escape") help?.classList.remove("is-open");
  });

  window.addEventListener("hashchange", () => show(fromHash()));
  help?.addEventListener("click", (e) => {
    if (e.target === help) help.classList.remove("is-open");
  });

  show(fromHash());
})();
