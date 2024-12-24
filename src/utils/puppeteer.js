// @flow
// libs
import * as puppeteer from 'puppeteer';

export async function getPdf(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    executablePath: '/usr/bin/google-chrome',
    ignoreHTTPSErrors: true
  });

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);
    
    // Wait for network idle to ensure the page is fully loaded
    await page.goto(url, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: 20,
        bottom: 20,
      },
      printBackground: true
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
