/* ════════════════════════════════════════════════════════
   AapkaDINACHARYA — Health Assistant Module
   - Isolated from main app.js to prevent auth conflicts
   - Handles BMR, TDEE, and Diet Plan generation
   ════════════════════════════════════════════════════════ */

function initHealthAssistant() {
  var healthFab      = document.getElementById('health-fab');
  var healthWindow   = document.getElementById('health-window');
  var closeHealthBtn = document.getElementById('close-health-btn');
  var hwCalcBtn      = document.getElementById('hw-calc-btn');
  var hwBackBtn      = document.getElementById('hw-back-btn');
  var hwForm         = document.getElementById('hw-form');
  var hwResults      = document.getElementById('hw-results');

  if (!healthFab) return;

  healthFab.addEventListener('click', function() {
    if (healthWindow) {
      healthWindow.classList.toggle('hidden');
      // Close other panels if open
      var chatbotWin = document.getElementById('chatbot-window');
      var notesModal = document.getElementById('notes-modal');
      if (chatbotWin) chatbotWin.classList.add('hidden');
      if (notesModal) notesModal.classList.add('hidden');
    }
  });

  if (closeHealthBtn) {
    closeHealthBtn.addEventListener('click', function() {
      healthWindow.classList.add('hidden');
    });
  }

  if (hwCalcBtn) {
    hwCalcBtn.addEventListener('click', function() {
      var weight = parseFloat(document.getElementById('hw-weight').value);
      var height = parseFloat(document.getElementById('hw-height').value);
      var age    = parseInt(document.getElementById('hw-age').value);
      var gender = document.getElementById('hw-gender').value;
      var activity = parseFloat(document.getElementById('hw-activity').value);

      if (!weight || !height || !age) {
        if (typeof showToast === 'function') {
          showToast('Please enter your weight, height, and age ⚖️', 'info');
        } else {
          alert('Please enter your weight, height, and age');
        }
        return;
      }

      var stats = calculateHealthStats(weight, height, age, gender, activity);
      displayHealthResults(stats);
    });
  }

  if (hwBackBtn) {
    hwBackBtn.addEventListener('click', function() {
      if (hwResults) hwResults.classList.add('hidden');
      if (hwForm) hwForm.classList.remove('hidden');
    });
  }
}

function calculateHealthStats(w, h, a, g, act) {
  // Mifflin-St Jeor Equation
  var bmr = (10 * w) + (6.25 * h) - (5 * a);
  if (g === 'male') bmr += 5;
  else bmr -= 161;

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
    dietPlanEl.innerHTML = 'To maintain your weight, consume <strong>' + stats.tdee + '</strong> calories/day. For weight loss, aim for <strong>' + (stats.tdee - 500) + '</strong>. Your daily protein goal is <strong>' + stats.protein + 'g</strong>.';
  }

  var foods = [
    { name: 'Eggs', type: 'Protein' },
    { name: 'Chicken Breast', type: 'Protein' },
    { name: 'Paneer/Tofu', type: 'Protein' },
    { name: 'Lentils/Dal', type: 'Protein' },
    { name: 'Greek Yogurt', type: 'Protein' },
    { name: 'Nuts & Seeds', type: 'Calories' },
    { name: 'Avocados', type: 'Calories' },
    { name: 'Oats', type: 'Fiber' }
  ];

  if (foodListEl) {
    foodListEl.innerHTML = foods.map(function(f) {
      return '<span class="hw-food-chip">' + f.name + ' (' + f.type + ')</span>';
    }).join('');
  }

  var form = document.getElementById('hw-form');
  var results = document.getElementById('hw-results');
  if (form) form.classList.add('hidden');
  if (results) results.classList.remove('hidden');
  
  if (typeof triggerEmojiBomb === 'function') triggerEmojiBomb('success');
  if (typeof showToast === 'function') showToast('Health plan generated! 🍏', 'success');
}

// Auto-run on load
window.addEventListener('load', function() {
  initHealthAssistant();
  console.log('Health Assistant initialized');
});
