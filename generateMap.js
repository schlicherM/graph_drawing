const turf = require('@turf/turf');
const fs = require('fs');
const DottedMap = require('dotted-map').default;
const { mapCountriesToGeoJson } = require('./countryToNoc');
const { readJsonFileSync, getConfig } = require("./utilities/util");

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

function filterLinksByCountry(links, country) {
  return links.filter(link => link.target === country);
}

// Calculate medals for each category by country
function calculateMedalsByCategory(filteredLinks, categories) {
  let categoryTotals = {};
  let totalMedalsForCountry = 0;

  filteredLinks.forEach(link => {
    let category = link.source; // Use link.source to get the category
    if (category !== "other" && category !== "teams") { // Exclude "other" and "teams"
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      link.attr.forEach(() => {
        categoryTotals[category]++;
        totalMedalsForCountry++; // Increment total medals for the country
      });
    }
  });

  return {
    totalMedalsForCountry,
    categories: categories.map(category => ({
      axis: category,
      value: (categoryTotals[category] / totalMedalsForCountry) || 0 // Normalize by total medals for the country
    }))
  };
}

// Function to calculate total medals for each country
function calculateTotalMedals(data) {
  const categories = [...new Set(data.links.map(link => link.source))].filter(category => category !== "other" && category !== "teams"); // Get unique categories from data, excluding "other" and "teams"
  let medalsPerCountry = {};

  data.nodes.forEach(node => {
    if (node.noc) { // Ensure node has a country code (noc)
      let filteredLinks = filterLinksByCountry(data.links, node.id);

      // Calculate medals by category
      const { totalMedalsForCountry } = calculateMedalsByCategory(filteredLinks, categories);

      medalsPerCountry[node.noc] = totalMedalsForCountry;
    }
  });

  return medalsPerCountry;
}

// Function to calculate opacity using logarithmic scaling
function calculateLogOpacity(medals, minMedals, maxMedals, minOpacity, maxOpacity) {
  if (medals === 0) return minOpacity;
  const logMinMedals = Math.log(minMedals + 1);
  const logMaxMedals = Math.log(maxMedals + 1);
  const logMedals = Math.log(medals + 1);
  return minOpacity + (logMedals - logMinMedals) * (maxOpacity - minOpacity) / (logMaxMedals - logMinMedals);
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
  const geojson = readJsonFileSync('./public/countries.geo.json');

  const map = new DottedMap({
    height: 240,//150
    grid: 'diagonal'
  });

  // add colors for clusters
  const colors = getConfig("map_color_sequence");

  // load filtered_data.json and calculate medals
  const jsonData = JSON.parse(fs.readFileSync('public/filtered_data.json', 'utf8'));
  const totalMedals = calculateTotalMedals(jsonData);

  // console.log("Total Medals Data: ", totalMedals); // Output the total medals data

  // Find the maximum number of medals for each cluster
  const minOpacity = getConfig("map_min_opacity"); // minimum opacity value
  const maxOpacity = 1.0; // maximum opacity value

  // Berechne die minimale und maximale Anzahl an Medaillen über alle Länder
  const allMedalCounts = Object.values(totalMedals);
  const globalMaxMedals = Math.max(...allMedalCounts);
  const globalMinMedals = Math.min(...allMedalCounts);

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
      const opacity = calculateLogOpacity(medals, globalMinMedals, globalMaxMedals, minOpacity, maxOpacity);
      const rgbaColor = hexToRgba(color, opacity.toFixed(2));
      
      // manually added countries ;)
      if(
        countryCode == "BRN"
      ){
        console.log(countryCode)
        console.log(pointsWithin.length)
        console.log(rgbaColor)
      }

      pointsWithin.forEach(point => {
        const [lng, lat] = point.geometry.coordinates;
        map.addPin({
          lat,
          lng,
          svgOptions: { color: rgbaColor, radius: 0.4 }//0.4
        });
      });
    }
  }

  const svgMap = map.getSVG({
    width: 8200,
    height: 4000,
    color: getConfig("map_color_bg-dark"),
    backgroundColor: null
  });

  fs.writeFileSync(`./files/map_clusters.svg`, svgMap);
}

module.exports = { generateMap };
