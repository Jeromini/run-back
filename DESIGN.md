---
name: Run Back
description: Fasting, training and nutrition in one calm coach, built dark-first for a 5 am phone check-in.
colors:
  bg: "#091315"
  bg-2: "#0d1b1e"
  surface: "#122427"
  surface-2: "#172d31"
  raised: "#1b3438"
  ink: "#e8f2f0"
  muted: "#91a7a8"
  faint: "#5f7678"
  line: "#22393d"
  accent: "#3cc7be"
  accent-2: "#2aa79f"
  accent-ink: "#052022"
  accent-soft: "#143c3c"
  fast: "#f5b544"
  fast-soft: "#3a2f16"
  fast-ink: "#f5b544"
  rose: "#f07a9b"
  rose-soft: "#3b1d28"
  water: "#5aa9f0"
  water-soft: "#14304a"
  water-ink: "#7cbcf5"
  violet: "#a78bfa"
  violet-soft: "#2a2347"
  gold-1: "#f3d27a"
  gold-2: "#c89b3c"
  gold-ink: "#2a1d02"
  good: "#4fc184"
  warn: "#e9a04d"
  bad: "#ef7469"
  light-bg: "#eef2f1"
  light-bg-2: "#e6ecea"
  light-surface: "#ffffff"
  light-surface-2: "#f3f6f5"
  light-ink: "#0e2a2f"
  light-muted: "#587076"
  light-faint: "#8aa0a4"
  light-line: "#dbe3e1"
  light-accent: "#0a7f7a"
  light-accent-2: "#12a39b"
  light-accent-soft: "#d6efec"
  light-fast: "#c47f06"
  light-fast-soft: "#fcefd6"
  light-fast-ink: "#8a5600"
  light-rose: "#c9406b"
  light-rose-soft: "#fbe3ea"
  light-water: "#1f74c4"
  light-water-soft: "#dcebf9"
  light-water-ink: "#155a9c"
  light-violet: "#6d4fd8"
  light-violet-soft: "#ebe5fd"
  light-good: "#23824f"
  light-warn: "#b3621b"
  light-bad: "#b8382f"
  hero-run-from: "#0e746e"
  hero-run-to: "#0a4649"
  hero-cross-from: "#6d55c9"
  hero-cross-to: "#3b2d7a"
  hero-rest-from: "#4a5f78"
  hero-rest-to: "#2c3a4c"
  workout-bg: "#071416"
typography:
  display-xl:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "normal"
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
  numeral:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  clock:
    fontFamily: "Barlow Condensed, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "clamp(56px, 17vw, 76px)"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Figtree, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.25
  body:
    fontFamily: "Figtree, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  note:
    fontFamily: "Figtree, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "Figtree, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
  article:
    fontFamily: "Figtree, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  dot: "6px"
  field: "12px"
  control: "14px"
  tile: "16px"
  card: "20px"
  hero: "24px"
  bar: "26px"
  pill: "999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  xxl: "18px"
components:
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-primary-big:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    height: "54px"
    width: "100%"
  button-fast:
    backgroundColor: "{colors.fast}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-gold:
    backgroundColor: "{colors.gold-2}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-mini:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "11px"
    padding: "8px 12px"
    height: "38px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    height: "46px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  pill-run:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pill-fast:
    backgroundColor: "{colors.fast-soft}"
    textColor: "{colors.fast-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  quick-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "12px 4px 10px"
  hero-run:
    backgroundColor: "{colors.hero-run-from}"
    textColor: "#ffffff"
    rounded: "{rounded.hero}"
    padding: "18px"
  nav-tabs:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.bar}"
    padding: "5px"
  nav-tab-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "20px"
  pop:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hero}"
    padding: "20px"
---

# Design System: Run Back

## Overview

**Creative North Star: "The Coach at First Light"**

Run Back is built for the minute before a 5 am run: a phone in one hand, low light, a quick question of what to do now. The world is a deep teal-black night (#091315 and its surfaces) lit by a small set of domain colours, each one meaning one thing. Teal is running and the brand; amber is the fast; rose is the body; sky is water; violet is strength and cross-training; gold is Premium and nothing else. A reader who learns the colours once can read every screen by them.

The surface is calm and dense in the way a good training log is dense: one column, rounded tonal cards on a dark field, condensed uppercase display numerals for the things that matter (the clock, the score, the kilograms) and quiet Figtree for everything else. Depth comes from tonal layering, not shadow. The only saturated full-bleed surfaces are the day's session hero and the Journey hero, so the next action is always the loudest thing on screen. A full light theme exists for bright outdoor use, but the system is designed dark and translated to light, never the reverse.

Motion is restrained and always behind `prefers-reduced-motion: no-preference`. Views rise in a few pixels, presses compress to 97 percent, sheets and pop-ups slide up. The one authored moment is the celebration ring: an arc that draws itself closed around a tick when a fasting goal or a Journey milestone lands. Nothing else is allowed to perform.

**Key Characteristics:**
- Dark-first teal-black field; light theme is a full token remap, not an afterthought.
- One colour per domain, used for icons, rings, bars, tints and the matching action.
- Barlow Condensed uppercase for headlines and every important number, with tabular figures.
- Figtree at 15px for body; weights 600 to 800 carry hierarchy, not size jumps.
- Tonal cards with a 1px hairline; shadow only on things that float.
- One phone column (560px), a floating glass tab bar that becomes a left rail at 1000px.
- A single authored celebration; everything else moves briefly or not at all.

## Colors

A night-teal neutral ramp carrying six domain hues, each with a solid, a soft tint and, where legibility needs it, an ink.

### Primary
- **First Light Teal** (accent): the brand and the run domain. Primary buttons, the active tab icon, focus outlines, selection, caret, progress bars, run pills, the brand wordmark accent, onboarding ticks. Its pressed/hover shade is **Deep Lagoon** (accent-2); text on it is **Abyss Ink** (accent-ink). **Lagoon Tint** (accent-soft) backs run pills, the current plan week, your own crew row and soft icon wells.

### Secondary
- **Fasting Amber** (fast): everything about the fast. The dial, stage bars, the timeline dots, the fast tab icon when active, the fast button, routine day picks, crew rank one. **Amber Tint** (fast-soft) backs fast pills, stage number wells, callouts and the fast mini-card gradient. **Amber Ink** (fast-ink) is the text colour on amber tints and for amber numerals; in dark it equals the solid, in light it deepens to stay legible on the pale tint.

### Tertiary
- **Body Rose** (rose): weight, food and the body. The weight chart line and area, the current weight, kcal tiles, meal and weigh-in quick tiles. Tint: **Rose Tint** (rose-soft).
- **Water Sky** (water): hydration and informational coaching. The glass fill, water quick tile, the `info` coach tone, human-studies evidence chips. Tint: **Sky Tint** (water-soft). **Sky Ink** (water-ink) is the text colour on the sky tint, used by the water add buttons.
- **Strength Violet** (violet): strength sets and cross-training. Completed set ticks, done-set inputs, cross day dots, the cross hero, early-research evidence chips. Tint: **Violet Tint** (violet-soft).
- **Premium Gold** (gold-1 to gold-2 gradient, text gold-ink): the PRO tag, gold buttons, the paywall crown and selected price, badge toasts, lock icons. Gold means Premium; it never decorates a free feature.

### Neutral
- **Night Field** (bg) and **Night Field 2** (bg-2): the page, sticky header, sheets.
- **Surface** (surface), **Surface 2** (surface-2), **Raised** (raised): cards; controls, inputs and inset panels; the selected segment.
- **Morning Ink** (ink): primary text. Also used as a solid for selected day and calendar cells and the toast, with bg as its text.
- **Mist** (muted) for secondary text and labels; **Faint** (faint) for disabled and off states; **Hairline** (line) for every 1px border and divider.
- **Status**: good (green), warn (orange), bad (red). They drive coach tones, evidence chips, BMI, sync dot and destructive states, usually as a 14 to 18 percent `color-mix` tint with the solid as text.
- **Fixed heroes**: the run, cross and rest session gradients (hero-run, hero-cross, hero-rest pairs) and the workout background (workout-bg) do not change with theme. White text sits on them.

### Named Rules
**The One Colour Per Domain Rule.** Each domain owns exactly one hue, and that hue appears wherever the domain appears: its icon, ring, bar, pill, tint and its primary action. Never borrow another domain's colour for emphasis, and never introduce a seventh hue for a new feature; map it to an existing domain or to neutral.

**The Ink On Tint Rule.** Text set on a soft tint uses that domain's ink token where one exists (fast-ink on fast-soft, water-ink on water-soft) so it holds contrast in the light theme. Solid hues are for marks and fills; inks are for words.

**The Gold Is Paid Rule.** Gold appears only on Premium surfaces: the PRO tag, upsell buttons, locks, the paywall and earned-badge toasts.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow, Roboto Condensed), weights 500 to 800 loaded
**Body Font:** Figtree (with system-ui, -apple-system, Segoe UI), weights 400 to 800 loaded

**Character:** A tall, condensed athletic face for numbers and headlines, read at arm's length like a race clock, paired with a friendly geometric sans that keeps the coaching copy calm and plain.

### Hierarchy
- **Clock** (700, clamp(56px, 17vw, 76px) on the fast dial; clamp(76px, 25vw, 112px) in the live workout; 180px countdown): the running timer. Tabular figures always.
- **Display XL** (800, 40px, 0.95, uppercase): the session hero title, Journey hero, onboarding headline, paywall headline, stage and celebration pop-ups (36 to 40px). Drops to 34px under 380px.
- **Display** (800, 32 to 34px, 1, uppercase): page titles (Today, date nav, big titles, article h2).
- **Numeral** (700 to 800, 20 to 28px, 1 to 1.1, tabular): stat values inside cards, list values, legends, totals, crew points. Units beside them drop back to Figtree 12 to 13px muted.
- **Title** (Figtree 800, 16 to 17px, 1.25): card headings, coach headline, activity title.
- **Body** (Figtree 400, 15px, 1.45): default copy. Long-form guides use 16px at 1.6 with a 65ch measure.
- **Note** (Figtree 600, 12.5 to 13.5px, muted): secondary lines, sub-labels, descriptions.
- **Label** (Figtree 600 to 700, 11.5 to 12px): stat captions, tab labels (11px, 12px on the rail), chip and pill text.

### Named Rules
**The Numbers Stand Tall Rule.** Any figure the user came to see (time, distance, weight, score, kcal, streak) is set in Barlow Condensed with tabular figures; its unit is set small in Figtree beside it.

**The Weight Not Size Rule.** Body hierarchy is carried by Figtree weight (600 note, 700 control, 800 title) within a 12 to 17px band. Size jumps belong to the display face.

## Layout

A single phone column, max 560px, 16px side padding, with bottom padding that clears the floating tab bar and the home indicator (110px plus safe area). Views stack cards with a 14px gap; inside a card the gap is 12px (8px when tight), padding 16px. Grids inside cards use 8 to 10px gaps: quick tiles in four columns, stats in three (two for four items), plans and prices in two, the week strip and calendars in seven.

The header is sticky with the brand left and icon buttons right. Full-screen sheets replace the page (same 560px body, sticky back bar) rather than floating as modals. The live workout is a separate fixed, always-dark layer capped at 520px with controls pinned to the bottom for thumb reach.

Every screen respects safe-area insets top and bottom. Touch targets are at least 38px for compact controls and 46 to 56px for primary ones; the workout start button is 64px.

At 1000px and wider the tab bar becomes a 92px left rail centred vertically, the column widens to 680px, sheets to 640px, and the toast drops to 32px from the bottom.

## Elevation & Depth

Depth is tonal: night field, then surface, then surface-2 and raised, each separated by a 1px hairline. Shadow is reserved for layers that float above the scroll: the tab bar, the toast and the pop-up. In light theme the same shadow becomes a faint teal-tinted haze. The selected segment and switch thumb carry a tiny contact shadow. Coloured surfaces (heroes, coach cards, the live fast card) get depth from a gradient, not a shadow.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 10px 30px rgba(0, 0, 0, .35)`; light `0 10px 30px rgba(14, 42, 47, .10)`): tab bar, toast, stage and celebration pop-ups.
- **Contact** (`box-shadow: 0 1px 3px rgba(0,0,0,.2)`): the selected segment and the switch thumb.
- **Halo** (`box-shadow: 0 0 0 4px var(--fast-soft)`): the current stage dot on the fasting timeline; stacked badges use a 3px surface ring to separate.

### Named Rules
**The Only Floaters Cast Shadows Rule.** A surface casts a shadow only if it sits above scrolling content. Cards in the flow stay flat with a hairline.

**The Glass Bar Rule.** The tab bar is the one translucent surface: surface at 88 percent with a 16px backdrop blur.

## Shapes

Soft, friendly, consistent rounding that scales with the size of the element: 6px for tags and the PRO badge, 12px for inputs, segments and small wells, 14px for buttons and inset panels, 16px for tiles, stats and choices, 20px for cards, 24px for heroes and pop-ups, 26px for the floating tab bar, full pills for chips and status tags. Icon wells are rounded squares (10 to 14px radius); avatars, badges, the main workout control and progress rings are circles. Progress is shown as rounded bars (6 to 10px tall) and segmented strips with 2 to 3px gaps. Icons are inline stroke SVG, 2px stroke, round caps and joins, inheriting currentColor.

## Components

### Buttons
Tactile, full-height and unadorned; colour says what the button belongs to.
- **Shape:** gently rounded (14px), minimum height 48px, weight 700, 8px icon gap with 19px icons.
- **Secondary (default):** surface-2 with a hairline border and ink text.
- **Primary:** teal fill and border with accent-ink text. **Big** stretches full width at 54px and 17px.
- **Domain fills:** fast (amber with dark gold-ink text), gold (Premium gradient, borderless).
- **Ghost / Danger / Armed:** transparent; red text; red text and border while a destructive tap is armed.
- **Hero action:** a white 56px button with dark teal text inside the session hero.
- **Mini:** 38px, 11px radius, 13px text, for inline row actions; a teal primary variant exists.
- **Link:** teal text, weight 700, no chrome.
- **States:** press scales to 0.97; colour transitions 150ms; disabled at 50 percent opacity; hover (pointer devices only) tints the border toward teal; focus-visible is a 2px teal outline offset 2px.

### Chips and Pills
- **Chip:** surface fill, hairline, full pill, 13.5px weight 700. Selected inverts to an ink fill with bg text. The add chip is teal.
- **Pill:** 12px status tag on surface-2; domain variants use the soft tint with the domain colour (run, fast, good) and no border.
- **Evidence chip:** 11px weight 800 pill tinted good (well established), water (human studies) or violet (early research). It sits beside every fasting claim.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** surface, with surface-2 for inset panels (plate, preview, picker, records).
- **Shadow Strategy:** flat (see Elevation).
- **Border:** 1px hairline.
- **Internal Padding:** 16px, 12px gap; list rows inside cards divide with a hairline and no outer border.
- **Tinted variants:** the coach card, live fast card, crew header and setup card wash the top of the card in a 10 to 14 percent tone tint and lift the border toward that tone.

### Inputs / Fields
- **Style:** surface-2 fill, hairline, 12px radius, 46px minimum, inherited font.
- **Focus:** border turns teal, no outline ring.
- **Labels:** 13px weight 600 muted, stacked 5px above.
- **Segmented control:** a 12px track on surface-2 with 9px buttons; the selected segment lifts to raised with ink text and a contact shadow. Premium-locked options show a small gold lock.
- **Switch:** 50 by 30 track, teal when on.
- **Big entry:** the weigh-in field is a borderless 44px display numeral over a 2px underline that turns teal on focus.

### Navigation
- **Tab bar:** a floating glass pill (26px radius) 10px above the safe area, six equal columns, 23px stroke icons over 11px weight 700 labels in muted. The active tab gets a surface-2 fill, ink label and a teal icon (amber on the Fast tab).
- **Left rail (1000px and up):** the same bar turned vertical, 92px wide, 24px radius, pinned 24px from the left and centred.
- **Sheets:** a sticky back button with a small title; onboarding hides the bar.

### Session Hero
The day's training as one saturated block: a fixed gradient by kind (run teal, cross violet, rest slate), 24px radius, white text, a 40px uppercase title, translucent white chips, a segmented walk/run/hard strip, and the white Go button. The inline coach (`hcoach`) sits inside it as a translucent white panel with a tone-coloured 28px icon well. After the session, a translucent done box shows three numerals.

### Coach Card
Advice as a tinted card: border and top wash take the tone (good, caution, stop, info), the headline is a 17px title, the body is muted. When locked, the body blurs and an unlock row sits beneath it.

### Quick Tiles
Four equal 16px-radius tiles on Today. Each has a 36px rounded-square icon well in its domain's soft tint and colour (rose for meal and weigh-in, violet for activity, sky for water), a 13px weight 800 name and an 11.5px muted status. The water tile logs 250 ml in one tap.

### Fast Mini-Card and Fast Dial
The mini-card is a full-width button with an amber-tint-to-surface gradient, a 56px amber ring, a title and status line, and the elapsed time as a 26px amber-ink numeral. On the Fast tab the dial is up to 330px with a large clock, an amber label and a percentage beneath.

### Journey
The Journey hero is a deep teal radial-over-linear gradient with a 1px white hairline, a score ring, a 40px title, a light-teal progress track, three translucent stat cells and an optional italic quote marked by a large display quotation glyph in light teal. Journey rows (`jrow`) are hairline-divided lines with a 30px rounded icon well in the domain tint, a bold label, a muted sub-line and mini actions; done rows turn the well green; not-applicable rows drop to 55 percent.

### Onboarding
A sheet without chrome: a 52px teal icon mark, a 40px uppercase headline capped at 14ch, muted 15.5px copy at 40ch, icon points in surface-2 wells, a four-step progress strip, and full-width choice rows (16px radius, 56px minimum, 1.5px border) whose selected state takes a teal border, a 7 percent teal wash and a filled teal tick. Children stagger in by 40ms steps.

### Stage Pop-up and Celebration
The stage pop-up rises from the bottom over a dark scrim: a 24px surface card with an amber-tinted border, a 36px amber-ink display title, an evidence chip and a segmented stage bar. The celebration (`pop win`) reuses that layer, centred, with a teal or amber border and the win mark: a 104px ring whose arc draws closed in 0.9s, then a filled 58px tick disc springs in at 0.55s, then the 40px ink title and muted line fade up. A single full-width primary button closes it; Escape also closes it and focus lands on the button.

### Workout
Always dark like a watch face, on its own fixed palette (run teal, walk slate, hard amber). The phase colour drives the progress ring, label and main control. Controls sit at the bottom: two 60px side buttons (stop is press-and-hold with a red fill sweep) around an 84px round main button.

### Toast
An inverted ink pill above the tab bar, 14px radius, weight 700; badge toasts use the gold gradient.

## Do's and Don'ts

### Do:
- **Do** give every new feature an existing domain colour and use its solid, soft and ink tokens together (icon and fill in the solid, tint behind, words in the ink).
- **Do** set every figure the user came for in Barlow Condensed with tabular numerals, and its unit in small muted Figtree.
- **Do** design in dark first and verify the light theme through the token remap; keep the session heroes, workout and paywall hero on their fixed dark gradients.
- **Do** keep primary targets at 46 to 56px and compact controls at no less than 38px, one-handed, inside safe-area insets.
- **Do** put every animation behind `prefers-reduced-motion: no-preference`, and keep transitions to 150ms colour and a 0.97 press scale.
- **Do** reserve the celebration ring for real wins (a fasting goal reached, a Journey milestone).
- **Do** write copy as a calm expert coach: plain, direct, honest about evidence, with an evidence chip beside fasting claims and safety guidance stated in the open.
- **Do** use hyphens, colons or full stops where a dash might go; the product uses no em or en dashes anywhere.

### Don't:
- **Don't** use gold outside Premium, or a domain hue outside its domain.
- **Don't** add shadows to cards in the flow; only floating layers (tab bar, toast, pop-ups) cast one.
- **Don't** add a second authored animation or make a celebration of routine logs.
- **Don't** add new small all-caps kicker labels above headings on new surfaces; the existing ones on older cards are incumbent, not a pattern to extend.
- **Don't** use hype, guilt or fear in copy, or claims beyond the evidence tag.
- **Don't** set body copy in the display face, or headlines in mixed case Barlow; display is uppercase.
