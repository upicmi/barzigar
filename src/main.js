import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

let map = L.map("map").setView([35.532591, 51.490314], 8);
// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//     attribution: "© OpenStreetMap contributors"
// }).addTo(map);

// L.tileLayer.provider("CartoDB.Voyager").addTo(map);

// Add Sentinel layer using WMS (Sentinel Hub or Copernicus Hub)
const instanceId = import.meta.env.VITE_APP_SENTINEL_INSTANCE_ID || "";
const sentinelLayer = L.tileLayer.wms(
    `https://services.sentinel-hub.com/ogc/wms/${instanceId}`,
    {
        layers: "2_FALSE_COLOR",
        format: "image/png",
        transparent: true,
        attribution: "&copy; Sentinel Hub"
    }
);
sentinelLayer.addTo(map);

// Variables to track selection
let isSelecting = false;
let startPoint = null;
let rectangle = null;

// Add button event listener
document.getElementById("selectArea").addEventListener("click", () => {
    isSelecting = true;
    alert("Click on the map to define the area.");
});

// Map click event to start/select an area
map.on("click", (e) => {
    if (!isSelecting) return;

    if (!startPoint) {
        // Set the first corner
        startPoint = e.latlng;
        alert("Now click to define the opposite corner.");
    } else {
        // Define the opposite corner and draw the rectangle
        const endPoint = e.latlng;

        if (rectangle) map.removeLayer(rectangle); // Remove previous rectangle
        rectangle = L.rectangle([startPoint, endPoint], { color: "blue", weight: 2 });
        rectangle.addTo(map);

        // Reset selection
        isSelecting = false;
        startPoint = null;

        alert(`Area selected: ${JSON.stringify(rectangle.getBounds())}`);
    }
});
