const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('[+] Starting login functionality test');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log('[*] Browser launched');

    // Navigate to login page
    await page.goto('http://10.0.0.105:3001/login');
    console.log('[*] Navigated to login page');

    // Wait for login form to load
    await page.waitForSelector('form');
    console.log('[*] Login form loaded');

    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('[*] Login page screenshot saved');

    // Fill in login form
    await page.type('input[type="text"]', 'test');
    await page.type('input[type="password"]', 'test123');
    console.log('[*] Filled in login credentials');

    // Submit form
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
    console.log('[*] Submitted login form');

    // Check if redirected to home page
    const url = page.url();
    console.log(`[*] Current URL: ${url}`);
    
    if (url === 'http://10.0.0.105:3001/') {
      console.log('[+] Login successful - redirected to home page');
    } else {
      console.log('[-] Login failed - not redirected to home page');
    }

    // Take screenshot of home page
    await page.screenshot({ path: 'home-page.png' });
    console.log('[*] Home page screenshot saved');

    // Check for error messages
    const errorElement = await page.$('div[style*="backgroundColor: #ffebee"]');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log(`[-] Error message found: ${errorText}`);
    }

    // Check local storage for token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (token) {
      console.log('[+] JWT token found in localStorage');
    } else {
      console.log('[-] No JWT token found in localStorage');
    }

  } catch (error) {
    console.error('[-] Test failed:', error);
  } finally {
    await browser.close();
    console.log('[*] Browser closed');
  }
}

// Run the test
testLogin().catch(console.error); 