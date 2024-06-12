const { log } = require('console');
const fs = require('fs');
const { ClientRequest } = require('http');

// Load the geojson file
const countriesGeo = JSON.parse(fs.readFileSync('public/countries.geo.json', 'utf8'));

// Load the data file
const nocData = JSON.parse(fs.readFileSync('public/filtered_data.json', 'utf8'));

// Extract country names and IDs from geojson
const countryGeoData = countriesGeo.features.map(feature => ({
    name: feature.properties.name,
    id: feature.id
}));

// Function to find matching NOC code using name or id
function findMatchingNoc(country, nocData) {
    for (let entry of nocData.nodes) {
        if (entry.name.toLowerCase() === country.name.toLowerCase() || entry.id === country.id) {
            return entry.id;
        }
    }
    return null;
}

// Create mapping of countries to NOC codes
const countryToNoc = {};
countryGeoData.forEach(country => {
    let nocCode = findMatchingNoc(country, nocData);
    countryToNoc[country.id] = nocCode;
});

const countryMap = {};

function nocToCountry(countryCodes) {
    nocData.nodes.forEach(node => {
        if (node.noc) {
            countryMap[node.id] = node.name;
        }
    });
    
    return countryCodes.map(code => ({ "id" :code, "name": countryMap[code] }));
}


// Function to map an array of country codes
function mapCountriesToGeoJson(countryCodes) {
    var countryData = nocToCountry(countryCodes);
    
    var array = countryCodes;

    for(let i in countryData) {
        for(let j in countryGeoData) {
            if(countryData[i].id === j.id || countryData[i].name === countryGeoData[j].name) {
                array[i] = countryGeoData[j].id
            }
        } 
    }
    return array;
}



module.exports = {mapCountriesToGeoJson} ;


/* //Check if country is not in data.json
Object.entries(countryToNoc).map(entry => {
    let key = entry[0];
    let value = entry[1];
    if(key == null || value == null ) {
        console.log(key);
    }
});
*/