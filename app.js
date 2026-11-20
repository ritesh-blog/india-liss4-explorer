const DATA_URL = "data/latest.json";
const map = L.map("map", { scrollWheelZoom: true }).setView([22.5, 79], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const layers = L.featureGroup().addTo(map);

function safe(value) {
  return String(value ?? "—").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[ch]);
}

function niceDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function satelliteName(collection) {
  if (collection.includes("ResourceSat-2A")) return "Resourcesat-2A";
  if (collection.includes("ResourceSat-2")) return "Resourcesat-2";
  return collection || "Unknown";
}

function render(data) {
  const features = Array.isArray(data.features) ? data.features : [];
  document.getElementById("scene-count").textContent = features.length;
  document.getElementById("updated-at").textContent = niceDate(data.generated_at);
  const newest = features.map(f => f.properties?.datetime).filter(Boolean).sort().reverse()[0];
  document.getElementById("newest-date").textContent = niceDate(newest);
  document.getElementById("status").textContent = data.status === "ok" ? "Catalogue loaded" : "No data";
  document.getElementById("list-note").textContent = data.note || "Newest acquisition dates first";

  layers.clearLayers();
  const rows = document.getElementById("scene-rows");
  rows.innerHTML = "";

  if (!features.length) {
    rows.innerHTML = '<tr><td colspan="5">No scenes found in the latest catalogue check. This may mean no matching acquisitions are currently returned.</td></tr>';
    return;
  }

  features.forEach(feature => {
    const p = feature.properties || {};
    const collection = feature.collection || p.collection || "";
    const id = feature.id || "Unknown scene";
    const date = p.datetime || p.start_datetime || p.end_datetime || "";
    const satellite = satelliteName(collection);

    if (feature.geometry) {
      const layer = L.geoJSON(feature, {
        style: { color: "#087e8b", weight: 1.5, fillColor: "#22a6b3", fillOpacity: 0.12 }
      }).addTo(layers);
      layer.bindPopup(`<b>${safe(id)}</b><br>${safe(satellite)}<br>${safe(niceDate(date))}<br>${safe(collection)}`);
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${safe(niceDate(date))}</td>
      <td>${safe(satellite)}</td>
      <td class="scene-id">${safe(id)}</td>
      <td>${safe(collection)}</td>
      <td><button type="button" class="details">Show on map</button></td>`;
    tr.querySelector("button").addEventListener("click", () => {
      const match = layers.getLayers().find(layer => {
        const props = layer.feature?.properties || {};
        return layer.feature?.id === id;
      });
      if (match) {
        map.fitBounds(match.getBounds(), { maxZoom: 10 });
        match.openPopup();
      }
    });
    rows.appendChild(tr);
  });

  if (layers.getLayers().length) map.fitBounds(layers.getBounds(), { padding: [18, 18], maxZoom: 7 });
}

fetch(`${DATA_URL}?v=${Date.now()}`)
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch(error => {
    document.getElementById("status").textContent = "Catalogue unavailable";
    document.getElementById("scene-rows").innerHTML =
      `<tr><td colspan="5">Could not load data/latest.json. ${safe(error.message)}. The catalogue update workflow may not have run yet.</td></tr>`;
  });
