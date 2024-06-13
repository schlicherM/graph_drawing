function cosineSimilarity(a, b) {
    mag_a = 0;
    mag_b = 0;
    dot = a.reduce((s, e, i) => {
        mag_a += e.value * e.value;
        mag_b += b[i].value * b[i].value;
        return s + (e.value * b[i].value);
    }, 0);
    mag_a = Math.sqrt(mag_a);
    mag_b = Math.sqrt(mag_b);
    return dot / (mag_a * mag_b);
}

function euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value.value - b[index].value, 2), 0));
}

function manhattanDistance(a, b) {
    return a.reduce((s, e, i) => s + Math.abs(e.value - b[i].value), 0);
}

module.exports = {cosineSimilarity, euclideanDistance, manhattanDistance};