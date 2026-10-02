// Coffee and tea builder. A drink = base + milk + sweetener + extras, scaled by cup size.
// Figures are typical: milk per 100 ml from standard nutrition tables, syrups and sauces from
// common coffee-shop recipes (about 20 kcal per syrup pump). Results are estimates.

export const BRANDS = [
  { id: "home", name: "Home / other" },
  { id: "starbucks", name: "Starbucks" },
  { id: "dunkin", name: "Dunkin'" },
  { id: "tims", name: "Tim Hortons" },
  { id: "mccafe", name: "McCafé" },
  { id: "costa", name: "Costa" },
  { id: "pret", name: "Pret" }
];

// Hot cup sizes in ml. Iced drinks at Starbucks go up to Venti 24 oz / Trenta 30 oz.
const SIZES = {
  home: [["Small cup (8 oz)", 240], ["Mug (12 oz)", 355], ["Large mug (16 oz)", 473]],
  starbucks: [["Short (8 oz)", 240], ["Tall (12 oz)", 355], ["Grande (16 oz)", 473], ["Venti (20 oz)", 591]],
  starbucksIced: [["Tall (12 oz)", 355], ["Grande (16 oz)", 473], ["Venti (24 oz)", 709], ["Trenta (30 oz)", 887]],
  dunkin: [["Small (10 oz)", 296], ["Medium (14 oz)", 414], ["Large (20 oz)", 591]],
  dunkinIced: [["Small (16 oz)", 473], ["Medium (24 oz)", 709], ["Large (32 oz)", 946]],
  tims: [["Small (10 oz)", 296], ["Medium (14 oz)", 414], ["Large (20 oz)", 591], ["Extra large (24 oz)", 709]],
  mccafe: [["Small (12 oz)", 355], ["Medium (16 oz)", 473], ["Large (20 oz)", 591]],
  costa: [["Primo (small)", 300], ["Medio (medium)", 400], ["Massimo (large)", 550]],
  pret: [["Regular (12 oz)", 355], ["Large (16 oz)", 473]]
};
const FIXED = { espresso: [["Single shot", 30], ["Double shot", 60]], cortado: [["Cortado (4.5 oz)", 130]], bubble: [["Regular (500 ml)", 500], ["Large (700 ml)", 700]] };

// milk: share of the cup that is milk (latte-style), or "splash" for black drinks with optional milk.
// base: kcal and protein per 473 ml (16 oz) for the non-milk part; scales with size.
export const DRINKS = [
  { id: "brewed", name: "Brewed coffee", short: "coffee", group: "coffee", milk: "splash", base: [5, 0.6], aliases: "drip filter coffee black americano regular" },
  { id: "americano", name: "Americano", group: "coffee", milk: "splash", base: [15, 1], aliases: "americano long black" },
  { id: "espresso", name: "Espresso", group: "coffee", milk: "none", base: [3, 0.2], fixed: "espresso", aliases: "espresso shot ristretto" },
  { id: "latte", name: "Latte", group: "coffee", milk: 0.78, base: [10, 0.5], aliases: "latte caffe latte" },
  { id: "iced-latte", name: "Iced latte", group: "coffee", milk: 0.6, base: [10, 0.5], iced: true, aliases: "iced latte" },
  { id: "cappuccino", name: "Cappuccino", group: "coffee", milk: 0.55, base: [10, 0.5], aliases: "cappuccino" },
  { id: "flat-white", name: "Flat white", group: "coffee", milk: 0.65, base: [15, 0.8], aliases: "flat white" },
  { id: "cortado", name: "Cortado", group: "coffee", milk: 0.5, base: [10, 0.5], fixed: "cortado", aliases: "cortado gibraltar" },
  { id: "macchiato", name: "Latte macchiato", group: "coffee", milk: 0.75, base: [10, 0.5], aliases: "macchiato latte macchiato" },
  { id: "caramel-macchiato", name: "Caramel macchiato", group: "coffee", milk: 0.75, base: [10, 0.5], syrup: 3, drizzle: true, aliases: "caramel macchiato" },
  { id: "mocha", name: "Mocha", group: "coffee", milk: 0.68, base: [100, 1.5], aliases: "mocha caffe mocha chocolate coffee" },
  { id: "white-mocha", name: "White chocolate mocha", group: "coffee", milk: 0.68, base: [190, 2], aliases: "white mocha" },
  { id: "cold-brew", name: "Cold brew", group: "coffee", milk: "splash", base: [5, 0.3], iced: true, aliases: "cold brew" },
  { id: "iced-coffee", name: "Iced coffee", group: "coffee", milk: "splash", base: [5, 0.3], iced: true, aliases: "iced coffee" },
  { id: "shaken", name: "Iced shaken espresso", group: "coffee", milk: 0.2, base: [15, 0.5], iced: true, syrup: 3, aliases: "shaken espresso brown sugar oat" },
  { id: "frappe", name: "Frappé / blended coffee", short: "frappé", group: "coffee", milk: 0.25, base: [160, 2], iced: true, aliases: "frappe frappuccino blended iced capp coolatta" },
  { id: "frappe-flavour", name: "Flavoured frappé (caramel, mocha, java chip)", short: "flavoured frappé", group: "coffee", milk: 0.25, base: [215, 3], iced: true, whip: true, drizzle: true, aliases: "caramel frappuccino mocha java chip frappe" },
  { id: "hot-choc", name: "Hot chocolate", group: "coffee", milk: 0.85, base: [90, 2], aliases: "hot chocolate cocoa" },
  { id: "tea", name: "Tea, hot (black, green or herbal)", short: "tea", group: "tea", milk: "splash", base: [2, 0], aliases: "tea black green herbal english breakfast earl grey chamomile mint" },
  { id: "iced-tea", name: "Iced tea", group: "tea", milk: "none", base: [2, 0], iced: true, aliases: "iced tea" },
  { id: "chai", name: "Chai latte", group: "tea", milk: 0.5, base: [120, 1], aliases: "chai tea latte" },
  { id: "dirty-chai", name: "Dirty chai (chai + espresso)", short: "dirty chai", group: "tea", milk: 0.5, base: [125, 1.2], aliases: "dirty chai" },
  { id: "matcha", name: "Matcha latte", group: "tea", milk: 0.8, base: [15, 1.5], aliases: "matcha green tea latte" },
  { id: "london-fog", name: "London fog (earl grey latte)", short: "London fog", group: "tea", milk: 0.5, base: [5, 0], syrup: 2, aliases: "london fog earl grey latte" },
  { id: "bubble", name: "Bubble tea (milk tea)", short: "bubble tea", group: "tea", milk: "none", base: [90, 1], fixed: "bubble", sugarLevel: true, pearls: true, aliases: "bubble tea boba milk tea pearl" }
];
export const drinkById = id => DRINKS.find(d => d.id === id) || DRINKS[0];

// per 100 ml [kcal, protein]
export const MILKS = [
  { id: "none", name: "No milk", v: [0, 0] },
  { id: "whole", name: "Whole", v: [61, 3.2] },
  { id: "2pc", name: "2% / semi-skimmed", v: [50, 3.3] },
  { id: "skim", name: "Skim", v: [34, 3.4] },
  { id: "oat", name: "Oat", v: [59, 1] },
  { id: "almond", name: "Almond", v: [20, 0.5] },
  { id: "soy", name: "Soy", v: [40, 3.3] },
  { id: "coconut", name: "Coconut", v: [30, 0.2] },
  { id: "halfhalf", name: "Half & half / cream", v: [130, 3] },
  { id: "creamer", name: "Flavoured creamer", v: [233, 0] }
];
export const SPLASH = [["Splash (30 ml)", 30], ["Generous (60 ml)", 60], ["Lots (100 ml)", 100]];

export const SWEET = [
  { id: "none", name: "None" },
  { id: "sugar", name: "Sugar", unit: "tsp", k: 16 },
  { id: "honey", name: "Honey", unit: "tsp", k: 21 },
  { id: "syrup", name: "Syrup", unit: "pumps", k: 20 },
  { id: "sf-syrup", name: "Sugar-free syrup", unit: "pumps", k: 0 },
  { id: "sweetener", name: "Zero-cal sweetener", unit: "packets", k: 0 }
];
// bubble tea sugar levels: share of a full-sugar 500 ml drink (about 30 g sugar)
export const SUGAR_LEVELS = [[0, "0%"], [0.25, "25%"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]];

export const sizesFor = (drink, brand) => drink.fixed ? FIXED[drink.fixed]
  : SIZES[brand + (drink.iced ? "Iced" : "")] || SIZES[brand] || SIZES.home;

// The cup most people order: Grande at Starbucks, otherwise the medium (or the only size).
export function defaultSize(d, brand) {
  const n = sizesFor(d, brand).length;
  return d.fixed ? 0 : Math.min(n - 1, brand === "starbucks" ? 2 : 1);
}

// Default recipe for a drink at a shop, sized to the shop's medium.
export function defaults(drinkId, brand = "home") {
  const d = drinkById(drinkId), sizes = sizesFor(d, brand);
  return {
    drink: d.id, brand, size: defaultSize(d, brand),
    milk: d.milk === "none" ? "none" : d.milk === "splash" ? "none" : brand === "starbucks" ? "2pc" : "whole",
    splash: 0, sweet: d.syrup ? "syrup" : "none", sweetQty: d.syrup || 1,
    sugarLevel: 0.5, pearls: !!d.pearls, whip: !!d.whip, drizzle: !!d.drizzle, foam: false, shot: false
  };
}

// Calories and protein for a configured drink.
export function drinkNutrition(c) {
  const d = drinkById(c.drink), sizes = sizesFor(d, c.brand), [label, ml] = sizes[Math.min(c.size, sizes.length - 1)];
  const scale = ml / 473, milk = MILKS.find(m => m.id === c.milk) || MILKS[0];
  let k = d.base[0] * scale, p = d.base[1] * scale;
  let milkMl = 0;
  if (typeof d.milk === "number") milkMl = c.milk === "none" ? 0 : ml * d.milk;
  else if (d.milk === "splash" && c.milk !== "none") milkMl = SPLASH[c.splash || 0][1];
  k += milkMl * milk.v[0] / 100; p += milkMl * milk.v[1] / 100;
  if (d.sugarLevel) {
    k += c.sugarLevel * 120 * (ml / 500);
    if (c.pearls) k += 150 * (ml / 500);
    k += 60 * (ml / 500); p += 0.5;     // non-dairy creamer in a classic milk tea
  } else {
    const s = SWEET.find(x => x.id === c.sweet) || SWEET[0];
    if (s.k) k += s.k * (c.sweetQty || 0);
  }
  if (c.whip) k += 80 * Math.min(1.3, scale);
  if (c.drizzle) k += 15 * Math.min(1.3, scale);
  if (c.foam) k += 70 * Math.min(1.3, scale);
  if (c.shot) k += 3;
  return { k: Math.round(k), p: Math.round(p * 10) / 10, ml, sizeLabel: label };
}

// A readable name for the log, e.g. "Grande Latte (Starbucks), oat milk, 2 pumps syrup".
export function drinkLabel(c) {
  const d = drinkById(c.drink), n = drinkNutrition(c), brand = BRANDS.find(b => b.id === c.brand);
  const size = n.sizeLabel.replace(/\s*\(.*\)$/, "");
  const parts = [`${size} ${(d.short || d.name.toLowerCase())}${brand && brand.id !== "home" ? " (" + brand.name + ")" : ""}`];
  if (c.milk !== "none" && d.milk !== "none") parts.push(MILKS.find(m => m.id === c.milk).name.toLowerCase() + " milk");
  if (d.sugarLevel) parts.push(Math.round(c.sugarLevel * 100) + "% sugar" + (c.pearls ? ", pearls" : ""));
  else if (c.sweet !== "none") { const s = SWEET.find(x => x.id === c.sweet); parts.push(s.unit ? `${c.sweetQty} ${c.sweetQty === 1 ? s.unit.replace(/s$/, "") : s.unit} ${s.name.toLowerCase()}` : s.name.toLowerCase()); }
  else parts.push("no sugar");
  if (c.whip) parts.push("whipped cream");
  if (c.foam) parts.push("cold foam");
  const s = parts.join(", ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Popular chain drinks with their standard recipe, as ready-made foods (per serving).
// [id, name, kcal, protein, size label, ml]
export const SIGNATURE = [
  ["sb-caramel-frap", "Starbucks Caramel Frappuccino (whole milk, whip)", 380, 4, "Grande (16 oz)", 473],
  ["sb-mocha-frap", "Starbucks Mocha Frappuccino (whole milk, whip)", 370, 5, "Grande (16 oz)", 473],
  ["sb-javachip-frap", "Starbucks Java Chip Frappuccino (whole milk, whip)", 440, 6, "Grande (16 oz)", 473],
  ["sb-caramel-mac", "Starbucks Caramel Macchiato (2% milk)", 250, 10, "Grande (16 oz)", 473],
  ["sb-psl", "Starbucks Pumpkin Spice Latte (2% milk, whip)", 390, 14, "Grande (16 oz)", 473],
  ["sb-white-mocha", "Starbucks White Chocolate Mocha (2% milk, whip)", 430, 14, "Grande (16 oz)", 473],
  ["sb-mocha", "Starbucks Caffè Mocha (2% milk, whip)", 370, 13, "Grande (16 oz)", 473],
  ["sb-chai", "Starbucks Chai Tea Latte (2% milk)", 240, 8, "Grande (16 oz)", 473],
  ["sb-bsose", "Starbucks Iced Brown Sugar Oatmilk Shaken Espresso", 120, 2, "Grande (16 oz)", 473],
  ["sb-vscb", "Starbucks Vanilla Sweet Cream Cold Brew", 110, 1, "Grande (16 oz)", 473],
  ["sb-pink", "Starbucks Pink Drink", 140, 1, "Grande (16 oz)", 473],
  ["sb-refresher", "Starbucks Strawberry Açaí Refresher", 100, 0, "Grande (16 oz)", 473],
  ["sb-hot-choc", "Starbucks Hot Chocolate (2% milk, whip)", 370, 14, "Grande (16 oz)", 473],
  ["dd-iced-cs", "Dunkin' Iced Coffee with cream and sugar", 260, 3, "Medium (24 oz)", 709],
  ["dd-caramel-swirl", "Dunkin' Caramel Swirl Iced Latte (whole milk)", 350, 11, "Medium (24 oz)", 709],
  ["dd-frozen", "Dunkin' Frozen Coffee with cream", 610, 6, "Medium (24 oz)", 709],
  ["th-double", "Tim Hortons Double-Double", 230, 4, "Medium (14 oz)", 414],
  ["th-iced-capp", "Tim Hortons Iced Capp", 350, 5, "Medium (16 oz)", 473],
  ["mc-latte", "McCafé Latte (whole milk)", 190, 10, "Medium (16 oz)", 473],
  ["mc-caramel-frappe", "McCafé Caramel Frappé", 510, 7, "Medium (16 oz)", 473],
  ["mc-iced-coffee", "McDonald's Iced Coffee (with cream and liquid sugar)", 140, 1, "Medium (22 oz)", 650],
  ["costa-latte", "Costa Latte (semi-skimmed)", 145, 9, "Medio (medium)", 400],
  ["costa-flat-white", "Costa Flat White (semi-skimmed)", 105, 6, "Medium", 300],
  ["pret-oat-flat-white", "Pret Oat Flat White", 120, 2, "Regular", 300]
];
