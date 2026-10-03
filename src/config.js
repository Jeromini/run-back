// Product-level settings. The app name is a working name: change it here and in index.html / manifest.
export const APP_NAME = "Run Back";
export const APP_TAGLINE = "Fast smarter. Run stronger.";

export const SUPABASE_URL = "https://bxmjxupypptofjrcofcb.supabase.co";
// Publishable key: safe in the browser; row-level security protects every table.
export const SUPABASE_KEY = "sb_publishable_dDGbEpmSv3wEwkAXHVn6xQ_5-aZEXGx";

// Public key for Web Push (the private half is in the database vault).
export const VAPID_PUBLIC = "BBWHhxaMvXcG-6Y_H1wv21f0DmmFs_IDD2EYkoMLmWHoEbpKPHwgBm8G60XWnDXSR20LuRHk3v0bOtl8VIfqmdo";

// Shown on the paywall. Checkout is not connected yet (see premium.js).
export const PRICES = [
  { id: "annual", label: "Annual", price: "$59.99", per: "per year", note: "$5.00 a month, save 50%" },
  { id: "monthly", label: "Monthly", price: "$9.99", per: "per month", note: "Cancel any time" }
];

// Fasting plans. `pro` plans need Premium.
export const FAST_PLANS = [
  { id: "13:11", hours: 13, label: "13:11", pro: false, blurb: "Gentle start" },
  { id: "14:10", hours: 14, label: "14:10", pro: false, blurb: "Easy daily rhythm" },
  { id: "16:8", hours: 16, label: "16:8", pro: false, blurb: "The classic" },
  { id: "18:6", hours: 18, label: "18:6", pro: false, blurb: "Stronger appetite control" },
  { id: "19:5", hours: 19, label: "19:5", pro: true, blurb: "Short eating window" },
  { id: "20:4", hours: 20, label: "20:4", pro: true, blurb: "Warrior-style" },
  { id: "omad", hours: 23, label: "OMAD", pro: true, blurb: "One meal a day" },
  { id: "36h", hours: 36, label: "36 h", pro: true, blurb: "Occasional extended fast" },
  { id: "48h", hours: 48, label: "48 h", pro: true, blurb: "Two-day fast" },
  { id: "72h", hours: 72, label: "72 h", pro: true, blurb: "Three-day fast" },
  { id: "120h", hours: 120, label: "5 days", pro: true, blurb: "Medically supervised only" },
  { id: "custom", hours: null, label: "Custom", pro: true, blurb: "Set your own, 12 h to 7 days" }
];
export const CUSTOM_FAST = { min: 12, max: 168 };
