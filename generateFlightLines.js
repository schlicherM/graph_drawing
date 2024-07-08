const fs = require('fs');

// Dynamically load d3
async function fetchD3() {
  return await import('d3');
}

// Define example flight lines
const flights = [
  { origin: { lon: -74.00597, lat: 40.71427 }, destination: { lon: 2.35222, lat: 48.85661 } }, // New York to Paris
  { origin: { lon: 139.69171, lat: 35.6895 }, destination: { lon: -0.127758, lat: 51.507351 } } // Tokyo to London
];

// Function to draw flight lines
async function generateFlightLines() {
  const d3 = await fetchD3();

  // Create a simple SVG document
  const width = 800;
  const height = 400;
  let svg = '';

  // Set up a D3 projection
  const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

  // Draw flight lines
  flights.forEach(flight => {
    const origin = projection([flight.origin.lon, flight.origin.lat]);
    const destination = projection([flight.destination.lon, flight.destination.lat]);

    svg += `<path d="M${origin[0]},${origin[1]}L${destination[0]},${destination[1]}" stroke="#ffcc00" stroke-width="2" fill="none"/>`;
  });

  // Combine SVG header, content, and footer

  // Write the flight lines SVG to a file
  fs.writeFileSync('./files/flight_lines.svg', svg);
}

// Export the function
module.exports = { generateFlightLines };

// Execute the function if the file is run directly
if (require.main === module) {
  generateFlightLines().then(() => {
    console.log('Flight lines SVG generated.');
  }).catch(err => {
    console.error('Error generating flight lines SVG:', err);
  });
}
