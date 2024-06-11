const turf = require('@turf/turf');
const { log } = require('console');
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

  if(countryFeature.id == "RUS") {
    bbox = [-10, 41.151416, 200, 81.2504]
  }

  const cellSize = 20;
  const grid = turf.pointGrid(bbox, cellSize);

  let pointsWithin;
  if(countryFeature.id == "RUS") {
     pointsWithin = grid.features.filter(point =>
      turf.booleanPointInPolygon(point, countryFeature)
    );
   
  } else {
     pointsWithin = grid.features.filter(point =>
      turf.booleanPointInPolygon(point, countryFeature)

    );
  }

  if(countryFeature.id == "JPN") {
    // log(grid.features.filter(point =>
    //   turf.booleanPointInPolygon(point, countryFeature)))
  }

  return pointsWithin;
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

  for (let clusterIndex = 0; clusterIndex < clusterData.length; clusterIndex++) {
    const countries  = clusterData[clusterIndex].countries;
    const color = colors[clusterIndex % colors.length];

    const isoCountries = mapCountriesToGeoJson(countries);  

    

    for (const countryCode of isoCountries) {
      const countryFeature = geojson.features.find(feature => feature.id === countryCode);
      if (!countryFeature) {

        console.warn(`Country with ISO code ${countryCode} not found`);
        continue;
      }

     

      const pointsWithin = await generatePointsForCountry(countryFeature);

      pointsWithin.forEach(point => {

        const [lng, lat] = point.geometry.coordinates;
        map.addPin({
          lat,
          lng,
          svgOptions: { color, radius: 0.4 }
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
