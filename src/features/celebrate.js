// The app's one authored moment: a ring that draws itself closed around a tick, for wins that
// matter (a fasting goal reached, a Journey milestone). Shares the pop-up layer with stage pop-ups.
import { act, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { buzz } from "../lib/sound.js";

const queue = [];
let open = false;

export function celebrate({ title, sub = "", tone = "accent", cta = "Nice" }) {
  queue.push({ title, sub, tone, cta });
  if (!open) next();
}
function next() {
  const box = document.getElementById("stagepop"), w = queue.shift();
  if (!box || !w) { open = false; return; }
  // never cover a stage pop-up that is already showing
  if (!box.hidden && box.innerHTML) { queue.unshift(w); setTimeout(next, 1500); return; }
  open = true; buzz([30, 50, 90]);
  box.innerHTML = `<div class="pop win ${w.tone}" role="dialog" aria-modal="true" aria-labelledby="win-t">
    <div class="win-mark" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="52"/><circle class="arc" cx="60" cy="60" r="52"/></svg><span>${ICON.tick}</span></div>
    <h2 id="win-t">${esc(w.title)}</h2>${w.sub ? `<p>${esc(w.sub)}</p>` : ""}
    <button class="btn primary big" data-act="win-close">${esc(w.cta)}</button></div>`;
  box.hidden = false;
  setTimeout(() => { const b = box.querySelector("[data-act=win-close]"); if (b) b.focus({ preventScroll: true }); }, 50);
}
act("win-close", () => { const box = document.getElementById("stagepop"); box.hidden = true; box.innerHTML = ""; open = false; setTimeout(next, 250); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && open) { const b = document.querySelector("[data-act=win-close]"); if (b) b.click(); } });
