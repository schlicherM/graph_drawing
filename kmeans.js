const { getConfig } = require("./utilities/util");
const { euclideanDistance, manhattanDistance, cosineDistance } = require("./utilities/distance_measures");

function distanceFunction(a, b) {
    // https://arxiv.org/pdf/1708.04321
    id = getConfig("cl_distance_measure");
    id_map = {
        "euclidean": euclideanDistance,
        "cosine": cosineDistance,
        "manhattan": manhattanDistance
    };
    f = null;
    if (id in id_map) {
        f = id_map[id];
    }
    else {
        throw new Error("Distance function '" + id + "' is not implemented.");
    }
    return f(a, b);
}

// K-means clustering with country names
function kmeans(data, k, countryNames) {
    let centroids = data.slice(0, k).map((d, i) => ({ data: d, countries: [countryNames[i]] }));
    let clusters = Array.from({ length: k }, () => ({ data: [], countries: [] }));

    // threshold for centroid updates, used to offset numerical inaccuracy
    let epsilon = 0;
    if (getConfig("cl_distance_measure") == "cosine")
        epsilon = 0.2;

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
                let distance = distanceFunction(point, centroid.data);
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
            if (cluster.data.length === 0)
                return;
            let newCentroid = cluster.data[0].map((_, i) => ({
                axis: cluster.data[0][i].axis,
                value: cluster.data.reduce((sum, point) => sum + point[i].value, 0) / cluster.data.length
            }));
            if (distanceFunction(newCentroid, centroids[index].data) > epsilon) {
                // console.log(distanceFunction(newCentroid, centroids[index].data)+" > "+epsilon);
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
        if (cluster.data.length === 0)
            return { data: [], countries: cluster.countries };
        let avgData = cluster.data[0].map((_, i) => ({
            axis: cluster.data[0][i].axis,
            value: cluster.data.reduce((sum, point) => sum + point[i].value, 0) / cluster.data.length
        }));
        return { data: avgData, countries: cluster.countries };
    });
}

module.exports = {kmeans, calculateClusterAverages};
