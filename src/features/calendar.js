// Month calendar: dots show what happened each day; tap a day to open it on Today.
import { act, openSheet, closeSheet, ICON } from "../lib/dom.js";
import { iso, parse, addDays, today, MONL } from "../lib/dates.js";
import { state, render } from "../core/state.js";
import { strengthDone, fastsOf, foodTotals } from "../domain/metrics.js";

let month = null;
export function openCalendar() { month = parse(state.sel); month.setDate(1); draw(); }
function draw() {
  const first = new Date(month), start = addDays(first, -first.getDay()), t = today();
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), k = iso(d), x = state.days[k] || {};
    const dots = [x.runDone && "var(--accent)", (x.crossDone || strengthDone(x)) && "var(--violet)", fastsOf(x).length && "var(--fast)", (foodTotals(x).n || x.weight) && "var(--rose)"].filter(Boolean);
    cells += `<button data-act="cal-day" data-d="${k}" class="${d.getMonth() !== month.getMonth() ? "out " : ""}${k === t ? "today " : ""}${k === state.sel ? "sel" : ""}">${d.getDate()}<span class="dots">${dots.map(c => `<i style="background:${c}"></i>`).join("")}</span></button>`;
  }
  openSheet({ title: "Calendar", html: `<div class="datenav"><button class="iconbtn" data-act="cal-move" data-n="-1" aria-label="Previous month">${ICON.back}</button>
    <div class="t">${MONL[month.getMonth()]} ${month.getFullYear()}</div><button class="iconbtn" data-act="cal-move" data-n="1" aria-label="Next month">${ICON.next}</button></div>
    <div class="cal">${["S", "M", "T", "W", "T", "F", "S"].map(d => `<span class="dh">${d}</span>`).join("")}${cells}</div>
    <div class="row note" style="gap:14px"><span><i class="legend-dot" style="background:var(--accent)"></i>Run</span><span><i class="legend-dot" style="background:var(--violet)"></i>Strength / cardio</span><span><i class="legend-dot" style="background:var(--fast)"></i>Fast</span><span><i class="legend-dot" style="background:var(--rose)"></i>Food / weight</span></div>` });
}
act("cal-move", el => { month.setMonth(month.getMonth() + Number(el.dataset.n)); closeSheet(); draw(); });
act("cal-day", el => { state.sel = el.dataset.d; state.view = "today"; closeSheet(); render(); window.scrollTo(0, 0); });
act("open-cal", openCalendar);
