import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { adminClient, testEmail } from "./admin";

mkdirSync("test-results", { recursive: true });
const PASSWORD = "Testpass#2026";

function watch(page: Page) {
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  return errs;
}

async function signUp(page: Page, tag: string) {
  const email = testEmail(tag);
  await page.goto("/");
  await page.getByText("Get started").click();
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder(/At least/).fill(PASSWORD);
  await page.getByPlaceholder("Repeat your password").fill(PASSWORD);
  await page.getByText("Create account").last().click();
  await expect(page.getByText("Scan fridge").first()).toBeVisible({ timeout: 30_000 });
  return email;
}
const tab = (page: Page, name: string) => page.getByRole("tab", { name }).or(page.getByText(name, { exact: true })).last();

test("welcome screen loads cleanly", async ({ page }) => {
  const errs = watch(page);
  await page.goto("/");
  await expect(page.getByText("Cook what you already have.")).toBeVisible();
  await expect(page.getByText("Get started")).toBeVisible();
  expect(errs).toEqual([]);
});

test("sign-up validation explains mistakes", async ({ page }) => {
  await page.goto("/signup");
  await page.getByPlaceholder("you@example.com").fill("not-an-email");
  await page.getByPlaceholder(/At least/).fill("short");
  await page.getByPlaceholder("Repeat your password").fill("different");
  await page.getByText("Create account").last().click();
  await expect(page.getByText(/valid email/i)).toBeVisible();
});

test("scan a real fridge photo → AI lists the items → add them to the fridge", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "AI scan once per run");
  const errs = watch(page);
  await signUp(page, "scan");
  await page.getByText("Scan fridge").first().click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByText("Choose from library").click();
  await (await chooser).setFiles("tests/fixtures/fridge.jpg");
  await expect(page.getByPlaceholder("Add something we missed")).toBeVisible({ timeout: 120_000 });
  const found = await page.getByText(/Freo found \d+ items?/).innerText();
  expect(Number(found.match(/\d+/)![0])).toBeGreaterThanOrEqual(3);
  // The model's wording varies a little (Tomato / Tomatoes); at least two of these should be there.
  const listed = await page.evaluate(() => document.body.innerText.toLowerCase());
  expect(["tomato", "orange", "carrot", "grape", "lemon"].filter((w) => listed.includes(w)).length).toBeGreaterThanOrEqual(2);
  await page.getByPlaceholder("Add something we missed").fill("Paneer");
  await page.keyboard.press("Enter");
  await page.getByText(/^Add \d+ items to fridge$/).click();
  await tab(page, "Fridge").click();
  await expect(page.getByText("Paneer").first()).toBeVisible({ timeout: 20_000 });
  expect(errs).toEqual([]);
});

test("scan a grocery receipt", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "AI scan once per run");
  await signUp(page, "receipt");
  await page.getByText("Scan fridge").first().click();
  await page.getByText("Receipt", { exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByText("Choose from library").click();
  await (await chooser).setFiles("tests/fixtures/receipt.jpg");
  await expect(page.getByPlaceholder("Add something we missed")).toBeVisible({ timeout: 120_000 });
  expect(Number((await page.getByText(/Freo found \d+ items?/).innerText()).match(/\d+/)![0])).toBeGreaterThanOrEqual(2);
});

test("AI recipe ideas → cook one → it lands in History and the fridge updates", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "AI recipes once per run");
  const errs = watch(page);
  await signUp(page, "cook");
  await page.getByText("Try with sample items").first().click();
  await expect(page.getByText(/6\s*\|?\s*items|items · /).first()).toBeVisible({ timeout: 20_000 });
  await tab(page, "Cook").click();
  await expect(page.getByText("Ideas for you")).toBeVisible();
  // offline ideas show first; the AI's replace them (no more "Quick mix" placeholders)
  await expect(page.getByText(/^Quick mix:/).first()).toBeHidden({ timeout: 90_000 });
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  const card = page.getByText(/\d+ mins?/).first();
  await card.click();
  const cookedTitle = (await page.getByRole("heading").first().innerText()).trim();
  await page.getByText("I cooked this").click();
  await expect(page.getByText("How much did you use?")).toBeVisible();
  // you have these, so they default to "Used some" (regression: they defaulted to "Didn't use")
  await expect(page.getByRole("tab", { name: "Used some", selected: true }).first()).toBeVisible();
  await page.getByText("Save & update fridge").click();
  await expect(page.getByText(/Saved to History/)).toBeVisible({ timeout: 20_000 });
  await page.goto("/history");
  await expect(page.getByText("No meals yet")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByText(cookedTitle).first()).toBeVisible();
  expect(errs).toEqual([]);
});

test("password reset: the email link opens 'Set a new password', and the new password works", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once per run");
  const email = await signUp(page, "reset");
  await page.evaluate(() => localStorage.clear());
  const base = info.project.use.baseURL!;
  const { data, error } = await adminClient().auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${base}/reset-password` } });
  expect(error).toBeNull();
  await page.goto(data!.properties.action_link);
  await expect(page.getByText("Set a new password")).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder("At least 8 characters").fill("Newpass#2026");
  await page.getByPlaceholder("Repeat your new password").fill("Newpass#2026");
  await page.getByText("Save new password").click();
  await expect(page.getByText("Password updated")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => localStorage.clear());
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Your password").fill("Newpass#2026");
  await page.getByText("Log in").last().click();
  await expect(page.getByText("Scan fridge").first()).toBeVisible({ timeout: 30_000 });
});

test("an expired reset link says so instead of hanging", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByText(/expired or was already used/)).toBeVisible({ timeout: 15_000 });
});

test("delete account removes the user", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once per run");
  const email = await signUp(page, "delete");
  await page.goto("/settings");
  page.on("dialog", (d) => void d.accept());
  await page.getByText("Delete account").click();
  await expect(page.getByText("Get started")).toBeVisible({ timeout: 30_000 });
  const { data } = await adminClient().auth.admin.listUsers({ perPage: 1000 });
  expect(data.users.some((u) => u.email === email)).toBe(false);
});
