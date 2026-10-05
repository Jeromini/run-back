---
name: Run Back
description: Fasting, training and nutrition in one calm coach, set like a premium training journal on warm paper.
colors:
  paper: "#f7f7f2"
  paper-2: "#efefe8"
  surface: "#ffffff"
  surface-2: "#f3f3ee"
  ink: "#17201d"
  muted: "#5b6460"
  faint: "#9aa19d"
  line: "#e5e5dd"
  cobalt: "#2858d8"
  cobalt-deep: "#1f49bc"
  cobalt-soft: "#e7edfb"
  on-cobalt: "#ffffff"
  fast: "#b4730a"
  fast-soft: "#f8eedb"
  fast-ink: "#7a4d05"
  water: "#0e8a80"
  water-soft: "#dcf0ed"
  water-ink: "#0a665e"
  rose: "#b8476a"
  rose-soft: "#f8e5eb"
  violet: "#6650c8"
  violet-soft: "#ece8fa"
  good: "#1e7a4a"
  warn: "#a85c14"
  bad: "#b23a30"
  gold: "#d9b25a"
  gold-light: "#f0d58a"
  gold-ink: "#2a1d02"
  hero: "#17201d"
  hero-ink: "#f7f7f2"
  hero-muted: "#a9b1ad"
  hero-line: "#2c3532"
  walk: "#c9ccc6"
  night: "#121614"
  night-2: "#171c1a"
  night-surface: "#1b201e"
  night-surface-2: "#232927"
  night-raised: "#2a302e"
  night-ink: "#eef0ec"
  night-muted: "#a3aba6"
  night-faint: "#6e7671"
  night-line: "#2e3532"
  night-cobalt: "#7c9ef4"
  night-cobalt-deep: "#6a8eee"
  night-on-cobalt: "#0c1838"
  night-cobalt-soft: "#1e2a47"
  night-fast: "#e2a94e"
  night-fast-soft: "#33291a"
  night-fast-ink: "#e8b462"
  night-water: "#4cc2b5"
  night-water-soft: "#173431"
  night-water-ink: "#6fd3c7"
  night-rose: "#e48aa5"
  night-rose-soft: "#362329"
  night-violet: "#a594f0"
  night-violet-soft: "#29263f"
  night-good: "#63c693"
  night-warn: "#e5a35a"
  night-bad: "#ec8075"
  night-hero: "#0b0f0d"
  night-hero-ink: "#f3f4f0"
  night-hero-muted: "#9aa39e"
  night-hero-line: "#262d2a"
  night-walk: "#59615d"
typography:
  display:
    fontFamily: "Manrope Variable, Manrope, -apple-system, BlinkMacSystemFont, SF Pro Display, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  figure:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "\"tnum\" 1"
  dial:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(44px, 13vw, 56px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "\"tnum\" 1"
  headline:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
  stat:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Manrope Variable, Manrope, -apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
  data-label:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.08em"
  dock-label:
    fontFamily: "Manrope Variable, Manrope, -apple-system, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
rounded:
  sm: "10px"
  control: "12px"
  card: "16px"
  pill: "999px"
  full: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-disabled:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.faint}"
    rounded: "{rounded.control}"
  session-go:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.control}"
    height: "52px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  session-card:
    backgroundColor: "{colors.hero}"
    textColor: "{colors.hero-ink}"
    rounded: "{rounded.card}"
    padding: "20px 18px 16px"
  utility-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 14px"
    height: "64px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "46px"
  segmented-outlined-on:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.sm}"
    height: "40px"
  dock:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.dock-label}"
    height: "50px"
  dock-active:
    textColor: "{colors.cobalt}"
  fab:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.full}"
    size: "52px"
  food-add:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.on-cobalt}"
    rounded: "{rounded.full}"
    size: "30px"
---

# Design System: Run Back

## Overview

**Creative North Star: "The Training Journal"**

Run Back reads like a well-kept training journal: warm paper, white pages, dark ink, and one cobalt pen for the thing to do next. Every screen is a page of plain records (rows, divided figures, a to-scale strip) with a single ink card that holds today's session. Nothing glows, nothing is glossy, and colour only appears where it carries meaning.

Density is calm and one-handed. A screen opens with a large title, then the most urgent row (the fast), then the session card, then one grouped quick log, then the Journey line. Figures are set large in tabular numerals and separated by hairlines rather than boxed into tiles. At night the same journal turns over to a green-black page with soft ink, keeping every role and rule.

The system was cut back from an earlier gradient-heavy look, and the build says so in its own comments: decorative gradients, glossy medals, tinted coach cards and stat tiles were all removed on purpose. Future work extends that restraint.

**Key Characteristics:**
- Warm off-white paper with white surfaces and a 1px warm hairline; green-black at night.
- One family (Manrope Variable, self-hosted), heavy 800 for titles and big figures, tabular numerals for all data.
- One cobalt accent for actions and the active state; amber, teal and rose only for fasting, water and weight.
- One flat ink card per screen for the hero record (today's session, the Journey).
- Figures in divided rows, status as a dot plus a word, no tiles and no pills for status.
- Flat surfaces; depth comes from the ink card and hairlines, not shadows.

## Colors

A warm neutral page with one cobalt pen and three quiet domain hues; every non-neutral colour has a job.

### Primary
- **Journal Cobalt** (light `cobalt`, night `night-cobalt`): every primary action (Start session, Start fast, Save), the + button, the active dock tab, the active text tab underline, the food add button, progress fills on the Journey line and calorie bar, and the jog blocks of the interval strip. The deeper cobalt is the hover and pressed state only.
- **Cobalt Wash** (`cobalt-soft`): the background of the current row in plan and leaderboard lists, and the `run` tag.

### Secondary
- **Fasting Amber** (`fast`, with `fast-soft` and `fast-ink`): the fasting dial arc and passed stage ticks, timeline markers, the fast row icon, the live card label, the plan button icon. Never on buttons.
- **Water Teal** (`water`, with `water-soft` and `water-ink`): water icons, the glass, the "human studies" evidence dot.
- **Weight Rose** (`rose`, with `rose-soft`): weight icon, the weight chart line and area, macro bars.

### Tertiary
- **Strength Violet** (`violet`, `violet-soft`): completed strength sets and the "early research" evidence dot.
- **Pro Gold** (`gold`, `gold-light`, `gold-ink`): Premium lock icons and the flat gold Pro button. The header Pro mark itself is muted text, not gold.

### Neutral
- **Warm Paper** (`paper`, `paper-2`): the page and sticky header background.
- **White Page** (`surface`, `surface-2`): cards, rows, the dock; `surface-2` for inputs, hover and disabled fills.
- **Journal Ink** (`ink`): text, and in light mode also the session card ground (`hero` equals `ink`).
- **Pencil** (`muted`) for secondary text and labels; **Faint Pencil** (`faint`) for chevrons, placeholders and disabled text.
- **Hairline** (`line`): every border, divider and empty track.
- **Session Ink** (`hero`, `hero-ink`, `hero-muted`, `hero-line`): the flat ink card. At night it goes darker than the page (`night-hero`) so it still reads as the one dark card.
- **Walk Grey** (`walk`): walk and warm-up blocks in the interval strip and the first fasting zone.
- **Status** (`good`, `warn`, `bad`): weight change, plan adherence, evidence dots and safety callouts.

### Named Rules
**The One Pen Rule.** Cobalt is the only action colour. The Start fast button is cobalt too; amber marks fasting progress, never a control.

**The Meaning Hue Rule.** Amber means fasting, teal means water, rose means weight, violet means strength. A domain hue never decorates a surface that is not about its domain.

**The Paper and Ink Rule.** Light mode is warm paper (`paper`) with white pages and ink text; never a cool grey or blue-tinted neutral. Night mode keeps the same roles on green-black.

## Typography

**Display Font:** Manrope Variable (self-hosted via @fontsource-variable/manrope, with -apple-system and system-ui fallbacks)
**Body Font:** Manrope Variable (same family)

**Character:** A single geometric-humanist sans used at two temperatures: tight, heavy 800 for titles and the big numbers a coach would circle, and plain 400 to 700 for everything you read. The display and body stacks differ only in their system fallbacks.

### Hierarchy
- **Display** (800, 34px, 1.05, -0.03em): page titles (Today, Fast) and the session title on the ink card.
- **Figure** (800, 44px, 1, -0.035em, tabular): the hero number of a summary, such as current weight; the calorie total uses the same voice at 40px.
- **Dial** (700, clamp(44px, 13vw, 56px), -0.035em, tabular): the fasting clock; a larger step for plan names and a smaller one past 24 hours.
- **Headline** (600, 22px, -0.01em): section headings between groups.
- **Title** (600, 17px): card titles. Row titles step down to 15px at 700.
- **Stat** (700, 22px, -0.01em, tabular): figures in a divided stats row; 20px inside the ink card and as side figures.
- **Body** (400, 15px, 1.45): running text, coach notes (14px on the ink card).
- **Label** (500, 13px, muted): figure captions, row details, field labels, in sentence case.
- **Data Label** (700, 12px, 0.08em, uppercase, muted): names a figure or an instrument directly above it, such as Weight over the weight figure, Jog / walk over the strip, or the dial state.
- **Dock Label** (600, 11px): tab names under dock icons.

### Named Rules
**The Tabular Rule.** Body text runs proportional figures; every number that is data (times, stats, kcal, weights, clocks) is set in tabular numerals so columns and ticking clocks do not jitter.

**The Heavy Number Rule.** Weight 800 belongs to titles and the one hero figure per card. Everything else stays at 700 or lighter.

## Layout

A single phone column, max 560px wide with 16px side padding, widening to 680px at 1000px and up. Views stack with a 12px gap; cards pad 16px inside and gap 12px. The spacing scale is 4, 8, 12, 16, 24, 32.

The Today order is fixed by intent: page title with date, the fast row, the session card, the quick log group, the Journey line, then supporting cards. The bottom of every page keeps 96px plus the safe area clear for the dock.

The dock spans the full width at the bottom, its five tabs inset to the column and its right edge reserving 72px for the + button, which sits inside the dock rather than floating above content. At 1000px and up the dock becomes a 92px left rail with the + button beneath it. The header is sticky on the page colour, compact (22px wordmark at 800).

### Named Rules
**The Divided Row Rule.** Groups of figures sit in one row divided by 1px hairlines, first cell flush left. No tiles, no boxes per figure.

## Elevation & Depth

Flat. Cards and rows sit on the page with a 1px hairline and no shadow; the dock is separated by a top hairline only. Depth comes from contrast: the one flat ink card is the deepest thing on any screen. Shadows survive only on transient layers and the + button.

### Shadow Vocabulary
- **Transient** (`box-shadow: 0 6px 20px rgba(23, 32, 29, .08)` light, `0 8px 24px rgba(0, 0, 0, .32)` night, via `--shadow`): toasts and the stage pop-up only.
- **Pen Lift** (`box-shadow: 0 4px 12px rgba(40, 88, 216, .28)`): the + button.
- **Selected Ring** (`box-shadow: inset 0 0 0 1.5px` cobalt): the selected option in the outlined meal selector.

### Named Rules
**The Flat Page Rule.** Resting surfaces never carry a drop shadow. If something needs to stand forward, it becomes the ink card or gets a hairline, not a shadow.

**The No Gloss Rule.** No decorative gradients on surfaces, buttons, badges, avatars or bars. Achievements are drawn as outlined circles in their domain colour. A hard-stop half fill for a half-done day is a data mark and is allowed.

## Shapes

Two radii carry the system: gently rounded cards and rows (16px) and slightly tighter controls (12px: buttons, inputs, segmented controls, the session button). Small inner controls step to 10px. Full pills (999px) are reserved for real tags and chip pickers; circles for the + button, food add buttons, badges and dots. Borders are 1px hairlines; outlined controls use 1.5px.

The fasting dial is a thin 270-degree arc (6px stroke, round caps) open at the bottom, with stage ticks inside the arc and Start and goal labels at its two ends. The interval strip is a row of 4px-radius blocks drawn to scale.

## Components

### Buttons
Plain and decisive: one cobalt button per decision, everything else white.
- **Shape:** gently rounded (12px), 48px tall, 52px for full-width primary actions.
- **Primary:** cobalt fill, white text at 700, 12px 16px padding. Applies to Start fast as well.
- **Hover / Focus:** hover deepens to the darker cobalt; focus is a 2px cobalt outline offset 2px; the session button presses to 98% scale in 0.12s ease-out when motion is allowed.
- **Secondary:** white surface, hairline border, ink text.
- **Disabled:** `surface-2` fill, faint text, not-allowed cursor; no opacity fade.
- **Text links:** cobalt text at 700, no underline.

### Chips
- **Style:** full pills with a hairline on white for pickers; the selected or add chip is cobalt.
- **Tags:** soft domain wash with domain text (`run`, `fast`, `good`), no border.
- **Text tabs:** category and Progress tabs are text with a 2px underline; active is cobalt text and cobalt underline. Horizontally scrollable on purpose.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** white surface on paper; the coach card and the live fasting card are plain white cards too.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 16px, 12px gap.

### Inputs / Fields
- **Style:** `surface-2` fill, 1px hairline, 12px radius, 46px tall, 10px 12px padding; search drops the border.
- **Focus:** border turns cobalt, no glow; caret is cobalt.
- **Segmented, outlined:** the meal selector is a white track with a hairline; the selected option is white with cobalt text and a 1.5px inset cobalt ring.

### Navigation
- **Dock:** full-width white bar with a top hairline, five tabs with 22px line icons (1.8 stroke) over 11px labels in muted text. Active is cobalt icon and label, no pill behind it.
- **The + button:** a 52px cobalt circle set into the right of the dock, white 26px plus.
- **Wide screens:** the dock becomes a bordered 92px left rail.

### Utility Row
The Today building block: a white 64px row with a 24px line icon (tinted only by domain), a 15px bold title over a 13px muted detail, a tabular value on the right, and a faint chevron. Hover fills with `surface-2`.

### Session Card
The one flat ink card. Plan meta and session type at the top, a 34px 800 title, a lead line, then a divided stats row on ink hairlines (total time, running time, effort), the to-scale interval strip (cobalt jog blocks numbered underneath, walk grey for walking, paler grey for warm-up and cool-down), the coach line as a coloured dot and one sentence with the verdict in bold, the cobalt session button, and two text links split by a hairline. The Journey hero uses the same ink card.

### Quick Log
One white group, two by two cells divided by hairlines: Meal, Activity, Water, Weight. Each cell shows a muted label over its current value; water carries a one-tap cobalt +250.

### Fasting Dial and Timeline
The dial: a 6px hairline-coloured arc with the amber progress arc over it, faint ticks for stages ahead and amber for stages passed, an uppercase state label in `fast-ink`, the clock, a short muted line, and the percentage in ink under the arc. The timeline: times in a 52px tabular column (muted, the current row in ink), small amber markers with a soft halo on the current stage. Evidence is a 6px dot plus a word (good for well established, teal for human studies, violet for early research), never a pill.

### Calorie and Weight Summaries
Calories: the total at 40px 800 with remaining and burned figures divided off to its right, over an 8px cobalt bar (warn colour when over). Weight: a data label, the 44px current figure with its unit, the change since day 1 in good or warn, then a divided Start, Current, Goal row.

## Do's and Don'ts

### Do:
- **Do** use cobalt for every primary action and active state, including Start fast and the food add button.
- **Do** set every data number in tabular numerals, and the one hero figure per card at 800.
- **Do** group figures in a single row divided by 1px hairlines, first cell flush left.
- **Do** show evidence and status as a 6px dot plus a word.
- **Do** keep cards at 16px radius and controls at 12px, on a 1px hairline with no shadow.
- **Do** give each screen at most one flat ink card, and put the next action inside it.
- **Do** draw durations to scale (interval strip, dial) and label their ends in plain words.
- **Do** keep reduced motion respected: press scale and transitions only under `prefers-reduced-motion: no-preference`.

### Don't:
- **Don't** use decorative gradients, glossy radial medals or tinted card washes; the build removed every one.
- **Don't** box stats into separate tiles.
- **Don't** use pills for status or evidence; keep pills for real tags and chip pickers.
- **Don't** put amber, teal or rose on anything outside fasting, water or weight.
- **Don't** add a drop shadow to a resting card, row or the dock.
- **Don't** use cool grey or navy neutrals; the page is warm paper and green-black ink.
- **Don't** put a small uppercase tracked line above a headline to introduce it; the data label names a figure or instrument, it does not announce a title.
