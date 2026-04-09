/* ════════════════════════════════════════════════════════
   AapkaDINACHARYA — Health Assistant Module (Upgraded)
   - Handles BMR, TDEE, FAQ Hub, and Workable Meal Plans
   ════════════════════════════════════════════════════════ */

const MEAL_PLANS = {
  'protein-diet': {
    title: 'Simple Daily Protein Diet Plan',
    subtitle: 'Beginner Friendly (Target: ~70–90g Protein/Day)',
    meals: [
      { time: '🌅 Morning (7–8 AM)', desc: '1 glass milk + 2 boiled eggs or 50g paneer.', pro: '12–15' },
      { time: '🍳 Breakfast (9-10 AM)', desc: '2–3 moong dal chilla or oats with peanut butter.', pro: '15-20' },
      { time: '🍎 Mid-Morning Snack', desc: 'Roasted chana, peanuts, or sprouts.', pro: '8–10' },
      { time: '🍛 Lunch', desc: '2 roti + dal + paneer sabzi or chicken.', pro: '20–25' },
      { time: '☕ Evening Snack', desc: 'Boiled eggs, soy chunks, or a smoothie.', pro: '10–15' },
      { time: '🍽️ Dinner', desc: 'Rice + dal or chicken or fish.', pro: '20–25' },
      { time: '🌙 Before Bed', desc: '1 glass milk.', pro: '6-8' }
    ]
  },
  'gym-plan': {
    title: 'Gym + Protein Plan',
    subtitle: 'Muscle Gain & Fitness Strategy',
    meals: [
      { time: '💪 Workout Split', desc: 'Chest/Triceps → Back/Biceps → Rest → Legs → Shoulders/Abs.', pro: 'Gain Focus' },
      { time: '⚡ Daily Targets', desc: 'Normal: 0.8g/kg | Beginners: 1.2–1.5g/kg | Gain: 1.6–2g/kg.', pro: 'Custom' },
      { time: '🍌 Pre-Workout', desc: 'Light carbs + little protein (e.g. banana + milk).', pro: 'Energy' },
      { time: '🥗 Post-Workout', desc: '3 eggs or whey protein or paneer (CRITICAL).', pro: '20-30' }
    ]
  },
  'indian-meal': {
    title: 'High-Protein Indian Meal Plan',
    subtitle: 'Veg & Non-Veg Traditional Options',
    meals: [
      { time: '🥬 Veg Breakfast', desc: 'Paneer paratha or moong dal chilla.', pro: '15-20' },
      { time: '🍗 Non-Veg Breakfast', desc: '3 eggs + toast.', pro: '18' },
      { time: '🥬 Veg Lunch', desc: 'Dal + roti + soybean sabzi.', pro: '20-25' },
      { time: '🍗 Non-Veg Lunch', desc: 'Chicken curry + roti.', pro: '25-30' },
      { time: '☕ Snacks', desc: 'Roasted chana + peanuts or boiled eggs.', pro: '10-15' },
      { time: '🥬 Veg Dinner', desc: 'Rajma / chole + rice.', pro: '15-20' },
      { time: '🍗 Non-Veg Dinner', desc: 'Fish / chicken + rice.', pro: '25' }
    ]
  }
};

(function() {
  function initHealthAssistant() {
    var healthFab      = document.getElementById('health-fab');
    var healthWindow   = document.getElementById('health-window');
    var closeHealthBtn = document.getElementById('close-health-btn');
    var hwCalcBtn      = document.getElementById('hw-calc-btn');
    var hwBackBtn      = document.getElementById('hw-back-btn');
    var hwForm         = document.getElementById('hw-form');
    var hwResults      = document.getElementById('hw-results');
    var hwStaticPlan   = document.getElementById('hw-static-plan');

    if (!healthFab) return;

    // Panel Toggling
    healthFab.addEventListener('click', function() {
      if (healthWindow) {
        healthWindow.classList.toggle('hidden');
        var notesModal = document.getElementById('notes-modal');
        if (notesModal) notesModal.classList.add('hidden');
      }
    });

    if (closeHealthBtn) {
    closeHealthBtn.addEventListener('click', function() {
      healthWindow.classList.add('hidden');
    });
  }

  // --- Tab System Logic ---
  var tabs = document.querySelectorAll('.hw-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var sectionId = tab.getAttribute('data-section');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');

      document.querySelectorAll('.hw-section').forEach(function(sec) {
        sec.classList.remove('active');
      });
      var targetSec = document.getElementById(sectionId);
      if (targetSec) targetSec.classList.add('active');
      
      // Reset views when switching tabs
      if (hwForm) hwForm.classList.remove('hidden');
      if (hwResults) hwResults.classList.add('hidden');
      if (hwStaticPlan) hwStaticPlan.classList.remove('active');
    });
  });

  // --- Accordion Logic for Protein Hub ---
  var qaButtons = document.querySelectorAll('.hw-qa-q');
  qaButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.parentElement;
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.hw-qa-item').forEach(function(i) {
        i.classList.remove('open');
      });
      if (!isOpen) item.classList.add('open');
    });
  });

  // --- Shortcut Buttons Logic ---
  var shortcuts = document.querySelectorAll('.hw-shortcut-btn');
  shortcuts.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var planType = btn.getAttribute('data-plan');
      renderMealPlan(planType);
    });
  });

  // Calculator Logic
  if (hwCalcBtn) {
    hwCalcBtn.addEventListener('click', function() {
      var weight = parseFloat(document.getElementById('hw-weight').value);
      var height = parseFloat(document.getElementById('hw-height').value);
      var age    = parseInt(document.getElementById('hw-age').value);
      var gender = document.getElementById('hw-gender').value;
      var activity = parseFloat(document.getElementById('hw-activity').value);

      if (!weight || !height || !age) {
        if (typeof showToast === 'function') showToast('Please enter your weight, height, and age ⚖️', 'info');
        return;
      }

      var stats = calculateHealthStats(weight, height, age, gender, activity);
      displayHealthResults(stats);
    });
  }

  // Back Button Listeners
  if (hwBackBtn) {
    hwBackBtn.addEventListener('click', function() {
      if (hwResults) hwResults.classList.add('hidden');
      if (hwForm) hwForm.classList.remove('hidden');
      if (hwStaticPlan) hwStaticPlan.classList.remove('active');
    });
  }

  var planBackBtns = document.querySelectorAll('.hw-plan-back-btn');
  planBackBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (hwStaticPlan) hwStaticPlan.classList.remove('active');
      if (hwForm) hwForm.classList.remove('hidden');
    });
  });
}

function calculateHealthStats(w, h, a, g, act) {
  var bmr = (10 * w) + (6.25 * h) - (5 * a);
  if (g === 'male') bmr += 5; else bmr -= 161;
  var tdee = Math.round(bmr * act);
  var protein = Math.round(w * 1.8); 
  return { bmr: Math.round(bmr), tdee: tdee, protein: protein, weight: w };
}

function displayHealthResults(stats) {
  var bmrEl = document.getElementById('res-bmr');
  var tdeeEl = document.getElementById('res-tdee');
  if (bmrEl) bmrEl.textContent = stats.bmr;
  if (tdeeEl) tdeeEl.textContent = stats.tdee;

  var dietPlanEl = document.getElementById('res-diet-plan');
  var foodListEl = document.getElementById('res-foods');
  if (dietPlanEl) {
    dietPlanEl.innerHTML = 'To maintain weight: <strong>' + stats.tdee + '</strong> kcal. For loss: <strong>' + (stats.tdee - 500) + '</strong>. Protein goal: <strong>' + stats.protein + 'g</strong>.';
  }

  var foods = [
    { name: 'Chicken Breast', pro: 31, cal: 165, icon: '🍗' },
    { name: 'Paneer (Cottage)', pro: 18, cal: 265, icon: '🧀' },
    { name: 'Eggs (3 large)', pro: 18, cal: 210, icon: '🥚' },
    { name: 'Soy Chunks', pro: 52, cal: 345, icon: '🌱' },
    { name: 'Lentils (Dal)', pro: 9, cal: 116, icon: '🍲' },
    { name: 'Fish (Salmon)', pro: 22, cal: 200, icon: '🐟' },
    { name: 'Chickpeas', pro: 19, cal: 364, icon: '🥣' },
    { name: 'Greek Yogurt', pro: 10, cal: 59, icon: '🥛' }
  ];

  if (foodListEl) {
    foodListEl.innerHTML = foods.map(function(f) {
      return '<div class="hw-food-card">' +
               '<div class="hw-food-head">' +
                 '<span class="hw-food-icon">' + f.icon + '</span>' +
                 '<span class="hw-food-name">' + f.name + '</span>' +
               '</div>' +
               '<div class="hw-food-macros">' +
                 '<span>Protein: <span class="macro-val">' + f.pro + 'g</span></span>' +
                 '<span>Calories: <span class="macro-val">' + f.cal + 'kcal</span></span>' +
               '</div>' +
             '</div>';
    }).join('');
  }

  document.getElementById('hw-form').classList.add('hidden');
  document.getElementById('hw-results').classList.remove('hidden');
  if (typeof triggerEmojiBomb === 'function') triggerEmojiBomb('success');
  if (typeof showToast === 'function') showToast('Custom strategy ready! 🍏', 'success');
}

function renderMealPlan(type) {
  var plan = MEAL_PLANS[type];
  if (!plan) return;

  var container = document.getElementById('plan-content-display');
  var html = '<div class="hw-plan-title">' + plan.title + '</div>' +
             '<span class="hw-plan-subtitle">' + plan.subtitle + '</span>';

  html += plan.meals.map(function(m) {
    return '<div class="hw-meal-row">' +
             '<span class="hw-meal-time">' + m.time + '</span>' +
             '<div class="hw-meal-desc">' + m.desc + '</div>' +
             '<span class="pro-tag">Protein: ' + m.pro + 'g</span>' +
           '</div>';
  }).join('');

  container.innerHTML = html;

  // Switch Views
  document.getElementById('hw-form').classList.add('hidden');
  document.getElementById('hw-results').classList.add('hidden');
  document.getElementById('hw-static-plan').classList.add('active');
  
  if (typeof showToast === 'function') showToast('Loading expert ' + plan.title + '...', 'info');
}

  // Auto-run on load
  window.addEventListener('load', function() {
    initHealthAssistant();
    console.log('Health Hub Fully Functional');
  });
})();
