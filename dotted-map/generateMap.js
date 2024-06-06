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
  // Create a bounding box around the country and generate a grid of points
  const bbox = turf.bbox(countryFeature);
  const cellSize = 40; // Adjust the cell size as needed (in degrees)
  const grid = turf.pointGrid(bbox, cellSize);

  // Filter points to ensure they are within the country boundary
  const pointsWithin = grid.features.filter(point =>
    turf.booleanPointInPolygon(point, countryFeature)
  );

  return pointsWithin;
}

// Create a dotted map with points for multiple countries
async function generateMap(countryCodes, color = '#2d1a82') {
  const geojson = fetchGeoJSON();

  // Create a new map instance
  const map = new DottedMap({
    height: 150,
    grid: 'diagonal',
    color,
    radius: 0.4
  });

  // Process each country
  for (const countryCode of countryCodes) {
    // Find the country feature by its ISO code
    const countryFeature = geojson.features.find(feature => feature.id === countryCode);
    if (!countryFeature) {
      console.warn(`Country with ISO code ${countryCode} not found`);
      continue;
    }

    // Generate points for the country
    const pointsWithin = await generatePointsForCountry(countryFeature);

    // Add points to the map
    pointsWithin.forEach(point => {
      const [lng, lat] = point.geometry.coordinates;
      map.addPin({
        lat,
        lng,
        svgOptions: { color, radius: 0.4 }  // Customize the appearance of the dots
      });
    });
  }

  // Generate the SVG map
  const svgMap = map.getSVG({
    width: 800,
    height: 400,
    backgroundColor: '#1f1f1f',
    radius: 0.4
  });

  // Output the SVG to a file
  fs.writeFileSync('dotted_map.svg', svgMap);
}

module.exports = { generateMap };
