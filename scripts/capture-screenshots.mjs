import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

await page.screenshot({
  path: "docs/screenshots/screenshot-inquiry.png",
  fullPage: false,
});

await page.getByRole("button", { name: "Load sample" }).click();
await page.getByRole("button", { name: "Analyze inquiry" }).click();
await page.getByText("Structured output").waitFor({ timeout: 15000 });

await page.screenshot({
  path: "docs/screenshots/screenshot-result.png",
  fullPage: true,
});

await browser.close();
console.log("Screenshots saved.");
