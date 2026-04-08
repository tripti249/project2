/* ════════════════════════════════════════════════════════
   AapkaDINACHARYA — Health Assistant Module (Upgraded)
   - Handles BMR, TDEE, FAQ Hub, and Detailed Macros
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

  // Panel Toggling
  healthFab.addEventListener('click', function() {
    if (healthWindow) {
      healthWindow.classList.toggle('hidden');
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

  // --- Tab System Logic ---
  var tabs = document.querySelectorAll('.hw-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var sectionId = tab.getAttribute('data-section');
      
      // Update Tab UI
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');

      // Update Section visibility
      document.querySelectorAll('.hw-section').forEach(function(sec) {
        sec.classList.remove('active');
      });
      var targetSec = document.getElementById(sectionId);
      if (targetSec) targetSec.classList.add('active');
    });
  });

  // --- Accordion Logic for Protein Hub ---
  var qaButtons = document.querySelectorAll('.hw-qa-q');
  qaButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.parentElement;
      var isOpen = item.classList.contains('open');
      
      // Close other items
      document.querySelectorAll('.hw-qa-item').forEach(function(i) {
        i.classList.remove('open');
      });

      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // --- Shortcut Buttons Logic ---
  var shortcuts = document.querySelectorAll('.hw-shortcut-btn');
  shortcuts.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var planType = btn.getAttribute('data-plan');
      handleMealPlanRequest(planType);
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
        if (typeof showToast === 'function') {
          showToast('Please enter your weight, height, and age ⚖️', 'info');
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
    dietPlanEl.innerHTML = 'To maintain your weight, consume <strong>' + stats.tdee + '</strong> kcal/day. For weight loss, aim for <strong>' + (stats.tdee - 500) + '</strong>. Daily protein goal: <strong>' + stats.protein + 'g</strong>.';
  }

  // Nutrition Database (Detailed)
  var foods = [
    { name: 'Chicken Breast', pro: 31, cal: 165, icon: '🍗', type: 'non-veg' },
    { name: 'Paneer (Cottage)', pro: 18, cal: 265, icon: '🧀', type: 'veg' },
    { name: 'Eggs (3 large)', pro: 18, cal: 210, icon: '🥚', type: 'non-veg' },
    { name: 'Soy Chunks', pro: 52, cal: 345, icon: '🌱', type: 'veg' },
    { name: 'Lentils (Dal)', pro: 9, cal: 116, icon: '🍲', type: 'veg' },
    { name: 'Fish (Salmon)', pro: 22, cal: 200, icon: '🐟', type: 'non-veg' },
    { name: 'Chickpeas', pro: 19, cal: 364, icon: '🥣', type: 'veg' },
    { name: 'Greek Yogurt', pro: 10, cal: 59, icon: '🥛', type: 'veg' }
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

  var form = document.getElementById('hw-form');
  var results = document.getElementById('hw-results');
  if (form) form.classList.add('hidden');
  if (results) results.classList.remove('hidden');
  
  if (typeof triggerEmojiBomb === 'function') triggerEmojiBomb('success');
  if (typeof showToast === 'function') showToast('Plan generated! 🍏', 'success');
}

function handleMealPlanRequest(type) {
  // Integrate with chatbot or show interactive plan
  if (typeof showToast === 'function') {
    showToast('Consulting GOPICHANDRA AI for your ' + type.replace('-', ' ') + '... 🤖', 'info');
  }
  
  // Open chatbot with pre-filled message if applicable
  var chatbotWin = document.getElementById('chatbot-window');
  var chatInput = document.getElementById('user-input');
  var chatSend = document.getElementById('send-button');

  if (chatbotWin && chatInput && chatSend) {
    setTimeout(function() {
      document.getElementById('health-window').classList.add('hidden');
      chatbotWin.classList.remove('hidden');
      var prompt = "Give me a detailed " + type.replace('-', ' ') + " based on my health requirements.";
      chatInput.value = prompt;
      chatSend.click();
    }, 1500);
  }
}

// Auto-run on load
window.addEventListener('load', function() {
  initHealthAssistant();
  console.log('Health Hub Upgraded Successfully');
});
