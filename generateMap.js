const turf = require('@turf/turf');
const fs = require('fs');
const DottedMap = require('dotted-map').default;

// Function to fetch GeoJSON data from a local file
function fetchGeoJSON() {
  const filePath = './node_modules/dotted-map/src/countries.geo.json';
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// Generate a grid of points within the country boundary
async function generatePointsForCountry(countryFeature) {
  const bbox = turf.bbox(countryFeature);
  const cellSize = 20;
  const grid = turf.pointGrid(bbox, cellSize);

  const pointsWithin = grid.features.filter(point =>
    turf.booleanPointInPolygon(point, countryFeature)
  );

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
  return Math.max(minOpacity, (medals / maxMedals)+minOpacity);
}

// Function to convert a hex color to RGBA, it didnt worked with hex
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

  // add colors for clusters
  const colors = [
    '#2d1a82', '#1a2d82', '#1a823d', '#823d1a', '#821a64', 
    '#64821a', '#1a6482', '#821a2d', '#2d823d' 
  ];

  // load data.json and caculate medals
  const jsonData = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));
  const totalMedals = calculateTotalMedals(jsonData);

  // Find the maximum number of medals
  const maxMedals = Math.max(...Object.values(totalMedals));
  const minOpacity = 0.65; // minimum opacity value

  for (let clusterIndex = 0; clusterIndex < clusterData.length; clusterIndex++) {
    const { countries } = clusterData[clusterIndex];
    const color = colors[clusterIndex % colors.length];

    for (const countryCode of countries) {
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
          svgOptions: { color: rgbaColor, radius: 0.4 }
        });
      });
    }
  }
  
  const svgMap = map.getSVG({
    width: 800,
    height: 400,
    backgroundColor: '#1f1f1f'
  });

  fs.writeFileSync(`./files/map_clusters.svg`, svgMap);
}

module.exports = { generateMap };
