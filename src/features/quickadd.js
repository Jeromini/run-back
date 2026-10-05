// The + button: every log in one place, one tap from any tab.
import { act, openSheet, closeSheet, toast, ICON } from "../lib/dom.js";
import { num } from "../lib/format.js";
import { today } from "../lib/dates.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { planFor } from "../domain/fasting.js";
import { targetFor } from "./water.js";
import { openLogActivity, startFreeWorkout } from "./activitylog.js";
import { openWorkout } from "./workout.js";
import { buzz } from "../lib/sound.js";
import { openNote } from "./notes.js";

const tile = (attrs, icon, color, soft, label, sub) => `<button class="qtile" ${attrs}><i style="background:${soft};color:${color}">${ICON[icon]}</i><b>${label}</b><small>${sub}</small></button>`;

function openQuickAdd() {
  const t = today(), d = state.days[t] || {}, fa = state.profile.fastActive;
  openSheet({ title: "Log", cls: "qsheet", html: `<h1 class="big-title">Log something</h1>
    <div class="qgrid">
      ${tile('data-act="qa-go" data-to="food"', "food", "var(--rose)", "var(--rose-soft)", "Meal or drink", "Search foods, coffee, tea")}
      ${tile('data-act="qa-water" data-ml="250"', "water", "var(--water)", "var(--water-soft)", "Water", `+250 ml &middot; ${num(d.water || 0)} of ${num(targetFor(t))}`)}
      ${tile('data-act="qa-workout"', "play", "var(--accent)", "var(--accent-soft)", "Start a workout", "Guided timer, GPS")}
      ${tile('data-act="qa-activity"', "bolt", "var(--violet)", "var(--violet-soft)", "Log an activity", "Done already? Add it")}
      ${tile('data-act="qa-weigh"', "scale", "var(--rose)", "var(--rose-soft)", "Weigh-in", d.weight ? d.weight + " " + state.profile.unit + " today" : "Not yet today")}
      ${tile('data-act="qa-go" data-to="fast"', "timer", "var(--fast-ink)", "var(--fast-soft)", fa ? "End fast" : "Start fast", fa ? "Open your fast" : planFor(state.profile).label + " plan")}
      ${tile('data-act="qa-note"', "edit", "var(--accent)", "var(--accent-soft)", "Daily note", (state.days[t] || {}).journal && (state.days[t] || {}).journal.text ? "Written today" : "How today went")}
      ${tile('data-act="qa-go" data-to="today" data-lifts="1"', "dumbbell", "var(--violet)", "var(--violet-soft)", "Strength", "Sets and reps")}
      ${tile('data-act="qa-mind"', "mind", "var(--accent)", "var(--accent-soft)", "Stress check-in", "How you feel and today's three")}
    </div>` });
}
act("quick-add", openQuickAdd);
act("qa-go", el => {
  closeSheet(); state.sel = today(); state.view = el.dataset.to; render(); window.scrollTo(0, 0);
  if (el.dataset.lifts) setTimeout(() => { const b = document.querySelector('[data-act="lifts"]'); if (b) b.click(); else { const c = document.getElementById("liftcard"); if (c) c.scrollIntoView({ behavior: "smooth" }); } }, 60);
});
act("qa-water", el => {
  const t = today(), d = day(t), before = d.water || 0, tg = targetFor(t);
  d.water = before + Number(el.dataset.ml); saveDay(t); buzz(15); closeSheet();
  toast(before < tg && d.water >= tg ? "Water target reached" : `${num(d.water)} of ${num(tg)} ml`); render();
});
act("qa-workout", () => { closeSheet(); startFreeWorkout(today(), openWorkout); });
act("qa-activity", () => { closeSheet(); openLogActivity(today()); });
act("qa-weigh", async () => { closeSheet(); state.sel = today(); const { openWeigh } = await import("../views/today.js"); openWeigh(); });
act("qa-note", () => { closeSheet(); openNote(today()); });
act("qa-mind", () => { closeSheet(); state.view = "mind"; render(); window.scrollTo(0, 0); });
