# FridgeMate AI — independent design review and redesign brief ("Fresh Market")

Review of the redesign committed at 45eb74d (screens: welcome, login, sign-up, home, fridge, scan, cook, history, settings at 390×844).

## What reads as generic / "AI slop"
1. **One electric blue (#1e5eff) on everything.** Buttons, hero card, tab bar, links and badges all use it. It feels like a fintech template, not food: cold, with no appetite appeal and no hierarchy between primary and secondary actions.
2. **Card soup.** Every section is the same white rounded card with a 1 px border, and the same "icon in a pale circle" motif repeats on the welcome rows, quick actions, scan tiles and settings. Nothing leads the eye.
3. **Template clichés:**
   - a three-tile grid of identical icon buttons (Scan / Add / Recipes);
   - gradient pill CTAs with drop shadows;
   - paragraph text inside cards (Settings → freshness);
   - "Danger zone" boilerplate.
4. **Emoji as food icons** (🍞🧀🥚🔍): inconsistent between platforms, low-fidelity next to the crisp mascot, and a 🔍 emoji standing in for every recipe image.
5. **Typography has no voice.** It's system font only, and every heading is heavy bold, so the title / section / body levels barely differ.
6. **Weak composition:**
   - Welcome shows a huge mascot, then a feature list, then a large dead gap before the CTA.
   - The empty home state is a big empty card.
   - The tab labels are tight against the bottom edge.
   - The greeting uses the raw email prefix ("Hi, Fm").
7. **Motion:** spring pops on buttons only. Lists appear abruptly, and nothing makes the scan or AI moments feel like moments.

## Direction: "Fresh Market"
Warm, appetising, editorial and calm, like a well-designed food magazine crossed with Apple's own apps. Freo is the only blue thing on screen, so he pops.

### Tokens
| Role | Value |
|---|---|
| canvas | `#FBF7F0` (warm cream) |
| surface | `#FFFFFF`, plus a raised surface `#FFFDF9` |
| ink | `#16302B` (deep herb green); secondary ink at 62 %, tertiary at 40 % |
| brand / primary action | `#1F4D3F` (herb green) |
| accent (one hero action per screen, highlights) | `#FF5A36` (tomato) |
| freshness | fresh `#3E9B5F` · soon `#E8A33D` · past `#D9534F` (soft tints for backgrounds) |
| Freo blue | `#2A66FF` (mascot surroundings and the app icon only) |
| lines | ink at 8 % |

- **Radii:** 20 for cards, 14 for controls, 999 for chips.
- **Shadows:** a single soft ambient shadow. No 1 px borders on cards.

### Type
Load with `@expo-google-fonts/fraunces` and `@expo-google-fonts/inter` via `expo-font`; both work in Expo Go.

| Use | Font | Size / line height |
|---|---|---|
| Display / headings | **Fraunces** 600–700, slight negative tracking | 34/38 (screen titles), 24/28 (sections), 20/24 (card titles) |
| UI and body | **Inter** 400 / 500 / 600 | 17/24 (body), 15/20 (secondary), 13/16 (captions) |
| Numbers | Inter with tabular figures | — |

### Composition rules
- Use whitespace and typography for hierarchy, not boxes. Group lists directly on the canvas with hairline separators, and keep cards for things you can act on.
- One tomato hero action per screen. Everything else is a herb-green primary, or a quiet text or ghost button.
- Food icons: one consistent set instead of emoji (`MaterialCommunityIcons` food glyphs, e.g. food-apple, cheese, egg, fish, bread-slice, carrot, cup, bottle, leaf), shown on a soft tinted tile by category with a fallback glyph.
- Recipe cards get a colour block or gradient drawn from their main ingredient's category colour, with the dish's title in Fraunces over it. No stock images or emoji.
- Greeting: use the name from the user's profile if set, otherwise capitalise the email prefix. Show "Good morning" and so on by time.

### Screens
- **Welcome:**
  - Full-bleed cream background with Freo and groceries large, gently floating (a slow translateY loop).
  - The headline in Fraunces: "Cook what you already have."
  - Three compact benefit lines (icon plus text, no cards).
  - A tomato "Get started" button and a text link for log in, pinned with safe-area padding. No dead gap.
- **Login / Sign up:**
  - Freo peeking from the top edge, a Fraunces title, and fields as large soft surfaces with floating labels or icons.
  - Primary button in herb green.
  - Keep all the existing behaviour (validation, show/hide, forgot password, error mapping, keyboard handling, AuthForm sharing).
- **Home:**
  - The greeting in Fraunces, with the settings avatar as a circle holding the user's initial.
  - A "Your fridge" summary as a large typographic stat ("12 items · 3 to use soon") with a slim segmented freshness bar (fresh / soon / past).
  - A horizontal **Use first** carousel of item cards, each with a circular freshness ring (days left), that taps through to Cook.
  - A single tomato **Scan fridge** hero CTA, with a quiet "Add item" text button.
  - The shopping list as a checklist on the canvas.
  - Empty state: Freo, one line of copy and the Scan CTA, with no big empty card.
- **Fridge:**
  - A sticky search / add field.
  - Sections by urgency ("Use soon" / "Fresh"), with rows on the canvas: icon tile, name, freshness pill and a compact stepper.
  - Swipe-free delete through a long-press or menu, with confirmation.
  - Quick-add chips in a horizontal scroll row instead of a wall of chips.
- **Scan:**
  - One big camera surface: a viewfinder-style frame with corner brackets and Freo's tip, plus a library button.
  - While detecting: an animated scanning line over the photo thumbnail and staged messages ("Looking at shelves… Spotting produce… Almost there").
  - The confirm screen as a checklist with icon tiles.
- **Cook:**
  - Selected ingredients as removable chips.
  - An "AI ideas" label with a subtle shimmer while generating.
  - Recipe cards as colour blocks with the Fraunces title, time / difficulty / kcal in a single quiet meta line, and an "Uses 3 of your items" pill.
- **Recipe detail:**
  - A colour-block hero, a meta row, and "You have" / "You'll also need" ingredient lists.
  - Large numbered steps.
  - A sticky "I cooked this" bar.
- **History:**
  - A timeline grouped by day, each row showing a small colour block, the title and the time.
- **Settings:**
  - A grouped iOS-style list on the canvas (Account, About, Privacy), with the freshness note as one short line plus "Learn more" expanding inline.
  - "Delete account" as a red text row at the bottom. Drop the "Danger zone" heading.
- **Tab bar:**
  - Cream surface with a hairline top border.
  - Icons in herb green, with a tomato dot for the active tab; labels at 11 pt with safe-area padding.
  - The centre Scan button as a tomato circle with a white camera.
  - Make sure the labels never touch the home indicator.

### Motion (`react-native-reanimated`, included in Expo Go)
- List and section entrances: `FadeInDown.springify().damping(18)` with a 40 ms stagger.
- Press feedback: scale to 0.97 with a spring on cards and buttons.
- Haptics are already in place; keep them.
- A Freo idle float on Welcome and the empty states.
- Animated freshness rings filling on mount, and a scanning-line sweep while detecting.
- A layout animation when adding or removing fridge items.
- Respect reduce motion via `useReducedMotion()`.

### Quality bar
- Equal 20 pt side margins and a 4/8 spacing scale.
- Nothing clipped by the notch, home indicator, tab bar or keyboard.
- 44 pt touch targets and Dynamic Type friendly (no fixed heights on text containers).
- Typecheck, `expo-doctor` 20/20, and an iOS export all green.
- Verified on Expo web at 390×844 and 430×932 with Playwright screenshots of every screen and state: empty, loading, error, filled.

## Progress
Implementation log for the Fresh Market redesign (branch `ios-sdk58`, local commits "Fresh Market: <step>").
- [x] 1. Tokens (`theme/tokens.ts`), Fraunces + Inter loaded in `app/_layout.tsx` (splash held), reanimated + svg, primitives (`Text`, `Button` hero/primary/secondary/ghost, `Surface`, `IconTile` + `lib/foodIcon.ts`, `FreshnessRing`, `Chip`, `SectionHeader`, `AnimatedEntrance`, `PressableScale`, `components/TabBar.tsx`). Legacy token aliases (`type`, `shadows`, `gradient`, old colour names) remain in tokens.ts until every screen is migrated — delete them last.
- [x] 2. Welcome (hero centred in free space, floating via `hooks/useFloat.ts`; unused landing icons deleted)
- [x] 3. Login / Sign up (AuthForm restyled only; logic untouched)
- [x] 4. Home (`components/home/*`, `lib/displayName.ts`; shopping ticks are session-only UI)
- [x] 5. Fridge (sticky search via `ScrollScreen sticky`, urgency sections, long-press / … menu, reanimated layout transitions)
- [ ] 6. Cook + Recipe detail
- [ ] 7. Scan + Confirm
- [ ] 8. History
- [ ] 9. Settings
- [ ] 10. Cleanup (remove legacy tokens, `lib/itemEmoji.ts`, `Card`, unused styles), expo-doctor, iOS export, contact sheet
