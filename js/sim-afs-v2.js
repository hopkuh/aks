import { DRONE_PRESETS, pixelSizeMm } from "./drone-presets.js";
import { heightFromGsd, groundFootprint } from "./sim-optics.js";
import {
  makeEnuTransform,
  buildRoutePlan,
  pathLength,
  pointInPolygon,
} from "./sim-routes.js";

const L = window.L;
const START = [55.76375, 37.66314];

function fmtLength(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} км` : `${m.toFixed(1)} м`;
}

function downloadGeoJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "afs-plan.geojson";
  link.click();
  URL.revokeObjectURL(url);
}

export function mountAfsSim(root) {
  if (!L?.map || !L.Control?.Draw) {
    throw new Error("Leaflet и Leaflet.draw не загружены.");
  }
  const host = root.querySelector("[data-afs-map]");
  const toolbar = root.querySelector(".sim-toolbar");
  const read = root.querySelector("[data-afs-read]");
  const pointList = root.querySelector("[data-afs-pts]");
  const gsdEl = root.querySelector("[data-afs-gsd]");
  const pxEl = root.querySelector("[data-afs-px]");
  const pyEl = root.querySelector("[data-afs-py]");
  const modeButtons = [...root.querySelectorAll("[data-afs-mode]")];
  let pointMode = "gcp";
  let preset = DRONE_PRESETS.matriceP1_35;
  let polygonLayer = null;
  let routePlan = null;
  let transform = null;
  let heading = 0;
  let nextPointId = 1;
  const points = [];

  const oldPresetButtons = toolbar.querySelector('[role="group"][aria-label="Тип БВС"]');
  const presetBox = document.createElement("div");
  presetBox.className = "sim-preset-box";
  presetBox.innerHTML = `
    <label class="sim-select">БВС + камера
      <select data-afs-preset>
        ${Object.values(DRONE_PRESETS).map((item) =>
          `<option value="${item.id}" ${item.id === preset.id ? "selected" : ""}>${item.name}</option>`
        ).join("")}
      </select>
    </label>
    <label class="sim-range">Курс маршрутов <span data-afs-heading>0°</span>
      <input type="range" data-afs-heading-input min="0" max="175" step="5" value="0">
    </label>
    <details class="sim-more" data-afs-camera>
      <summary>Параметры камеры и полёта</summary>
      <div class="sim-custom-grid">
        <label>f, мм <input type="number" step="0.1" min="1" data-custom-f></label>
        <label>Матрица X, мм <input type="number" step="0.1" min="1" data-custom-sw></label>
        <label>Матрица Y, мм <input type="number" step="0.1" min="1" data-custom-sh></label>
        <label>Пикселей X <input type="number" step="1" min="100" data-custom-px></label>
        <label>Пикселей Y <input type="number" step="1" min="100" data-custom-py></label>
        <label>V план., м/с <input type="number" step="0.5" min="1" data-custom-v></label>
      </div>
    </details>`;
  oldPresetButtons?.replaceWith(presetBox);

  const siteButtons = toolbar.querySelector('[role="group"][aria-label="Участок"]');
  siteButtons?.remove();
  const io = document.createElement("div");
  io.className = "sim-seg";
  io.innerHTML = `
    <button type="button" data-afs-import>Импорт GeoJSON</button>
    <button type="button" data-afs-export>Экспорт GeoJSON</button>
    <input type="file" accept=".json,.geojson,application/geo+json" data-afs-file hidden>`;
  toolbar.append(io);

  const map = L.map(host, {
    zoomControl: true,
    preferCanvas: true,
  }).setView(START, 16);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    crossOrigin: true,
    updateWhenIdle: true,
  }).addTo(map);

  const editable = new L.FeatureGroup().addTo(map);
  const routes = new L.FeatureGroup().addTo(map);
  const draw = new L.Control.Draw({
    position: "topleft",
    edit: { featureGroup: editable, remove: true },
    draw: {
      polygon: {
        allowIntersection: false,
        shapeOptions: { color: "#86c99a", fillOpacity: 0.14, weight: 3 },
      },
      marker: false,
      polyline: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
    },
  });
  map.addControl(draw);

  const defaultPolygon = L.polygon([
    [55.7660, 37.6574],
    [55.7661, 37.6685],
    [55.7608, 37.6693],
    [55.7606, 37.6582],
  ], { color: "#86c99a", fillOpacity: 0.14, weight: 3 }).addTo(editable);
  polygonLayer = defaultPolygon;

  function presetFields() {
    const fields = {
      focalMm: presetBox.querySelector("[data-custom-f]"),
      sensorWidthMm: presetBox.querySelector("[data-custom-sw]"),
      sensorHeightMm: presetBox.querySelector("[data-custom-sh]"),
      pixelsX: presetBox.querySelector("[data-custom-px]"),
      pixelsY: presetBox.querySelector("[data-custom-py]"),
      planningSpeedMps: presetBox.querySelector("[data-custom-v]"),
    };
    Object.entries(fields).forEach(([key, input]) => {
      input.value = preset[key] ?? "";
      input.disabled = preset.id !== "custom" && !(key === "focalMm" && preset.focalMm == null);
    });
  }

  function currentCamera() {
    const value = (selector, fallback) => {
      const parsed = Number(presetBox.querySelector(selector).value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    return {
      ...preset,
      focalMm: value("[data-custom-f]", preset.focalMm),
      sensorWidthMm: value("[data-custom-sw]", preset.sensorWidthMm),
      sensorHeightMm: value("[data-custom-sh]", preset.sensorHeightMm),
      pixelsX: value("[data-custom-px]", preset.pixelsX),
      pixelsY: value("[data-custom-py]", preset.pixelsY),
      planningSpeedMps: value("[data-custom-v]", preset.planningSpeedMps),
    };
  }

  function polygonLatLngs() {
    if (!polygonLayer) return [];
    const rings = polygonLayer.getLatLngs();
    return Array.isArray(rings[0]) ? rings[0] : rings;
  }

  function markerIcon(kind, number) {
    return L.divIcon({
      className: `afs-point afs-point--${kind}`,
      html: `<span>${kind === "gcp" ? "О" : "К"}${number}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  function renumberPoints() {
    for (const kind of ["gcp", "chk"]) {
      points.filter((point) => point.kind === kind).forEach((point, index) => {
        point.number = index + 1;
        point.marker.setIcon(markerIcon(kind, point.number));
      });
    }
  }

  function addPoint(kind, latlng) {
    const marker = L.marker(latlng, {
      draggable: true,
      icon: markerIcon(kind, points.filter((point) => point.kind === kind).length + 1),
      zIndexOffset: 800,
    }).addTo(map);
    const point = { id: nextPointId++, kind, number: 0, marker };
    points.push(point);
    marker.on("dragend", sync);
    marker.on("contextmenu", () => {
      map.removeLayer(marker);
      points.splice(points.indexOf(point), 1);
      renumberPoints();
      sync();
    });
    renumberPoints();
    sync();
  }

  function clearRoutes() {
    routes.clearLayers();
    routePlan = null;
  }

  function compute() {
    clearRoutes();
    const ring = polygonLatLngs();
    if (ring.length < 3) {
      read.innerHTML = "<p>Нарисуйте один полигон объекта съёмки.</p>";
      return;
    }
    const camera = currentCamera();
    const gsdM = Number(gsdEl.value) / 100;
    const overlapAlong = Number(pxEl.value) / 100;
    const overlapAcross = Number(pyEl.value) / 100;
    root.querySelector("[data-afs-gsdval]").textContent =
      `${Number(gsdEl.value).toFixed(1).replace(".", ",")} см`;
    root.querySelector("[data-afs-pxval]").textContent = `${Math.round(overlapAlong * 100)} %`;
    root.querySelector("[data-afs-pyval]").textContent = `${Math.round(overlapAcross * 100)} %`;
    if (!(camera.focalMm > 0)) {
      read.innerHTML = `
        <p><strong>Расчёт остановлен:</strong> для ${camera.name} нет паспортного физического фокусного расстояния.</p>
        <p>Введите f из EXIF или калибровочного паспорта камеры.</p>`;
      return;
    }
    const origin = {
      lat: ring.reduce((sum, p) => sum + p.lat, 0) / ring.length,
      lng: ring.reduce((sum, p) => sum + p.lng, 0) / ring.length,
    };
    transform = makeEnuTransform(origin);
    const localPolygon = ring.map((p) => transform.toLocal(p));
    const pixelMm = camera.sensorWidthMm / camera.pixelsX;
    const heightM = heightFromGsd(gsdM, pixelMm, camera.focalMm);
    const footprint = groundFootprint(
      heightM,
      camera.sensorWidthMm,
      camera.sensorHeightMm,
      camera.focalMm
    );
    routePlan = buildRoutePlan({
      polygon: localPolygon,
      headingDeg: heading,
      footprintAlongM: footprint.alongM,
      footprintAcrossM: footprint.acrossM,
      overlapAlong,
      overlapAcross,
      fixedWing: camera.platform === "fixedwing",
      turnRadiusM: camera.turnRadiusM,
    });
    routePlan.lines.forEach((route) => {
      L.polyline(route.points.map((point) => transform.toWgs(point)), {
        color: "#e2b56a",
        weight: 3,
      }).addTo(routes);
    });
    if (routePlan.path.length) {
      L.polyline(routePlan.path.map((point) => transform.toWgs(point)), {
        color: "#e07a73",
        weight: 1.5,
        dashArray: camera.platform === "fixedwing" ? "7 7" : "3 5",
        opacity: 0.8,
      }).addTo(routes);
    }
    routePlan.shots.forEach((point) => {
      L.circleMarker(transform.toWgs(point), {
        radius: routePlan.shots.length > 500 ? 1 : 2.2,
        color: "#6ec3d8",
        fillColor: "#6ec3d8",
        fillOpacity: 0.9,
        weight: 0,
        interactive: false,
      }).addTo(routes);
    });
    const lengthM = pathLength(routePlan.path);
    const flightMin = lengthM / camera.planningSpeedMps / 60;
    const intervalS = routePlan.alongStep / camera.planningSpeedMps;
    const source = camera.source
      ? `<a href="${camera.source}" target="_blank" rel="noopener noreferrer">официальный источник</a>`
      : "пользовательские данные";
    read.innerHTML = `
      <p><strong>${camera.name}</strong></p>
      <p>Высота фотографирования H<sub>ф</sub> = ${fmtLength(heightM)}</p>
      <p>Захват L<sub>x</sub> = ${fmtLength(footprint.alongM)}; L<sub>y</sub> = ${fmtLength(footprint.acrossM)}</p>
      <p>Продольный базис B<sub>x</sub> = ${fmtLength(routePlan.alongStep)}</p>
      <p>Поперечный базис B<sub>y</sub> = ${fmtLength(routePlan.acrossStep)}</p>
      <p>Маршрутов ${routePlan.routeCount}; кадров ${routePlan.shots.length}; интервал ${intervalS.toFixed(2)} с.</p>
      <p>Путь ${fmtLength(lengthM)}; расчётное время ${flightMin.toFixed(1)} мин при ${camera.planningSpeedMps} м/с.</p>
      <p>Доступное время ${camera.usableFlightTimeMin} мин из паспортных ${camera.maxFlightTimeMin} мин; ${source}.</p>
      <p class="muted">${camera.note} Время зависит от нагрузки, батареи, ветра и резерва.${camera.platform === "fixedwing" ? ` Развороты сглажены с расчётным радиусом ${camera.turnRadiusM} м.` : ""}</p>`;
  }

  function syncPointList() {
    const local = transform;
    const rows = points.map((point) => {
      const ll = point.marker.getLatLng();
      const xy = local?.toLocal(ll);
      return `<div>${point.kind === "gcp" ? "О" : "К"}${point.number} · ${xy
        ? `${xy.x.toFixed(1)}; ${xy.y.toFixed(1)} м`
        : `${ll.lat.toFixed(6)}; ${ll.lng.toFixed(6)}`}</div>`;
    });
    const gcps = points.filter((point) => point.kind === "gcp");
    let warning = "";
    if (gcps.length < 3) warning = "Нужно не менее трёх опорных точек.";
    else if (transform) {
      const localPoints = gcps.map((point) => transform.toLocal(point.marker.getLatLng()));
      const a = localPoints[0];
      const b = localPoints[1];
      const base = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      if (localPoints.every((p) =>
        Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / base < 10
      )) warning = "Опорные точки почти на одной прямой.";
    }
    pointList.innerHTML = `
      <p class="sim-kicker">Опорные ${gcps.length} · контрольные ${points.length - gcps.length}</p>
      ${rows.join("") || "<p class='muted'>Щёлкните внутри полигона, чтобы поставить точку.</p>"}
      ${warning ? `<p class="sim-warning">${warning}</p>` : ""}`;
  }

  function sync() {
    compute();
    syncPointList();
  }

  map.on(L.Draw.Event.CREATED, (event) => {
    editable.clearLayers();
    polygonLayer = event.layer.addTo(editable);
    sync();
  });
  map.on(L.Draw.Event.EDITED, () => sync());
  map.on(L.Draw.Event.DELETED, () => {
    polygonLayer = null;
    clearRoutes();
    syncPointList();
  });
  map.on("click", (event) => {
    if (!polygonLayer || !transform) return;
    const localPoint = transform.toLocal(event.latlng);
    const localPolygon = polygonLatLngs().map((p) => transform.toLocal(p));
    if (pointInPolygon(localPoint, localPolygon)) addPoint(pointMode, event.latlng);
  });

  modeButtons.forEach((button) => button.addEventListener("click", () => {
    pointMode = button.dataset.afsMode;
    modeButtons.forEach((b) => b.classList.toggle("is-on", b === button));
  }));
  presetBox.querySelector("[data-afs-preset]").addEventListener("change", (event) => {
    preset = DRONE_PRESETS[event.target.value] ?? DRONE_PRESETS.custom;
    pxEl.value = Math.round(preset.overlapAlong * 100);
    pyEl.value = Math.round(preset.overlapAcross * 100);
    presetFields();
    sync();
  });
  presetBox.querySelector("[data-afs-heading-input]").addEventListener("input", (event) => {
    heading = Number(event.target.value);
    presetBox.querySelector("[data-afs-heading]").textContent = `${heading}°`;
    sync();
  });
  presetBox.querySelectorAll("[data-custom-f],[data-custom-sw],[data-custom-sh],[data-custom-px],[data-custom-py],[data-custom-v]")
    .forEach((input) => input.addEventListener("input", sync));
  [gsdEl, pxEl, pyEl].forEach((input) => input.addEventListener("input", sync));

  root.querySelector("[data-afs-auto]").addEventListener("click", () => {
    points.splice(0).forEach((point) => map.removeLayer(point.marker));
    const bounds = polygonLayer?.getBounds();
    if (!bounds) return;
    const center = bounds.getCenter();
    const localPolygon = polygonLatLngs().map((p) => transform.toLocal(p));
    const fitInside = (latlng) => {
      let current = L.latLng(latlng);
      for (let i = 0; i < 12; i++) {
        if (pointInPolygon(transform.toLocal(current), localPolygon)) return current;
        current = L.latLng(
          (current.lat + center.lat) / 2,
          (current.lng + center.lng) / 2
        );
      }
      return center;
    };
    const positions = [
      bounds.getNorthWest(),
      bounds.getNorthEast(),
      bounds.getSouthEast(),
      bounds.getSouthWest(),
      center,
    ];
    positions.forEach((latlng) => addPoint("gcp", fitInside(latlng)));
    addPoint("chk", fitInside(L.latLng(bounds.getNorth(), center.lng)));
  });
  root.querySelector("[data-afs-clear]").addEventListener("click", () => {
    points.splice(0).forEach((point) => map.removeLayer(point.marker));
    syncPointList();
  });

  const fileInput = root.querySelector("[data-afs-file]");
  root.querySelector("[data-afs-import]").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const data = JSON.parse(await file.text());
    const layer = L.geoJSON(data);
    let found = null;
    layer.eachLayer((candidate) => {
      if (!found && candidate instanceof L.Polygon) found = candidate;
    });
    if (!found) throw new Error("В GeoJSON нет полигона.");
    editable.clearLayers();
    polygonLayer = found.addTo(editable);
    map.fitBounds(polygonLayer.getBounds(), { padding: [30, 30] });
    sync();
    points.splice(0).forEach((point) => map.removeLayer(point.marker));
    const features = data.type === "FeatureCollection" ? data.features : [data];
    features.filter((feature) =>
      feature?.geometry?.type === "Point" &&
      ["gcp", "chk"].includes(feature.properties?.kind)
    ).forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      addPoint(feature.properties.kind, L.latLng(lat, lng));
    });
  });
  root.querySelector("[data-afs-export]").addEventListener("click", () => {
    const features = [];
    if (polygonLayer) features.push(polygonLayer.toGeoJSON());
    if (routePlan && transform) {
      features.push({
        type: "Feature",
        properties: { kind: "flight-route", heading },
        geometry: {
          type: "LineString",
          coordinates: routePlan.path.map((point) => {
            const ll = transform.toWgs(point);
            return [ll.lng, ll.lat];
          }),
        },
      });
    }
    points.forEach((point) => {
      const ll = point.marker.getLatLng();
      features.push({
        type: "Feature",
        properties: { kind: point.kind, number: point.number },
        geometry: { type: "Point", coordinates: [ll.lng, ll.lat] },
      });
    });
    downloadGeoJson({ type: "FeatureCollection", features });
  });

  presetFields();
  sync();
  let awake = false;
  return {
    resize() {
      map.invalidateSize(false);
    },
    wake() {
      awake = true;
      setTimeout(() => map.invalidateSize(false), 0);
    },
    sleep() {
      awake = false;
    },
    resetView() {
      if (polygonLayer) map.fitBounds(polygonLayer.getBounds(), { padding: [30, 30] });
      else map.setView(START, 16);
    },
    dispose() {
      awake = false;
      map.remove();
    },
  };
}
