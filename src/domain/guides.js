// Guide library. Plain, practical, and careful with health claims.
// Body format: strings are paragraphs; ["h", text] is a subheading; ["ul", [...items]] is a list.
export const GUIDES = [
  {
    id: "rate", cat: "Start here", free: true, mins: 3, tone: "accent",
    title: "How fast should you lose weight?",
    body: [
      "A sustainable rate is about 0.5-1% of your body weight a week. At 210 lb that's 1-2 lb a week; as you get lighter, the weekly number naturally shrinks.",
      "Faster sounds better, but it usually costs muscle, energy for training and, eventually, the weight itself. Losing at a steady rate keeps your runs improving while the scale comes down.",
      ["h", "Think in stages"],
      "A big goal is easier in chunks. If you have 60 lb to lose, aim for 10-15 lb at a time, then take a week or two at maintenance before the next stage. Those breaks make the long run far more likely to stick.",
      ["h", "What to watch"],
      ["ul", ["Your 7-day average weight, not single days", "How your easy runs feel at the same pace", "Waist measurement once a month", "Sleep and mood: if they slide, the deficit is too big"]]
    ]
  },
  {
    id: "fast-train", cat: "Fasting + training", free: true, mins: 4, tone: "sun",
    title: "Fasting and training: getting the timing right",
    body: [
      "Fasting and running work well together if you match the session to where you are in your fast.",
      ["h", "Easy sessions"],
      "Easy runs, walks and light cycling are fine fasted for most healthy adults. The sweet spot is the last hour or two of your fast, so you can eat soon after.",
      ["h", "Hard sessions"],
      "Intervals, tempo runs and heavy strength work go better fed. Train 2-3 hours after your first meal. You'll hold better quality and recover faster.",
      ["h", "After training"],
      "Break your fast with 30-40 g of protein and some carbohydrate within about an hour. That's what protects muscle while you're losing fat.",
      ["h", "When not to train fasted"],
      ["ul", ["Past about 24 hours of fasting", "If you feel dizzy, shaky or unusually breathless", "In strong heat without water and electrolytes", "If you have diabetes or take blood-pressure or blood-sugar medication: speak to your doctor first"]]
    ]
  },
  {
    id: "protein", cat: "Food", free: true, mins: 3, tone: "rose",
    title: "Protein made simple",
    body: [
      "When you eat less to lose fat, protein is what tells your body to keep its muscle. It also keeps you fuller for longer, which matters with a short eating window.",
      "A good daily target is about 0.7-1 g per lb of your goal weight. Spread it over your meals: 30-50 g per meal is easier than one huge serving.",
      ["h", "Easy sources"],
      ["ul", ["Fish: snapper, mahi-mahi, tuna, salmon", "Chicken, turkey and lean beef", "Eggs and egg whites", "Greek yoghurt and cottage cheese", "Beans, lentils and tofu", "A protein shake when you're short"]],
      "Build each plate from the protein first, then add vegetables, then carbs to suit the day's training."
    ]
  },
  {
    id: "heat", cat: "Running", free: false, mins: 3, tone: "sun",
    title: "Running in the heat",
    body: [
      "Heat and humidity make every pace feel harder. That isn't a fitness problem; your body is sending blood to the skin to cool you.",
      ["ul", ["Run early or late, out of the midday sun", "Slow down by 30-90 seconds per mile on humid days and run by effort, not pace", "Drink to thirst, and carry water on anything over 30 minutes", "Add electrolytes on long or very sweaty sessions, especially when fasting", "Wear light colours and a cap"]],
      ["h", "Stop and cool down if you notice"],
      ["ul", ["Headache, confusion or dizziness", "Chills or goosebumps in the heat", "Nausea, or you stop sweating"]]
    ]
  },
  {
    id: "scale", cat: "Mindset", free: false, mins: 3, tone: "accent",
    title: "Why the scale goes up when you're doing everything right",
    body: [
      "Your weight can swing 2-4 lb from one day to the next without any change in body fat.",
      ["ul", ["Salt and restaurant meals hold water", "New or harder training adds water to repair muscles", "More carbohydrate after a fast refills glycogen, which stores water", "Sleep, stress and hormones all play a part"]],
      "That's why the app shows your 7-day average and a trend line. Judge progress over two to three weeks. If the trend is flat for three weeks, make one small change: about 150-200 kcal less a day, or an extra walk."
    ]
  },
  {
    id: "mistakes", cat: "Running", free: false, mins: 3, tone: "accent",
    title: "Five comeback mistakes runners make",
    body: [
      ["ul", [
        "Running at old race pace. Your fitness memory is faster than your current body. Easy means full sentences.",
        "Skipping the walk breaks. They're the plan, not a sign of weakness. They let your tendons catch up with your lungs.",
        "Adding too much too soon. Build total time by about 10% a week, and repeat a week when needed.",
        "Ignoring strength work. Two short sessions a week prevent most of the niggles that end comebacks.",
        "Training through sharp or worsening pain. Pain that changes how you move means stop and rest."
      ]]
    ]
  },
  {
    id: "hunger", cat: "Fasting + training", free: false, mins: 3, tone: "sun",
    title: "Handling hunger during a fast",
    body: [
      "Hunger during a fast comes in waves. It usually builds around your normal meal times and fades within 15-20 minutes if you don't feed it.",
      ["ul", ["Drink a large glass of water, or black coffee or plain tea", "Go for a 10-minute walk", "Keep busy at your usual meal times", "Add a pinch of salt to water on long fasts", "Make your last meal before a fast rich in protein and fibre"]],
      "If hunger is constant and strong, the plan is too aggressive for now. Shorten the fast by an hour or two. Consistency beats intensity."
    ]
  },
  {
    id: "eating-out", cat: "Food", free: false, mins: 2, tone: "rose",
    title: "Eating out and still losing weight",
    body: [
      ["ul", ["Pick the protein first: grilled fish, chicken or steak", "Ask for sauces and dressings on the side", "Swap fries for salad, vegetables or rice and peas in a smaller portion", "One drink, or sparkling water with lime", "Look at the menu beforehand so you decide before you're hungry"]],
      "One restaurant meal doesn't undo a week. Log it as best you can and carry on with your next meal as normal."
    ]
  },
  {
    id: "sleep", cat: "Recovery", free: false, mins: 2, tone: "accent",
    title: "Sleep: the training session you can't skip",
    body: [
      "Short sleep raises hunger, makes training feel harder and slows recovery. People losing weight on little sleep tend to lose more muscle.",
      ["ul", ["Aim for 7-9 hours", "Keep the same wake-up time, even at weekends", "Finish your last meal 2-3 hours before bed", "Cool, dark room; screens away 30 minutes before sleep"]]
    ]
  },
  {
    id: "first-meal", cat: "Fasting + training", free: false, mins: 2, tone: "sun",
    title: "How to break a fast",
    body: [
      "Your first meal sets up the rest of your eating window. Make it protein-led and unhurried.",
      ["ul", ["Start with protein: eggs, fish, chicken, Greek yoghurt", "Add vegetables and some slow carbs, especially after training", "Eat slowly; it takes about 20 minutes to feel full", "After longer fasts, start with a smaller meal"]]
    ]
  }
];
