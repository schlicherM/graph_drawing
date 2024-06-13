const fs = require('fs');

function readJsonFileSync(filepath, encoding = 'utf8') {
    const data = fs.readFileSync(filepath, encoding);
    return JSON.parse(data);
}

function getConfig(key){
    const config = readJsonFileSync("./config/config.json");
    value = null;
    if(key in config){
        value = config[key];
    }
    else{
        throw new Error("Config key '"+key+"' was not found in the config file.");
    }
    return value;
}