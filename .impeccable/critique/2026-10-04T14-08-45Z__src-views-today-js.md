---
target: Today screen
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\jerom\\Fitness\\web\\src\\views\\today.js"
target_fingerprint: "sha256:dd12fea72dc7375eaf8a27a9f80c0162774667037cd1ff5ee10f7c6f7d01c32c"
target_path: "C:\\Users\\jerom\\Fitness\\web\\src\\views\\today.js"
timestamp: 2026-10-04T14-08-45Z
slug: src-views-today-js
---
Method: dual-agent (A: design review, B: detector + browser overlay)

## Design Health Score: 23/40 (acceptable, significant improvements needed)

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Live fast timer excellent; sync state is an unlabelled dot |
| 2 | Match System / Real World | 3 | "Week 1: Build" beside "Day 14 of 84" contradicts |
| 3 | User Control and Freedom | 3 | Water undo exists; weight and sets hard to correct |
| 4 | Consistency and Standards | 1 | Three different week definitions and counts (Today header, rings, Journey) |
| 5 | Error Prevention | 2 | Coach "eat first" sits below an unqualified Start run |
| 6 | Recognition Rather Than Recall | 3 | Everything visible (the cause of #8) |
| 7 | Flexibility and Efficiency | 3 | Good shortcuts, but logging duplicated in 2-3 places |
| 8 | Aesthetic and Minimalist Design | 2 | 11 blocks, 37 controls, 2.6 screens long |
| 9 | Error Recovery | 2 | Pain/effort guidance hidden in a collapsed section |
| 10 | Help and Documentation | 1 | Rings, streak rule and Journey dots unexplained |

## Design Specificity
Strong product-specific core (run hero with interval strip and 2021 pace line, live Fast + Train coach, condensed numerals) inside a generic card stack (Apple-style rings, 4 quick tiles, water glass, read-next row). The differentiator, training timed around the fast, is split across two unrelated cards.
Detector: source files clean. Browser overlay: 17 findings. 8 low contrast (PRO tag 1.9:1, fast timer 2.9:1, hero copy on teal 4.2:1, water buttons 4.0:1, placeholders 4.2:1), 8 undersized text (10.5px day labels and PRO tag), 2 cyan gradient (run hero; auth screen hidden here). False positive: .gauge .mk border triangle.

## Priority Issues
1. [P0] Three conflicting progress counts: header Week 1 (Thu-Wed plan week) vs Journey Week 2 (Mon-Sun); rings Runs 1/3 vs Journey Run 3/3. Fix: one week definition and one progress source (Journey). clarify / distill.
2. [P1] Coach advice below the action it governs: caution/stop advice must sit inside the hero above Start run, with the CTA relabelled. layout.
3. [P1] Today duplicates Journey and is too long: make Today a "now" screen (fast, session + coach, compact log row), Journey owns checklist, rings and totals. distill.
4. [P2] First mobile screen is all status; session starts below the fold. Merge header lines, move day bar into calendar, hero second. layout.
5. [P2] Contrast and small text from the overlay (PRO tag, fast timer, water buttons, hero copy, 10.5px labels). polish/audit.
6. [P2] Weight bundled with run back-fill and pain notes; zero states read as deficits ("0 of 7", empty glass). clarify.

## Persona Red Flags
- First-time Premium user: unlabelled Journey dots, unexplained ring targets, Week 1 vs Day 14, nothing says what Premium unlocked.
- Busy exec (20 s): session title off-screen on mobile; greeted with "0 of 7 goals"; fast card says break when ready while coach says eat first further down.
- Power user: water loggable in 3 places, weight field ~1800px down, Log an activity twice.

## Minor
"+ 250 ml" tile label inconsistent; daybar Today chip heaviest element; inline styles bypass tokens; empty glass outline reads broken; hero note at 0.8 opacity on teal.

## Questions
Should Today become the top of Journey? Why are fast and session two unrelated cards? Would a premium coach open with "0 of 7"?
