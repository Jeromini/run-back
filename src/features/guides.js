// Guide library: list and reader. Three guides are free; the rest are Premium.
import { act, openSheet, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { GUIDES } from "../domain/guides.js";
import { isPro } from "../core/premium.js";
import { state } from "../core/state.js";
import { saveProfile } from "../core/store.js";
import { openPaywall } from "./paywall.js";

const ART = { "Start here": "star", "Fasting + training": "bolt", Food: "food", Running: "run", Mindset: "chart", Recovery: "timer" };
export const guideRow = g => `<button class="guide" data-act="open-guide" data-id="${g.id}">
  <span class="art ${g.tone}">${ICON[ART[g.cat]] || ICON.book}</span>
  <div><b>${esc(g.title)}</b><span>${esc(g.cat)} &middot; ${g.mins} min read</span></div>
  ${!g.free && !isPro() ? `<span class="lock" aria-label="Premium">${ICON.lock}</span>` : `<span class="note">${ICON.next.replace("<svg", '<svg width="18" height="18"')}</span>`}</button>`;

export function openGuides() {
  const cats = [...new Set(GUIDES.map(g => g.cat))];
  openSheet({ title: "Guides", html: `<h1 class="big-title">Guides</h1><p class="note">Short, practical reads on fasting, training and food. No hype.</p>` +
    cats.map(c => `<div class="eyebrow" style="margin-top:6px">${esc(c)}</div><div class="guides">${GUIDES.filter(g => g.cat === c).map(guideRow).join("")}</div>`).join("") });
}
export function openGuide(id) {
  const g = GUIDES.find(x => x.id === id); if (!g) return;
  if (!g.free && !isPro()) { openPaywall("guides"); return; }
  const read = state.profile.readGuides || [];
  if (!read.includes(id)) { state.profile.readGuides = [...read, id]; saveProfile(); }
  const body = g.body.map(p => typeof p === "string" ? `<p>${esc(p)}</p>`
    : p[0] === "h" ? `<h3>${esc(p[1])}</h3>`
    : `<ul>${p[1].map(li => `<li>${esc(li)}</li>`).join("")}</ul>`).join("");
  openSheet({ title: g.cat, html: `<article class="article"><span class="eyebrow">${g.mins} min read</span><h2>${esc(g.title)}</h2>${body}
    <p class="note" style="margin-top:8px">General guidance, not medical advice. If you have a medical condition or take medication, check with your doctor before fasting.</p></article>` });
}
act("open-guides", openGuides);
act("open-guide", el => openGuide(el.dataset.id));
