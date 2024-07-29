const fs = require('fs');
const puppeteer = require('puppeteer');

// Function to convert SVG to high-resolution PNG
const convertSvgToPng = async (svgFilePath, outputPngFilePath, width, height) => {
  // Read the SVG file content
  const svgData = fs.readFileSync(svgFilePath, 'utf8');


  // Launch a headless browser using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the viewport to the desired size
  await page.setViewport({ width, height });

  // Set the content of the page to the SVG data
  await page.setContent(`<div id="svg-container">${svgData}</div>`);

  // Wait for the SVG to load
  await page.waitForSelector('#svg-container svg');

  // Take a screenshot of the SVG and save it as a PNG
  const element = await page.$('#svg-container svg');
  await element.screenshot({ path: outputPngFilePath, omitBackground: true });

  // Close the browser
  await browser.close();

  console.log('PNG saved:', outputPngFilePath);
};

// Example usage:
const svgFilePath = './files/map_clusters.svg'; // Path to your SVG file
const outputPngFilePath = './files/newMapHigherContrast.png'; // Path to save the PNG file
const width = 8200; // Desired width of the PNG
const height= 0; // Desired height of the PNG



convertSvgToPng(svgFilePath, outputPngFilePath, width, height);