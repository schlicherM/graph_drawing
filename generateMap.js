const turf = require('@turf/turf');
const fs = require('fs');
const DottedMap = require('dotted-map').default;
const { mapCountriesToGeoJson } = require('./countryToNoc');

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

  if (countryFeature.id == "JPN") {
    // log(grid.features.filter(point =>
    //   turf.booleanPointInPolygon(point, countryFeature)))
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

// Function to calculate the maximum number of medals for each cluster
function calculateMaxMedals(clusterData, totalMedals) {
  return clusterData.map(cluster => {
      const countries = cluster.countries;
      const isoCountries = mapCountriesToGeoJson(countries);
      const clusterMedals = isoCountries.map(countryCode => totalMedals[countryCode] || 0);
      return Math.max(...clusterMedals);
  });
}


// Function to calculate opacity based on the number of medals
function calculateOpacity(medals, maxMedals, minOpacity) {
  return Math.max(minOpacity, (medals / maxMedals));
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

  // add colors for clusters
  const colors = [
    '#2d1a82', '#1a2d82', '#1a823d', '#823d1a', '#821a64'
  ];

  // load data.json and calculate medals
  const jsonData = JSON.parse(fs.readFileSync('public/data.json', 'utf8'));
  const totalMedals = calculateTotalMedals(jsonData);

  // Find the maximum number of medals for each cluster
  const maxMedalsPerCluster = calculateMaxMedals(clusterData, totalMedals);
  const minOpacity = 0.10; // minimum opacity value

  for (let clusterIndex = 0; clusterIndex < clusterData.length; clusterIndex++) {
    const countries = clusterData[clusterIndex].countries;
    const color = colors[clusterIndex % colors.length];
    const maxMedals = maxMedalsPerCluster[clusterIndex];

    const isoCountries = mapCountriesToGeoJson(countries);

    // Ausgabe der Länder und Medaillen des vierten Clusters
   /*  if (clusterIndex === 3) {
      console.log(`Länder, Medaillen und Opazität für Cluster 4:`);
      isoCountries.forEach(countryCode => {
        const medals = totalMedals[countryCode] || 0;
        const opacity = calculateOpacity(medals, maxMedals, minOpacity);
        if(opacity>0.7){
          console.log(`Land: ${countryCode}, Medaillen: ${medals}, Opazität: ${opacity.toFixed(2)}`);
        }
      });
    } */

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
