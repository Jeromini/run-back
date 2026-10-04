// More: your header (streak, progress) and one grouped list to everything that isn't a tab:
// profile and settings, fasting plan and routine, crew, guides, achievements, sharing.
import { act, ICON } from "../lib/dom.js";
import { esc, round1 } from "../lib/format.js";
import { today } from "../lib/dates.js";
import { state, S, render } from "../core/state.js";
import { isPro } from "../core/premium.js";
import { weights } from "../domain/metrics.js";
import { planFor, routineLabel } from "../domain/fasting.js";
import { journeyStreak } from "./journey.js";
import { APP_NAME } from "../config.js";

// Days in a row with anything logged, counting back from today (today only counts once logged).
function logStreak() {
  let n = 0;
  for (let d = new Date(); ; d.setDate(d.getDate() - 1)) {
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const x = state.days[k];
    if (x && Object.keys(x).length > 1) n++; else if (k !== today()) break;
    if (n > 3650) break;
  }
  return n;
}

const row = (icon, label, attrs, sub = "", tone = "") => `<button class="mrow" ${attrs}><i class="${tone}">${ICON[icon] || ICON.star}</i><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span><em aria-hidden="true">${ICON.next}</em></button>`;

export function renderMore(root) {
  const p = state.profile, list = weights(state.days), u = p.unit;
  const start = p.startWeight || (list.length ? list[0].w : null), now = list.length ? list[list.length - 1].w : null;
  const lost = start && now ? round1(start - now) : null;
  const streak = journeyStreak() ?? logStreak();
  const name = (p.displayName || (S.email || "").split("@")[0] || "You").trim();
  const r = p.routine, plan = planFor(p);
  root.innerHTML = `<section class="view">
    <h1 class="big-title">More</h1>
    <div class="mhead">
      <div class="mstat"><span>Streak</span><b>${streak}</b><small>${streak === 1 ? "day" : "days"}</small></div>
      <div class="mme"><span class="mavatar" aria-hidden="true">${esc(name.charAt(0).toUpperCase())}</span><b>${esc(name)}</b>${isPro() ? `<span class="pro-tag">Pro</span>` : ""}</div>
      <div class="mstat"><span>Progress</span><b>${lost == null ? "-" : (lost > 0 ? lost : 0) + " " + u}</b><small>${lost == null ? "add a weigh-in" : lost >= 0 ? u + " lost" : "since start"}</small></div>
    </div>
    <div class="mlist">
      ${row("star", isPro() ? APP_NAME + " Premium" : "Try Premium", 'data-act="paywall"', isPro() ? "Every feature unlocked" : "The coach, every plan, deep trends", "gold")}
      ${row("user", "My profile", 'data-act="go-settings"', "Your numbers, units, appearance, account")}
    </div>
    <div class="mlist">
      ${row("timer", "Fasting plan", 'data-act="fast-plans"', esc(plan.label), "fast")}
      ${row("cal", "Fasting routine", 'data-act="routine-edit"', r && r.on ? esc(routineLabel(r)) + " on your chosen days" : "Fast on chosen days", "fast")}
      ${row("flag", "My journey", 'data-act="tab" data-v="journey"', p.journey && p.journey.on ? esc(p.journey.name) : "Choose a package")}
      ${row("food", "Food log", 'data-act="tab" data-v="food"', "Meals, drinks and calories", "rose")}
      ${row("scale", "Weight and measurements", 'data-act="tab" data-v="trends"', now ? now + " " + u + " latest" : "Log your first weigh-in", "rose")}
    </div>
    <div class="mlist">
      ${row("crew", "Crew", 'data-act="tab" data-v="crew"', p.crewId ? "Your crew's week" : "Train with friends", "violet")}
      ${row("book", "Guides", 'data-act="open-guides"', "Short reads on fasting, training and food")}
      ${row("star", "Achievements", 'data-act="open-badges"', "Badges you've earned")}
      ${row("share", "Share my week", 'data-act="share"', "A card for your story or chat")}
    </div>
    <p class="note mfoot">Stop and get medical advice for chest pain, faintness or unusual breathlessness.</p>
  </section>`;
}
act("go-more", () => { state.view = "more"; render(); window.scrollTo(0, 0); });
act("go-settings", () => { state.view = "me"; render(); window.scrollTo(0, 0); });
