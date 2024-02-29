const config = require('./config.json');

// Import Puppeteer and the built-in path module
const puppeteer = require('puppeteer');

let retries = 50;

function printProgress(msg) {
  console.clear();
  console.log(msg);
}

const run = async () => {
  let interval = null;
  let urls = {};
  let pages = {};

  // Load URL
  config.forEach(params => {
    const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

    urls[params.algorithm] = `https://browserminer.vercel.app?${query}`;
  });

  try {
    const algos = Object.keys(urls);

    console.log(`[Native]: Browser starting...`);
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

    for (let index = 0; index < algos.length; index++) {
      const algo = algos[index];
      const url = urls[algo];

      console.log(`[Native]: Page starting with url "${url}"`);

      // Create a new page
      const page = await browser.newPage();

      // Navigate to the file URL
      await page.goto(url);

      // Store page
      pages[algo] = page;
    }

    // Log
    interval = setInterval(async () => {
      try {
        const msg = [];
        for (let index = 0; index < algos.length; index++) {
          const algo = algos[index];
          const page = pages[algo];
          let hash = await page.evaluate(() => document.querySelector('#hashrate')?.innerText ?? "0 H/s");
          let shared = await page.evaluate(() => document.querySelector('#shared')?.innerText ?? "0");
          msg.push(`[${algo.toUpperCase()}]: Current: ${hash} ***  Shared: ${shared}`)
        }
        printProgress(msg.join('\n'));
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
    }, 6000);

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