(() => {
  const root = document.querySelector("[data-hub]");
  if (!root) return;

  const pills = [...root.querySelectorAll("[data-sem]")];
  const panels = [...root.querySelectorAll("[data-panel]")];
  if (!pills.length) return;

  const show = (id) => {
    pills.forEach((p) => {
      if (p.dataset.sem === id) p.setAttribute("aria-current", "true");
      else p.removeAttribute("aria-current");
    });
    panels.forEach((p) => p.classList.toggle("is-on", p.dataset.panel === id));
  };

  const fromHash = () => {
    const raw = (location.hash || "").replace("#", "");
    return pills.some((p) => p.dataset.sem === raw) ? raw : pills[0].dataset.sem;
  };

  pills.forEach((p) => {
    p.addEventListener("click", (e) => {
      e.preventDefault();
      const id = p.dataset.sem;
      history.replaceState(null, "", `#${id}`);
      show(id);
    });
  });

  window.addEventListener("hashchange", () => show(fromHash()));
  show(fromHash());
})();
