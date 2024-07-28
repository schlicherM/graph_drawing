const fs = require('fs');
const { mapCountriesToGeoJson } = require('./countryToNoc');
const { log } = require('console');
const { SourceTextModule } = require('vm');

const turf = require('@turf/turf');
const DottedMap = require('dotted-map').default;

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

  fs.writeFileSync(`./files/old_map_clusters.svg`, svgMap);
}


 /* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */

        ////////////////////////////////////////////////////////////// 
        //////////////////////// Set-Up ////////////////////////////// 
        ////////////////////////////////////////////////////////////// 
        var margin = {top: 50, right: 50, bottom: 50, left: 50},
            width = 100,
            height = width;

        ////////////////////////////////////////////////////////////// 
        /////////////////////// Fetch Data ///////////////////////////
        //////////////////////////////////////////////////////////////
        var continents = {
            "Oceania" : ["ASA", "AUS", "COK", "FIJ", "FSM", "GUM", "KIR", "MHL", "NRU", "NZL", "PLW", "PNG", "SAM", "SOL", "TGA", "TUV", "VAN"],
            "Europe" : ["ALB", "AND", "ARM", "AUT", "AZE", "BLR", "BEL", "BIH", "BUL", "CRO", "CYP", "CZE", "DEN", "EST", "FIN", "FRA", "GEO", "GER","GBR", "GRE", "HUN", "ISL", "IRL", "ISR", "ITA", "KOS", "LAT", "LIE", "LTU", "LUX", "MLT", "MDA", "MON", "MNE", "NED", "MKD", "NOR", "POL", "POR", "ROU", "RUS", "SMR", "SRB", "SVK","SLO", "ESP", "SWE", "SUI", "TUR", "UKR"],
            "America" : ["ANT", "ARG", "ARU", "BAH", "BAR", "BIZ", "BER", "BOL", "BRA", "IVB", "CAN", "CAY", "CHI", "COL", "CRC", "CUB", "DMA", "DOM", "ECU", "ESA", "GRN", "GUA", "GUY", "HAI", "HON", "JAM", "MEX", "NCA", "PAN", "PAR", "PER", "PUR", "SKN", "LCA", "VIN", "SUR", "TTO", "USA", "URU", "VEN", "ISV"],
            "Africa" : ["ALG", "EGY", "LBA", "MAR", "SUD", "TUN", "BEN", "BUR", "CPV", "GAM", "GHA", "GUI", "GBS", "CIV", "LBR", "MLI", "MTN", "NIG", "NGR", "SEN", "SLE", "TOG", "CMR", "CAF", "CHA", "CGO", "COD", "GEQ", "GAB", "STP", "BDI", "DJI", "ERI", "ETH", "KEN", "RWA", "SEY", "SOM", "SSD", "TAN", "UGA", "ANG", "BOT", "COM", "SWZ", "LES", "MAD", "MAW", "MRI", "MOZ", "NAM", "RSA", "ZAM", "ZIM"],
            "Asia" : ["BRN", "IRI", "IRQ", "JOR", "KUW", "LBN", "OMA", "PLE", "QAT", "KSA", "SYR", "UAE", "YEM", "AFG", "KAZ", "KGZ", "TJK", "TKM", "UZB", "BAN", "BHU", "IND", "MDV", "NEP", "PAK", "SRI", "CHN", "HKG", "MAC", "JPN", "PRK", "KOR", "TPE", "MGL", "BRU", "CAM", "INA", "LAO", "MAS", "MYA", "PHI", "SGP", "THA", "TLS", "VIE"]
        };

        // Calculate total medals for each category across all countries
        function calculateTotalMedals(jsonData) {
            let totalMedals = {};
            jsonData.links.forEach(link => {
                let category = link.source;  // Use link.source to get the category
                if (category !== "other" && category !== "teams") {  // Exclude "other" and "teams"
                    link.attr.forEach(attr => {
                        if (!totalMedals[category]) {
                            totalMedals[category] = 0;
                        }
                        totalMedals[category]++;
                    });
                }
            });
            return totalMedals;
        }

        // Filter links by country
        function filterLinksByCountry(links, country) {
            return links.filter(link => link.target === country);
        }

        // Calculate medals for each category by country
function calculateMedalsByCategory(filteredLinks, categories) {
    let categoryTotals = {};
    let totalMedalsForCountry = 0;

    filteredLinks.forEach(link => {
        let category = link.source;  // Use link.source to get the category
        if (category !== "other" && category !== "teams") {  // Exclude "other" and "teams"
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            link.attr.forEach(attr => {
                categoryTotals[category]++;
                totalMedalsForCountry++;  // Increment total medals for the country
            });
        }
    });

    return categories.map(category => ({
        axis: category,
        value: (categoryTotals[category] / totalMedalsForCountry) || 0  // Normalize by total medals for the country
    }));
}

// Prepare data for radar chart for each country
function prepareRadarChartData(data) {
    const categories = [...new Set(data.links.map(link => link.source))].filter(category => category !== "other" && category !== "teams");  // Get unique categories from data, excluding "other" and "teams"
    let radarData = {};

    data.nodes.forEach(node => {
        if (node.noc) {  // Ensure node has a country code (noc)
            let filteredLinks = filterLinksByCountry(data.links, node.id);
            let countryData = calculateMedalsByCategory(filteredLinks, categories);
            radarData[node.noc] = countryData;
        }
    });

    return radarData;
}

// Euclidean distance function
function euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value.value - b[index].value, 2), 0));
}

// K-means clustering with country names
function kmeans(data, k, countryNames) {
    let centroids = data.slice(0, k).map((d, i) => ({ data: d, countries: [countryNames[i]] }));
    let clusters = Array.from({ length: k }, () => ({ data: [], countries: [] }));

    let change = true;
    while (change) {
        change = false;

        // Assign points to clusters
        clusters.forEach(cluster => {
            cluster.data.length = 0;
            cluster.countries.length = 0;
        });

        data.forEach((point, idx) => {
            let minDistance = Infinity;
            let clusterIndex = 0;
            centroids.forEach((centroid, index) => {
                let distance = euclideanDistance(point, centroid.data);
                if (distance < minDistance) {
                    minDistance = distance;
                    clusterIndex = index;
                }
            });
            clusters[clusterIndex].data.push(point);
            clusters[clusterIndex].countries.push(countryNames[idx]);
        });

        // Update centroids
        clusters.forEach((cluster, index) => {
            if (cluster.data.length === 0) return;
            let newCentroid = cluster.data[0].map((_, i) => ({
                axis: cluster.data[0][i].axis,
                value: cluster.data.reduce((sum, point) => sum + point[i].value, 0) / cluster.data.length
            }));
            if (euclideanDistance(newCentroid, centroids[index].data) > 0) {
                centroids[index].data = newCentroid;
                centroids[index].countries = cluster.countries.slice();
                change = true;
            }
        });
    }

    return clusters;
}

// Calculate average medals for each cluster
function calculateClusterAverages(clusters) {
    return clusters.map(cluster => {
        if (cluster.data.length === 0) return { data: [], countries: cluster.countries };
        let avgData = cluster.data[0].map((_, i) => ({
            axis: cluster.data[0][i].axis,
            value: cluster.data.reduce((sum, point) => sum + point[i].value, 0) / cluster.data.length
        }));
        return { data: avgData, countries: cluster.countries };
    });
}

// Function to read JSON file
function readJsonFileSync(filepath, encoding = 'utf8') {
    const file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}


// Fetch JSON data from URL
function generateRadarCharts() {
    try {
        const jsonData = readJsonFileSync('public/filtered_data.json');

        // Process the JSON data
        const radarChartData = prepareRadarChartData(jsonData);


        // Convert radar chart data to an array for clustering
        const dataForClustering = Object.values(radarChartData);
        const countryNames = Object.keys(radarChartData);

        // Number of clusters (adjust as needed)
        const numClusters = 5;

        // Perform k-means clustering
        const clusters = kmeans(dataForClustering, numClusters, countryNames);

        // Calculate average medals for each cluster
        const clusterAverages = calculateClusterAverages(clusters);
    

        clusterAverages.forEach((clusterAvg, clusterIndex) => {
            var nocToIso = mapCountriesToGeoJson(clusterAverages[clusterIndex].countries);
            clusterAverages[clusterIndex].countries = nocToIso;
        });
        
        generateMap(clusterAverages).then(() => {
            console.log('Combined dotted map created for all clusters');
        }).catch(err => {
            console.error(err);
        });

        

    } catch (error) {
        console.error('Error generating radar charts:', error);
    }
}

generateRadarCharts();