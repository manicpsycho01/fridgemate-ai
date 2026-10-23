import { expect, test, type Page } from "@playwright/test";
import { adminClient, testEmail } from "./admin";

/**
 * Layout audit across 17 screen sizes on every screen, signed out and signed in (animations off):
 * no sideways overflow, no text off-screen or overlapping, no text under 11px, 44px touch targets on touch screens.
 */
const VIEWPORTS = [[320,568,1],[360,740,1],[390,844,1],[393,852,1],[430,932,1],[844,390,1],[768,1024,1],[820,1180,1],[1024,768,0],[1024,1366,1],[1280,600,0],[1280,800,0],[1366,768,0],[1440,900,0],[1536,864,0],[1920,1080,0],[2560,1440,0]] as const;

async function audit(page: Page, touch: number, scope?: string): Promise<string[]> {
  return page.evaluate(({ touch, scope }) => {
    const out: string[] = [];
    const vw = document.documentElement.clientWidth;
    const root = scope ? document.querySelector(scope)! : document.body;
    if (document.documentElement.scrollWidth > vw + 1) out.push(`page overflow ${document.documentElement.scrollWidth}>${vw}`);
    for (const el of root.querySelectorAll<HTMLElement>("*")) {
      const cs = getComputedStyle(el);
      if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !(el.firstElementChild && getComputedStyle(el.firstElementChild).flexDirection === "row")) out.push(`sideways scroll in ${el.tagName} ${el.scrollWidth}>${el.clientWidth}`);
    }
    const hidden = (el: Element) => { for (let e: Element | null = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return true; } return false; };
    // The bottom tab bar floats over scrolling content by design; decorative icon glyphs (private-use code points) aren't text.
    const skip = (el: Element) => !scope && (!!el.closest('[role="dialog"],[data-testid="tab-bar"],[aria-hidden="true"]') || /^[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\s]+$/u.test(el.textContent ?? ""));
    // A horizontal ScrollView (row content) is meant to scroll sideways; anything inside it may sit off-screen.
    const inHScroll = (el: Element) => { for (let e = el.parentElement; e; e = e.parentElement) { const c = getComputedStyle(e); if ((c.overflowX === "auto" || c.overflowX === "scroll") && e.firstElementChild && getComputedStyle(e.firstElementChild).flexDirection === "row") return true; } return false; };
    const leaves = [...root.querySelectorAll("*")].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim().length > 1));
    const boxes: { el: Element; txt: string; rs: { l: number; t: number; r: number; b: number }[] }[] = [];
    for (const el of leaves) {
      if (hidden(el) || skip(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) continue;
      const txt = el.textContent!.trim().slice(0, 40);
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 11) out.push(`tiny text ${fs}px "${txt}"`);
      if ((r.right > vw + 1 || r.left < -1) && !inHScroll(el)) out.push(`offscreen x ${Math.round(r.left)}..${Math.round(r.right)} "${txt}"`);
      const rg = document.createRange(); rg.selectNodeContents(el);
      boxes.push({ el, txt, rs: [...rg.getClientRects()].filter((x) => x.width > 1)
        // clip to the element's own box: truncated (ellipsis) or line-clamped text is cut off visually
        .map((x) => ({ l: Math.max(x.left, r.left), r: Math.min(x.right, r.right), t: Math.max(x.top + x.height * 0.3, r.top), b: Math.min(x.bottom - x.height * 0.3, r.bottom) })).filter((x) => x.r - x.l > 1 && x.b - x.t > 1) });
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i]!, B = boxes[j]!;
      if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
      if (A.rs.some((a) => B.rs.some((c) => Math.min(a.r, c.r) - Math.max(a.l, c.l) > 3 && Math.min(a.b, c.b) - Math.max(a.t, c.t) > 3))) out.push(`overlap "${A.txt}" × "${B.txt}"`);
    }
    if (touch) for (const el of root.querySelectorAll('[role="button"],[role="link"],[role="tab"],[role="radio"],[role="checkbox"],a,button,input,textarea')) {
      if (hidden(el) || skip(el)) continue;
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      if (r.height < 43.5 && r.width < 200) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`);
    }
    return [...new Set(out)];
  }, { touch, scope });
}


const settle = (p: Page) => p.waitForTimeout(600);
let email = "";
test.beforeAll(async () => {
  email = testEmail("layout");
  const { error } = await adminClient().auth.admin.createUser({ email, password: "Testpass#2026", email_confirm: true });
  expect(error).toBeNull();
});

for (const [w, h, touch] of VIEWPORTS) {
  test(`layout ${w}x${h}`, async ({ browser }, info) => {
    test.skip(info.project.name !== "phone", "the matrix sets its own viewports");
    test.setTimeout(180_000);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: !!touch, isMobile: !!touch && w < 1024, reducedMotion: "reduce", baseURL: info.project.use.baseURL });
    const page = await ctx.newPage();
    const issues: string[] = [];
    const check = async (tag: string) => { await settle(page); issues.push(...(await audit(page, touch)).map((x) => `${tag}: ${x}`)); };
    for (const r of ["/", "/login", "/signup", "/reset-password"]) { await page.goto(r); await check(r); }
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("Your password").fill("Testpass#2026");
    await page.getByText("Log in").last().click();
    await page.getByText("Scan fridge").first().waitFor({ timeout: 30_000 });
    if (await page.getByText("Try with sample items").count()) { await page.getByText("Try with sample items").first().click(); await page.waitForTimeout(1500); }
    for (const r of ["/", "/inventory", "/scan", "/cook", "/history", "/settings"]) { await page.goto(r); await page.waitForTimeout(900); await check(r); }
    await ctx.close();
    expect(issues).toEqual([]);
  });
}
