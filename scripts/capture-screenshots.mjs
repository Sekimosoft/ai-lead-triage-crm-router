import { chromium } from "playwright";
import { mkdir, copyFile } from "fs/promises";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3011";
const API_PROXY = process.env.SCREENSHOT_API ?? "http://localhost:8005";

async function setupApiProxy(page) {
  await page.route("**/api/v1/analyze", async (route) => {
    const response = await fetch(`${API_PROXY}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: route.request().postData() ?? "{}",
    });
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: await response.text(),
    });
  });
}

async function capture(locale, suffix) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await setupApiProxy(page);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  if (locale === "ja") {
    await page.getByRole("button", { name: "Switch language to Japanese" }).click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({
    path: `docs/assets/screenshot-${suffix}-inquiry.png`,
    fullPage: false,
  });

  const loadLabel = locale === "ja" ? "サンプルを読み込む" : "Load sample";
  const analyzeLabel = locale === "ja" ? "問い合わせを解析" : "Analyze inquiry";

  await page.getByRole("button", { name: loadLabel }).click();
  await page.getByRole("button", { name: analyzeLabel }).click();

  const resultLabel = locale === "ja" ? "構造化出力" : "Structured output";
  await page.getByText(resultLabel).waitFor({ timeout: 15000 });

  await page.screenshot({
    path: `docs/assets/screenshot-${suffix}-result.png`,
    fullPage: true,
  });

  await browser.close();
}

await mkdir("docs/assets", { recursive: true });
await capture("en", "en");
await capture("ja", "ja");

await copyFile("docs/assets/screenshot-en-result.png", "docs/screenshots/screenshot-en.png");
await copyFile("docs/assets/screenshot-ja-result.png", "docs/screenshots/screenshot-ja.png");
console.log("Screenshots saved.");
