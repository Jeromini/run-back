// Daily note: a few words and a mood for any day, with or without a Journey.
// Saved to day.journal = { text, mood: 1-5 }, the same place the Journey diary reads.
import { act, onInput, openSheet, closeSheet, segHtml, toast } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { today, nice } from "../lib/dates.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { MOODS } from "../domain/journey.js";

let noteDate = null, draft = null;

export function openNote(date = today()) {
  noteDate = date;
  const jr = (state.days[date] || {}).journal || {};
  draft = { text: jr.text || "", mood: jr.mood || null };
  openSheet({ title: "Daily note", html: `<h1 class="big-title">${date === today() ? "How did today go?" : esc(nice(date))}</h1>
    <p class="note">A line or two on energy, sleep, cravings or a win. Over time it shows what helps and what doesn't.</p>
    <label class="f">Note<textarea id="note-text" data-in="note-text" rows="5" maxlength="1000" placeholder="Slept well, legs fresh, easy to say no to the biscuits">${esc(draft.text)}</textarea></label>
    <label class="f">Mood${segHtml("note-mood", MOODS.map((m, i) => [i + 1, m]), draft.mood || "", 'data-act="note-mood" aria-label="Mood"')}</label>
    <button class="btn primary big" data-act="note-save">Save note</button>
    ${state.profile.journey && state.profile.journey.on ? `<p class="note">It also appears in your Journey diary.</p>` : ""}` });
  setTimeout(() => { const t = document.getElementById("note-text"); if (t) t.focus(); }, 60);
}
onInput("note-text", el => { draft.text = el.value; });
act("note-mood", (el, ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  const v = Number(b.dataset.v); draft.mood = draft.mood === v ? null : v;
  el.querySelectorAll("button").forEach(x => x.classList.toggle("on", Number(x.dataset.v) === draft.mood));
});
act("note-save", () => {
  const d = day(noteDate);
  d.journal = { ...(d.journal || {}), text: draft.text.trim(), mood: draft.mood };
  saveDay(noteDate); closeSheet(); toast(draft.text.trim() || draft.mood ? "Note saved" : "Note cleared"); render();
});
act("note-open", el => openNote(el.dataset.date || today()));
