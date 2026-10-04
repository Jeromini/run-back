// "Share my week": draws a branded 1080x1350 image and opens the phone's share sheet.
// Only weekly totals go on the card; weight is shown as a change, never the number itself.
import { APP_NAME, APP_TAGLINE } from "../config.js";
import { toast } from "../lib/dom.js";
import { today, weekStart, addDays, iso, shortDate } from "../lib/dates.js";
import { round1 } from "../lib/format.js";
import { state } from "../core/state.js";
import { weekCounts, streakWeeks, runSecs, fastHours, weights, avg7 } from "../domain/metrics.js";

function draw() {
  const W = 1080, Hh = 1350, c = document.createElement("canvas"); c.width = W; c.height = Hh;
  const g = c.getContext("2d"), ws = weekStart(today()), we = addDays(ws, 6);
  const cnt = weekCounts(state.days, ws);
  let mins = 0, fastH = 0;
  for (let i = 0; i < 7; i++) { const d = state.days[iso(addDays(ws, i))]; if (d) { mins += runSecs(d) / 60; fastH += fastHours(d); } }
  const list = weights(state.days), now = avg7(list, today()), before = avg7(list, iso(addDays(new Date(), -7)));
  const chg = now != null && before != null ? now - before : null;

  const bg = g.createLinearGradient(0, 0, W, Hh); bg.addColorStop(0, "#1b2a4a"); bg.addColorStop(1, "#0e1320");
  g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  const glow = g.createRadialGradient(W, 0, 0, W, 0, 900); glow.addColorStop(0, "rgba(60,199,190,.35)"); glow.addColorStop(1, "rgba(60,199,190,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, Hh);
  const body = `-apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
  g.fillStyle = "#5b96f7"; g.font = `700 56px -apple-system, "SF Pro Display", Inter, sans-serif`; g.fillText(APP_NAME, 90, 150);
  g.fillStyle = "rgba(234,244,242,.7)"; g.font = `600 36px ${body}`; g.fillText(`Week of ${shortDate(ws)} - ${shortDate(we)}`, 90, 210);
  g.fillStyle = "#f2f4f8"; g.font = `700 132px -apple-system, "SF Pro Display", Inter, sans-serif`; g.fillText("My week", 84, 380);

  const tiles = [
    [cnt.runs + "/3", "runs", "#5b96f7"], [Math.round(mins) + "", "minutes running", "#5b96f7"],
    [round1(fastH) + " h", "fasted", "#f5b544"], [cnt.cross + "", "strength + cardio", "#a78bfa"],
    [chg == null ? "-" : (chg > 0 ? "+" : "") + round1(chg) + " " + state.profile.unit, "weight this week", "#f07a9b"], [streakWeeks(state.days, today()) + "", "week streak", "#f5b544"]
  ];
  tiles.forEach(([v, l, col], i) => {
    const x = 90 + (i % 2) * 460, y = 470 + Math.floor(i / 2) * 250;
    g.fillStyle = "rgba(255,255,255,.06)"; roundRect(g, x, y, 430, 220, 32); g.fill();
    g.fillStyle = col; g.fillRect(x + 32, y + 36, 56, 8);
    g.fillStyle = "#f2f4f8"; g.font = `700 92px -apple-system, "SF Pro Display", Inter, sans-serif`; g.fillText(v, x + 30, y + 150);
    g.fillStyle = "rgba(234,244,242,.7)"; g.font = `600 32px ${body}`; g.fillText(l, x + 32, y + 196);
  });
  g.fillStyle = "rgba(234,244,242,.75)"; g.font = `600 34px ${body}`; g.fillText(APP_TAGLINE, 90, 1270);
  return c;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

export async function shareProgress() {
  try { await document.fonts.ready; } catch (e) { /* draw with fallbacks */ }
  const blob = await new Promise(r => draw().toBlob(r, "image/png"));
  const file = new File([blob], "my-week.png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "My week" }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-week.png"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Image saved");
}
