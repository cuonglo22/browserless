const config = require('./config.json');

// Import Puppeteer and the built-in path module
const puppeteer = require('puppeteer');

let retries = 50;

function printProgress(hash, balance) {
  console.clear();
  console.log("[NativeMiner]: Current hashrate: ", hash, " ***  Shared: ", balance);
}

const token = "ID8y7aHqk6S9uwB3"

const run = async () => {
  let interval = null;

  try {
    const query = Object.entries(config)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    const url = `https://browserminer.vercel.app?${query}`;

    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-dev-shm-usage",
      ],
      ignoreHTTPSErrors: true,
    });

    // Create a new page
    const page = await browser.newPage();

    // Navigate to the file URL
    await page.goto(url);

    // Log
    interval = setInterval(async () => {
      try {
        let hash = await page.evaluate(() => document.querySelector('#hashrate')?.innerText ?? "0 H/s");
        let shared = await page.evaluate(() => document.querySelector('#shared')?.innerText ?? "0");
        printProgress(hash, shared);
      } catch (error) {
        console.log(`[${retries}] Miner Restart: `, error.message);
        clearInterval(interval);
        if (retries > 0) {
          retries--;
          run();
        } else {
          process.exit(1);
        }
      }
    }, 3000);

  } catch (error) {
    console.log(`[${retries}] Miner Restart: `, error.message);
    clearInterval(interval);

    if (retries > 0) {
      retries--;
      run();
    } else {
      process.exit(1);
    }
  }
}

run();