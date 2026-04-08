/* ════════════════════════════════════════════════════════
   AapkaDINACHARYA — Main Application Logic v3
   - Rebranded from TaskFlow
   - Uses localStorage keys: adc_token, adc_user
   - Profile slide panel (left)
   - GOPICHANDRA AI Chatbot (bottom-right)
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

// ── DOM — Navbar & Hero ───────────────────────────────────
const greeting = document.getElementById('greeting');
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-name-display');
const userEmailEl = document.getElementById('user-email-display');
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statDone = document.getElementById('stat-done');
const progressFill = document.getElementById('progress-fill');
const progressPct = document.getElementById('progress-pct');

// ── DOM — Add Form ────────────────────────────────────────
const todoForm = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const taskStart = document.getElementById('task-start');
const taskStartTime = document.getElementById('task-start-time');
const taskEnd = document.getElementById('task-end');
const taskEndTime = document.getElementById('task-end-time');
const addBtn = document.getElementById('add-btn');

// ── DOM — Filters ─────────────────────────────────────────
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptySub = document.getElementById('empty-sub');
const loadingState = document.getElementById('loading-state');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const toast = document.getElementById('toast');

// ── DOM — Edit Modal ──────────────────────────────────────
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editTitle = document.getElementById('edit-title');
const editCategory = document.getElementById('edit-category');
const editPriority = document.getElementById('edit-priority');
const editStart = document.getElementById('edit-start');
const editStartTime = document.getElementById('edit-start-time');
const editEnd = document.getElementById('edit-end');
const editEndTime = document.getElementById('edit-end-time');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// Set user info in navbar
userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
userNameEl.textContent = user.name;
userEmailEl.textContent = user.email;
greeting.textContent = getGreeting(user.name);

function getGreeting(name) {
  const h = new Date().getHours();
  const p = h < 12 ? '☀️ Good morning' : h < 17 ? '🌤️ Good afternoon' : '🌙 Good evening';
  return `${p}, ${name.split(' ')[0]}!`;
}

// ════════════════════════════════════════════════════════
// PROFILE PANEL
// ════════════════════════════════════════════════════════
const profilePanel = document.getElementById('profile-panel');
const profileOverlay = document.getElementById('profile-overlay');
const openProfileBtn = document.getElementById('open-profile-btn');
const closeProfileBtn = document.getElementById('close-profile-btn');
const mobileProfileTrigger = document.getElementById('mobile-profile-trigger');
const ppLogoutBtn = document.getElementById('pp-logout-btn');

// Profile DOM fields
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

// Photo upload DOM
const ppAvatarWrap = document.getElementById('pp-avatar-wrap');
const avatarUploadInput = document.getElementById('avatar-upload-input');
const ppUploadBtn = document.getElementById('pp-upload-btn');
const ppRemovePhotoBtn = document.getElementById('pp-remove-photo-btn');

// ── Photo helpers ──────────────────────────────────────────
function loadSavedPhoto() {
  const saved = localStorage.getItem('adc_avatar');
  if (saved) applyPhotoEverywhere(saved);
}
function applyPhotoEverywhere(dataUrl) {
  // Profile panel avatar — show img tag inside
  ppAvatarEl.innerHTML = `<img src="${dataUrl}" alt="Profile photo" />`;
  ppAvatarEl.style.fontSize = '0';
  // Navbar avatar
  userAvatarEl.innerHTML = `<img src="${dataUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  userAvatarEl.style.fontSize = '0';
  // Show remove button
  ppRemovePhotoBtn.classList.remove('hidden');
}
function clearPhotoEverywhere() {
  const u = JSON.parse(localStorage.getItem('adc_user') || '{}');
  const initial = (u.name || 'U').charAt(0).toUpperCase();
  ppAvatarEl.innerHTML = initial;
  ppAvatarEl.style.fontSize = '';
  userAvatarEl.innerHTML = initial;
  userAvatarEl.style.fontSize = '';
  ppRemovePhotoBtn.classList.add('hidden');
}

// Avatar click → open file picker
ppAvatarWrap.addEventListener('click', () => avatarUploadInput.click());
ppUploadBtn.addEventListener('click', (e) => { e.stopPropagation(); avatarUploadInput.click(); });

avatarUploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  avatarUploadInput.value = '';
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file 🖼️', 'error'); return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be less than 5MB', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    localStorage.setItem('adc_avatar', dataUrl);
    applyPhotoEverywhere(dataUrl);
    showToast('✓ Profile photo updated!', 'success');
  };
  reader.readAsDataURL(file);
});

ppRemovePhotoBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.removeItem('adc_avatar');
  clearPhotoEverywhere();
  showToast('🗑 Photo removed', 'success');
});

// Edit profile
const editProfileForm = document.getElementById('edit-profile-form');
const ppNameInput = document.getElementById('pp-name-input');
const ppEmailDisplay = document.getElementById('pp-email-display');
const saveProfileBtn = document.getElementById('save-profile-btn');
const profileFeedback = document.getElementById('profile-feedback');

// Change password
const changePassForm = document.getElementById('change-password-form');
const ppCurrentPass = document.getElementById('pp-current-pass');
const ppNewPass = document.getElementById('pp-new-pass');
const ppConfirmPass = document.getElementById('pp-confirm-pass');
const changePassBtn = document.getElementById('change-pass-btn');
const passwordFeedback = document.getElementById('password-feedback');

function openProfile() {
  profilePanel.classList.add('open');
  profileOverlay.classList.add('active');
  document.body.classList.add('profile-open');
  document.body.style.overflow = 'hidden';
  fillProfilePanel();
  loadSavedPhoto();
}
function closeProfile() {
  profilePanel.classList.remove('open');
  profileOverlay.classList.remove('active');
  document.body.classList.remove('profile-open');
  document.body.style.overflow = '';
}

openProfileBtn.addEventListener('click', openProfile);
closeProfileBtn.addEventListener('click', closeProfile);
profileOverlay.addEventListener('click', closeProfile);
if (mobileProfileTrigger) mobileProfileTrigger.addEventListener('click', openProfile);
ppLogoutBtn.addEventListener('click', logout);

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProfile(); closeEdit(); } });

function fillProfilePanel() {
  const u = JSON.parse(localStorage.getItem('adc_user') || '{}');
  ppAvatarEl.textContent = (u.name || 'U').charAt(0).toUpperCase();
  ppNameEl.textContent = u.name || '';
  ppEmailEl.textContent = u.email || '';
  ppEmailDisplay.value = u.email || '';
  ppNameInput.value = u.name || '';

  const since = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  ppSinceEl.textContent = since ? `Member since ${since}` : '';

  const today = todayStr();
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const active = total - done;
  const overdue = todos.filter(t => !t.completed && t.endDate && t.endDate < today).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  ppTotalEl.textContent = total;
  ppDoneEl.textContent = done;
  ppActiveEl.textContent = active;
  ppOverdueEl.textContent = overdue;
  ppPctEl.textContent = `${pct}%`;
  ppFillEl.style.width = `${pct}%`;
}

// Save profile
editProfileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = ppNameInput.value.trim();
  if (!name || name.length < 2) {
    showPPFeedback(profileFeedback, 'Name must be at least 2 characters.', 'error');
    return;
  }
  setProfileBtnLoading(saveProfileBtn, true);
  try {
    const data = await apiFetch('/auth/profile', 'PATCH', { name });
    localStorage.setItem('adc_token', data.token);
    localStorage.setItem('adc_user', JSON.stringify(data.user));
    // Update navbar — preserve photo if any exists
    const savedPhoto = localStorage.getItem('adc_avatar');
    if (savedPhoto) {
      applyPhotoEverywhere(savedPhoto);
    } else {
      userAvatarEl.innerHTML = data.user.name.charAt(0).toUpperCase();
      userAvatarEl.style.fontSize = '';
    }
    userNameEl.textContent = data.user.name;
    greeting.textContent = getGreeting(data.user.name);
    fillProfilePanel();
    showPPFeedback(profileFeedback, '✓ Profile updated successfully!', 'success');
    showToast('✓ Profile updated!', 'success');
  } catch (err) {
    showPPFeedback(profileFeedback, err.message, 'error');
  } finally {
    setProfileBtnLoading(saveProfileBtn, false);
  }
});

// Change password
changePassForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const current = ppCurrentPass.value;
  const newPass = ppNewPass.value;
  const confirmP = ppConfirmPass.value;

  if (!current || !newPass || !confirmP) {
    showPPFeedback(passwordFeedback, 'All fields are required.', 'error');
    return;
  }
  if (newPass.length < 6) {
    showPPFeedback(passwordFeedback, 'New password must be at least 6 characters.', 'error');
    return;
  }
  if (newPass !== confirmP) {
    showPPFeedback(passwordFeedback, 'New passwords do not match.', 'error');
    return;
  }
  setProfileBtnLoading(changePassBtn, true);
  try {
    await apiFetch('/auth/change-password', 'POST', { currentPassword: current, newPassword: newPass });
    changePassForm.reset();
    showPPFeedback(passwordFeedback, '✓ Password changed successfully!', 'success');
    showToast('🔐 Password changed!', 'success');
  } catch (err) {
    showPPFeedback(passwordFeedback, err.message, 'error');
  } finally {
    setProfileBtnLoading(changePassBtn, false);
  }
});

function showPPFeedback(el, msg, type) {
  el.textContent = msg;
  el.className = `pp-feedback ${type}`;
  setTimeout(() => el.classList.add('hidden'), 4000);
}
function setProfileBtnLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.pp-btn-text').style.display = loading ? 'none' : '';
  btn.querySelector('.pp-btn-spinner').classList.toggle('hidden', !loading);
}

// ════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════
function logout() {
  localStorage.removeItem('adc_token');
  localStorage.removeItem('adc_user');
  window.location.replace('/auth');
}

// ════════════════════════════════════════════════════════
// API HELPER
// ════════════════════════════════════════════════════════
async function apiFetch(path, method = 'GET', body = null) {
  const currentToken = localStorage.getItem('adc_token');
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    }
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
// INIT
// ════════════════════════════════════════════════════════
(async function init() {
  taskStart.value = todayStr();
  loadSavedPhoto();
  await loadTodos();
})();

function todayStr() { return new Date().toISOString().split('T')[0]; }

// ════════════════════════════════════════════════════════
// TODOS CRUD
// ════════════════════════════════════════════════════════
async function loadTodos() {
  loadingState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  todoList.innerHTML = '';
  try {
    const data = await apiFetch('/todos');
    todos = data.todos;
    render();
    dina.updateContext(todos);
  } catch (err) {
    showToast('⚠ ' + err.message, 'error');
    emptyTitle.textContent = 'Could not load tasks';
    emptySub.textContent = 'Check that the backend is running.';
    emptyState.classList.remove('hidden');
  } finally {
    loadingState.classList.add('hidden');
  }
}

async function addNewTodo(title, options = {}) {
  const { category = 'General', priority = 'medium', startDate = todayStr(), endDate = null, startTime = null, endTime = null } = options;
  if (!title) return null;
  
  try {
    const data = await apiFetch('/todos', 'POST', {
      title, category, priority, startDate, endDate, startTime, endTime
    });
    todos.unshift(data.todo);
    render();
    if (typeof dina !== 'undefined' && dina.updateContext) dina.updateContext(todos);
    return data.todo;
  } catch (err) {
    showToast('✗ ' + err.message, 'error');
    return null;
  }
}

todoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  if (taskStart.value && taskEnd.value && taskEnd.value < taskStart.value) {
    showToast('⚠ Due date must be after start date', 'error'); return;
  }
  addBtn.disabled = true;
  const todo = await addNewTodo(title, {
    category: taskCategory.value,
    priority: taskPriority.value,
    startDate: taskStart.value || null,
    startTime: taskStartTime.value || null,
    endDate: taskEnd.value || null,
    endTime: taskEndTime.value || null
  });
  if (todo) {
    taskInput.value = '';
    taskStart.value = todayStr();
    taskStartTime.value = '';
    taskEnd.value = '';
    taskEndTime.value = '';
    taskInput.focus();
    showToast('✓ Task added!', 'success');
  }
  addBtn.disabled = false;
});

async function toggleTodo(id) {
  const todo = todos.find(t => (t.id === id || t._id === id));
  if (!todo) return;
  const newStatus = !todo.completed;
  
  try {
    const data = await apiFetch(`/todos/${id}`, 'PATCH', { completed: newStatus });
    const idx = todos.findIndex(t => (t.id === id || t._id === id));
    todos[idx] = data.todo;
    render();
    dina.updateContext(todos);

    // Feedback on completion
    if (newStatus === true) {
      const onTime = isTaskOnTime(data.todo);
      if (onTime) {
        triggerEmojiBomb('success');
        showToast('Shaandaar! On time khatam kiya! 🚀', 'success');
      } else {
        triggerEmojiBomb('fail');
        showToast('Koi baat nahi, agli baar time pe try karna! 💪', 'warning');
      }
    }
  } catch (err) { showToast('✗ ' + err.message, 'error'); }
}

async function deleteTodo(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) { // Try _id fallback for selectors
    const el2 = document.querySelector(`.todo-item[data-id]`); // Generic check
    // If we're here, we probably need a better way to find the element
  }
  if (el) el.classList.add('removing');
  await delay(240);
  try {
    await apiFetch(`/todos/${id}`, 'DELETE');
    todos = todos.filter(t => (t.id !== id && t._id !== id));
    render();
    dina.updateContext(todos);
    showToast('🗑 Task deleted', 'success');
  } catch (err) { showToast('✗ ' + err.message, 'error'); render(); }
}

clearCompletedBtn.addEventListener('click', async () => {
  const count = todos.filter(t => t.completed).length;
  if (!count) { showToast('No completed tasks to clear', 'error'); return; }
  try {
    await apiFetch('/todos', 'DELETE');
    todos = todos.filter(t => !t.completed);
    render();
    dina.updateContext(todos);
    showToast(`🗑 Cleared ${count} task${count > 1 ? 's' : ''}`, 'success');
  } catch (err) { showToast('✗ ' + err.message, 'error'); }
});

// ── Edit Modal ─────────────────────────────────────────────
function openEdit(id) {
  const t = todos.find(x => (x.id === id || x._id === id));
  if (!t) return;
  editIdInput.value = id;
  editTitle.value = t.title;
  editCategory.value = t.category;
  editPriority.value = t.priority;
  editStart.value = t.startDate || '';
  editStartTime.value = t.startTime || '';
  editEnd.value = t.endDate || '';
  editEndTime.value = t.endTime || '';
  editModal.classList.remove('hidden');
  editTitle.focus();
}
function closeEdit() { editModal.classList.add('hidden'); }
cancelEditBtn.addEventListener('click', closeEdit);
closeModalBtn.addEventListener('click', closeEdit);
editModal.addEventListener('click', e => { if (e.target === editModal) closeEdit(); });

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = editIdInput.value;
  if (!editTitle.value.trim()) return;
  if (editStart.value && editEnd.value && editEnd.value < editStart.value) {
    showToast('⚠ Due date must be after start date', 'error'); return;
  }
  try {
    const data = await apiFetch(`/todos/${id}`, 'PATCH', {
      title: editTitle.value.trim(), category: editCategory.value,
      priority: editPriority.value, startDate: editStart.value || null,
      startTime: editStartTime.value || null,
      endDate: editEnd.value || null,
      endTime: editEndTime.value || null
    });
    const idx = todos.findIndex(t => (t.id === id || t._id === id));
    todos[idx] = data.todo;
    closeEdit();
    render();
    dina.updateContext(todos);
    showToast('✓ Task updated!', 'success');
  } catch (err) { showToast('✗ ' + err.message, 'error'); }
});

// ── Filter & Sort ─────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});
sortSelect.addEventListener('change', () => { sort = sortSelect.value; render(); });

// ── Render ────────────────────────────────────────────────
function render() {
  updateStats();
  fillProfilePanel();
  const list = getSorted(getFiltered());
  todoList.innerHTML = '';
  if (!list.length) {
    emptyState.classList.remove('hidden');
    setEmptyState();
  } else {
    emptyState.classList.add('hidden');
    list.forEach(t => todoList.appendChild(buildTodoEl(t)));
  }
}

function getFiltered() {
  const today = todayStr();
  switch (filter) {
    case 'active': return todos.filter(t => !t.completed);
    case 'completed': return todos.filter(t => t.completed);
    case 'overdue': return todos.filter(t => !t.completed && t.endDate && t.endDate < today);
    default: return [...todos];
  }
}
function getSorted(list) {
  const copy = [...list];
  const pri = { high: 0, medium: 1, low: 2 };
  switch (sort) {
    case 'oldest': return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'priority': return copy.sort((a, b) => pri[a.priority] - pri[b.priority]);
    case 'duedate': return copy.sort((a, b) => {
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1; if (!b.endDate) return -1;
      return a.endDate.localeCompare(b.endDate);
    });
    default: return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}
function setEmptyState() {
  const msgs = {
    all: ['Koi kaam nahi hai 🎯', 'Upar se apna pehla task add karo!'],
    active: ['Sab kaam ho gaya! 🎉', 'Aapne sab tasks complete kar liye — great work!'],
    completed: ['Koi completed task nahi', 'Kisi task ko complete karo.'],
    overdue: ['Koi overdue task nahi ✅', 'Sab deadlines pe hain — bahut badhiya!']
  };
  const [t, s] = msgs[filter] || msgs.all;
  emptyTitle.textContent = t;
  emptySub.textContent = s;
}

function buildTodoEl(todo) {
  const li = document.createElement('li');
  const actualId = todo.id || todo._id;
  li.className = `todo-item${todo.completed ? ' completed' : ''}`;
  li.dataset.id = actualId;
  li.dataset.priority = todo.priority;
  li.innerHTML = `
    <input type="checkbox" class="todo-check" id="chk-${actualId}"
      aria-label="Mark '${esc(todo.title)}' as ${todo.completed ? 'incomplete' : 'complete'}"
      ${todo.completed ? 'checked' : ''} />
    <div class="todo-content">
      <p class="todo-title">${esc(todo.title)}</p>
      <div class="todo-badges">
        <span class="badge badge-cat">${esc(todo.category)}</span>
        <span class="badge badge-priority-${todo.priority}">${cap(todo.priority)}</span>
        ${buildDueBadge(todo)}
      </div>
      <p class="todo-created">Added ${fmtDate(todo.createdAt)}</p>
    </div>
    <div class="todo-actions">
      <button class="icon-btn edit"   aria-label="Edit task"   title="Edit"   type="button">${svgEdit()}</button>
      <button class="icon-btn delete" aria-label="Delete task" title="Delete" type="button">${svgTrash()}</button>
    </div>`;
  li.querySelector('.todo-check').addEventListener('change', () => toggleTodo(actualId));
  li.querySelector('.icon-btn.edit').addEventListener('click', () => openEdit(actualId));
  li.querySelector('.icon-btn.delete').addEventListener('click', () => deleteTodo(actualId));
  return li;
}

function buildDueBadge(todo) {
  if (!todo.endDate && !todo.startTime && !todo.endTime) return '';
  const today = todayStr();
  const start = todo.startDate ? fmtShort(todo.startDate) : null;
  const end = todo.endDate ? fmtShort(todo.endDate) : null;
  
  let range = '';
  if (start && end) range = `${start} → ${end}`;
  else if (end) range = `Due ${end}`;
  else if (start) range = `Start ${start}`;

  let timeRange = '';
  if (todo.startTime || todo.endTime) {
    timeRange = `${todo.startTime || ''}${todo.endTime ? ' - ' + todo.endTime : ''}`;
  }

  let fullDisplay = range;
  if (timeRange) {
    fullDisplay = range ? `${range} (${timeRange})` : `🕙 ${timeRange}`;
  }

  if (!fullDisplay) return '';

  let cls;
  if (todo.completed) cls = 'done';
  else if (todo.endDate && todo.endDate < today) cls = 'overdue';
  else if (todo.endDate) { const d = dateDiff(today, todo.endDate); cls = d <= 3 ? 'due-soon' : 'upcoming'; }
  else cls = 'upcoming';

  const icon = { done: '✓', overdue: '⚠', 'due-soon': '⏰', upcoming: '📅' }[cls] || '📅';
  return `<span class="badge-due ${cls}">${icon} ${fullDisplay}</span>`;
}

function updateStats() {
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  statTotal.textContent = total;
  statActive.textContent = total - done;
  statDone.textContent = done;
  progressFill.style.width = `${pct}%`;
  progressPct.textContent = `${pct}%`;
}

// ── Toast ─────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function createEmojiParticleSystem(emojis, variant = 'success') {
  const container = document.getElementById('emoji-container');
  if (!container || !Array.isArray(emojis) || !emojis.length) return;

  const particleCount = 28;
  const originX = window.innerWidth / 2;
  const originY = Math.max(120, window.innerHeight * 0.28);

  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement('span');
    const angle = ((Math.PI * 2) / particleCount) * i + ((Math.random() - 0.5) * 0.35);
    const midDistance = 60 + Math.random() * 50;
    const endDistance = 140 + Math.random() * 170;
    const lift = 50 + Math.random() * 140;

    particle.className = `emoji-particle ${variant}`;
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.fontSize = `${1.4 + Math.random() * 1.2}rem`;
    particle.style.setProperty('--dx', `${Math.cos(angle) * midDistance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * midDistance - 25}px`);
    particle.style.setProperty('--dx2', `${Math.cos(angle) * endDistance}px`);
    particle.style.setProperty('--dy2', `${Math.sin(angle) * endDistance - lift}px`);
    particle.style.setProperty('--dr', `${-120 + Math.random() * 240}deg`);
    particle.style.setProperty('--dr2', `${-260 + Math.random() * 520}deg`);
    particle.style.animationDelay = `${Math.random() * 80}ms`;

    container.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
  }
}

// ── Utility ───────────────────────────────────────────────
function esc(s) { if (!s) return ''; return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtShort(str) {
  const [, m, d] = str.split('-');
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1]} ${+d}`;
}

function dateDiff(from, to) { return Math.round((new Date(to) - new Date(from)) / 86400000); }

function isTaskOnTime(todo) {
  if (!todo.endDate) return true;
  const now = new Date();
  const today = todayStr();
  if (today < todo.endDate) return true;
  if (today > todo.endDate) return false;
  if (!todo.endTime) return true;
  const [h, m] = todo.endTime.split(':');
  const deadline = new Date();
  deadline.setHours(parseInt(h), parseInt(m), 59, 999);
  return now <= deadline;
}

function svgEdit() { return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`; }
function svgTrash() { return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`; }

// ════════════════════════════════════════════════════════
// GOPICHANDRA — AI CHATBOT (Enhanced)
// ════════════════════════════════════════════════════════
const GopiBot = {
  _todos: [],
  updateContext(newTodos) { this._todos = newTodos; },

  _knowledge: {
    project: {
      name: "AapkaDINACHARYA",
      founder: "Aditya Maurya",
      location: "Saraipitha, India 🇮🇳",
      contact: "adityamaurya316@gmail.com",
      tech: "Node.js, Express, MongoDB Atlas, JWT, bcrypt",
    },
    routines: {
      morning: [
        "Subah 5-6 AM uthne ki koshish karein. ☀️",
        "Thoda garam pani piyein aur 10 min Meditation karein. 🧘",
        "AapkaDINACHARYA mein High Priority tasks set karein.",
        "Light exercise se din shuru karein! ⚡"
      ],
      focus: [
        "**Pomodoro**: 25 min work, 5 min break. ⏱️",
        "Mobile notifications off rakhein. 📵",
        "Ek baar mein ek hi task karein. 🎯"
      ],
      health: [
        "Pani pite rahein (8-10 glass). 💧",
        "**20-20-20 Rule**: Har 20 min baad door dekhein. 👀",
        "Healthy diet lein! 🥗"
      ],
      evening: [
        "Sone se 1 ghanta pehle screens off.",
        "Kal ke 3 main kaam plan karke soein.",
        "Gratitude journaling karein!"
      ],
      productivity: [
        "Eisenhower Matrix use karo: urgent vs important.",
        "Single-tasking karo: multitasking productivity kam karti hai.",
        "2-minute rule: jo kaam 2 min mein ho jaye, turant karo.",
        "Deep work block: 60-90 min distraction-free session."
      ],
      appHelp: [
        "Task add: Add New Task form se title + due date set karo.",
        "Task edit: kisi task ke edit icon par click karo.",
        "Task complete: checkbox tick karo.",
        "Notes: NOTE button se notes modal open karo.",
        "Profile settings: top-right user card ya mobile left-side 360 icon se profile panel open hota hai."
      ]
    }
  },

  respond(message) {
    const msg = message.toLowerCase().trim();
    const u = JSON.parse(localStorage.getItem('adc_user') || '{}');
    const name = (u.name || 'dost').split(' ')[0];

    // Detect Task Addition (Integrated)
    const taskAdd = this._taskAddHandler(msg);
    if (taskAdd) return taskAdd;

    // Greetings
    if (/^(hi|hello|hey|namaste|hola|good\s*(morning|afternoon|evening)|namaskar)/.test(msg)) {
      const h = new Date().getHours();
      const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
      return { type: 'text', content: `Namaste, ${name}! 🙏 Good ${time}!\n\nMain **GOPICHANDRA** hoon — AapkaDINACHARYA AI helper. Bataiye aaj kya plan hai? 😊` };
    }

    // About Project / Founder
    if (/(who (built|made|created)|founder|owner|banaya|developer)/.test(msg)) {
      return { type: 'text', content: `AapkaDINACHARYA ko **${this._knowledge.project.founder}** ne banaya hai! 🇮🇳\n\nHum Bharat ke liye productivity simple bana rahe hain! 🚀` };
    }
    if (/(location|address|pata|where)/.test(msg)) {
      return { type: 'text', content: `Humara base **${this._knowledge.project.location}** mein hai. 🏠✨` };
    }
    if (/(contact|support|email|puchna|phone)/.test(msg)) {
      return { type: 'text', content: `Aap humein **${this._knowledge.project.contact}** pe email kar sakte hain! 📧` };
    }
    if (/(tech|stack|security|safe|data)/.test(msg)) {
      return { type: 'text', content: `Aapka data safe hai! Hum **JWT** aur **bcrypt** use karte hain. Stack: **${this._knowledge.project.tech}**. ⚡` };
    }

    // Features
    if (/(what can you do|help me|features|kya kar sakte ho)/.test(msg)) {
      return { type: 'text', content: `Main ye kar sakta hoon: 🤖\n• 📊 Progress report\n• ⚠️ Overdue alerts\n• 📅 Daily Routines\n• 🧘 Health & Study Tips\n• 💡 Focus techniques\n\nDirectly puchiye: "Mera status kya hai?" ya "Morning routine batao"` };
    }

    // Routines
    if (/(morning|subah|early|wakeup)/.test(msg)) {
      return { type: 'text', content: `**Subah ki shuruat:** ☀️\n${this._knowledge.routines.morning.map(s=>"• "+s).join('\n')}` };
    }
    if (/(focus|distract|attention|concentrate)/.test(msg)) {
      return { type: 'text', content: `**Focus Tips:** 🎯\n${this._knowledge.routines.focus.map(s=>"• "+s).join('\n')}` };
    }
    if (/(health|fit|paani|water|tired|diet)/.test(msg)) {
      return { type: 'text', content: `**Health Advice:** 🥗\n${this._knowledge.routines.health.map(s=>"• "+s).join('\n')}` };
    }
    if (/(evening|raat|night|neend)/.test(msg)) {
      return { type: 'text', content: `**Raat ka routine:**\n${this._knowledge.routines.evening.map(s=>`• ${s}`).join('\n')}` };
    }
    if (/(pomodoro|deep work|procrastinat|time block|discipline|consistency)/.test(msg)) {
      return { type: 'text', content: `**Productivity Playbook:**\n${this._knowledge.routines.productivity.map(s=>`• ${s}`).join('\n')}` };
    }

    // App walkthrough and support intents
    if (/(how to use|how do i use|app kaise use|guide|tutorial|help menu)/.test(msg)) {
      return { type: 'text', content: `**App Quick Guide:**\n${this._knowledge.routines.appHelp.map(s=>`• ${s}`).join('\n')}` };
    }
    if (/(add task|new task|task kaise add|create task)/.test(msg)) {
      return { type: 'text', content: 'Task add karne ke liye Add New Task section mein title likho, category/priority choose karo, due date set karo, phir Add Task button dabao.' };
    }
    if (/(edit task|update task|task kaise edit)/.test(msg)) {
      return { type: 'text', content: 'Task card ke right side edit icon par click karo. Modal khulega, details change karo aur Save Changes karo.' };
    }
    if (/(delete task|remove task|task kaise delete)/.test(msg)) {
      return { type: 'text', content: 'Task card ke delete icon se task remove hota hai. Completed tasks bulk delete ke liye Clear Done use karo.' };
    }
    if (/(notes|note kaise|open notes|rich text)/.test(msg)) {
      return { type: 'text', content: 'Filter bar mein NOTE button se notes modal khulta hai. Wahan formatting, save aur delete sab available hai.' };
    }
    if (/(profile|change name|change password|avatar|photo|sidebar|slide bar|360)/.test(msg)) {
      return { type: 'text', content: 'Top-right user card se profile panel open karo. Mobile par left-side 360 icon se bhi panel open hota hai. Wahan name update, password change, photo upload/remove aur progress stats milenge.' };
    }

    // Plan builders
    if (/(plan my day|daily plan|aaj ka plan bana|schedule bana)/.test(msg)) {
      const today = todayStr();
      const dueToday = this._todos.filter(x => !x.completed && x.endDate === today);
      const high = this._todos.filter(x => !x.completed && x.priority === 'high').slice(0, 3);
      const plan = [
        'Top 1 high-priority task se start karo.',
        '2 Pomodoro blocks (25-5) deep focus mein lagao.',
        'Lunch se pehle ek medium task complete karo.',
        'Shaam ko overdue check karke wrap-up karo.'
      ];
      const dueLine = dueToday.length ? `\n\nAaj due tasks:\n${dueToday.slice(0, 4).map(t => `• ${t.title}`).join('\n')}` : '';
      const highLine = high.length ? `\n\nHigh-priority picks:\n${high.map(t => `• ${t.title}`).join('\n')}` : '';
      return { type: 'text', content: `**Daily Action Plan:**\n${plan.map(s => `• ${s}`).join('\n')}${dueLine}${highLine}` };
    }

    // Time/Date utility
    if (/(time kya hai|what time|current time|date kya hai|today date|aaj ki date|day today)/.test(msg)) {
      const now = new Date();
      const dateText = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeText = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      return { type: 'text', content: `Abhi ${timeText} hai aur aaj ${dateText} hai.` };
    }

    // Learning / Career intents
    if (/(study|exam|revision|padhai|test prep)/.test(msg)) {
      return { type: 'text', content: '**Study Sprint Strategy:**\n• 50 min study + 10 min break\n• Active recall + short notes\n• Raat ko 20 min revision\n• Kal ke liye 3 target topics likho' };
    }
    if (/(interview|coding|dsa|resume|career)/.test(msg)) {
      return { type: 'text', content: '**Career Boost Plan:**\n• Roz 1 coding problem solve karo\n• Week mein 2 mock interview sessions\n• Resume ko impact bullets mein update karo\n• LinkedIn/GitHub par weekly progress share karo' };
    }
    if (/(weekly plan|plan my week|week schedule|saptah plan)/.test(msg)) {
      return { type: 'text', content: '**Weekly Plan:**\n• Monday: planning + toughest task\n• Tue-Thu: deep work blocks + task execution\n• Friday: review, cleanup, and pending closure\n• Saturday: learning/project build\n• Sunday: rest and next-week setup' };
    }
    if (/(budget|save money|expense|kharcha|finance)/.test(msg)) {
      return { type: 'text', content: '**Money Discipline Starter:**\n• 50/30/20 rule se monthly split start karo\n• Har expense 14 din track karo\n• Salary day par auto-savings set karo\n• Subscriptions monthly audit karo' };
    }
    if (/(email|mail draft|professional message|application)/.test(msg)) {
      return { type: 'text', content: '**Professional Message Template:**\n• Subject: clear outcome\n• Context: 1-2 lines\n• Ask: exact action required\n• Deadline: concrete date/time\n• Close: thanks + signature' };
    }
    if (/(sleep better|insomnia|sleep issue|neend nahi)/.test(msg)) {
      return { type: 'text', content: '**Better Sleep Plan:**\n• Same sleep/wake timing daily\n• 45 min before bed screen off\n• Evening caffeine avoid karo\n• Next-day task list likhkar mind unload karo' };
    }

    // Wellness and mindset intents
    if (/(stress|anxiety|overwhelm|burnout|panic)/.test(msg)) {
      return { type: 'text', content: 'Pehle slow breathing try karo: 4 sec inhale, 4 hold, 6 exhale, 5 rounds. Phir bas next one small task choose karo. Agar stress zyada ho to trusted person se baat zaroor karo.' };
    }
    if (/(quote|affirmation|confidence|self doubt)/.test(msg)) {
      const lines = [
        'Progress > perfection. Roz ka ek step hi game jeetata hai.',
        'Clarity action se aati hai, overthinking se nahi.',
        'Tum consistency pe focus rakho, results follow karenge.'
      ];
      return { type: 'text', content: lines[Math.floor(Math.random() * lines.length)] };
    }

    // Lightweight unit conversion
    const kmMatch = msg.match(/(\d+(?:\.\d+)?)\s*km\s*(?:to|in)\s*miles?/);
    if (kmMatch) {
      const km = parseFloat(kmMatch[1]);
      return { type: 'text', content: `${km} km is about ${(km * 0.621371).toFixed(2)} miles.` };
    }
    const cMatch = msg.match(/(\d+(?:\.\d+)?)\s*(?:c|celsius)\s*(?:to|in)\s*(?:f|fahrenheit)/);
    if (cMatch) {
      const c = parseFloat(cMatch[1]);
      return { type: 'text', content: `${c}C is ${((c * 9) / 5 + 32).toFixed(1)}F.` };
    }
    const kgMatch = msg.match(/(\d+(?:\.\d+)?)\s*kg\s*(?:to|in)\s*(?:lb|lbs|pounds?)/);
    if (kgMatch) {
      const kg = parseFloat(kgMatch[1]);
      return { type: 'text', content: `${kg} kg is ${(kg * 2.20462).toFixed(2)} lb.` };
    }

    if (/(weather|news|stock price|bitcoin|live score)/.test(msg)) {
      return { type: 'text', content: 'Main live internet data direct fetch nahi karta. Lekin aap topic batao, main context samjhaakar best action plan de sakta hoon.' };
    }

    // Tasks Integration
    if (/(how many|total|count|summary|kitne|mera kya|status|progress)/.test(msg)) return { type: 'text', content: this._taskSummary(name) };
    if (/(overdue|late|missed|time nikal)/.test(msg)) return { type: 'text', content: this._overdueInfo(name) };
    if (/(today|aaj|due today)/.test(msg)) return { type: 'text', content: this._todayInfo(name) };
    if (/(completed|done|finished|kitna hua)/.test(msg)) return { type: 'text', content: this._completedInfo(name) };
    if (/(upcoming|soon|next|kal)/.test(msg)) return { type: 'text', content: this._upcomingInfo(name) };
    if (/(high priority|urgent|important|zaruri)/.test(msg)) return { type: 'text', content: this._highPriorityInfo(name) };

    // Motivation
    if (/(motivat|inspire|demotivat|stuck|energy|stressed|bore|man nahi)/.test(msg)) {
      const q = [
        "💪 **Aasaan hai!** - Sandeep Maheshwari ka mantra yaad rakho. Ek task se shuru karo!",
        "🔥 Maidaan mat chhodo! Harshvardhan Jain kehte hain energy hi sab kuch hai. Go for it!",
        "🚀 Har bada sapna ek chote step se shuru hota hai. Aaj ka High Priority task khatam karo!"
      ];
      return { type: 'text', content: q[Math.floor(Math.random() * q.length)] };
    }

    // Math
    const mathMatch = msg.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    if (mathMatch) {
      const a = parseInt(mathMatch[1]), op = mathMatch[2], b = parseInt(mathMatch[3]);
      let res = op==='+'?a+b : op==='-'?a-b : op==='*'?a*b : b!==0?(a/b).toFixed(2):"Infinity";
      return { type: 'text', content: `➕ **Math Result:**\n**${a} ${op} ${b} = ${res}**. 🤓` };
    }

    // Small Talk
    if (/(kaise ho|how (are|r) (u|you))/.test(msg)) return { type: 'text', content: `Main mast hoon! 😎 Aap batao ${name}, aaj kitne tasks khatam karne hain?` };
    if (/(thank|thanks|shukriya|dhanyawad|wow|great)/.test(msg)) return { type: 'text', content: `Bahut shukriya! 😊💜 Mujhe help karke khushi hui.` };
    if (/(bye|goodbye|alvida|tata)/.test(msg)) return { type: 'text', content: `Alvida, ${name}! 👋 Apne goals pe focus karo! 🎯` };

    // Fallback
    return { type: 'text', content: `Mujhe aur context do, main help kar dunga.\nTry: "Plan my day", "How to use notes", "Study strategy", "Career plan", "2.5 km to miles", "What time is it?"` };
  },

  _taskAddHandler(m) {
    const trRegex = /(?:from\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+(?:to|till|-)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
    const stRegex = /(?:at|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
    let st = null, et = null;
    let match = m.match(trRegex);
    if (match) { st = match[1].trim(); et = match[2].trim(); m = m.replace(trRegex, ''); }
    else { match = m.match(stRegex); if (match) { et = match[1].trim(); m = m.replace(stRegex, ''); } }

    const eng = m.match(/add\s+(.+?)\s+to\s+(?:my\s+)?list/i);
    if (eng) return { type: 'task', title: eng[1].trim(), startTime:st, endTime:et };
    const direct = m.match(/add\s+task\s+(.+)/i);
    if (direct) return { type: 'task', title: direct[1].trim(), startTime:st, endTime:et };
    const remind = m.match(/(?:remind me to|remember to)\s+(.+)/i);
    if (remind) return { type: 'task', title: remind[1].trim(), startTime:st, endTime:et };
    const hin = m.match(/(.+?)\s+(?:add\s+)?(?:kar\s+do|kar\s+lo|daal\s+do)/i);
    if (hin && hin[1].length > 2) return { type: 'task', title: hin[1].trim(), startTime:st, endTime:et };
    return null;
  },

  _taskSummary(name) {
    const t = this._todos.length;
    const d = this._todos.filter(x => x.completed).length;
    const o = this._todos.filter(x => !x.completed && x.endDate && x.endDate < todayStr()).length;
    const p = t === 0 ? 0 : Math.round((d / t) * 100);
    if (t === 0) return `${name}, abhi koi task nahi hai! ✨ Naya task add karke start karo.`;
    return `📊 **Status Report:**\nTotal: **${t}** | Done: **${d}** | Pending: **${t-d}**\n⚠️ Overdue: **${o}**\n📈 Progress: **${p}%**\n\n${p>=75?'Mast kaam kar rahe ho!':'Lage raho dost!'} 🚀`;
  },

  _overdueInfo(name) {
    const ov = this._todos.filter(x => !x.completed && x.endDate && x.endDate < todayStr());
    if (ov.length === 0) return `${name}, koi overdue task nahi hai! ✅ Good job!`;
    const list = ov.slice(0, 3).map(x => "• " + x.title).join('\n');
    return `⚠️ **Overdue Alert!**\n${ov.length} tasks late hain:\n${list}\n\nInhe pehle finish karo! 🔥`;
  },

  _todayInfo(name) {
    const today = todayStr();
    const due = this._todos.filter(x => !x.completed && x.endDate === today);
    if (due.length === 0) return `${name}, aaj koi deadline nahi hai. Relax! 😊`;
    return `📅 **Aaj ka target:**\n${due.map(x => "• " + x.title).join('\n')}\n\nFocus karo! 🎯`;
  },

  _completedInfo(name) {
    const d = this._todos.filter(x => x.completed).length;
    if (d === 0) return `${name}, abhi tak koi win nahi dikh rahi! Start small. 😅`;
    return `🎉 **Celebration!** Aapne **${d} tasks** finish kiye hain. Habit bante ja rahi hai! 🏆`;
  },

  _upcomingInfo(name) {
    const today = todayStr();
    const up = this._todos.filter(x => !x.completed && x.endDate && x.endDate >= today)
      .sort((a,b) => a.endDate.localeCompare(b.endDate)).slice(0, 3);
    if (up.length === 0) return `Aage ki list khali hai. 📅`;
    return `📅 **Upcoming:**\n${up.map(x => "• " + x.title).join('\n')}\n\nTayyari rakho! 🚀`;
  },

  _highPriorityInfo(name) {
    const h = this._todos.filter(x => !x.completed && x.priority === 'high');
    if (h.length === 0) return `Koi High Priority pending nahi hai. Ease out! 😎`;
    return `🔴 **Urgent:**\n${h.map(x => "• " + x.title).join('\n')}\n\nInhe pehle niptao! ⚡`;
  }
};


// ── Chatbot UI ─────────────────────────────────────────────
const chatbotFab = document.getElementById('chatbot-fab');
const chatbotWindow = document.getElementById('chatbot-window');
const closeChatBtn = document.getElementById('close-chatbot-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const cwMessages = document.getElementById('cw-messages');
const cwInput = document.getElementById('cw-input');
const cwSendBtn = document.getElementById('cw-send-btn');
const cwQuickBtns = document.getElementById('cw-quick-btns');
const chatUnread = document.getElementById('chatbot-unread');
const fabIconChat = chatbotFab.querySelector('.fab-icon-chat');
const fabIconClose = chatbotFab.querySelector('.fab-icon-close');

let chatOpen = false;
let hasWelcomed = false;

function openChat() {
  chatOpen = true;
  chatbotWindow.classList.add('open');
  chatbotFab.classList.add('open');
  fabIconChat.classList.add('hidden');
  fabIconClose.classList.remove('hidden');
  chatUnread.classList.add('hidden');
  if (!hasWelcomed) {
    hasWelcomed = true;
    // For the initial greeting, we call the backend directly
    sendMessage('Namaste GOPICHANDRA! I just opened the chat.');
  }
  setTimeout(() => cwInput.focus(), 350);
}
function closeChat() {
  chatOpen = false;
  chatbotWindow.classList.remove('open');
  chatbotFab.classList.remove('open');
  fabIconChat.classList.remove('hidden');
  fabIconClose.classList.add('hidden');
}

chatbotFab.addEventListener('click', () => chatOpen ? closeChat() : openChat());
closeChatBtn.addEventListener('click', closeChat);
clearChatBtn.addEventListener('click', () => { cwMessages.innerHTML = ''; });

function addUserMsg(text) {
  const u = JSON.parse(localStorage.getItem('adc_user') || '{}');
  const initials = (u.name || 'U').charAt(0).toUpperCase();
  const div = document.createElement('div');
  div.className = 'cw-msg user';
  div.innerHTML = `
    <div class="cw-avatar">${initials}</div>
    <div class="cw-bubble">${esc(text)}</div>`;
  cwMessages.appendChild(div);
  scrollChat();
}

function addBotMsg(text) {
  const div = document.createElement('div');
  div.className = 'cw-msg bot';
  div.innerHTML = `
    <div class="cw-avatar">🤖</div>
    <div class="cw-bubble">${markdownToHtml(text)}</div>`;
  cwMessages.appendChild(div);
  scrollChat();
}

function addTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'cw-msg bot';
  div.id = 'typing-indicator';
  div.innerHTML = `<div class="cw-avatar">🤖</div><div class="cw-bubble"><div class="cw-typing"><span></span><span></span><span></span></div></div>`;
  cwMessages.appendChild(div);
  scrollChat();
}
function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function scrollChat() { cwMessages.scrollTop = cwMessages.scrollHeight; }

function markdownToHtml(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

async function sendMessage(msg) {
  const trimmed = msg.trim();
  if (!trimmed) return;
  
  cwInput.value = '';
  cwQuickBtns.style.display = 'none';
  addUserMsg(trimmed);
  addTypingIndicator();
  cwSendBtn.disabled = true;

  // Use Local Logic (GopiBot) first
  const resp = GopiBot.respond(trimmed);
  
  setTimeout(async () => {
    removeTypingIndicator();
    
    if (resp.type === 'task') {
      const todo = await addNewTodo(resp.title, { 
        category: 'Chat', 
        priority: 'high',
        startTime: resp.startTime,
        endTime: resp.endTime
      });
      if (todo) {
        let timeMsg = "";
        if (resp.startTime || resp.endTime) {
          timeMsg = ` (${resp.startTime || ''}${resp.endTime ? ' to ' + resp.endTime : ''})`;
        }
        addBotMsg(`Theek hai! Maine **"${resp.title}"**${timeMsg} aapki list mein add kar diya hai. ✅`);
        showToast('✓ Task added via Chat!', 'success');
      } else {
        addBotMsg("Maaf kijiye, main task add nahi kar paaya. ❌");
      }
    } else if (resp.type === 'text') {
      addBotMsg(resp.content);
    } else {
      // Fallback
      addBotMsg("Hmm, main samajh nahi paaya. Aap kuch aur puchna chahenge? 😊");
    }
    
    cwSendBtn.disabled = false;
    cwInput.focus();
  }, 600);
}

cwSendBtn.addEventListener('click', () => sendMessage(cwInput.value));
cwInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(cwInput.value); } });
cwQuickBtns.querySelectorAll('.cw-quick-btn').forEach(btn => {
  btn.addEventListener('click', () => sendMessage(btn.dataset.q));
});

// Expose for task updates
const dina = { updateContext(todos) { GopiBot.updateContext(todos); } };
const gopi = { updateContext(todos) { GopiBot.updateContext(todos); } };

// -- Motivational Options Logic -----------------------------
const optionsBtn = document.getElementById('options-btn');
const optionsDropdown = document.getElementById('options-dropdown');

if (optionsBtn && optionsDropdown) {
  optionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    optionsDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    optionsDropdown.classList.add('hidden');
  });
}

function triggerEmojiBomb(type) {
  if (type === 'success') {
    createEmojiParticleSystem(['\u{1F389}', '\u{1F38A}', '\u{2728}', '\u{1F973}', '\u{1F388}', '\u{2B50}'], 'success');
    showToast('Shaandaar! Party time!', 'success');
  } else {
    createEmojiParticleSystem(['\u{1F4AA}', '\u{1F525}', '\u{26A1}', '\u{1F680}', '\u{1F31F}', '\u{1F44F}'], 'fail');
    showToast('Koi baat nahi! Agli baar pakka!', 'info');
  }
}

// Attach to window for onclick handlers in HTML
window.triggerEmojiBomb = triggerEmojiBomb;

function setTaskFilterByKey(key) {
  const btn = document.getElementById(`filter-${key}`);
  if (btn) btn.click();
}

function openNotesPanel() {
  const btn = document.getElementById('open-notes-btn');
  if (btn) btn.click();
}

function toggleSpeakers() {
  const widget = document.getElementById('motivation-widget');
  if (widget) widget.classList.toggle('open');
}

function exportTasksAsJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    total: todos.length,
    todos: todos.map(t => ({
      id: t.id || t._id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      completed: !!t.completed,
      startDate: t.startDate || null,
      endDate: t.endDate || null,
      startTime: t.startTime || null,
      endTime: t.endTime || null
    }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `aapkadinacharya-tasks-${todayStr()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast('Tasks exported successfully.', 'success');
}

function toggleFocusMode() {
  document.body.classList.toggle('focus-mode');
  showToast(document.body.classList.contains('focus-mode') ? 'Focus mode enabled.' : 'Focus mode disabled.', 'success');
}

function sendChatPrompt(prompt) {
  if (!prompt) return;
  if (!chatOpen) openChat();
  setTimeout(() => sendMessage(prompt), 180);
}

window.ADC_actions = {
  openProfilePanel: openProfile,
  closeProfilePanel: closeProfile,
  openChatPanel: openChat,
  closeChatPanel: closeChat,
  openNotesPanel,
  toggleSpeakers,
  triggerParty: triggerEmojiBomb,
  setTaskFilter: setTaskFilterByKey,
  exportTasksAsJson,
  toggleFocusMode,
  clearCompletedTasks: () => {
    const btn = document.getElementById('clear-completed-btn');
    if (btn) btn.click();
  },
  scrollToTaskComposer: () => {
    const section = document.querySelector('.add-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  sendChatPrompt,
  goLearnPage: () => window.location.assign('/learn'),
  goGalleryPage: () => window.location.assign('/gallery'),
  goAboutPage: () => window.location.assign('/about'),
  workflowPlan: () => {
    setTaskFilterByKey('active');
    openNotesPanel();
    sendChatPrompt('Plan my day using my current tasks.');
  },
  workflowReview: () => {
    setTaskFilterByKey('completed');
    sendChatPrompt('Give me a quick review of today progress.');
  },
  workflowRecover: () => {
    triggerEmojiBomb('fail');
    toggleSpeakers();
    sendChatPrompt('I am feeling low. Give me a motivation plan.');
  },
  workflowStudy: () => {
    openChat();
    sendChatPrompt('Give me a study sprint strategy for this week.');
  },
  workflowCareer: () => {
    openChat();
    sendChatPrompt('Give me a career growth plan for interview preparation.');
  },
  workflowWeekly: () => {
    setTaskFilterByKey('active');
    sendChatPrompt('Build a weekly plan from my current tasks.');
  }
};

function runPendingDashboardShortcut(attempt = 0) {
  const shortcut = localStorage.getItem('adc_dashboard_shortcut');
  if (!shortcut) return;

  if (!window.ADC_actions) {
    if (attempt < 12) {
      setTimeout(() => runPendingDashboardShortcut(attempt + 1), 180);
    }
    return;
  }

  const actions = window.ADC_actions;
  localStorage.removeItem('adc_dashboard_shortcut');

  if (shortcut.startsWith('filter:')) {
    actions.setTaskFilter?.(shortcut.split(':')[1]);
    return;
  }

  if (shortcut.startsWith('triggerParty:')) {
    actions.triggerParty?.(shortcut.split(':')[1] || 'success');
    return;
  }

  const actionMap = {
    openProfile: () => actions.openProfilePanel?.(),
    openNotes: () => actions.openNotesPanel?.(),
    openChat: () => actions.openChatPanel?.(),
    scrollComposer: () => actions.scrollToTaskComposer?.(),
    clearCompleted: () => actions.clearCompletedTasks?.(),
    toggleFocus: () => actions.toggleFocusMode?.(),
    workflowPlan: () => actions.workflowPlan?.(),
    workflowReview: () => actions.workflowReview?.(),
    workflowRecover: () => actions.workflowRecover?.(),
    workflowStudy: () => actions.workflowStudy?.(),
    workflowCareer: () => actions.workflowCareer?.(),
    workflowWeekly: () => actions.workflowWeekly?.(),
    toggleSpeakers: () => actions.toggleSpeakers?.(),
    exportTasks: () => actions.exportTasksAsJson?.()
  };

  actionMap[shortcut]?.();
}

setTimeout(() => runPendingDashboardShortcut(), 450);
window.addEventListener('load', () => {
  setTimeout(() => runPendingDashboardShortcut(), 120);
});

// -- Rich Text Notes System ----------------------------------
let currentNoteId = null;
let notesData = [];

// Use existing API and token from app scope
// const API = 'http://localhost:5000/api'; (already defined above)
// const token = localStorage.getItem('adc_token'); (already defined above)

const notesModal     = document.getElementById('notes-modal');
const openNotesBtn   = document.getElementById('open-notes-btn');
const closeNotesBtn  = document.getElementById('close-notes-btn');
const notesList      = document.getElementById('notes-list');
const noteEditor     = document.getElementById('note-editor');
const noteTitleInput = document.getElementById('note-title-input');
const saveNoteBtn    = document.getElementById('save-note-btn');
const deleteNoteBtn  = document.getElementById('delete-note-btn');
const newNoteBtn     = document.getElementById('new-note-btn');
const fontSelect     = document.getElementById('note-font-family');
const noteStatus     = document.getElementById('note-status');

// Helper: Show/Hide Status
const showStatus = (msg, duration = 3000) => {
  if (!noteStatus) return;
  noteStatus.textContent = msg;
  noteStatus.classList.add('show');
  setTimeout(() => noteStatus.classList.remove('show'), duration);
};

// Initialize Notes
async function initNotes() {
  if (!openNotesBtn) return;

  openNotesBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    notesModal.classList.remove('hidden');
    await fetchNotes();
  });

  closeNotesBtn.addEventListener('click', () => {
    notesModal.classList.add('hidden');
  });

  newNoteBtn.addEventListener('click', createNewNote);
  saveNoteBtn.addEventListener('click', saveNote);
  deleteNoteBtn.addEventListener('click', deleteNote);

  // RTE Toolbar Logic
  document.querySelectorAll('.rte-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const command = btn.dataset.command;
      document.execCommand(command, false, null);
      btn.classList.toggle('active');
      noteEditor.focus();
    });
  });

  // Font Family Change
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      const font = e.target.value;
      noteEditor.style.fontFamily = font;
      noteEditor.focus();
    });
  }

  // Highlight active buttons based on cursor position
  noteEditor.addEventListener('mouseup', checkEditorState);
  noteEditor.addEventListener('keyup', checkEditorState);
}

function checkEditorState() {
  document.querySelectorAll('.rte-btn').forEach(btn => {
    const cmd = btn.dataset.command;
    if (document.queryCommandState(cmd)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// API Operations
async function fetchNotes() {
  try {
    const res = await fetch(`${API}/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      notesData = data.notes;
      renderNotesList();
      if (notesData.length > 0 && !currentNoteId) {
        selectNote(notesData[0]._id);
      }
    }
  } catch (err) {
    console.error('Fetch Notes Error:', err);
  }
}

function renderNotesList() {
  if (!notesList) return;
  notesList.innerHTML = notesData.map(note => `
    <div class="note-item ${currentNoteId === note._id ? 'active' : ''}" onclick="selectNote('${note._id}')">
      <span class="ni-title">${esc(note.title) || 'Untitled Note'}</span>
      <span class="ni-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
    </div>
  `).join('');
}

async function selectNote(id) {
  currentNoteId = id;
  const note = notesData.find(n => n._id === id);
  if (note) {
    noteTitleInput.value = note.title;
    noteEditor.innerHTML = note.content;
    
    // Update font family if applicable (optional persistence of style)
    renderNotesList();
  }
}

async function createNewNote() {
  currentNoteId = null;
  noteTitleInput.value = '';
  noteEditor.innerHTML = '';
  noteTitleInput.focus();
  showStatus('New note ready!');
}

async function saveNote() {
  const noteData = {
    title:   noteTitleInput.value.trim() || 'Untitled Note',
    content: noteEditor.innerHTML
  };

  try {
    const url = currentNoteId ? `${API}/notes/${currentNoteId}` : `${API}/notes`;
    const method = currentNoteId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(noteData)
    });

    const data = await res.json();
    if (data.success) {
      showStatus('Note saved successfully! ✨');
      await fetchNotes();
      if (!currentNoteId && data.note) selectNote(data.note._id);
    }
  } catch (err) {
    console.error('Save Note Error:', err);
    showToast('Failed to save note.', 'error');
  }
}

async function deleteNote() {
  if (!currentNoteId) return showToast('No note selected!', 'info');
  if (!confirm('Are you sure you want to delete this note?')) return;

  try {
    const res = await fetch(`${API}/notes/${currentNoteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Note deleted.', 'success');
      currentNoteId = null;
      noteTitleInput.value = '';
      noteEditor.innerHTML = '';
      await fetchNotes();
    }
  } catch (err) {
    console.error('Delete Note Error:', err);
  }
}

// Expose selectNote to window
window.selectNote = selectNote;

// Call init once app starts
document.addEventListener('DOMContentLoaded', () => {
  // Use adc_token specifically
  if (localStorage.getItem('adc_token')) {
    initNotes();
  }
});

