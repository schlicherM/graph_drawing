const fs = require('fs');
const { generateMap } = require('./generateMap');
const { mapCountriesToGeoJson } = require('./countryToNoc');
const { readJsonFileSync, getConfig, } = require("./utilities/util");
const { kmeans, calculateClusterAverages } = require("./kmeans");

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
        const numClusters = getConfig("cl_num_clusters");

        // Perform k-means clustering
        const clusters = kmeans(dataForClustering, numClusters, countryNames);

        // Calculate average medals for each cluster
        clusterAverages = calculateClusterAverages(clusters);
        // for(cluster of clusterAverages)
        //     console.log(cluster);

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