// Premium status. The entitlements table is written only by the server (access codes today,
// card checkout later), so a user cannot grant themselves Premium from the browser.
import { sb } from "./store.js";
import { S, render } from "./state.js";

export async function loadEntitlement() {
  if (!sb || !S.uid) { S.pro = false; S.proInfo = null; return; }
  const cached = () => { try { return localStorage.getItem("runback.pro:" + S.uid) === "1"; } catch (e) { return false; } };
  try {
    const { data, error } = await sb.from("entitlements").select("tier, source, expires_at").eq("user_id", S.uid).maybeSingle();
    // offline or a server error: keep the last known answer for this account, and don't overwrite it
    if (error) { S.pro = cached(); return; }
    S.pro = !!(data && (!data.expires_at || new Date(data.expires_at) > new Date()));
    S.proInfo = S.pro ? data : null;
    try { localStorage.setItem("runback.pro:" + S.uid, S.pro ? "1" : "0"); } catch (e) { /* storage blocked */ }
  } catch (e) {
    S.pro = cached();
  }
}

export async function redeemCode(code) {
  if (!sb || !S.uid) throw new Error("Sign in to redeem a code.");
  const { error } = await sb.rpc("redeem_premium_code", { p_code: code.trim() });
  if (error) throw new Error(/not valid/i.test(error.message) ? "That code isn't valid." : /fully used/i.test(error.message) ? "That code has been fully used." : error.message);
  await loadEntitlement();
  render();
}

// Features behind Premium. Keep the free app genuinely useful: plan, coach, GPS, logging, crew.
export const PRO_FEATURES = {
  fastPlansPlus: "Longer fasting plans (19:5, 20:4, OMAD, 36 h)",
  fastTrain: "Fast + Train coach",
  trendsHistory: "Weekly and monthly trends",
  correlations: "Correlations: fasting, food and weight",
  guides: "The full guide library",
  export: "Export your data"
};
export const isPro = () => S.pro;
