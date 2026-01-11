const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const outDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = 'http://localhost:5174/';
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for app to render input
  await page.waitForSelector('.guess-input', { timeout: 10000 });

  // Submit a wrong guess
  await page.fill('.guess-input', 'WRONG ANSWER');
  await page.click('.btn.submit');
  await page.waitForTimeout(600); // wait for message to appear
  await page.screenshot({ path: path.join(outDir, 'wrong.png'), fullPage: true });
  console.log('Saved wrong.png');

  // Submit the correct guess for the current movie
  // Use the answer pattern on the page: we'll try common test answers
  // First try THE DARK KNIGHT
  await page.fill('.guess-input', 'THE DARK KNIGHT');
  await page.click('.btn.submit');

  // wait for applause overlay or result.right
  try {
    await page.waitForSelector('.applause-overlay, .result.right', { timeout: 5000 });
  } catch (e) {
    console.warn('Applause not detected within timeout, capturing anyway');
  }

  await page.waitForTimeout(800); // let confetti animate
  await page.screenshot({ path: path.join(outDir, 'correct.png'), fullPage: true });
  console.log('Saved correct.png');

  await browser.close();
  console.log('Done');
})();
