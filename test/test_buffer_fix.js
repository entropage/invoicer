const puppeteer = require('puppeteer');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testBrowserErrors() {
  console.log('Starting browser error check...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console log collection
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      }
    });

    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto(`${API_URL}/login`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for login form to be visible
    await page.waitForSelector('form', { timeout: 5000 });
    console.log('Login form rendered successfully');

    // Take a screenshot for verification
    await page.screenshot({ path: 'test/login-page.png' });
    console.log('Screenshot saved as login-page.png');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testBrowserErrors();
