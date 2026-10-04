---
target: Fast tab
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\jerom\\Fitness\\web\\src\\views\\fast.js"
target_fingerprint: "sha256:73621390e712de3a327dc24d44246099963ed67cff2d49e597571eaf69e35b31"
target_path: "C:\\Users\\jerom\\Fitness\\web\\src\\views\\fast.js"
timestamp: 2026-10-04T14-28-25Z
slug: src-views-fast-js
---
Method: dual-agent (A: design review, B: detector + browser overlay)

## Design Health Score: 25/40
1 Visibility 3 (goal reached, unclear what past goal means) | 2 Real world 3 (two vocabularies: 11 stages vs 4 zones) | 3 Control 2 (plan change silently rewrites live goal; "?" delete) | 4 Consistency 2 (two conflicting Next lines; four selected styles) | 5 Error prevention 2 (long routine fasts skip the safety checklist) | 6 Recognition 3 | 7 Efficiency 3 (no extend goal) | 8 Minimalist 2 (about 7 screens during a fast) | 9 Recovery 2 | 10 Help 3 (disclaimer at the very bottom)

## Specificity
Top third (dial, evidence pills, live card, coach) is product-specific; lower two thirds is a generic stat/chart/history stack.
Detector: CLI clean; browser 18 findings, real: --fast on --fast-soft contrast 2.9:1 (plan button, dial %, stage number), 10.5px evidence pills (10), h1 to h3 skip; false positive: hidden auth gradient; pulsing live dot intended.

## Priority Issues
- [P0] Routine fasts of 36 h+ start from the due banner or day sheet without the extended-fast checklist; builder offers 72 h with no warning. harden
- [P1] Changing plan mid-fast silently changes the live goal (can jump to 72 h without checklist). harden
- [P1] Too much during a live fast: duplicate Now/Live cards with conflicting Next, routine pitch, stats, zones, water, history. distill
- [P2] Past goal gives no guidance: neutral End fast, coach four screens down, no extend. clarify
- [P2] Stage vs zone naming mismatch; contrast and 10.5px pills. clarify / polish

## Personas
First-time faster: 12 plan tiles, no start-here, routine builder defaults to 24 h MWF, disclaimer at bottom. Busy exec: train/eat answer four screens down; two Next lines disagree. Extended faster: no extend, zones cap at Deep fast, routine long fasts skip checklist.
