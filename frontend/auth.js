/* ════════════════════════════════════════════════════════
   AapkaDINACHARYA — Auth Frontend Logic
   ════════════════════════════════════════════════════════ */

const API = '/api';

// Redirect if already logged in
if (localStorage.getItem('adc_token')) {
  window.location.replace('/');
}

// DOM Refs
const loginForm   = document.getElementById('login-form');
const signupForm  = document.getElementById('signup-form');
const tabBtns     = document.querySelectorAll('.tab-btn');
const switchLinks = document.querySelectorAll('.switch-link');
const toast       = document.getElementById('auth-toast');

// Tab Switching
function switchTab(tab) {
  tabBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
    b.setAttribute('aria-selected', b.dataset.tab === tab);
  });
  loginForm.classList.toggle('hidden',  tab !== 'login');
  signupForm.classList.toggle('hidden', tab !== 'signup');
  clearErrors();
}
tabBtns.forEach(btn  => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
switchLinks.forEach(l => l.addEventListener('click',  () => switchTab(l.dataset.switch)));

// Toggle password visibility
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = document.getElementById(btn.dataset.target);
    inp.type  = inp.type === 'password' ? 'text' : 'password';
  });
});

// Password strength
const sgPass = document.getElementById('sg-password');
const strengthFill = document.getElementById('strength-fill');
sgPass.addEventListener('input', () => {
  const v = sgPass.value;
  let score = 0;
  if (v.length >= 6)  score++;
  if (v.length >= 10) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  strengthFill.style.width      = `${(score/5)*100}%`;
  strengthFill.style.background = ['#ef4444','#f59e0b','#f59e0b','#10b981','#10b981'][Math.max(0,score-1)] || '#ef4444';
});

// Validation helpers
function setError(inp, errEl, msg) { inp.classList.add('error'); inp.classList.remove('valid'); errEl.textContent = msg; }
function setValid(inp, errEl)      { inp.classList.remove('error'); inp.classList.add('valid'); errEl.textContent = ''; }
function clearErrors() {
  document.querySelectorAll('.form-input').forEach(i => i.classList.remove('error','valid'));
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.api-error').forEach(e => e.classList.add('hidden'));
}
function showApiError(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }

// Toast
let toastTimer;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className   = `auth-toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Set loading
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-text').style.display   = loading ? 'none' : '';
  btn.querySelector('.btn-spinner').classList.toggle('hidden', !loading);
}

// LOGIN
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('lg-email');
  const password = document.getElementById('lg-password');
  const apiErr   = document.getElementById('lg-api-error');
  const btn      = document.getElementById('lg-submit-btn');
  let valid = true;
  apiErr.classList.add('hidden');

  if (!email.value.trim() || !email.value.includes('@')) {
    setError(email, document.getElementById('lg-email-err'), 'Enter a valid email address.');
    valid = false;
  } else { setValid(email, document.getElementById('lg-email-err')); }

  if (!password.value) {
    setError(password, document.getElementById('lg-pass-err'), 'Password is required.');
    valid = false;
  } else { setValid(password, document.getElementById('lg-pass-err')); }

  if (!valid) return;
  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim(), password: password.value })
    });
    const data = await res.json();
    if (!res.ok) { showApiError(apiErr, data.message); }
    else {
      localStorage.setItem('adc_token', data.token);
      localStorage.setItem('adc_user',  JSON.stringify(data.user));
      showToast('✓ Welcome back, ' + data.user.name + '!', 'success');
      setTimeout(() => window.location.replace('/'), 800);
    }
  } catch { showApiError(apiErr, 'Cannot connect to server. Is the backend running?'); }
  finally  { setLoading(btn, false); }
});

// SIGNUP
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name     = document.getElementById('sg-name');
  const email    = document.getElementById('sg-email');
  const password = document.getElementById('sg-password');
  const confirm  = document.getElementById('sg-confirm');
  const apiErr   = document.getElementById('sg-api-error');
  const btn      = document.getElementById('sg-submit-btn');
  let valid = true;
  apiErr.classList.add('hidden');

  if (!name.value.trim() || name.value.trim().length < 2) {
    setError(name, document.getElementById('sg-name-err'), 'Name must be at least 2 characters.'); valid = false;
  } else { setValid(name, document.getElementById('sg-name-err')); }

  if (!email.value.trim() || !email.value.includes('@')) {
    setError(email, document.getElementById('sg-email-err'), 'Enter a valid email address.'); valid = false;
  } else { setValid(email, document.getElementById('sg-email-err')); }

  if (!password.value || password.value.length < 6) {
    setError(password, document.getElementById('sg-pass-err'), 'Password must be at least 6 characters.'); valid = false;
  } else { setValid(password, document.getElementById('sg-pass-err')); }

  if (!confirm.value || confirm.value !== password.value) {
    setError(confirm, document.getElementById('sg-confirm-err'), 'Passwords do not match.'); valid = false;
  } else if (confirm.value) { setValid(confirm, document.getElementById('sg-confirm-err')); }

  if (!valid) return;
  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(), password: password.value })
    });
    const data = await res.json();
    if (!res.ok) { showApiError(apiErr, data.message); }
    else {
      localStorage.setItem('adc_token', data.token);
      localStorage.setItem('adc_user',  JSON.stringify(data.user));
      showToast('🎉 Account created! Redirecting…', 'success');
      setTimeout(() => window.location.replace('/'), 1000);
    }
  } catch { showApiError(apiErr, 'Cannot connect to server. Is the backend running?'); }
  finally  { setLoading(btn, false); }
});

// Real-time confirm check
document.getElementById('sg-confirm').addEventListener('input', () => {
  const pass    = document.getElementById('sg-password').value;
  const confirm = document.getElementById('sg-confirm');
  const errEl   = document.getElementById('sg-confirm-err');
  if (confirm.value && confirm.value !== pass) setError(confirm, errEl, 'Passwords do not match.');
  else if (confirm.value) setValid(confirm, errEl);
});
