// Plain-language guides for each diet: what it is, how the app checks it, what to eat, an
// example day (real foods from the database, so the numbers are real), who it suits and when to
// take care. Example days: [meal, foodId, portionIndex, qty]; tests confirm each one keeps its diet.

export const DIET_INFO = {
  "no-carb": {
    what: "A no carb or carnivore-style diet is built almost entirely on animal foods: meat, fish, eggs and some cheese or butter. Carbohydrate drops close to zero, so the body runs on fat and ketones.",
    how: "We add up the net carbs (carbs minus fibre) in everything you log and keep you under 10 g a day. Grains, beans, starchy food, fruit, added sugar and sugary drinks are flagged as off plan, even in small amounts.",
    eat: ["Beef, lamb, pork, goat", "Chicken, turkey", "Fish and seafood", "Eggs", "Butter, hard cheese"],
    limit: ["Soft cheese and cream (small carbs add up)", "Processed meat such as bacon or sausage (salt and additives)"],
    avoid: ["Bread, rice, pasta, cereal", "Potato, plantain, cassava, corn", "Fruit and juice", "Beans and lentils", "Sugar and sweets"],
    day: [["Breakfast", "egg", 0, 3], ["Breakfast", "bacon", 0, 2], ["Lunch", "beef-ground", 0, 2], ["Lunch", "cheddar", 0, 1], ["Dinner", "salmon", 0, 2], ["Dinner", "butter", 0, 1]],
    suits: "People who do best with very simple rules and like animal foods. Some use it short term to break a sugar habit.",
    careful: "Very low in fibre and vitamin C. Talk to your doctor first if you have kidney disease, high cholesterol or take diabetes or blood pressure medication. Drink plenty of water and add salt in the first weeks.",
    evidence: "Little long-term research. Short-term weight loss is common, mostly from eating fewer calories and less sugar."
  },
  keto: {
    what: "Keto cuts carbohydrate so low (about 20 to 50 g a day) that the body switches to burning fat and making ketones for fuel. Most of your calories come from fat, a moderate amount from protein.",
    how: "Two checks. Net carbs (carbs minus fibre) must stay under your limit, 25 g by default and adjustable in Settings. Fat should be at least 55% of your calories. Sugar and sugary drinks are flagged, and any single food with a lot of net carbs is marked so you can see what tipped the day.",
    eat: ["Meat, fish, eggs", "Leafy and green vegetables (spinach, broccoli, salad, peppers)", "Avocado, olives, olive oil, butter", "Nuts and seeds in handfuls", "Cheese, full-fat Greek yoghurt"],
    limit: ["Berries (a small cup)", "Onion, carrot and tomato (carbs add up)", "Milk (about 12 g carbs a glass)"],
    avoid: ["Bread, rice, pasta, oats, cereal", "Potato, plantain, yam, corn", "Most fruit, juice, sugar, honey", "Beans and lentils"],
    day: [["Breakfast", "egg-scram", 0, 1], ["Breakfast", "bacon", 0, 2], ["Breakfast", "avocado", 0, 1], ["Lunch", "chk-thigh-skin", 0, 2], ["Lunch", "salad", 0, 1], ["Lunch", "olive-oil", 0, 1], ["Lunch", "cheddar", 0, 1], ["Snack", "almonds", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "broccoli", 0, 1], ["Dinner", "butter", 0, 1]],
    suits: "People who find that cutting carbs kills their cravings, and who don't mind giving up bread, rice and fruit. Runners: easy runs adapt well after a few weeks; hard sessions feel flat at first.",
    careful: "Expect 'keto flu' (headache, tiredness) in week one: drink water and add salt. Not advised in pregnancy, with kidney disease, or on diabetes medication without your doctor, because blood sugar can drop sharply.",
    evidence: "Good evidence for faster early weight loss and better blood sugar control. Over a year, results end up similar to other diets people can stick to."
  },
  "low-carb": {
    what: "A moderate low carb diet: less bread, rice, pasta and sugar, but room for some fruit, beans and starchy vegetables. Typically 50 to 150 g of carbs a day.",
    how: "Net carbs (carbs minus fibre) are kept under your limit, 100 g by default and adjustable in Settings. Added sugar and sugary drinks are flagged as off plan.",
    eat: ["Meat, fish, eggs, dairy", "All vegetables", "Fruit, especially berries, apples and oranges", "Nuts, olive oil, avocado", "Beans and lentils in moderate portions"],
    limit: ["Rice, bread, pasta, potato (one fist-sized portion a day)", "Tropical fruit and dried fruit"],
    avoid: ["Sugar, sweets, pastries", "Sugary drinks and juice"],
    day: [["Breakfast", "greek-2", 0, 1], ["Breakfast", "berries", 0, 1], ["Breakfast", "almonds", 0, 1], ["Lunch", "chk-breast-grill", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "sweet-potato", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "mixed-veg", 0, 1], ["Dinner", "rice-brown", 0, 0.5]],
    suits: "Most people. It's the easiest carb-cutting diet to keep up, and it leaves enough carbs to fuel training.",
    careful: "If you take diabetes medication, tell your doctor before cutting carbs, as doses may need to change.",
    evidence: "Solid evidence for weight loss and blood sugar control, about as effective as other calorie-controlled diets."
  },
  atkins: {
    what: "Atkins is a low carb diet in four phases. You start very low, then add carbs back in steps until you find the most you can eat while still losing or holding your weight.",
    how: "Net carbs are checked against your phase: Phase 1 Induction 20 g, Phase 2 Balancing 40 g, Phase 3 Fine-tuning 80 g, Phase 4 Maintenance 100 g. Change phase in Settings. Added sugar is flagged as off plan.",
    eat: ["Meat, fish, eggs, cheese", "Low-carb vegetables (salad, broccoli, green beans, spinach)", "Butter, olive oil, avocado", "From Phase 2: nuts, berries"],
    limit: ["From Phase 3: beans, fruit and some whole grains, in small amounts"],
    avoid: ["Sugar, sweets, sugary drinks", "In Phase 1: bread, rice, pasta, potato, fruit"],
    day: [["Breakfast", "omelette", 0, 1], ["Lunch", "tuna-can", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "mayo", 0, 1], ["Dinner", "beef-steak", 0, 2], ["Dinner", "green-beans", 0, 1], ["Dinner", "butter", 0, 1]],
    suits: "People who want the structure of keto at the start but a clear path back to more normal eating.",
    careful: "The same cautions as keto during Phase 1: water and salt, and medical advice if you take diabetes medication.",
    evidence: "One of the most studied low carb diets: good short-term weight loss, similar to other diets at one to two years."
  },
  paleo: {
    what: "Paleo eats the way people did before farming: meat, fish, eggs, vegetables, fruit, nuts and seeds. No grains, beans, dairy, added sugar or processed food.",
    how: "There's no number to hit. Each food you log is checked against the rules, and anything with grains, beans or lentils, soy, dairy, added sugar, processed ingredients or alcohol is flagged off plan.",
    eat: ["Meat, poultry, fish, eggs", "Vegetables, including sweet potato", "Fruit", "Nuts and seeds (not peanuts, which are a legume)", "Olive oil, avocado"],
    limit: ["Dried fruit and honey"],
    avoid: ["Bread, rice, pasta, oats, corn", "Beans, lentils, peanuts, soy", "Milk, cheese, yoghurt", "Sugar, processed food, alcohol"],
    day: [["Breakfast", "egg", 0, 2], ["Breakfast", "berries", 0, 1], ["Lunch", "chk-breast-grill", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "avocado", 0, 1], ["Lunch", "olive-oil", 0, 1], ["Snack", "almonds", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "sweet-potato", 0, 1], ["Dinner", "broccoli", 0, 1]],
    suits: "People who want to cut processed food and like clear yes or no rules rather than counting.",
    careful: "Cutting dairy means watching calcium (leafy greens, sardines with bones, almonds).",
    evidence: "Short studies show weight loss and better blood markers, mostly because processed food and sugar go."
  },
  whole30: {
    what: "Whole30 is a 30-day reset: whole foods only, with no sugar, grains, beans, dairy or alcohol. After 30 days you bring foods back one at a time to see how each one affects you.",
    how: "Each food is checked against the rules. Anything with grains, beans or lentils, soy, dairy, added sugar, processed ingredients or alcohol is flagged off plan.",
    eat: ["Meat, fish, eggs", "Vegetables, including potatoes", "Fruit", "Nuts (not peanuts)", "Olive oil, avocado"],
    limit: ["Fruit as a snack on its own (the program discourages using it as dessert)"],
    avoid: ["Sugar in any form, including honey and sweeteners", "Grains, beans, peanuts, soy", "Dairy", "Alcohol"],
    day: [["Breakfast", "egg", 0, 2], ["Breakfast", "berries", 0, 1], ["Lunch", "chk-breast-grill", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "avocado", 0, 1], ["Lunch", "olive-oil", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "sweet-potato", 0, 1], ["Dinner", "broccoli", 0, 1]],
    suits: "A short, strict reset, especially if you suspect a food is bothering your gut or skin.",
    careful: "Strict elimination isn't a good idea if you have a history of disordered eating.",
    evidence: "Not studied as a program. Its benefits come from eating whole foods and cutting sugar and alcohol."
  },
  "sugar-free": {
    what: "No added sugar: every food is allowed except sugar added during cooking or processing, sweets and sugary drinks. Natural sugar in fruit and milk is fine.",
    how: "Each food is checked. Anything containing added sugar, or a sugary drink, is flagged off plan. Everything else counts as on plan.",
    eat: ["Everything else: meat, fish, eggs, dairy, grains, beans, vegetables, fruit"],
    limit: ["Fruit juice (a small glass)", "Sauces like ketchup and barbecue sauce (hidden sugar)"],
    avoid: ["Sugar, honey, syrup in drinks and cooking", "Sweets, cake, biscuits, chocolate", "Soda, sweetened tea and coffee drinks"],
    day: [["Breakfast", "porridge", 0, 1], ["Breakfast", "banana", 0, 1], ["Lunch", "bread-ww", 0, 2], ["Lunch", "turkey", 0, 1], ["Lunch", "salad", 0, 1], ["Dinner", "rice-brown", 0, 1], ["Dinner", "snapper", 0, 1], ["Dinner", "mixed-veg", 0, 1]],
    suits: "Almost everyone. It's the single change with the biggest payoff for most diets.",
    careful: "Sugar hides in sauces, flavoured yoghurt and coffee-shop drinks. Use the drink builder to log exactly how you take it.",
    evidence: "Strong evidence that cutting added sugar, especially sugary drinks, helps weight and heart health."
  },
  mediterranean: {
    what: "The traditional diet of Greece, Italy and Spain: plenty of vegetables, fruit, fish, olive oil, beans, nuts and whole grains, some dairy, and little red meat or sugar.",
    how: "Three checks. Core food groups: eat from at least 4 of vegetables, fruit, fish, beans, nuts, olive oil and whole grains each day. Limits: red meat once a day at most, no processed meat, and one sugary item at most. Sugary drinks are flagged off plan.",
    eat: ["Vegetables and salads at every meal", "Fish and seafood, two or more times a week", "Olive oil as your main fat", "Beans, lentils, chickpeas, hummus", "Nuts, fruit, whole grains, yoghurt"],
    limit: ["Red meat (a few times a week)", "Cheese", "Sweets (an occasional treat)"],
    avoid: ["Processed meat", "Sugary drinks", "Heavily processed snacks"],
    day: [["Breakfast", "greek-2", 0, 1], ["Breakfast", "berries", 0, 1], ["Breakfast", "almonds", 0, 1], ["Lunch", "hummus", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "bread-ww", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "mixed-veg", 0, 1], ["Dinner", "olive-oil", 0, 1], ["Dinner", "rice-brown", 0, 1]],
    suits: "Anyone who wants a long-term way of eating rather than a short diet, and anyone thinking about heart health.",
    careful: "Olive oil and nuts are calorie-dense: measure them if weight loss is the goal.",
    evidence: "The best evidence of any diet for heart health and long life, including large clinical trials."
  },
  dash: {
    what: "DASH (Dietary Approaches to Stop Hypertension) was designed to lower blood pressure: fruit, vegetables, low-fat dairy, whole grains, lean protein and beans, with little salt, sugar or fatty meat.",
    how: "Three checks. Core food groups: at least 4 of vegetables, fruit, dairy, whole grains, beans and nuts a day. Fat under 30% of calories. Limits: red meat once a day, no processed meat, one sugary item at most. We can't measure salt yet, so keep an eye on it yourself.",
    eat: ["Vegetables and fruit (8 to 10 portions a day)", "Low-fat milk and yoghurt", "Whole grains: oats, brown rice, wholemeal bread", "Chicken, fish, beans, nuts"],
    limit: ["Red meat", "Salt (aim under one teaspoon a day)", "Sweets"],
    avoid: ["Processed meat", "Sugary drinks", "Salty snacks and takeaways"],
    day: [["Breakfast", "porridge", 0, 1], ["Breakfast", "banana", 0, 1], ["Breakfast", "milk-skim", 0, 1], ["Lunch", "chk-breast-grill", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "bread-ww", 0, 1], ["Snack", "apple", 0, 1], ["Snack", "greek-0", 0, 1], ["Dinner", "snapper", 0, 1], ["Dinner", "rice-brown", 0, 1], ["Dinner", "broccoli", 0, 1]],
    suits: "Anyone with raised blood pressure, or a family history of it.",
    careful: "It works best with less salt, which this app can't track. Check labels and go easy on stock cubes and takeaways.",
    evidence: "Strong evidence: it lowers blood pressure within weeks in clinical trials."
  },
  vegetarian: {
    what: "No meat, poultry or fish. Eggs and dairy are fine, along with everything from plants.",
    how: "Each food is checked. Anything containing meat, poultry, fish or shellfish is flagged off plan.",
    eat: ["Beans, lentils, chickpeas, tofu", "Eggs, milk, yoghurt, cheese", "Grains, vegetables, fruit, nuts"],
    limit: ["Cheese-heavy meals (easy to overdo calories)"],
    avoid: ["Meat, chicken, fish, seafood", "Dishes cooked in meat or fish stock"],
    day: [["Breakfast", "egg-scram", 0, 1], ["Breakfast", "bread-ww", 0, 1], ["Lunch", "lentils", 0, 2], ["Lunch", "rice-brown", 0, 1], ["Lunch", "salad", 0, 1], ["Dinner", "pasta", 0, 1], ["Dinner", "mozz", 0, 1], ["Dinner", "tomato", 0, 1]],
    suits: "Anyone who wants to cut meat while keeping protein easy through eggs and dairy.",
    careful: "Plan your protein: aim for a palm of eggs, dairy, beans or tofu at every meal. Iron and B12 are worth checking once a year.",
    evidence: "Linked with lower risk of heart disease and type 2 diabetes in large studies."
  },
  vegan: {
    what: "Plants only: no meat, fish, eggs or dairy. Protein comes from beans, lentils, tofu, nuts and grains.",
    how: "Each food is checked. Anything containing meat, poultry, fish, shellfish, egg or dairy is flagged off plan. Honey isn't tracked.",
    eat: ["Beans, lentils, chickpeas, tofu, soy milk", "Grains, vegetables, fruit", "Nuts, seeds, peanut butter", "Olive oil, avocado"],
    limit: ["Vegan junk food (chips, sweets and processed meat substitutes are still processed)"],
    avoid: ["Meat, fish, seafood", "Eggs", "Milk, cheese, yoghurt, butter, cream"],
    day: [["Breakfast", "porridge", 0, 1], ["Breakfast", "berries", 0, 1], ["Breakfast", "pb", 0, 1], ["Lunch", "chickpeas", 0, 2], ["Lunch", "rice-brown", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "olive-oil", 0, 1], ["Dinner", "tofu", 0, 2], ["Dinner", "mixed-veg", 0, 1], ["Dinner", "rice-white", 0, 1]],
    suits: "People with ethical or environmental reasons, or who simply feel better without animal foods.",
    careful: "Take a vitamin B12 supplement: plants don't provide it. Watch iron, calcium, iodine and omega-3, and plan protein at each meal, especially when training.",
    evidence: "Good evidence for heart health and weight. Needs planning to cover nutrients."
  },
  pescatarian: {
    what: "Vegetarian plus fish and seafood. No meat or poultry.",
    how: "Each food is checked. Anything containing red meat, pork or poultry is flagged off plan.",
    eat: ["Fish and seafood", "Eggs and dairy", "Beans, grains, vegetables, fruit, nuts"],
    limit: ["Large predatory fish like swordfish and king mackerel (mercury)"],
    avoid: ["Beef, pork, lamb, goat", "Chicken, turkey"],
    day: [["Breakfast", "greek-2", 0, 1], ["Breakfast", "berries", 0, 1], ["Lunch", "tuna-can", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "bread-ww", 0, 1], ["Dinner", "shrimp", 0, 2], ["Dinner", "rice-brown", 0, 1], ["Dinner", "mixed-veg", 0, 1]],
    suits: "People who want the benefits of a mostly plant diet with the easy protein and omega-3 of fish.",
    careful: "Pregnant? Avoid high-mercury fish and raw shellfish.",
    evidence: "Shares the benefits of vegetarian and Mediterranean eating."
  },
  flexitarian: {
    what: "Mostly plants, with meat or poultry now and then. A practical middle ground.",
    how: "We count meat and poultry servings and flag the day if you have more than one. Fish, eggs and dairy are fine.",
    eat: ["Beans, lentils, tofu", "Vegetables, fruit, whole grains, nuts", "Eggs, dairy, fish"],
    limit: ["Meat or poultry (once a day at most)"],
    avoid: ["Nothing is banned"],
    day: [["Breakfast", "porridge", 0, 1], ["Breakfast", "banana", 0, 1], ["Lunch", "hummus", 0, 1], ["Lunch", "salad", 0, 1], ["Lunch", "bread-ww", 0, 1], ["Dinner", "chk-breast-grill", 0, 1], ["Dinner", "mixed-veg", 0, 1], ["Dinner", "rice-brown", 0, 1]],
    suits: "People who want to eat less meat without giving it up.",
    careful: "Swap meat for beans or tofu rather than just bread or pasta, so protein stays up.",
    evidence: "Good evidence that eating less red and processed meat improves heart and metabolic health."
  },
  "high-protein": {
    what: "Make protein the anchor of every meal so you hold on to muscle while losing fat, and stay fuller for longer.",
    how: "We check that your daily protein reaches your target (set it under Food targets; about 0.8 g per lb of goal weight is a good start). Everything else is up to you.",
    eat: ["Chicken, turkey, fish, lean beef", "Eggs, Greek yoghurt, cottage cheese", "Beans, lentils, tofu", "Protein shakes when you're short"],
    limit: ["Fatty cuts and fried coatings (calories add up fast)"],
    avoid: ["Nothing is banned"],
    day: [["Breakfast", "egg", 0, 3], ["Breakfast", "greek-0", 0, 1], ["Lunch", "chk-breast-grill", 0, 2], ["Lunch", "salad", 0, 1], ["Lunch", "rice-brown", 0, 1], ["Snack", "cottage", 0, 1], ["Dinner", "salmon", 0, 2], ["Dinner", "broccoli", 0, 1]],
    suits: "Anyone losing weight while training, especially over 40, when holding muscle gets harder.",
    careful: "If you have kidney disease, check your protein target with your doctor.",
    evidence: "Strong evidence that higher protein helps keep muscle during weight loss and reduces hunger."
  },
  "low-fat": {
    what: "Keep fat under 30% of your daily calories, with plenty of grains, fruit, vegetables and lean protein.",
    how: "We work out what share of your calories came from fat (fat grams x 9, divided by total calories) and flag the day if it's over 30%.",
    eat: ["Lean chicken, turkey, white fish", "Low-fat dairy", "Grains, potatoes, beans", "Fruit and vegetables"],
    limit: ["Oils, butter, nuts, cheese (measure them)", "Fatty meat and skin"],
    avoid: ["Fried food", "Pastries and creamy sauces"],
    day: [["Breakfast", "porridge", 0, 1], ["Breakfast", "banana", 0, 1], ["Breakfast", "milk-skim", 0, 1], ["Lunch", "turkey", 0, 1], ["Lunch", "bread-ww", 0, 2], ["Lunch", "salad", 0, 1], ["Dinner", "snapper", 0, 1], ["Dinner", "rice-white", 0, 1], ["Dinner", "broccoli", 0, 1], ["Snack", "greek-0", 0, 1], ["Snack", "berries", 0, 1]],
    suits: "People who like carbs and find a plate of rice or pasta more satisfying than fat.",
    careful: "Low fat doesn't mean low sugar: check labels on 'low-fat' yoghurts and snacks.",
    evidence: "Works for weight loss about as well as low carb when calories are matched."
  },
  zone: {
    what: "The Zone diet balances every day at about 40% of calories from carbohydrate, 30% from protein and 30% from fat.",
    how: "We work out each share of your calories: carbs 33 to 47%, protein 23 to 37%, fat 23 to 37%. All three must land in range for the day to count.",
    eat: ["A palm of lean protein at each meal", "Vegetables and fruit as your main carbs", "A little olive oil, avocado or nuts"],
    limit: ["Bread, rice, pasta (they push carbs over 40%)"],
    avoid: ["Sugary food and drinks"],
    day: [["Breakfast", "greek-2", 0, 1], ["Breakfast", "berries", 0, 1], ["Breakfast", "almonds", 0, 1], ["Lunch", "chk-breast-grill", 0, 1], ["Lunch", "rice-brown", 0, 1], ["Lunch", "salad", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "sweet-potato", 0, 1], ["Dinner", "broccoli", 0, 1], ["Snack", "apple", 0, 1]],
    suits: "People who like a balanced plate and a number to aim for, without cutting any food group.",
    careful: "Hitting the ratios needs fairly careful logging. Use the macro split on My diet to steer each meal.",
    evidence: "Weight loss similar to other balanced, calorie-controlled diets."
  },
  calories: {
    what: "No foods are off limits. You eat what you like within a daily calorie target, which sets your rate of weight loss.",
    how: "We add up your calories and check you stay within your daily target (set under Food targets), with a 5% margin.",
    eat: ["Anything, ideally plenty of protein, vegetables and fruit to stay full"],
    limit: ["Calorie-dense extras: oil, sauces, drinks, snacks"],
    avoid: ["Nothing is banned"],
    day: [["Breakfast", "porridge", 0, 1], ["Breakfast", "berries", 0, 1], ["Breakfast", "egg", 0, 2], ["Lunch", "chk-breast-grill", 0, 1], ["Lunch", "rice-brown", 0, 1], ["Lunch", "salad", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "sweet-potato", 0, 1], ["Dinner", "broccoli", 0, 1]],
    suits: "People who want flexibility and are happy to log everything.",
    careful: "Very low targets (under about 1,500 kcal for men or 1,200 for women) make training hard and are best done with professional advice.",
    evidence: "Calorie balance is what drives weight change; every successful diet works through it."
  },
  "gluten-free": {
    what: "No gluten, the protein in wheat, barley and rye. Essential for coeliac disease and helpful for some people with gluten sensitivity.",
    how: "Each food is checked. Anything containing wheat, barley or rye is flagged off plan.",
    eat: ["Rice, potatoes, corn, quinoa, gluten-free oats", "Meat, fish, eggs, dairy", "Beans, vegetables, fruit, nuts"],
    limit: ["Gluten-free breads and snacks (often highly processed)"],
    avoid: ["Bread, pasta, couscous, most cereals", "Flour-coated or breaded food", "Beer, many sauces and stock cubes"],
    day: [["Breakfast", "omelette", 0, 1], ["Breakfast", "berries", 0, 1], ["Lunch", "rice-white", 0, 1], ["Lunch", "beans-black", 0, 1], ["Lunch", "chk-thigh", 0, 2], ["Lunch", "salad", 0, 1], ["Dinner", "salmon", 0, 1], ["Dinner", "potato-boiled", 0, 1], ["Dinner", "green-beans", 0, 1]],
    suits: "People with coeliac disease or a confirmed sensitivity.",
    careful: "Get tested for coeliac disease before going gluten-free, as testing needs gluten in your diet. With coeliac disease, even crumbs matter: check labels for cross-contamination.",
    evidence: "Essential for coeliac disease. No proven benefit for people without a gluten problem."
  },
  "dairy-free": {
    what: "No milk, cheese, yoghurt, butter or cream. For lactose intolerance, milk allergy, or personal choice.",
    how: "Each food is checked. Anything containing dairy is flagged off plan, including milk in coffee drinks.",
    eat: ["Meat, fish, eggs", "Plant milks: oat, soy, almond, coconut", "Grains, beans, vegetables, fruit, nuts", "Olive oil instead of butter"],
    limit: ["Coconut-based alternatives (high in saturated fat)"],
    avoid: ["Milk, cheese, yoghurt, butter, cream", "Creamy sauces, milk chocolate, many baked goods"],
    day: [["Breakfast", "porridge", 0, 1], ["Breakfast", "banana", 0, 1], ["Breakfast", "pb", 0, 1], ["Lunch", "chk-breast-grill", 0, 1], ["Lunch", "rice-brown", 0, 1], ["Lunch", "mixed-veg", 0, 1], ["Dinner", "beef-steak", 0, 1], ["Dinner", "sweet-potato", 0, 1], ["Dinner", "salad", 0, 1], ["Dinner", "olive-oil", 0, 1]],
    suits: "Anyone with lactose intolerance or a milk allergy.",
    careful: "Replace the calcium: fortified plant milk, leafy greens, tinned fish with bones.",
    evidence: "Needed for allergy and helpful for lactose intolerance. No benefit otherwise if calcium is covered."
  }
};

// What each check on the My diet screen means.
export const CHECK_HELP = {
  net: "Net carbs are total carbohydrate minus fibre. Fibre isn't digested into sugar, so most low carb diets count net carbs. Your limit is in Settings.",
  carbs: "Total carbohydrate from everything you logged today.",
  fat: "The share of today's calories that came from fat: fat grams x 9, divided by your total calories.",
  carbp: "The share of today's calories that came from carbohydrate: carb grams x 4, divided by your total calories.",
  protp: "The share of today's calories that came from protein: protein grams x 4, divided by your total calories.",
  protein: "Total protein today against your target. Set the target under Food targets in the Food log.",
  kcal: "Total calories today against your daily target, with a 5% margin.",
  foods: "How many of today's foods fit the diet's rules. Tap Off plan today below to see which ones didn't, and why.",
  favour: "How many of the diet's core food groups you ate today. The more groups, the closer you are to the real pattern.",
  cap: "A daily limit on a food group. Going over it means the day no longer counts as fully on plan."
};
