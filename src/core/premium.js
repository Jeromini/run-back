// Premium status. The entitlements table is written only by the server (access codes today,
// card checkout later), so a user cannot grant themselves Premium from the browser.
import { sb } from "./store.js";
import { S, render } from "./state.js";

export async function loadEntitlement() {
  S.pro = false; S.proInfo = null;
  if (!sb || !S.uid) return;
  try {
    const { data } = await sb.from("entitlements").select("tier, source, expires_at").eq("user_id", S.uid).maybeSingle();
    if (data && (!data.expires_at || new Date(data.expires_at) > new Date())) { S.pro = true; S.proInfo = data; }
    try { localStorage.setItem("runback.pro:" + S.uid, S.pro ? "1" : "0"); } catch (e) { /* ignore */ }
  } catch (e) {
    // offline: trust the last known answer for this account
    try { S.pro = localStorage.getItem("runback.pro:" + S.uid) === "1"; } catch (e2) { /* ignore */ }
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
