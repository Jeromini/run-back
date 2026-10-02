// Premium paywall. Card checkout is not connected yet: the CTA records interest and the
// access-code field grants Premium through the server (redeem_premium_code).
import { APP_NAME, PRICES } from "../config.js";
import { act, openSheet, closeSheet, toast, ICON, $ } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { S, state, render } from "../core/state.js";
import { saveProfile } from "../core/store.js";
import { redeemCode, PRO_FEATURES } from "../core/premium.js";
import { showAuth } from "../core/auth.js";

const PERKS = [
  ["bolt", "Fast + Train coach", "Tells you the best time to train around today's fast, and when to eat first."],
  ["timer", "Every fasting plan", "19:5, 20:4, OMAD and occasional 36-hour fasts, with safety guidance built in."],
  ["chart", "Deep trends", "Weekly and monthly views, plus how fasting and food actually move your weight."],
  ["book", "The full guide library", "Practical guides on fasting, training, food, heat and recovery."],
  ["share", "Your data, yours", "Export everything you log, any time."]
];
let choice = "annual";

export function openPaywall(feature) {
  const why = feature && PRO_FEATURES[feature];
  const b = openSheet({ title: "Premium", cls: "pw", html: html(why) });
  b.querySelector("#pw-code").addEventListener("keydown", e => { if (e.key === "Enter") $("pw-redeem").click(); });
}
function html(why) {
  if (S.pro) return `<div class="pw-hero"><div class="crown">${ICON.star}</div><h2>You're Premium</h2>
    <p>Every feature is unlocked${S.proInfo && S.proInfo.expires_at ? " until " + new Date(S.proInfo.expires_at).toLocaleDateString() : ""}. Thank you for backing ${esc(APP_NAME)}.</p></div>
    <div class="perks">${PERKS.map(perk).join("")}</div>`;
  return `<div class="pw-hero"><div class="crown">${ICON.star}</div>
      <h2>${esc(APP_NAME)} Premium</h2>
      <p>${why ? esc(why) + " is part of Premium. " : ""}The coach that links your fasting, training and food, so every hour of effort counts.</p></div>
    <div class="perks">${PERKS.map(perk).join("")}</div>
    <div class="prices" role="radiogroup" aria-label="Plan">${PRICES.map(p => `<button type="button" class="price${p.id === choice ? " on" : ""}" role="radio" aria-checked="${p.id === choice}" data-act="pw-price" data-id="${p.id}">
      ${p.id === "annual" ? '<span class="best">BEST VALUE</span>' : ""}<span class="l">${esc(p.label)}</span><b>${esc(p.price)}</b><span class="n">${esc(p.per)} &middot; ${esc(p.note)}</span></button>`).join("")}</div>
    <button class="btn gold big" data-act="pw-buy">Continue</button>
    <p class="note" id="pw-status" style="text-align:center">Card checkout is opening soon. Tap Continue to be first in line.</p>
    <div class="card"><div class="eyebrow">Have an access code?</div>
      <div class="quickw"><input id="pw-code" placeholder="e.g. FOUNDER-XXXXXX" autocapitalize="characters" autocomplete="off" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700">
      <button class="btn primary" id="pw-redeem" data-act="pw-redeem">Redeem</button></div></div>`;
}
const perk = ([ic, t, d]) => `<div class="perk"><i>${ICON[ic]}</i><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`;

act("pw-price", el => { choice = el.dataset.id; document.querySelectorAll(".price").forEach(p => { const on = p.dataset.id === choice; p.classList.toggle("on", on); p.setAttribute("aria-checked", on); }); });
act("pw-buy", () => {
  state.profile.premiumInterest = { plan: choice, at: new Date().toISOString() };
  saveProfile();
  $("pw-status").textContent = "You're on the list. We'll let you know the moment checkout opens.";
  toast("You're on the list");
});
act("pw-redeem", async el => {
  const code = $("pw-code").value;
  if (!code.trim()) { toast("Enter your code"); return; }
  if (!S.uid) { closeSheet(); toast("Sign in first, then redeem your code"); S.localOnly = false; showAuth(true); return; }
  el.disabled = true;
  try { await redeemCode(code); closeSheet(); toast("Premium unlocked. Enjoy.", "badge-t"); render(); }
  catch (e) { toast(e.message); }
  el.disabled = false;
});

// Small inline "locked" footer used on teaser cards.
export const unlockRow = (feature, text = "Unlock with Premium") =>
  `<div class="unlock"><span class="note">${esc(text)}</span><button class="btn gold" data-act="paywall" data-f="${feature}">${ICON.lock} Premium</button></div>`;
act("paywall", el => openPaywall(el.dataset.f));
