import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import Swal from 'sweetalert2'; // Import SweetAlert2

let map = L.map("map").setView([35.532591, 51.490314], 8);

// OpenStreetMap layer
const openStreetMapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
});

// Sentinel layer using WMS (Sentinel Hub or Copernicus Hub)
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

// Add Sentinel as the default layer
sentinelLayer.addTo(map);

// Add control to switch between layers
L.control.layers({
    "Sentinel": sentinelLayer,
    "OpenStreetMap": openStreetMapLayer
}).addTo(map);

// Variables to track selection
let isSelecting = false;
let points = [];
let polygon = null;
let cornerCircles = [];
let selectedCoordinates = []; // Variable to store the coordinates of the polygon
const closeThreshold = 0.01; // Distance threshold in degrees to consider the point "close enough" to the first one

// Add button event listener for area selection
document.getElementById("selectArea").addEventListener("click", () => {
    isSelecting = true;
    points = []; // Reset points for a new selection
    cornerCircles.forEach(circle => map.removeLayer(circle)); // Remove old corner circles
    cornerCircles = []; // Clear the corner circles array
    if (polygon) {
        map.removeLayer(polygon); // Remove previous polygon if any
    }

    Swal.fire({
        title: "انتخاب محدوده",
        text: "بر روی نقشه کلیک کنید تا محدوده را مشخص کنید٬ حداقل روی سه نقطه کلیک کنید.",
        icon: "info",
        confirmButtonText: "شروع"
    });
});

// Map click event to define the points and draw the polygon
map.on("click", (e) => {
    if (!isSelecting) return;

    // Add the clicked point to the points array
    points.push(e.latlng);

    // Draw or update the polygon
    if (polygon) {
        map.removeLayer(polygon); // Remove previous polygon
    }

    if (points.length > 2) {
        polygon = L.polygon(points, { color: "blue", weight: 2 }).addTo(map); // Create polygon with at least 3 points
    }

    // Add circles at each corner
    cornerCircles.forEach(circle => map.removeLayer(circle)); // Remove previous corner circles
    cornerCircles = points.map(point => {
        return L.circleMarker(point, { radius: 6, color: "red", fillColor: "red", fillOpacity: 0.7 }).addTo(map);
    });

    if (points.length == 3) {
        Swal.fire({
            title: "محدوده اولیه انتخاب شد",
            text: "برای پایان میتوانید روی اولین نقطه کلیک کنید و یا برای دقت بیشتر ادامه دهید.",
            icon: "info",
            confirmButtonText: "ادامه"
        });
    }
});

// Check if the clicked point is within the threshold distance from the first point
function isPointCloseToFirst(point) {
    const firstPoint = points[0];
    const distance = firstPoint.distanceTo(point); // Get distance between the points in meters
    return distance <= closeThreshold * 100000; // Convert threshold to meters (1 degree ≈ 111 km, so use small threshold for ease)
}

// Optionally, allow the user to close the polygon by clicking the first point again
map.on("click", (e) => {
    if (isSelecting && points.length >= 3) {
        const firstPoint = points[0];
        if (isPointCloseToFirst(e.latlng)) {
            // Close the polygon when the user clicks close to the first point
            Swal.fire({
                title: "محدوده انتخاب شد",
                text: `مختصات : ${JSON.stringify(polygon.getBounds())}`,
                icon: "success",
                confirmButtonText: "تایید"
            });

            // Store the coordinates of the selected polygon
            selectedCoordinates = points.map(point => ({
                lat: point.lat,
                lng: point.lng
            }));

            console.log("Selected Coordinates:", selectedCoordinates);

            // Finalize selection
            isSelecting = false;
            points = [];
        }
    }
});
