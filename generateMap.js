const turf = require('@turf/turf');
const { log } = require('console');
const fs = require('fs');
const DottedMap = require('dotted-map').default;
const { mapCountriesToGeoJson } = require('./countryToNoc');
const THREE = require('three');

// Function to fetch GeoJSON data from a local file
function fetchGeoJSON() {
  const filePath = './public/countries.geo.json';
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// Generate a grid of points within the country boundary
async function generatePointsForCountry(countryFeature) {
  let bbox = turf.bbox(countryFeature);

  if (countryFeature.id == "RUS") {
    bbox = [-10, 41.151416, 200, 81.2504];
  }

  const cellSize = 20;
  const grid = turf.pointGrid(bbox, cellSize);

  let pointsWithin;
  if (countryFeature.id == "RUS") {
    pointsWithin = grid.features.filter(point =>
      turf.booleanPointInPolygon(point, countryFeature)
    );
  } else {
    pointsWithin = grid.features.filter(point =>
      turf.booleanPointInPolygon(point, countryFeature)
    );
  }

  return pointsWithin;
}

// Function to calculate total medals for each country
function calculateTotalMedals(data) {
  let totalMedals = {};
  data.links.forEach(link => {
    if (!totalMedals[link.target]) {
      totalMedals[link.target] = 0;
    }
    totalMedals[link.target] += link.attr.length;
  });
  return totalMedals;
}

// Function to calculate opacity based on the number of medals
function calculateOpacity(medals, maxMedals, minOpacity) {
  return Math.max(minOpacity, (medals / maxMedals) + minOpacity);
}

// Function to convert a hex color to RGBA
function hexToRgba(hex, opacity) {
  let r = 0, g = 0, b = 0;
  r = parseInt(hex[1] + hex[2], 16);
  g = parseInt(hex[3] + hex[4], 16);
  b = parseInt(hex[5] + hex[6], 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// Create a dotted map with points for multiple countries
async function generateMap(clusterData) {
  const geojson = fetchGeoJSON();

  const map = new DottedMap({
    height: 150,
    grid: 'diagonal'
  });

  // Add colors schema for clusters
  const colors = [
    '#2d1a82', // first color 
    '#1a2d82', // second color
    '#1a823d', // third color
    '#823d1a', // fourth color
    '#821a64', // fifth color 
  ];

  // Load data.json and calculate medals
  const jsonData = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));
  const totalMedals = calculateTotalMedals(jsonData);

  // Find the maximum number of medals
  const maxMedals = Math.max(...Object.values(totalMedals));
  const minOpacity = 0.65; // minimum opacity value

  for (let clusterIndex = 0; clusterIndex < clusterData.length; clusterIndex++) {
    const countries = clusterData[clusterIndex].countries;
    const color = colors[clusterIndex % colors.length];
    const isoCountries = mapCountriesToGeoJson(countries);

    for (const countryCode of isoCountries) {
      const countryFeature = geojson.features.find(feature => feature.id === countryCode);
      if (!countryFeature) {
        console.warn(`Country with ISO code ${countryCode} not found`);
        continue;
      }

      const pointsWithin = await generatePointsForCountry(countryFeature);
      const medals = totalMedals[countryCode] || 0;
      const opacity = calculateOpacity(medals, maxMedals, minOpacity);
      const rgbaColor = hexToRgba(color, opacity.toFixed(2));

      pointsWithin.forEach(point => {
        const [lng, lat] = point.geometry.coordinates;
        map.addPin({
          lat,
          lng,
          data: { value: medals }, // Store the value to use it for 3D extrusion
          svgOptions: { color: rgbaColor, radius: 0.4 }
        });
      });
    }
  }

  const allPoints = map.getPoints();

  // Set up Three.js
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, Window.innerWidth / Window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.z = 5;

  // Create hexagons in Three.js
  allPoints.forEach(point => {
    const hexShape = new THREE.Shape();
    const size = 0.1; // Adjust size as needed
    const hexHeight = Math.sqrt(3) * size;

    // Create a hexagon shape
    hexShape.moveTo(0, size);
    for (let i = 1; i < 7; i++) {
      hexShape.lineTo(size * Math.cos((i * 2 * Math.PI) / 6), size * Math.sin((i * 2 * Math.PI) / 6));
    }
    hexShape.lineTo(0, size);

    // Extrude the hexagon shape
    const extrudeSettings = {
      depth: point.data.value, // Use the value from the pin data
      bevelEnabled: false,
    };
    const geometry = new THREE.ExtrudeGeometry(hexShape, extrudeSettings);
    const material = new THREE.MeshBasicMaterial({ color: point.svgOptions.color });
    const hexagonMesh = new THREE.Mesh(geometry, material);

    // Set the position based on the 2D coordinates
    hexagonMesh.position.set(point.x, point.y, 0);

    // Add the hexagon to the scene
    scene.add(hexagonMesh);
  });

  const animate = function () {
    requestAnimationFrame(animate);

    // Any animations or interactions
    renderer.render(scene, camera);
  };

  animate();

  const svgMap = map.getSVG({
    width: 800,
    height: 400,
    backgroundColor: '#1f1f1f'
  });

  fs.writeFileSync(`./files/map_clusters.svg`, svgMap);
}

module.exports = { generateMap };
