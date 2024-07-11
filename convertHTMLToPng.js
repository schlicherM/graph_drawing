const fs = require('fs');
const puppeteer = require('puppeteer');

// Function to convert SVG to high-resolution PNG
const convertHTMLToPng = async (page_url, outputPngFilePath, width, height, scale) => {
  // Launch a headless browser using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the viewport to the desired size
  await page.setViewport({ width, height });

  // Set the content of the page to the SVG data
  await page.goto(page_url)
  await page.evaluate((scale) => {document.body.style.zoom = scale;}, scale);
  await page.screenshot({ 
    saveHtml: false, 
    path: outputPngFilePath, 
    omitBackground: true, 
    fullPage: false
  });

  // Close the browser
  await browser.close();

  console.log('PNG saved:', outputPngFilePath);
};

// Example usage:
const page_url = "http://localhost:8080/all_clusters_map_charts-screenshot-page.html";
const outputPngFilePath = './files/charts_output.png'; // Path to save the PNG file
const scale = 4
const width = scale*1000; // Desired width of the PNG
const height= scale*1000*2; // Desired height of the PNG




convertHTMLToPng(page_url, outputPngFilePath, width, height, scale);
