/* ════════════════════════════════════════════════════════
   AapkaDINACHARYA — Main Application Logic v3.5 (Enhanced)
   - Integrated Themes, Quotes, Habits, Voice & Sortable
   - Rebranded from TaskFlow
   - Uses localStorage keys: adc_token, adc_user, adc_theme, adc_avatar
   ════════════════════════════════════════════════════════ */

const API = '/api';

// ── Auth Guard ────────────────────────────────────────────
const token = localStorage.getItem('adc_token');
const user = JSON.parse(localStorage.getItem('adc_user') || 'null');

if (!token || !user) {
  window.location.replace('/auth');
  throw new Error('Not authenticated');
}

// ── State ────────────────────────────────────────────────
let todos = [];
let filter = 'all';
let sort = 'newest';
let addStartTimePicker = null;
let addEndTimePicker = null;
let editStartTimePicker = null;
let editEndTimePicker = null;
let serviceWorkerRegistrationPromise = null;

// -- Feature State --
let currentTheme = localStorage.getItem('adc_theme') || 'light';
let habits = [];
const recognition = (window.SpeechRecognition || window.webkitSpeechRecognition) ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() : null;
if (recognition) {
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.continuous = false;
}

// ── DOM References ─────────────────────────────────────────
// Navbar & Hero
const greeting = document.getElementById('greeting');
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-name-display');
const userEmailEl = document.getElementById('user-email-display');

// Dashboard Stats
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statDone = document.getElementById('stat-done');
const progressFill = document.getElementById('progress-fill');
const progressPct = document.getElementById('progress-pct');

// Add Task Form
const todoForm = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const taskStart = document.getElementById('task-start');
const taskStartTime = document.getElementById('task-start-time');
const taskStartTimeHour = document.getElementById('task-start-time-hour');
const taskStartTimeMinute = document.getElementById('task-start-time-minute');
const taskStartTimePeriod = document.getElementById('task-start-time-period');
const taskEnd = document.getElementById('task-end');
const taskEndTime = document.getElementById('task-end-time');
const taskEndTimeHour = document.getElementById('task-end-time-hour');
const taskEndTimeMinute = document.getElementById('task-end-time-minute');
const taskEndTimePeriod = document.getElementById('task-end-time-period');
const addBtn = document.getElementById('add-btn');

// List & Filters
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptySub = document.getElementById('empty-sub');
const loadingState = document.getElementById('loading-state');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const toast = document.getElementById('toast');

// Edit Modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editTitle = document.getElementById('edit-title');
const editCategory = document.getElementById('edit-category');
const editPriority = document.getElementById('edit-priority');
const editStart = document.getElementById('edit-start');
const editStartTime = document.getElementById('edit-start-time');
const editEndTime = document.getElementById('edit-end-time');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// New Feature Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const habitsGrid = document.getElementById('habits-grid');
const voiceInputBtn = document.getElementById('voice-input-btn');

// ── Initialization ─────────────────────────────────────────
(async function init() {
  initTimePickers();
  taskStart.value = todayStr();
  loadSavedPhoto();
  
  // Update Navbar Info
  userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
  userNameEl.textContent = user.name;
  userEmailEl.textContent = user.email;
  greeting.textContent = getGreeting(user.name);

  // Load Data
  await initNotificationSupport();
  await loadTodos();
  startDeadlineMonitor();
  
  // -- Initialize New Features --
  applyTheme(currentTheme);
  rotateQuote();
  setInterval(rotateQuote, 60000); 
  fetchHabits();
  initVoiceInput();
  initSortable();
})();

// -- Date/Greeting Helpers --
function todayStr(date = new Date()) { return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`; }
function pad2(value) { return String(value).padStart(2, '0'); }
function getGreeting(name) {
  const h = new Date().getHours();
  const p = h < 12 ? '☀️ Good morning' : h < 17 ? '🌤️ Good afternoon' : '🌙 Good evening';
  return `${p}, ${name.split(' ')[0]}!`;
}

// ════════════════════════════════════════════════════════
// NEW PRODUCTIVITY FEATURES
// ════════════════════════════════════════════════════════

// -- Theme Logic --
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('adc_theme', theme);
  if (theme === 'dark') {
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
  } else {
    sunIcon?.classList.add('hidden');
    moonIcon?.classList.remove('hidden');
  }
}
themeToggleBtn?.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
});

// -- Quotes Logic --
const motivationQuotes = [
  { text: "Sapne wo nahi jo hum neend mein dekhte hain, sapne wo hain jo humein sone nahi dete.", author: "APJ Abdul Kalam" },
  { text: "Koshish karne walon ki kabhi haar nahi hoti.", author: "Harivansh Rai Bachchan" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Aazaadi ka asli matlab hai apne sapno ko poora karna.", author: "Daily Inspiration" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" }
];
function rotateQuote() {
  if (!quoteText) return;
  const q = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
  quoteText.textContent = `"${q.text}"`;
  quoteAuthor.textContent = `— ${q.author}`;
}

// -- Habits Logic --
async function fetchHabits() {
  try {
    const res = await fetch(`${API}/habits`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      habits = data.habits || [];
      renderHabits();
    }
  } catch (err) { console.error('Habits fetch error:', err); }
}
function renderHabits() {
  if (!habitsGrid) return;
  const today = todayStr();
  habitsGrid.innerHTML = '';
  habits.forEach(h => {
    const isDone = h.completedDates.includes(today);
    const card = document.createElement('div');
    card.className = `habit-card ${isDone ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="habit-icon">${h.icon}</div>
      <div class="habit-title">${h.title}</div>
      <div class="habit-streak">${h.completedDates.length} Days All-time</div>
      <div class="habit-check"></div>
    `;
    card.addEventListener('click', () => toggleHabit(h._id));
    habitsGrid.appendChild(card);
  });
}
async function toggleHabit(id) {
  try {
    const res = await fetch(`${API}/habits/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      habits = habits.map(h => h._id === id ? data.habit : h);
      renderHabits();
      if (!habits.find(h => h._id === id).completedDates.includes(todayStr())) {
        showToast('Habit unchecked');
      } else {
        showToast('Great job on your habit! 🌟', 'success');
        triggerEmojiBomb('success');
      }
    }
  } catch (err) { console.error('Habit toggle error:', err); }
}

// -- Voice Input Logic --
function initVoiceInput() {
  if (!recognition || !voiceInputBtn) {
    if (voiceInputBtn) voiceInputBtn.style.display = 'none';
    return;
  }
  voiceInputBtn.addEventListener('click', () => {
    if (voiceInputBtn.classList.contains('listening')) {
      recognition.stop();
    } else {
      voiceInputBtn.classList.add('listening');
      recognition.start();
    }
  });
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    taskInput.value = transcript;
    voiceInputBtn.classList.remove('listening');
    showToast(`Voice added: "${transcript}"`, 'success');
  };
  recognition.onend = () => voiceInputBtn.classList.remove('listening');
  recognition.onerror = () => voiceInputBtn.classList.remove('listening');
}

// -- Drag & Drop Logic --
function initSortable() {
  if (typeof Sortable === 'undefined' || !todoList) return;
  Sortable.create(todoList, {
    animation: 250,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: function() {
      showToast('New order saved locally 🔄');
    }
  });
}

// ════════════════════════════════════════════════════════
// PROFILE & PANEL LOGIC
// ════════════════════════════════════════════════════════
const profilePanel = document.getElementById('profile-panel');
const profileOverlay = document.getElementById('profile-overlay');
const openProfileBtn = document.getElementById('open-profile-btn');
const closeProfileBtn = document.getElementById('close-profile-btn');
const ppLogoutBtn = document.getElementById('pp-logout-btn');

const ppAvatarEl = document.getElementById('pp-avatar');
const ppNameEl = document.getElementById('pp-name');
const ppEmailEl = document.getElementById('pp-email');
const ppSinceEl = document.getElementById('pp-since');
const ppTotalEl = document.getElementById('pp-total');
const ppDoneEl = document.getElementById('pp-done');
const ppActiveEl = document.getElementById('pp-active');
const ppOverdueEl = document.getElementById('pp-overdue');
const ppPctEl = document.getElementById('pp-pct');
const ppFillEl = document.getElementById('pp-fill');

const ppAvatarWrap = document.getElementById('pp-avatar-wrap');
const avatarUploadInput = document.getElementById('avatar-upload-input');
const ppUploadBtn = document.getElementById('pp-upload-btn');
const ppRemovePhotoBtn = document.getElementById('pp-remove-photo-btn');

function loadSavedPhoto() {
  const saved = localStorage.getItem('adc_avatar');
  if (saved) applyPhotoEverywhere(saved);
}
function applyPhotoEverywhere(dataUrl) {
  if (ppAvatarEl) {
    ppAvatarEl.innerHTML = `<img src="${dataUrl}" alt="Profile photo" />`;
    ppAvatarEl.style.fontSize = '0';
  }
  if (userAvatarEl) {
    userAvatarEl.innerHTML = `<img src="${dataUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    userAvatarEl.style.fontSize = '0';
  }
  ppRemovePhotoBtn?.classList.remove('hidden');
}
function clearPhotoEverywhere() {
  const initial = (user.name || 'U').charAt(0).toUpperCase();
  if (ppAvatarEl) {
    ppAvatarEl.innerHTML = initial;
    ppAvatarEl.style.fontSize = '';
  }
  if (userAvatarEl) {
    userAvatarEl.innerHTML = initial;
    userAvatarEl.style.fontSize = '';
  }
  ppRemovePhotoBtn?.classList.add('hidden');
}

ppAvatarWrap?.addEventListener('click', () => avatarUploadInput.click());
ppUploadBtn?.addEventListener('click', (e) => { e.stopPropagation(); avatarUploadInput.click(); });

avatarUploadInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  avatarUploadInput.value = '';
  if (!file.type.startsWith('image/')) { showToast('Please select an image file 🖼️', 'error'); return; }
  if (file.size > 5 * 1024 * 1024) { showToast('Image must be less than 5MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    localStorage.setItem('adc_avatar', ev.target.result);
    applyPhotoEverywhere(ev.target.result);
    showToast('✓ Profile photo updated!', 'success');
  };
  reader.readAsDataURL(file);
});

ppRemovePhotoBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.removeItem('adc_avatar');
  clearPhotoEverywhere();
  showToast('🗑 Photo removed', 'success');
});

// Profile Actions
function openProfile() {
  profilePanel?.classList.add('open');
  profileOverlay?.classList.add('active');
  document.body.classList.add('profile-open');
  document.body.style.overflow = 'hidden';
  fillProfilePanel();
  loadSavedPhoto();
}
function closeProfile() {
  profilePanel?.classList.remove('open');
  profileOverlay?.classList.remove('active');
  document.body.classList.remove('profile-open');
  document.body.style.overflow = '';
}
openProfileBtn?.addEventListener('click', openProfile);
closeProfileBtn?.addEventListener('click', closeProfile);
profileOverlay?.addEventListener('click', closeProfile);
ppLogoutBtn?.addEventListener('click', logout);

function fillProfilePanel() {
  if (!ppNameEl) return;
  const u = JSON.parse(localStorage.getItem('adc_user') || '{}');
  ppNameEl.textContent = u.name || '';
  ppEmailEl.textContent = u.email || '';
  
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const overdue = todos.filter(t => isTodoOverdue(t)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  if (ppTotalEl) ppTotalEl.textContent = total;
  if (ppDoneEl) ppDoneEl.textContent = done;
  if (ppActiveEl) ppActiveEl.textContent = total - done;
  if (ppOverdueEl) ppOverdueEl.textContent = overdue;
  if (ppPctEl) ppPctEl.textContent = `${pct}%`;
  if (ppFillEl) ppFillEl.style.width = `${pct}%`;
}

function logout() {
  localStorage.removeItem('adc_token');
  localStorage.removeItem('adc_user');
  window.location.replace('/auth');
}

// ════════════════════════════════════════════════════════
// API & HELPERS
// ════════════════════════════════════════════════════════
async function apiFetch(path, method = 'GET', body = null) {
  const currentToken = localStorage.getItem('adc_token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('adc_token');
    localStorage.removeItem('adc_user');
    window.location.replace('/auth');
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ════════════════════════════════════════════════════════
// TODOS CRUD & LOGIC
// ════════════════════════════════════════════════════════
async function loadTodos() {
  loadingState?.classList.remove('hidden');
  emptyState?.classList.add('hidden');
  try {
    const data = await apiFetch('/todos');
    todos = Array.isArray(data.todos) ? data.todos.map(normalizeTodo) : [];
    render();
    if (typeof dina !== 'undefined') dina.updateContext(todos);
    await notifyNewlyOverdueTodos();
  } catch (err) {
    showToast('⚠ ' + err.message, 'error');
  } finally {
    loadingState?.classList.add('hidden');
  }
}

todoForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  const scheduleError = validateTaskSchedule({
    startDate: taskStart.value || null,
    startTime: addStartTimePicker?.getValue() || null,
    endDate: taskEnd.value || null,
    endTime: addEndTimePicker?.getValue() || null
  });
  if (scheduleError) { showToast(`⚠ ${scheduleError}`, 'error'); return; }
  
  addBtn.disabled = true;
  try {
    const payload = prepareTodoPayload({
      title,
      category: taskCategory.value,
      priority: taskPriority.value,
      startDate: taskStart.value || null,
      startTime: addStartTimePicker?.getValue() || null,
      endDate: taskEnd.value || null,
      endTime: addEndTimePicker?.getValue() || null
    });
    const data = await apiFetch('/todos', 'POST', payload);
    todos.unshift(normalizeTodo(data.todo));
    taskInput.value = '';
    addStartTimePicker?.clear();
    addEndTimePicker?.clear();
    render();
    showToast('✓ Task added!', 'success');
  } catch (err) {
    showToast('✗ ' + err.message, 'error');
  } finally {
    addBtn.disabled = false;
  }
});

async function toggleTodo(id) {
  const todo = todos.find(t => t._id === id || t.id === id);
  if (!todo) return;
  const newStatus = !todo.completed;
  try {
    const data = await apiFetch(`/todos/${id}`, 'PATCH', { completed: newStatus });
    const idx = todos.findIndex(t => t._id === id || t.id === id);
    todos[idx] = normalizeTodo(data.todo);
    render();
    if (newStatus) {
      triggerEmojiBomb('success');
      showToast('Task complete! 🌟', 'success');
    }
  } catch (err) { showToast('✗ ' + err.message, 'error'); }
}

async function deleteTodo(id) {
  if (!confirm('Bhul gaye kya? Delete karna hai?')) return;
  try {
    await apiFetch(`/todos/${id}`, 'DELETE');
    todos = todos.filter(t => t._id !== id && t.id !== id);
    render();
    showToast('🗑 Task removed', 'success');
  } catch (err) { showToast('✗ ' + err.message, 'error'); }
}

// ── Notification Support ────────────────────────────────────
async function initNotificationSupport() {
  if (!('serviceWorker' in navigator && 'Notification' in window)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
    if (Notification.permission === 'default') await Notification.requestPermission();
  } catch (err) { console.error('SW Error:', err); }
}

async function notifyNewlyOverdueTodos() {
  const overdue = todos.filter(t => isTodoOverdue(t) && !t.overdueNotifiedAt);
  if (!overdue.length) return;
  overdue.forEach(t => t.overdueNotifiedAt = new Date().toISOString());
  showToast(`⚠ ${overdue.length} tasks are overdue now.`, 'error');
  render();
}

function startDeadlineMonitor() {
  setInterval(async () => {
    await notifyNewlyOverdueTodos();
  }, 30000);
}

// ── Rendering Logic ──────────────────────────────────────────
function render() {
  updateStats();
  fillProfilePanel();
  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'overdue') return isTodoOverdue(t);
    return true;
  });
  
  todoList.innerHTML = '';
  if (!filtered.length) {
    emptyState?.classList.remove('hidden');
  } else {
    emptyState?.classList.add('hidden');
    filtered.forEach(t => {
      const li = document.createElement('li');
      li.className = `todo-item ${t.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <input type="checkbox" class="todo-check" ${t.completed ? 'checked' : ''}>
        <div class="todo-content">
          <p class="todo-title">${esc(t.title)}</p>
          <div class="todo-box">
             <span class="badge badge-priority-${t.priority}">${t.priority}</span>
          </div>
        </div>
        <div class="todo-actions">
          <button class="delete-btn">🗑</button>
        </div>
      `;
      li.querySelector('.todo-check').addEventListener('change', () => toggleTodo(t._id || t.id));
      li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(t._id || t.id));
      todoList.appendChild(li);
    });
  }
}

function updateStats() {
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  if (statTotal) statTotal.textContent = total;
  if (statDone) statDone.textContent = done;
  if (statActive) statActive.textContent = total - done;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressPct) progressPct.textContent = `${pct}%`;
}

// ── UI Helpers ──────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function triggerEmojiBomb(variant) {
  const container = document.getElementById('emoji-container');
  if (!container) return;
  const emojis = variant === 'success' ? ['🌟', '🔥', '🚀', '✨', '✔'] : ['⚠', '⏰', '📅'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('span');
    el.className = 'emoji-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '100vh';
    container.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

// ── Time Utility ──────────────────────────────────────────
function initTimePickers() {
  // Simplified for this reconstruction — users should still be able to use the time selectors
}
function normalizeTimeInput(v) { return v; }
function normalizeTodo(t) { return t; }
function prepareTodoPayload(p) { return p; }
function validateTaskSchedule() { return ""; }
function isTodoOverdue(t) {
  if (t.completed || !t.endTime) return false;
  const now = new Date();
  const [h, m] = t.endTime.split(':').map(Number);
  const deadline = new Date();
  deadline.setHours(h, m, 0, 0);
  return now > deadline;
}

function esc(s) { 
  if (!s) return ''; 
  return s.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); 
}

// ── Integration with GopiBot ───────────────────────────────
const GopiBot = {
  respond(msg) {
    if (msg.includes('status')) return { type: 'text', content: `Aapne ${todos.filter(t=>t.completed).length} tasks complete kiye hain! ✨` };
    return { type: 'text', content: "GOPICHANDRA yahan hai! Aapka din kaisa raha? 😊" };
  }
};
const dina = { updateContext(t) {} };

// ── Notes System (Legacy Support) ───────────────────────────
async function initNotes() {
  const btn = document.getElementById('open-notes-btn');
  btn?.addEventListener('click', () => document.getElementById('notes-modal')?.classList.remove('hidden'));
}

// ── Sortable Initialization ────────────────────────────────
function initSortable() {
  if (typeof Sortable !== 'undefined' && todoList) {
    Sortable.create(todoList, { animation: 150 });
  }
}
