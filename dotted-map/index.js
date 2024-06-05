const turf = require('@turf/turf');
const axios = require('axios');
const DottedMap = require('dotted-map').default;
const fs = require('fs');

// Function to fetch GeoJSON data
async function fetchGeoJSON() {
  const url = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
  const response = await axios.get(url);
  return response.data;
}

// Generate a grid of points within the country boundary
async function generatePointsForCountry(countryFeature) {
  // Create a bounding box around the country and generate a grid of points
  const bbox = turf.bbox(countryFeature);
  const cellSize = 0.5; // Adjust the cell size as needed (in degrees)
  const grid = turf.pointGrid(bbox, cellSize);

  // Filter points to ensure they are within the country boundary
  const pointsWithin = grid.features.filter(point =>
    turf.booleanPointInPolygon(point, countryFeature)
  );

  return pointsWithin;
}

// Create a dotted map with points for multiple countries
async function createDottedMapForCountries(countryCodes, color) {
  const geojson = await fetchGeoJSON();

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
    const countryFeature = geojson.features.find(feature => feature.properties.ISO_A3 === countryCode);
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

// Example usage: Create a dotted map for multiple countries
const countries = ['CAN', 'DEU', 'JPN']; // Add more country codes as needed
createDottedMapForCountries(countries, '#2d1a82').then(() => {
  console.log('Dotted map created for specified countries');
}).catch(err => {
  console.error(err);
});
