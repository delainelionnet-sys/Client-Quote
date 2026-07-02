const puppeteer = require("puppeteer");

async function htmlToImage(html) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1064,
      height: 800,
      deviceScaleFactor: 2
    });

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    const contentHeight = await page.evaluate(() => {
      return Math.ceil(document.documentElement.scrollHeight);
    });

    await page.setViewport({
      width: 1064,
      height: Math.max(contentHeight, 800),
      deviceScaleFactor: 2
    });

    return await page.screenshot({
      type: "png",
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

module.exports = {
  htmlToImage
};
