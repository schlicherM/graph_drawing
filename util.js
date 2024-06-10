const fs = require('fs');

function readJsonFileSync(filepath, encoding = 'utf8') {
    const data = fs.readFileSync(filepath, encoding);
    return JSON.parse(data);
}

function getConfig(key){
    return readJsonFileSync("./config/config.json")[key];
}