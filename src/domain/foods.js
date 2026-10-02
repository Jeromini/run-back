// Food database: calories and protein per 100 g (cooked weight where it's eaten cooked),
// with everyday portions in grams. Values are typical nutrition-table figures (USDA-style),
// rounded; real foods vary by recipe and brand, so the app labels results as estimates.
//
// Hand portions for measuring without scales (adult hand):
//   fist = about 1 cup        palm = about 100 g cooked meat or fish (3.5 oz)
//   cupped hand = about 1/2 cup    thumb = about 1 tablespoon

export const CATS = [
  ["protein", "Meat & fish"], ["dairy", "Eggs & dairy"], ["carbs", "Rice, bread & starch"], ["carib", "Caribbean"],
  ["legumes", "Beans & lentils"], ["veg", "Vegetables"], ["fruit", "Fruit"], ["fats", "Nuts, oils & sauces"],
  ["drinks", "Drinks"], ["snacks", "Snacks & treats"], ["fast", "Takeaway & meals"]
];

// [id, name, cat, kcal/100g, protein/100g, portions[[label, grams]], aliases]
const RAW = [
  // ---- chicken ----
  ["chk-breast-grill", "Chicken breast, grilled (skinless)", "protein", 165, 31, [["1 palm (100 g)", 100], ["1 breast", 170], ["1 oz", 28]], "chicken breast boneless skinless baked"],
  ["chk-breast-skin", "Chicken breast, roasted with skin", "protein", 197, 30, [["1 palm (100 g)", 100], ["1 breast", 195]], "chicken breast skin on"],
  ["chk-breast-fried", "Chicken breast, fried (breaded)", "protein", 260, 25, [["1 piece", 160], ["1 palm (100 g)", 100]], "fried chicken breast kfc"],
  ["chk-thigh", "Chicken thigh, roasted (skinless)", "protein", 179, 25, [["1 thigh", 70], ["1 palm (100 g)", 100]], "chicken thigh boneless"],
  ["chk-thigh-skin", "Chicken thigh, roasted with skin", "protein", 229, 23, [["1 thigh", 90], ["1 palm (100 g)", 100]], "chicken thigh skin"],
  ["chk-drum", "Chicken drumstick, roasted (skinless)", "protein", 172, 28, [["1 drumstick", 45], ["1 palm (100 g)", 100]], "chicken leg drumstick"],
  ["chk-drum-skin", "Chicken drumstick, roasted with skin", "protein", 216, 27, [["1 drumstick", 55], ["1 palm (100 g)", 100]], "chicken leg drumstick skin"],
  ["chk-leg", "Chicken leg quarter, roasted with skin", "protein", 232, 24, [["1 leg quarter", 150], ["1 palm (100 g)", 100]], "chicken leg whole leg quarter"],
  ["chk-wing", "Chicken wing, roasted or grilled", "protein", 290, 27, [["1 wing", 34], ["6 wings", 204]], "chicken wings"],
  ["chk-wing-fried", "Chicken wing, fried", "protein", 320, 25, [["1 wing", 38], ["6 wings", 228]], "fried chicken wings buffalo"],
  ["chk-fried-leg", "Fried chicken drumstick (breaded)", "protein", 270, 22, [["1 drumstick", 75]], "fried chicken leg kfc"],
  ["chk-rotis", "Rotisserie chicken (mixed, with skin)", "protein", 220, 26, [["1 palm (100 g)", 100], ["1/4 chicken", 230]], "rotisserie roast chicken"],
  ["chk-nugget", "Chicken nuggets", "protein", 296, 15, [["1 nugget", 16], ["6 nuggets", 96]], "nuggets"],
  ["turkey", "Turkey breast, roasted", "protein", 147, 30, [["1 palm (100 g)", 100], ["2 slices deli", 56]], "turkey"],
  // ---- red meat & pork ----
  ["beef-ground", "Ground beef 85% lean, cooked", "protein", 250, 26, [["1 palm (100 g)", 100], ["1 patty", 85]], "minced beef mince hamburger"],
  ["beef-steak", "Steak, sirloin, cooked (lean)", "protein", 190, 30, [["1 palm (100 g)", 100], ["8 oz steak", 227]], "beef steak sirloin"],
  ["beef-stew", "Beef stew (meat and gravy)", "protein", 140, 12, [["1 cup", 245], ["1 fist", 245]], "stew beef"],
  ["pork-chop", "Pork chop, cooked", "protein", 210, 28, [["1 chop", 145], ["1 palm (100 g)", 100]], "pork"],
  ["bacon", "Bacon, cooked", "protein", 541, 37, [["1 slice", 8], ["3 slices", 24]], "bacon"],
  ["sausage", "Sausage, pork, cooked", "protein", 320, 14, [["1 link", 45], ["1 patty", 38]], "sausage hot dog"],
  ["ham", "Ham, sliced", "protein", 145, 21, [["2 slices", 56], ["1 palm (100 g)", 100]], "ham"],
  ["goat-curry", "Curry goat", "carib", 180, 21, [["1 cup", 220], ["1 palm (100 g)", 100]], "goat curry mutton"],
  ["oxtail", "Oxtail, stewed (with gravy)", "carib", 250, 22, [["1 cup", 220], ["1 palm (100 g)", 100]], "oxtail stew"],
  // ---- fish & seafood ----
  ["snapper", "Snapper, grilled or steamed", "protein", 128, 26, [["1 palm (100 g)", 100], ["1 fillet", 170]], "red snapper fish"],
  ["mahi", "Mahi-mahi, grilled", "protein", 109, 24, [["1 palm (100 g)", 100], ["1 fillet", 160]], "dolphin fish mahi"],
  ["salmon", "Salmon, baked", "protein", 206, 22, [["1 palm (100 g)", 100], ["1 fillet", 155]], "salmon fish"],
  ["tuna-can", "Tuna, canned in water", "protein", 116, 26, [["1 can (drained)", 142], ["1/2 cup", 80]], "tuna tin"],
  ["tilapia", "Tilapia, baked", "protein", 128, 26, [["1 fillet", 115], ["1 palm (100 g)", 100]], "tilapia fish"],
  ["fish-fried", "Fried fish (battered)", "protein", 230, 15, [["1 piece", 140], ["1 palm (100 g)", 100]], "fish and chips fried fish escovitch"],
  ["shrimp", "Shrimp, cooked", "protein", 99, 24, [["1 palm (100 g)", 100], ["10 large", 70]], "prawns shrimp"],
  ["conch", "Conch, cooked", "carib", 130, 26, [["1 palm (100 g)", 100]], "conch stew"],
  ["sardines", "Sardines in oil, drained", "protein", 208, 25, [["1 can", 92]], "sardines"],
  // ---- eggs & dairy ----
  ["egg", "Egg, boiled or poached", "dairy", 143, 12.6, [["1 large egg", 50], ["1 medium egg", 44]], "eggs boiled"],
  ["egg-fried", "Egg, fried", "dairy", 196, 13.6, [["1 large egg", 46]], "fried egg"],
  ["egg-scram", "Scrambled eggs", "dairy", 166, 11, [["2 eggs' worth", 122], ["1 cup", 220]], "scrambled"],
  ["egg-white", "Egg whites", "dairy", 52, 11, [["1 egg white", 33], ["1/2 cup", 122]], "egg white"],
  ["omelette", "Omelette, cheese (2 eggs)", "dairy", 190, 13, [["1 omelette", 140]], "omelet"],
  ["milk-whole", "Milk, whole", "dairy", 61, 3.2, [["1 cup (240 ml)", 244], ["splash in coffee", 30]], "milk"],
  ["milk-skim", "Milk, skim", "dairy", 34, 3.4, [["1 cup (240 ml)", 245]], "milk skim fat free"],
  ["greek-0", "Greek yoghurt, plain 0%", "dairy", 59, 10.3, [["1 tub (170 g)", 170], ["1 cup", 245]], "greek yogurt"],
  ["greek-2", "Greek yoghurt, plain 2%", "dairy", 73, 9.9, [["1 tub (170 g)", 170], ["1 cup", 245]], "greek yogurt"],
  ["yog-flav", "Yoghurt, flavoured", "dairy", 99, 3.5, [["1 pot (150 g)", 150]], "yogurt fruit"],
  ["cottage", "Cottage cheese, 2%", "dairy", 84, 11, [["1/2 cup", 113], ["1 cup", 226]], "cottage cheese"],
  ["cheddar", "Cheddar cheese", "dairy", 403, 25, [["1 slice", 28], ["1 thumb", 15]], "cheese"],
  ["cheese-processed", "Cheese slice (processed)", "dairy", 330, 18, [["1 slice", 21]], "american cheese slice"],
  ["mozz", "Mozzarella", "dairy", 280, 28, [["1 oz", 28]], "cheese mozzarella"],
  // ---- rice, bread, starch ----
  ["rice-white", "White rice, cooked", "carbs", 130, 2.7, [["1 fist (1 cup)", 158], ["1/2 cup", 79], ["1 cupped hand", 79]], "rice"],
  ["rice-brown", "Brown rice, cooked", "carbs", 112, 2.3, [["1 fist (1 cup)", 195], ["1/2 cup", 98]], "rice brown"],
  ["rice-fried", "Fried rice", "fast", 163, 5, [["1 fist (1 cup)", 140], ["takeaway box", 400]], "chinese fried rice"],
  ["pasta", "Pasta, cooked", "carbs", 158, 5.8, [["1 fist (1 cup)", 140], ["1/2 cup", 70]], "spaghetti macaroni noodles"],
  ["noodles-instant", "Instant noodles (prepared)", "carbs", 190, 4, [["1 packet", 240]], "ramen cup noodles"],
  ["bread-white", "White bread", "carbs", 265, 9, [["1 slice", 28], ["2 slices", 56]], "bread toast"],
  ["bread-ww", "Wholewheat bread", "carbs", 247, 13, [["1 slice", 32], ["2 slices", 64]], "brown bread toast wholemeal"],
  ["bagel", "Bagel", "carbs", 257, 10, [["1 bagel", 98]], "bagel"],
  ["tortilla", "Flour tortilla (8 inch)", "carbs", 297, 8, [["1 tortilla", 49]], "wrap tortilla"],
  ["roll", "Bread roll / bun", "carbs", 280, 9, [["1 roll", 50], ["1 burger bun", 55]], "bun roll"],
  ["oats-dry", "Oats (dry)", "carbs", 389, 13, [["1/2 cup", 40], ["1 cupped hand", 40]], "oatmeal porridge oats"],
  ["porridge", "Porridge / oatmeal (made with water)", "carbs", 71, 2.5, [["1 bowl (1 cup)", 234]], "oatmeal porridge"],
  ["cereal", "Breakfast cereal (cornflakes type)", "carbs", 357, 7.5, [["1 cup", 28], ["1 bowl", 40]], "cereal cornflakes"],
  ["granola", "Granola", "carbs", 450, 10, [["1/2 cup", 60], ["1 cupped hand", 40]], "granola muesli"],
  ["potato-boiled", "Potato, boiled", "carbs", 87, 1.9, [["1 medium", 170], ["1 fist", 150]], "potatoes"],
  ["potato-mash", "Mashed potato", "carbs", 113, 2, [["1 fist (1 cup)", 210], ["1/2 cup", 105]], "mash"],
  ["fries", "French fries", "carbs", 312, 3.4, [["small", 70], ["medium", 117], ["large", 154]], "chips fries"],
  ["sweet-potato", "Sweet potato, baked", "carbs", 90, 2, [["1 medium", 114], ["1 fist", 150]], "sweet potato"],
  ["corn", "Corn on the cob", "carbs", 96, 3.4, [["1 ear", 100]], "corn sweetcorn"],
  ["pancake", "Pancake (6 inch)", "carbs", 227, 6.4, [["1 pancake", 77], ["stack of 3", 231]], "pancakes"],
  ["crackers", "Crackers", "carbs", 430, 9, [["5 crackers", 16]], "crackers water crackers"],
  // ---- Caribbean ----
  ["rice-peas", "Rice and peas", "carib", 170, 4.5, [["1 fist (1 cup)", 175], ["1/2 cup", 88], ["side portion", 250]], "rice and beans red peas coconut"],
  ["jerk-chicken", "Jerk chicken (with skin)", "carib", 220, 25, [["1 leg quarter", 150], ["1/4 chicken", 230], ["1 palm (100 g)", 100]], "jerk chicken"],
  ["brown-stew-chk", "Brown stew chicken", "carib", 180, 18, [["1 cup", 240], ["1 palm (100 g)", 100]], "brown stew chicken"],
  ["curry-chk", "Curry chicken", "carib", 170, 17, [["1 cup", 240], ["1 palm (100 g)", 100]], "curry chicken"],
  ["ackee-salt", "Ackee and saltfish", "carib", 180, 10, [["1 cup", 200], ["1 cupped hand", 100]], "ackee saltfish"],
  ["callaloo", "Callaloo, steamed", "carib", 35, 2.5, [["1 cup", 150], ["1 cupped hand", 75]], "callaloo greens"],
  ["plantain-fried", "Plantain, fried (ripe)", "carib", 240, 1.5, [["3 slices", 60], ["1/2 plantain", 90]], "plantain fried sweet"],
  ["plantain-boiled", "Plantain, boiled (green)", "carib", 116, 0.8, [["1/2 plantain", 90], ["1 plantain", 180]], "plantain boiled green"],
  ["breadfruit", "Breadfruit, roasted", "carib", 120, 1.1, [["1 slice", 100], ["1 fist", 150]], "breadfruit"],
  ["yam", "Yam, boiled", "carib", 116, 1.5, [["1 fist", 150], ["1 piece", 100]], "yam"],
  ["green-banana", "Green banana, boiled", "carib", 90, 1.1, [["1 banana", 100]], "green banana"],
  ["dumpling-boiled", "Dumpling, boiled", "carib", 230, 6, [["1 dumpling", 60]], "boiled dumpling spinner"],
  ["johnny-cake", "Johnny cake / fried dumpling", "carib", 370, 7, [["1 johnny cake", 60]], "fried dumpling johnny cake"],
  ["festival", "Festival", "carib", 360, 6, [["1 festival", 60]], "festival fried"],
  ["coco-bread", "Coco bread", "carib", 330, 7, [["1 coco bread", 90]], "coco bread"],
  ["patty", "Beef patty", "carib", 285, 9, [["1 patty", 140]], "jamaican patty beef patty"],
  ["conch-fritter", "Conch fritters", "carib", 280, 8, [["1 fritter", 30], ["6 fritters", 180]], "conch fritters"],
  ["fish-tea", "Fish tea / soup", "carib", 45, 4, [["1 cup", 240]], "fish soup fish tea"],
  ["cassava", "Cassava, boiled", "carib", 112, 1, [["1 fist", 150]], "cassava yuca bammy"],
  ["bammy", "Bammy", "carib", 220, 1.5, [["1 bammy", 80]], "bammy cassava"],
  ["macaroni-pie", "Macaroni pie / mac and cheese", "fast", 200, 8, [["1 slice", 150], ["1 fist (1 cup)", 200]], "mac and cheese macaroni pie"],
  // ---- beans & lentils ----
  ["beans-black", "Black beans, cooked", "legumes", 132, 8.9, [["1/2 cup", 86], ["1 cupped hand", 86], ["1 fist (1 cup)", 172]], "beans black"],
  ["beans-kidney", "Kidney beans / red peas, cooked", "legumes", 127, 8.7, [["1/2 cup", 89], ["1 fist (1 cup)", 177]], "red beans kidney red peas"],
  ["chickpeas", "Chickpeas, cooked", "legumes", 164, 8.9, [["1/2 cup", 82], ["1 fist (1 cup)", 164]], "chickpeas garbanzo channa"],
  ["lentils", "Lentils, cooked", "legumes", 116, 9, [["1/2 cup", 99], ["1 fist (1 cup)", 198]], "lentils dal"],
  ["baked-beans", "Baked beans", "legumes", 100, 5, [["1/2 cup", 127], ["1/2 can", 200]], "baked beans heinz"],
  ["hummus", "Hummus", "legumes", 166, 7.9, [["2 tbsp", 30], ["1 thumb", 15]], "hummus"],
  ["tofu", "Tofu, firm", "legumes", 144, 17, [["1 palm (100 g)", 100]], "tofu"],
  // ---- vegetables ----
  ["salad", "Mixed salad greens", "veg", 17, 1.5, [["1 bowl (2 cups)", 85], ["1 fist", 40]], "salad lettuce greens"],
  ["broccoli", "Broccoli, cooked", "veg", 35, 2.4, [["1 fist (1 cup)", 156], ["1/2 cup", 78]], "broccoli"],
  ["mixed-veg", "Mixed vegetables, cooked", "veg", 65, 2.9, [["1 fist (1 cup)", 182], ["1/2 cup", 91]], "mixed veg vegetables"],
  ["cabbage", "Cabbage, steamed", "veg", 23, 1.3, [["1 fist (1 cup)", 150]], "cabbage"],
  ["carrots", "Carrots", "veg", 41, 0.9, [["1 medium", 61], ["1 cup", 128]], "carrot"],
  ["tomato", "Tomato", "veg", 18, 0.9, [["1 medium", 123]], "tomatoes"],
  ["cucumber", "Cucumber", "veg", 15, 0.7, [["1/2 cucumber", 150]], "cucumber"],
  ["spinach", "Spinach, cooked", "veg", 23, 3, [["1 cup", 180]], "spinach"],
  ["green-beans", "Green beans / string beans", "veg", 35, 1.9, [["1 cup", 125]], "string beans"],
  ["peppers", "Sweet peppers", "veg", 26, 1, [["1 pepper", 120]], "bell pepper"],
  ["onion", "Onion", "veg", 40, 1.1, [["1/2 onion", 55]], "onion"],
  ["coleslaw", "Coleslaw", "veg", 150, 1, [["1/2 cup", 90]], "coleslaw slaw"],
  ["potato-salad", "Potato salad", "veg", 143, 2.7, [["1/2 cup", 125]], "potato salad"],
  // ---- fruit ----
  ["banana", "Banana", "fruit", 89, 1.1, [["1 medium", 118], ["1 small", 101]], "banana"],
  ["apple", "Apple", "fruit", 52, 0.3, [["1 medium", 182]], "apple"],
  ["orange", "Orange", "fruit", 47, 0.9, [["1 medium", 131]], "orange"],
  ["mango", "Mango", "fruit", 60, 0.8, [["1 cup sliced", 165], ["1 whole", 336]], "mango"],
  ["pineapple", "Pineapple", "fruit", 50, 0.5, [["1 cup", 165]], "pineapple"],
  ["papaya", "Papaya", "fruit", 43, 0.5, [["1 cup", 145]], "papaya pawpaw"],
  ["watermelon", "Watermelon", "fruit", 30, 0.6, [["1 cup", 152], ["1 wedge", 286]], "watermelon"],
  ["berries", "Berries (strawberries, blueberries)", "fruit", 45, 0.7, [["1 cup", 150], ["1 cupped hand", 75]], "strawberries blueberries"],
  ["grapes", "Grapes", "fruit", 69, 0.7, [["1 cup", 151]], "grapes"],
  ["avocado", "Avocado", "fruit", 160, 2, [["1/2 avocado", 68], ["1 whole", 136]], "avocado pear"],
  ["dates", "Dates", "fruit", 282, 2.5, [["1 date", 8], ["3 dates", 24]], "dates"],
  ["raisins", "Raisins", "fruit", 299, 3.1, [["small box", 28]], "raisins"],
  // ---- fats, nuts, sauces ----
  ["olive-oil", "Olive or cooking oil", "fats", 884, 0, [["1 tbsp (1 thumb)", 13.5], ["1 tsp", 4.5]], "oil olive vegetable coconut"],
  ["butter", "Butter", "fats", 717, 0.9, [["1 tbsp (1 thumb)", 14], ["1 pat", 5]], "butter margarine"],
  ["pb", "Peanut butter", "fats", 588, 25, [["1 tbsp (1 thumb)", 16], ["2 tbsp", 32]], "peanut butter"],
  ["mayo", "Mayonnaise", "fats", 680, 1, [["1 tbsp", 14]], "mayo"],
  ["almonds", "Almonds", "fats", 579, 21, [["1 handful (1 oz)", 28]], "almonds nuts"],
  ["peanuts", "Peanuts", "fats", 567, 26, [["1 handful (1 oz)", 28]], "peanuts nuts"],
  ["cashews", "Cashews", "fats", 553, 18, [["1 handful (1 oz)", 28]], "cashews nuts"],
  ["ketchup", "Ketchup", "fats", 101, 1, [["1 tbsp", 17]], "ketchup sauce"],
  ["bbq", "BBQ / jerk sauce", "fats", 172, 0.8, [["1 tbsp", 17]], "bbq jerk sauce"],
  ["dressing", "Salad dressing (creamy)", "fats", 430, 1, [["1 tbsp", 15], ["2 tbsp", 30]], "ranch dressing"],
  ["sugar", "Sugar", "fats", 387, 0, [["1 tsp", 4], ["1 tbsp", 12.5]], "sugar"],
  ["honey", "Honey", "fats", 304, 0.3, [["1 tbsp", 21], ["1 tsp", 7]], "honey"],
  ["jam", "Jam", "fats", 250, 0.4, [["1 tbsp", 20]], "jam jelly"],
  // ---- drinks ----
  ["coffee", "Coffee, black / tea", "drinks", 2, 0.3, [["1 cup", 240]], "coffee tea black"],
  ["latte", "Latte (whole milk)", "drinks", 40, 2.5, [["small (12 oz)", 355], ["medium (16 oz)", 473]], "latte cappuccino flat white"],
  ["oj", "Orange juice", "drinks", 45, 0.7, [["1 glass (240 ml)", 248]], "juice orange"],
  ["soda", "Soft drink (cola, regular)", "drinks", 39, 0, [["1 can (355 ml)", 355], ["bottle (500 ml)", 500]], "soda coke pepsi ting soft drink"],
  ["diet-soda", "Diet soft drink", "drinks", 0, 0, [["1 can", 355]], "diet coke zero"],
  ["beer", "Beer", "drinks", 43, 0.5, [["1 can/bottle (355 ml)", 355], ["pint", 473]], "beer red stripe lager"],
  ["wine", "Wine", "drinks", 83, 0.1, [["1 glass (150 ml)", 150]], "wine red white"],
  ["rum", "Rum or spirits", "drinks", 231, 0, [["1 shot (44 ml)", 44]], "rum vodka whiskey spirits"],
  ["rum-punch", "Rum punch", "drinks", 120, 0, [["1 glass", 240]], "rum punch cocktail"],
  ["smoothie", "Fruit smoothie", "drinks", 60, 1, [["1 cup", 245], ["large (20 oz)", 590]], "smoothie"],
  ["shake", "Protein shake (whey, with water)", "drinks", 400, 80, [["1 scoop", 30]], "whey protein shake"],
  ["coconut-water", "Coconut water", "drinks", 19, 0.7, [["1 cup", 240]], "coconut water jelly water"],
  ["sports-drink", "Sports drink", "drinks", 26, 0, [["1 bottle (591 ml)", 591]], "gatorade powerade"],
  // ---- snacks ----
  ["chips", "Potato chips / crisps", "snacks", 536, 7, [["small bag (1 oz)", 28], ["share bag", 150]], "crisps chips"],
  ["chocolate", "Chocolate bar", "snacks", 535, 7.6, [["1 bar", 44], ["2 squares", 20]], "chocolate"],
  ["protein-bar", "Protein bar", "snacks", 350, 33, [["1 bar", 60]], "protein bar"],
  ["granola-bar", "Granola bar", "snacks", 470, 8, [["1 bar", 28]], "cereal bar"],
  ["cookie", "Cookies / biscuits", "snacks", 480, 5, [["1 cookie", 15], ["2 cookies", 30]], "cookies biscuits"],
  ["cake", "Cake (frosted)", "snacks", 380, 4, [["1 slice", 80]], "cake"],
  ["ice-cream", "Ice cream", "snacks", 207, 3.5, [["1/2 cup", 66], ["1 scoop", 66]], "ice cream"],
  ["popcorn", "Popcorn (microwave, buttered)", "snacks", 500, 8, [["1 cup popped", 11], ["1 bag", 85]], "popcorn"],
  ["donut", "Doughnut", "snacks", 452, 5, [["1 doughnut", 60]], "donut doughnut"],
  ["muffin", "Muffin", "snacks", 380, 5, [["1 muffin", 113]], "muffin"],
  // ---- takeaway & meals ----
  ["pizza", "Pizza (cheese or pepperoni)", "fast", 266, 11, [["1 slice", 107], ["2 slices", 214]], "pizza"],
  ["burger", "Burger with cheese (single)", "fast", 265, 14, [["1 burger", 120], ["large burger", 220]], "burger cheeseburger hamburger"],
  ["hotdog", "Hot dog in bun", "fast", 290, 10, [["1 hot dog", 98]], "hotdog"],
  ["sandwich-chk", "Chicken sandwich", "fast", 250, 14, [["1 sandwich", 200]], "chicken sandwich sub"],
  ["burrito", "Burrito (meat, rice, beans)", "fast", 200, 9, [["1 burrito", 350]], "burrito"],
  ["sushi", "Sushi roll", "fast", 150, 5, [["6 pieces", 170], ["1 piece", 28]], "sushi maki"],
  ["chicken-salad", "Grilled chicken salad (with dressing)", "fast", 110, 10, [["1 bowl", 350]], "salad chicken caesar"],
  ["soup", "Soup, chicken or vegetable", "fast", 40, 2.5, [["1 bowl", 300], ["1 cup", 245]], "soup"],
  ["chow-mein", "Chow mein / lo mein", "fast", 150, 7, [["1 fist (1 cup)", 200], ["takeaway box", 450]], "chow mein noodles chinese"]
];

export const FOODS = RAW.map(([id, name, cat, k, p, portions, aliases]) => ({ id, name, cat, k, p, portions: portions.map(([label, g]) => ({ label, g })), aliases: aliases || "" }));
const byId = Object.fromEntries(FOODS.map(f => [f.id, f]));
export const foodById = id => byId[id] || null;

// Calories and protein for `qty` x portion.
export function nutrition(food, portionIndex, qty) {
  const pt = food.portions[portionIndex] || food.portions[0], g = pt.g * qty;
  return { g, k: Math.round(food.k * g / 100), p: Math.round(food.p * g / 10) / 10 };
}

// Ranked search across names and aliases; every word must match.
export function searchFoods(q, limit = 40) {
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored = [];
  FOODS.forEach((f, i) => {
    const hay = (f.name + " " + f.aliases).toLowerCase();
    if (!words.every(w => hay.includes(w))) return;
    const name = f.name.toLowerCase();
    // name match beats alias match; ties go to the more common food (list order)
    scored.push([(name.startsWith(words[0]) ? 0 : name.includes(words[0]) ? 1 : 2) + i / 10000, f]);
  });
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map(x => x[1]);
}
