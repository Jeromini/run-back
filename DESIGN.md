---
name: Run Back
description: Fasting, training and nutrition in one calm coach, in the shape of an iOS health app on deep navy.
colors:
  bg: "#151a24"
  bg-2: "#1a202c"
  surface: "#222936"
  surface-2: "#2a3240"
  raised: "#313a4a"
  ink: "#f2f4f8"
  muted: "#a0a9b8"
  faint: "#6c768a"
  line: "#323b4b"
  accent: "#5b96f7"
  accent-2: "#4683ec"
  accent-ink: "#0b1a3a"
  accent-soft: "#22355a"
  fast: "#f5b544"
  fast-soft: "#3a3020"
  fast-ink: "#f5b544"
  rose: "#f07a9b"
  rose-soft: "#3b2230"
  water: "#3fd0c0"
  water-soft: "#173a3c"
  water-ink: "#6fe0d3"
  violet: "#a78bfa"
  violet-soft: "#2c2750"
  gold-1: "#f6d77f"
  gold-2: "#e2b04a"
  gold-ink: "#2a1d02"
  good: "#5fca8f"
  warn: "#eda552"
  bad: "#f07a6f"
  light-bg: "#f2f3f7"
  light-bg-2: "#e9ebf1"
  light-surface: "#ffffff"
  light-surface-2: "#f5f6f9"
  light-ink: "#111827"
  light-muted: "#5f6878"
  light-faint: "#9aa2b1"
  light-line: "#e3e6ec"
  light-accent: "#2f6fe4"
  light-accent-2: "#255fcc"
  light-accent-soft: "#e2ebfc"
  light-fast: "#c47f06"
  light-fast-soft: "#fcefd6"
  light-fast-ink: "#8a5600"
  light-rose: "#c9406b"
  light-rose-soft: "#fbe3ea"
  light-water: "#0d9488"
  light-water-soft: "#d6f2ee"
  light-water-ink: "#0a6b62"
  light-violet: "#6d4fd8"
  light-violet-soft: "#ebe5fd"
  light-good: "#23824f"
  light-warn: "#b3621b"
  light-bad: "#b8382f"
  hero-run-from: "#2c62d4"
  hero-run-to: "#1a3a82"
  hero-cross-from: "#6d55c9"
  hero-cross-to: "#3b2d7a"
  hero-rest-from: "#4a5f78"
  hero-rest-to: "#2c3a4c"
  journey-from: "#1b2f60"
  journey-to: "#131b30"
  journey-glow: "#2f5bc0"
  hero-tint: "#a9c8ff"
  hero-go-ink: "#13306b"
  art-blue: "#dce8ff"
  art-blue-ink: "#2f5fc4"
  art-sun: "#fff1c9"
  art-sun-ink: "#b8660a"
  art-rose: "#fde0e7"
  art-rose-ink: "#c23d66"
typography:
  large-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  section:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "13px"
    fontWeight: 500
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 600
  stat-numeral:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
  timer-numeral:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "clamp(56px, 17vw, 76px)"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  live-numeral:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Inter\", system-ui, \"Segoe UI\", sans-serif"
    fontSize: "clamp(76px, 25vw, 112px)"
    fontWeight: 700
    lineHeight: 0.95
    fontFeature: "tnum"
rounded:
  input: "12px"
  control: "14px"
  tile: "16px"
  tile-lg: "18px"
  card: "20px"
  hero: "24px"
  tab-bar: "30px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "10px"
  view: "14px"
  card: "16px"
  hero: "18px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
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
  fab:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    size: "66px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tab-bar}"
    padding: "5px"
  tab-active:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.accent}"
    typography: "{typography.caption}"
    rounded: "{rounded.card}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  grouped-list:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  grouped-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "14px 16px"
    height: "60px"
  quick-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.tile-lg}"
    padding: "14px"
    height: "116px"
  stat-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.stat-numeral}"
    rounded: "{rounded.tile}"
    padding: "12px"
  guide-art-blue:
    backgroundColor: "{colors.art-blue}"
    textColor: "{colors.art-blue-ink}"
    rounded: "{rounded.tile-lg}"
  guide-art-sun:
    backgroundColor: "{colors.art-sun}"
    textColor: "{colors.art-sun-ink}"
    rounded: "{rounded.tile-lg}"
  guide-art-rose:
    backgroundColor: "{colors.art-rose}"
    textColor: "{colors.art-rose-ink}"
    rounded: "{rounded.tile-lg}"
  hero-run:
    backgroundColor: "{colors.hero-run-from}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.hero}"
    padding: "18px"
  hero-go:
    backgroundColor: "{colors.accent-ink}"
    textColor: "{colors.hero-go-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.tile}"
    height: "56px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "10px 12px"
    height: "46px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  pill-fast:
    backgroundColor: "{colors.fast-soft}"
    textColor: "{colors.fast}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  sheet-pop:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hero}"
    padding: "20px"
---

# Design System: Run Back

## Overview

**Creative North Star: "The Quiet Coach in Your Pocket"**

Run Back looks and behaves like a native iOS health app that happens to know about fasting, training and food at once. The world is deep blue-grey navy in the dark theme and cool paper grey in the light one, with white or slate cards, grouped lists, a floating pill tab bar, and a separate round blue plus button that holds every log. The visual reference is the user's own: Lose It style grouped lists and floating tab bar, and a fasting app's stat grids and illustrated insight cards. Nothing is invented for spectacle; every surface is a familiar phone pattern done carefully.

Type is the system face (SF Pro on Apple devices, Inter loaded from Google Fonts elsewhere) in mixed case throughout. Hierarchy comes from size and weight on a short, Apple-like ramp, not from case, tracking or a second family. Large tabular numerals carry the data: timers, streaks, weights and totals are the loudest things on any screen, and the words around them stay small and muted.

Colour is functional. Blue means act now and running; amber is the fast; rose is the body (food, weight); teal is water; violet is strength and cross-training; gold is Premium. One saturated card per screen at most (the session hero or the Journey card) carries a fixed deep gradient with white ink; everything else sits on neutral surfaces with a soft tinted icon square to say which domain it belongs to. The voice is a calm expert coach, and the visuals match: no hype colour, no alarm red except for safety and destructive actions.

**Key Characteristics:**
- Deep navy dark theme first, a complete light theme second, both from one token set.
- System font, mixed case, eight text sizes (12 / 13 / 15 / 17 / 20 / 22 / 28 / 34) plus timer numerals.
- Floating five-tab pill bar with a separate 66px plus button; a left rail at 1000px and up.
- Grouped lists with hairline dividers, 2-column tile grids, and pastel illustrated guide tiles.
- Domain colour coding through soft tinted icon squares, not coloured cards.
- One saturated gradient hero per screen, white ink, a white primary pill inside it.

## Colors

A cool navy neutral ramp carrying one confident iOS blue and five domain hues, each with a soft companion for chips and icon squares.

### Primary
- **Action Blue** (accent): the primary button, the plus button, the active tab icon, the focus ring, selected onboarding choices, links and back links, switches, progress fills. Pressed and hover use **Deep Action Blue** (accent-2). **Blue Wash** (accent-soft) backs blue icon squares, run pills and the highlighted row in lists.

### Secondary
- **Fast Amber** (fast, fast-ink, fast-soft): everything about the fast. The dial, stage numbers, plan cards, routine days, the stage pop-up border and title, the fasting tab's active icon. Use fast-ink for amber text so the light theme stays legible (it darkens to a brown amber there).

### Tertiary
- **Body Rose** (rose, rose-soft): food and weight. Weight chart line and area, the calorie side of portion totals, food and weigh-in tiles.
- **Water Teal** (water, water-ink, water-soft): water logging and the "human studies" evidence chip; info-tone coach cards.
- **Strength Violet** (violet, violet-soft): strength sets, cross-training hero and day dots, the "early research" evidence chip, crew rows.
- **Premium Gold** (gold-1 to gold-2 gradient, gold-ink text): the Pro tag, gold buttons, price selection, lock glyphs, the Premium row in More. Gold is only for Premium.

### Neutral
- **Night Navy** (bg) and **Lifted Navy** (bg-2): the page and sticky header. The light theme swaps to cool paper grey (light-bg).
- **Slate Surface** (surface), **Slate Inset** (surface-2) and **Raised Slate** (raised): cards and lists, inputs and secondary buttons, the active tab and selected segment. In light: white, near-white, white.
- **Mist Ink** (ink), **Fog** (muted), **Dusk** (faint): primary text, secondary text and labels, chevrons and disabled marks.
- **Hairline** (line): 1px card borders and list dividers.
- **Status** (good, warn, bad): achieved and safe, caution, stop and destructive. Each has a light-theme counterpart.

### Fixed-colour surfaces
- **Session heroes** run on fixed gradients that do not change with theme: run blue (hero-run-from to hero-run-to), cross violet, rest slate. The Journey card is a deep navy gradient with a blue glow in the top right and pale blue (hero-tint) accents.
- **Guide illustrations** sit on fixed pastels (art-blue, art-sun, art-rose) with a deeper ink of the same hue, in both themes.

### Named Rules
**The Domain Hue Rule.** Each domain owns one hue and nothing else borrows it: blue for action and running, amber for the fast, rose for body, teal for water, violet for strength, gold for Premium. A new feature picks its domain's hue; it never introduces a new one.

**The Tinted Square Rule.** Domain colour arrives as a soft square behind a glyph (accent-soft with accent, fast-soft with fast-ink, and so on), not as a coloured card background. Cards stay neutral.

**The One Hero Rule.** At most one saturated gradient card per screen. The rest of the screen is neutral surfaces.

## Typography

**Display Font:** the system face: -apple-system, SF Pro Display, then Inter, system-ui, Segoe UI
**Body Font:** the system face: -apple-system, SF Pro Text, then Inter, system-ui, Segoe UI

**Character:** One family, native to the phone. It reads as an Apple Health or Lose It screen: friendly, precise, unbranded, letting numbers lead.

### Hierarchy
- **Large Title** (700, 34px, 1.1, -0.02em): one per screen, top left (Today, More, Guides, Log something). Also hero and pop-up titles.
- **Section** (600, 22px, -0.01em): headings between groups, for example guide categories.
- **Title** (700, 20px, 1.15): stage names, hero action label, article subheads.
- **Headline** (600, 17px, 1.25): card titles, tile and list row titles (rows use 500), back links, underline tabs.
- **Body** (400, 15px, 1.45): coach copy, notes, descriptions. Articles step up to 17px at 1.6 with a 65ch measure.
- **Label** (500, 13px): muted group labels above fields and sub-lines under row titles.
- **Caption** (600 to 700, 12px): tab labels, chart ticks, small chips, weekday letters.
- **Numerals** (700, tabular): 20 to 22px in rows and legends, 28px in stat tiles, 34px for headline figures and live stats, 44px for weigh-in and the stepper, clamp(56px, 17vw, 76px) on the fasting dial, clamp(76px, 25vw, 112px) for the live workout clock.

### Named Rules
**The Mixed Case Rule.** Every label, tab, button and heading is sentence or title case. No uppercase, no tracked-out small caps.

**The Numbers Lead Rule.** Figures are the largest element in their block and always use tabular numerals; the unit and the label beside them drop to 13px muted.

## Layout

A single phone column (max 560px, 16px side padding) under a sticky header holding the wordmark, sync dot, Guides and More icons. Views stack with a 14px gap; cards pad 16px; heroes pad 18px. Grids are 2-up (quick add, guide tiles, plans, stat pairs) or 3-up (stat rows, totals), with 8 to 10px gaps; guide tiles use 16px rows by 14px columns. Bottom padding reserves 110px plus the safe area for the floating bar.

Full-screen sheets slide over everything with their own sticky top bar and the same 560px body; the workout screen is a separate always-dark full-screen layer. At 1000px and wider the tab bar becomes a 92px vertical rail on the left, the plus button sits under it, the content column widens to 680px and sheets to 640px. Under 380px a few dense rows reduce their indents.

### Named Rules
**The Thumb Zone Rule.** Primary navigation and the log action live at the bottom, floating, within one thumb's reach. Nothing important is only reachable from the top.

## Elevation & Depth

Mostly tonal: depth comes from stepping navy (bg, surface, surface-2, raised) and a 1px hairline border, not from shadows. Shadows are reserved for things that float above the page.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 12px 32px rgba(0, 0, 0, .38)` dark, `0 10px 30px rgba(17, 24, 39, .10)` light): the tab bar, toasts, the stage and celebration pop-ups.
- **Blue glow** (`box-shadow: 0 10px 26px color-mix(in srgb, var(--accent) 45%, transparent)`): the plus button only.
- **Lift** (`box-shadow: 0 1px 3px rgba(0,0,0,.2)`): the selected segment in a segmented control and the switch thumb.

The tab bar adds a 16px backdrop blur over 88% surface so content shows faintly through it.

### Named Rules
**The Float Only Rule.** Cards, tiles and lists never cast a shadow. Only floating chrome (tab bar, plus button, toast, pop-ups) does.

## Shapes

Soft, generous, continuous corners in a clear ladder: inputs and segments 12px, buttons 14px, stat and plan tiles 16px, quick add and guide tiles 18px, cards and grouped lists 20px, heroes and pop-ups 24px, the tab bar 30px, and full pills for chips, tags and the plus button. Icon squares are 10 to 12px. Hairline 1px borders on neutral containers; onboarding choices use 1.5px; price cards 2px. Guide illustrations clip two translucent white circles inside their tile as a simple illustrated motif. Glyphs are stroked line icons (2px, round caps and joins), thinner (1.6 to 1.8) in More rows and guide art.

## Components

### Buttons
Rounded, solid, one clear action per block.
- **Shape:** gently rounded (14px), at least 48px tall; full width "big" variant 54px at 17px.
- **Primary:** Action Blue fill, white text, weight 700.
- **Secondary:** Slate Inset fill with hairline border. **Ghost** is transparent; **Danger** keeps the neutral fill with bad-coloured text.
- **Fast / Gold:** amber fill or gold gradient with dark gold-ink text, only in their domains.
- **Press:** scale(.97) with a .15s colour transition, disabled at 50% opacity. Focus is a 2px accent outline offset 2px.
- **Mini:** 38px, 11px radius, 13px text, for inline row actions.

### The plus button
A 66px Action Blue circle with a 30px plus glyph, fixed bottom right beside the tab bar (left rail position at 1000px), with the blue glow. It opens the quick add sheet. Hidden while any sheet is open. Press scales to .94.

### Navigation
- **Tab bar:** a floating pill (30px radius) of five tabs (Today, Journey, Fast, Food, Progress), blurred translucent surface, hairline border, float shadow, leaving room on the right for the plus button. Each tab is a 23px line icon over a 12px label at 78% opacity; the active tab gets a raised slate pill, full opacity and a blue icon (amber for Fast).
- **Underline tabs:** text-only tabs at 17px (500, muted) with a 2px ink underline and 600 weight on the active one, scrolling sideways over a hairline. Used on Progress.
- **Segmented control:** a 12px inset track with 9px segments; the active segment is raised slate with the lift shadow.
- **Back link:** blue 17px text with a chevron, top left of sheets.

### Grouped lists (More)
iOS settings style. A rounded 20px surface with hairline border holds 60px rows: a 24px coloured line glyph (muted by default, gold, amber, rose or violet by domain), a 17px title at 500 with an optional 13px muted sub-line, and a faint chevron. Rows divide with hairlines; hover fills Slate Inset. The More header above is three columns: streak, a 76px gradient avatar with name and Pro tag, and progress, each as a 28px figure over 15px words.

### Quick add tiles
A 2-column grid of 116px tiles (18px radius, surface, hairline): a 40px tinted icon square, a 17px title at 600 and a 13px muted line with live context (for water: the amount added and progress against the day's target).

### Stat tiles
Fasting-app stat grids: surface tiles (16px radius, 12px padding) with a 28px tabular figure over a 13px muted label, in rows of three or pairs.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** surface with a 1px hairline.
- **Shadow Strategy:** none (see Float Only Rule).
- **Internal Padding:** 16px, 12px internal gap, card titles 17px at 600.
- **Coach card:** a neutral card washed 12% with its tone colour (good, caution, stop, info) fading to surface, a matching 35% border, and a toned 12px label with icon.

### Session hero
A 24px-radius card on a fixed 150 degree gradient (run blue, cross violet or rest slate), white ink, 18px padding. Meta line at 13px, title at 34px, chips as 16% white pills, a segmented work strip, and a white 56px action pill with navy text. Coach advice inside sits in a translucent white panel (12% fill, 14% border) with a small toned icon square.

### Journey card
The same shape on a deep navy gradient with a blue radial glow, a score ring, a 34px title, a pale blue progress track, three translucent stat cells and an italic coach quote with a pale blue opening mark.

### Guide tiles
Illustrated insight cards in a 2-column grid: a 4:3 pastel art panel (18px radius) with a 44% line glyph in the hue's deeper ink and two translucent white circles, a dark round lock badge in the corner for Premium guides, then the title at 17px 500 and the read time at 13px muted beneath, with no card around them.

### Inputs / Fields
- **Style:** Slate Inset fill, hairline border, 12px radius, 46px tall; labels sit above at 13px muted.
- **Focus:** border turns Action Blue; caret is blue.
- **Big entry:** weigh-in uses a borderless 44px tabular numeral over a 2px underline that turns blue on focus.
- **Switch:** iOS style 50 by 30px, line-coloured off, blue on.

### Chips and pills
- **Chip:** full pill, surface fill, hairline, 15px 700. Selected inverts to ink fill and bg text; the "add" chip is blue.
- **Pill / tag:** 13px pill in a domain soft colour with the domain hue as text. Evidence chips (12px) map strong to good, human studies to water, early research to violet.

### Pop-ups and celebration
Bottom-anchored 24px cards over a dark scrim, float shadow, rising in .28s. The stage pop-up has an amber border and amber 34px title with a stage progress bar. The celebration variant centres everything, draws a 104px ring that sweeps closed in .9s, then pops in a filled tick disc, in blue (or amber for a finished fast), followed by a full width button.

### Onboarding
Full-screen, no sheet bar. A 52px blue-wash mark, a 34px title capped at 14ch, 17px muted intro, icon-led points, then a four-segment progress bar and 56px choice cards (16px radius, 1.5px border) whose selected state takes a blue border, a 7% blue wash and a filled blue tick. Children rise in with a short stagger.

### Workout (signature)
An always-dark full-screen layer like a watch face. A phase-coloured ring (run blue, walk grey, hard amber) around a clamp(76px, 25vw, 112px) clock, a three-up live stat row at 34px, a segmented interval timeline with a white needle, and an 84px round main control flanked by hold-to-confirm side buttons.

### Known leftovers (recorded, not part of the system)
These exist in the shipped stylesheet and should be cleaned up, not copied.
- **Duplicate stepper.** The stepper is defined twice: an older 60px three-column grid with a 44px figure and 56px buttons, then a later 40px flex version with a 22px figure. The later rule wins in the cascade; the first is dead weight.
- **Other doubled rules.** The small group label is declared at 12px 700 and again at 13px 500 (the second wins); the crew leaderboard row grid is overridden with !important.
- **A few literals.** The GPS dots, the hold-to-end fill and the locked coach glyph still use literal status colours (#4fc184, #ef7469, #f3d27a) instead of tokens.
- **Untokenised literals.** Coach icon tones inside heroes (#f5b544, #ff9d92, #7ee2a8), the More avatar gradient (#7aa7ff to #9b7bf5), and the dark text on amber buttons (#2a1d02, equal to gold-ink but not referenced) are typed directly rather than drawn from tokens.
- **Off-ramp sizes.** 44px numerals, the 52px auth wordmark and the 32px avatar initial sit outside the eight-step ramp; the stylesheet header still says "seven sizes" while listing eight.
- **Unused token.** The 14px small radius variable is declared but never referenced; 14px corners are typed literally.

## Do's and Don'ts

### Do:
- **Do** take colour from the domain: blue for action and running, amber for fast, rose for body, teal for water, violet for strength, gold for Premium only.
- **Do** put domain colour in a soft tinted icon square or pill and keep cards on neutral surface with a 1px hairline.
- **Do** use the system face in mixed case on the 12 / 13 / 15 / 17 / 20 / 22 / 28 / 34 ramp, with 34px large titles at -0.02em.
- **Do** make figures the largest thing in their block, bold and tabular, with 13px muted units and labels.
- **Do** route new logging actions through the plus button's quick add grid rather than adding buttons to tabs.
- **Do** build secondary destinations as grouped list rows in More (24px glyph, 17px title, 13px sub-line, chevron).
- **Do** keep touch targets at least 44px (buttons 48px, list rows 60px) and gate motion behind prefers-reduced-motion.
- **Do** keep every new colour a token with both a dark and a light value.

### Don't:
- **Don't** use uppercase or letter-spaced labels; the system is mixed case everywhere.
- **Don't** add a second typeface or a condensed display face.
- **Don't** put shadows on cards, tiles or lists; only floating chrome casts one.
- **Don't** place more than one saturated gradient hero on a screen.
- **Don't** use gold outside Premium or red outside safety, stop and destructive states.
- **Don't** put a small label above a heading as a kicker; let the large title stand alone.
- **Don't** use em or en dashes in any copy.
