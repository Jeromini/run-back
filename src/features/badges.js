// Achievements UI: summary row, full grid, and "new badge" toasts.
import { act, openSheet, toast } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { today } from "../lib/dates.js";
import { state } from "../core/state.js";
import { saveProfile } from "../core/store.js";
import { context, evaluate, nextUp, fmtBadgeProgress } from "../domain/achievements.js";

export const badgeList = () => evaluate(context(state.days, state.profile, today()));
export const badgeEl = (b, sm = false) => `<span class="badge ${b.earned ? b.cat : "off"}${sm ? " sm" : ""}" aria-hidden="true">${esc(b.mark)}</span>`;

export function badgesSummary() {
  const list = badgeList(), earned = list.filter(b => b.earned), nx = nextUp(list);
  const recent = earned.slice(-3).reverse();
  return `<div class="card" data-act="open-badges" style="cursor:pointer">
    <div class="card-head"><h3>Achievements</h3><span class="note">${earned.length}/${list.length} &rsaquo;</span></div>
    ${nx ? `<div class="badges-row">${badgeEl({ ...nx, earned: true })}<div style="min-width:0">
        <b style="display:block">${esc(nx.title)}</b><span class="note">${esc(nx.desc)} &middot; ${fmtBadgeProgress(nx, state.profile.dunit)}</span>
        <div class="bar" style="margin-top:8px"><i style="width:${(nx.pct * 100).toFixed(0)}%;background:var(--accent)"></i></div></div></div>` : `<p class="note">Every badge earned. Remarkable.</p>`}
    ${recent.length ? `<div class="card-head" style="background:var(--surface-2);border-radius:12px;padding:8px 12px"><span class="note">Recently earned</span><div class="badges-recent">${recent.map(b => badgeEl(b, true)).join("")}</div></div>` : ""}
  </div>`;
}
export function openBadges() {
  const list = badgeList(), cats = [["run", "Training"], ["fast", "Fasting"], ["body", "Body"], ["habit", "Habits"]];
  openSheet({ title: "Achievements", html: `<h1 class="big-title">${list.filter(b => b.earned).length} of ${list.length} earned</h1>` + cats.map(([c, name]) => `
    <div class="card"><div class="eyebrow">${name}</div><div class="badgegrid">${list.filter(b => b.cat === c).map(b => `
      <div class="badgecell">${badgeEl(b)}<b>${esc(b.title)}</b><span>${esc(b.desc)}</span>
      ${b.earned ? `<span class="pill good">Earned</span>` : `<div class="bar"><i style="width:${(b.pct * 100).toFixed(0)}%;background:var(--accent)"></i></div><span>${fmtBadgeProgress(b, state.profile.dunit)}</span>`}</div>`).join("")}</div></div>`).join("") });
}
act("open-badges", openBadges);

// Called after every render: announce badges earned since last time (silently seed on first run).
export function checkBadges() {
  const earned = badgeList().filter(b => b.earned).map(b => b.id), p = state.profile;
  if (!p.badges) { p.badges = earned; saveProfile(); return; }
  const fresh = earned.filter(id => !p.badges.includes(id));
  if (!fresh.length) return;
  p.badges = [...p.badges, ...fresh]; saveProfile();
  const b = badgeList().find(x => x.id === fresh[0]);
  setTimeout(() => toast("Achievement unlocked: " + b.title, "badge-t"), 400);
}
