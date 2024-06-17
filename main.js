const fs = require('fs');
const { generateMap } = require('./generateMap');
const { mapCountriesToGeoJson } = require('./countryToNoc');
const { log } = require('console');
const { SourceTextModule } = require('vm');
const { readJsonFileSync, } = require("./utilities/util");
const { kmeans, calculateClusterAverages } = require("./kmeans");

const margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 100,
    height = width;

const continents = {
    "Oceania": ["ASA", "AUS", "COK", "FIJ", "FSM", "GUM", "KIR", "MHL", "NRU", "NZL", "PLW", "PNG", "SAM", "SOL", "TGA", "TUV", "VAN"],
    "Europe": ["ALB", "AND", "ARM", "AUT", "AZE", "BLR", "BEL", "BIH", "BUL", "CRO", "CYP", "CZE", "DEN", "EST", "FIN", "FRA", "GEO", "GER", "GBR", "GRE", "HUN", "ISL", "IRL", "ISR", "ITA", "KOS", "LAT", "LIE", "LTU", "LUX", "MLT", "MDA", "MON", "MNE", "NED", "MKD", "NOR", "POL", "POR", "ROU", "RUS", "SMR", "SRB", "SVK", "SLO", "ESP", "SWE", "SUI", "TUR", "UKR"],
    "America": ["ANT", "ARG", "ARU", "BAH", "BAR", "BIZ", "BER", "BOL", "BRA", "IVB", "CAN", "CAY", "CHI", "COL", "CRC", "CUB", "DMA", "DOM", "ECU", "ESA", "GRN", "GUA", "GUY", "HAI", "HON", "JAM", "MEX", "NCA", "PAN", "PAR", "PER", "PUR", "SKN", "LCA", "VIN", "SUR", "TTO", "USA", "URU", "VEN", "ISV"],
    "Africa": ["ALG", "EGY", "LBA", "MAR", "SUD", "TUN", "BEN", "BUR", "CPV", "GAM", "GHA", "GUI", "GBS", "CIV", "LBR", "MLI", "MTN", "NIG", "NGR", "SEN", "SLE", "TOG", "CMR", "CAF", "CHA", "CGO", "COD", "GEQ", "GAB", "STP", "BDI", "DJI", "ERI", "ETH", "KEN", "RWA", "SEY", "SOM", "SSD", "TAN", "UGA", "ANG", "BOT", "COM", "SWZ", "LES", "MAD", "MAW", "MRI", "MOZ", "NAM", "RSA", "ZAM", "ZIM"],
    "Asia": ["BRN", "IRI", "IRQ", "JOR", "KUW", "LBN", "OMA", "PLE", "QAT", "KSA", "SYR", "UAE", "YEM", "AFG", "KAZ", "KGZ", "TJK", "TKM", "UZB", "BAN", "BHU", "IND", "MDV", "NEP", "PAK", "SRI", "CHN", "HKG", "MAC", "JPN", "PRK", "KOR", "TPE", "MGL", "BRU", "CAM", "INA", "LAO", "MAS", "MYA", "PHI", "SGP", "THA", "TLS", "VIE"]
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

function generateClustering(){
    clusterAverages = Object();
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
        clusterAverages = calculateClusterAverages(clusters);
        for(cluster of clusterAverages)
            console.log(cluster);

        clusterAverages.forEach((clusterAvg, clusterIndex) => {
            var nocToIso = mapCountriesToGeoJson(clusterAverages[clusterIndex].countries);
            clusterAverages[clusterIndex].countries = nocToIso;
        });
    } catch (error) {
        console.error('Error while generating clustering: ', error);
    }
    fs.writeFile('files/kmeans_clustering.json', JSON.stringify(clusterAverages), e => {
        if (e) console.error('Error while saving clustering: ', e);
    });
    return clusterAverages;
}

function generateMapFromClustering(clusterAverages) {
    generateMap(clusterAverages).then(() => {
        console.log('Combined dotted map created for all clusters');
    }).catch(err => {
        console.error('Error generating dotted map: ', err);
    });
}

const clusters = generateClustering();
generateMapFromClustering(clusters);