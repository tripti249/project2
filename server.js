// AapkaDINACHARYA — Root Entry Point for Render v4
require('dotenv').config({ path: './backend/.env' }); // Look for .env in its current location

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');
const path       = require('path');
const webpush    = require('web-push');

const app        = express();
const PORT       = process.env.PORT       || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'aapkadinacharya_jwt_secret_2024';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@aapkadinacharya.app';

const vapidKeys = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  ? {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    }
  : webpush.generateVAPIDKeys();

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('Using ephemeral VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY for stable web-push subscriptions.');
}

webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);

function pad2(value) {
  return String(value).padStart(2, '0');
}

function normalizeTimeInput(value) {
  if (value == null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const match24 = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (match24) {
    return `${pad2(Number(match24[1]))}:${match24[2]}`;
  }

  const match12 = raw.match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)$/i);
  if (!match12) return null;

  let hour = Number(match12[1]);
  const minute = Number(match12[2] || '0');
  const period = match12[3].toUpperCase();

  if (hour < 1 || hour > 12) return null;

  if (period === 'AM') hour = hour % 12;
  if (period === 'PM') hour = (hour % 12) + 12;

  return `${pad2(hour)}:${pad2(minute)}`;
}

function buildUtcTimestampFromLocal(dateStr, timeStr, offsetMinutes = 0, fallbackTime = '00:00') {
  if (!dateStr) return null;

  const normalized = normalizeTimeInput(timeStr) || fallbackTime;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = normalized.split(':').map(Number);
  const endOfDay = fallbackTime === '23:59' && !normalizeTimeInput(timeStr);

  return Date.UTC(year, month - 1, day, hour, minute, endOfDay ? 59 : 0, endOfDay ? 999 : 0) + (offsetMinutes * 60000);
}

function getTodoDeadlineTimestamp(todo) {
  if (!todo.endDate) return null;
  const offsetMinutes = Number.isFinite(Number(todo.timeZoneOffsetMinutes)) ? Number(todo.timeZoneOffsetMinutes) : 0;
  return buildUtcTimestampFromLocal(todo.endDate, todo.endTime, offsetMinutes, '23:59');
}

function isTodoOverdue(todo, referenceTimestamp = Date.now()) {
  if (todo.completed) return false;
  const deadline = getTodoDeadlineTimestamp(todo);
  return deadline != null && referenceTimestamp > deadline;
}

function formatTimeForDisplay(value) {
  const normalized = normalizeTimeInput(value);
  if (!normalized) return '';

  const [hour24, minute] = normalized.split(':').map(Number);
  const hour12 = hour24 % 12 || 12;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${pad2(minute)} ${period}`;
}

function formatTodoDeadline(todo) {
  const dateLabel = todo.endDate || '';
  const timeLabel = formatTimeForDisplay(todo.endTime);
  return [dateLabel, timeLabel].filter(Boolean).join(' ');
}

function normalizeTodoPayload(body, { requireTitle = false } = {}) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'title') || requireTitle) {
    const title = String(body.title || '').trim();
    if (requireTitle && !title) throw new Error('Title is required.');
    payload.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'category')) {
    payload.category = body.category || 'General';
  }

  if (Object.prototype.hasOwnProperty.call(body, 'priority')) {
    payload.priority = ['low', 'medium', 'high'].includes(body.priority) ? body.priority : 'medium';
  }

  if (Object.prototype.hasOwnProperty.call(body, 'startDate')) {
    payload.startDate = body.startDate || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'endDate')) {
    payload.endDate = body.endDate || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'startTime')) {
    payload.startTime = body.startTime ? normalizeTimeInput(body.startTime) : null;
    if (body.startTime && !payload.startTime) throw new Error('Start time is invalid.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'endTime')) {
    payload.endTime = body.endTime ? normalizeTimeInput(body.endTime) : null;
    if (body.endTime && !payload.endTime) throw new Error('Due time is invalid.');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'completed')) {
    payload.completed = Boolean(body.completed);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'overdueNotifiedAt')) {
    payload.overdueNotifiedAt = body.overdueNotifiedAt ? new Date(body.overdueNotifiedAt) : null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'timeZoneOffsetMinutes')) {
    const offset = Number(body.timeZoneOffsetMinutes);
    payload.timeZoneOffsetMinutes = Number.isFinite(offset) ? offset : null;
  }

  const resolvedStartDate = Object.prototype.hasOwnProperty.call(payload, 'startDate') ? payload.startDate : body.startDate || null;
  if ((payload.startTime || body.startTime) && !resolvedStartDate) {
    payload.startDate = body.startDate || null;
  }

  const activeStartDate = Object.prototype.hasOwnProperty.call(payload, 'startDate') ? payload.startDate : body.startDate || null;
  const activeEndDate = Object.prototype.hasOwnProperty.call(payload, 'endDate') ? payload.endDate : body.endDate || null;
  const activeEndTime = Object.prototype.hasOwnProperty.call(payload, 'endTime') ? payload.endTime : normalizeTimeInput(body.endTime);

  if (activeEndTime && !activeEndDate) {
    payload.endDate = activeStartDate || body.endDate || body.startDate || null;
  }

  const startDate = Object.prototype.hasOwnProperty.call(payload, 'startDate') ? payload.startDate : body.startDate || null;
  const endDate = Object.prototype.hasOwnProperty.call(payload, 'endDate') ? payload.endDate : body.endDate || null;
  const startTime = Object.prototype.hasOwnProperty.call(payload, 'startTime') ? payload.startTime : normalizeTimeInput(body.startTime);
  const endTime = Object.prototype.hasOwnProperty.call(payload, 'endTime') ? payload.endTime : normalizeTimeInput(body.endTime);

  if (startDate && endDate && endDate < startDate) {
    throw new Error('Due date must be after start date.');
  }

  if (startDate && endDate && startDate === endDate && startTime && endTime) {
    const startAt = buildUtcTimestampFromLocal(startDate, startTime, Number(payload.timeZoneOffsetMinutes || body.timeZoneOffsetMinutes || 0), '00:00');
    const endAt = buildUtcTimestampFromLocal(endDate, endTime, Number(payload.timeZoneOffsetMinutes || body.timeZoneOffsetMinutes || 0), '23:59');
    if (endAt < startAt) {
      throw new Error('Due time must be after start time.');
    }
  }

  return payload;
}

// ─── MongoDB Connection ─────────────────────────────────────────
const rawURI = process.env.MONGO_URI || '';
if (!rawURI) {
  console.log('❌  CRITICAL: MONGO_URI is missing from Environment Variables!');
} else {
  // Log a masked version for security: mongodb+srv://Adi***:***@cluster0...
  const masked = rawURI.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  console.log('✅  MONGO_URI detected:', masked);
}

mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DB_NAME || 'aapkadinacharya',
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
})
  .then(() => console.log('✅  Successfully Connected to MongoDB Database:', process.env.DB_NAME || 'aapkadinacharya'))
  .catch(err => {
    console.error('❌  MongoDB Connection Error Details:', err.message);
  });

// ─── Mongoose Schemas & Models ─────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true });

const todoSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true, trim: true },
  category:  { type: String, default: 'General' },
  priority:  { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  startDate: { type: String, default: null },
  endDate:   { type: String, default: null },
  startTime: { type: String, default: null },
  endTime:   { type: String, default: null },
  timeZoneOffsetMinutes: { type: Number, default: null },
  overdueNotifiedAt: { type: Date, default: null },
  completed: { type: Boolean, default: false },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true, trim: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

const feedbackSchema = new mongoose.Schema({
  name:     { type: String, trim: true },
  email:    { type: String, trim: true },
  type:     { type: String },
  rating:   { type: Number, default: 0 },
  message:  { type: String, required: true, trim: true },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

const noteSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, default: 'Untitled Note', trim: true },
  content: { type: String, default: '', trim: true },
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

// ─── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// Simplest path resolution for Render:
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// ─── Auth Middleware ────────────────────────────────────────────
function auth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token)
    return res.status(401).json({ success: false, message: 'Access denied. Please login.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Invalid or expired token. Please login again.' });
  }
}

// ─── AUTH ROUTES ────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields are required.' });
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });
    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name: name.trim(), email, password: hashedPwd });
    const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ─── Protected Routes (Full crud for todos, notes etc) ─────────────
// (Reduced for brevity in root file — keep logic from original backend)
app.get('/api/todos', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, todos });
  } catch (err) {
    console.error('GET /api/todos failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});
app.post('/api/todos', auth, async (req, res) => {
  try {
    const payload = normalizeTodoPayload(req.body, { requireTitle: true });
    const todo = await Todo.create({ ...payload, userId: req.user.id });
    res.status(201).json({ success: true, todo });
  } catch (err) {
    const status = /required|invalid|after start/i.test(err.message) ? 400 : 500;
    console.error('POST /api/todos failed:', err.message);
    res.status(status).json({ success: false, message: status === 400 ? err.message : 'Server error.' });
  }
});
app.patch('/api/todos/:id', auth, async (req, res) => {
  try {
    const existingTodo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!existingTodo) {
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    }

    const payload = normalizeTodoPayload(req.body);
    const scheduleFields = ['startDate', 'endDate', 'startTime', 'endTime', 'timeZoneOffsetMinutes'];
    if (scheduleFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field))) {
      payload.overdueNotifiedAt = null;
    }

    Object.assign(existingTodo, payload);
    await existingTodo.save();
    res.json({ success: true, todo: existingTodo });
  } catch (err) {
    const status = /required|invalid|after start/i.test(err.message) ? 400 : 500;
    console.error('PATCH /api/todos/:id failed:', err.message);
    res.status(status).json({ success: false, message: status === 400 ? err.message : 'Server error.' });
  }
});
app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/todos/:id failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.delete('/api/todos', auth, async (req, res) => {
  try {
    await Todo.deleteMany({ userId: req.user.id, completed: true });
    res.json({ success: true, message: 'Cleared completed todos.' });
  } catch (err) {
    console.error('DELETE /api/todos failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.get('/api/notifications/vapid-public-key', auth, (_req, res) => {
  res.json({ success: true, publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', auth, async (req, res) => {
  try {
    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, message: 'A valid push subscription is required.' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: req.user.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userAgent: req.headers['user-agent'] || '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/notifications/subscribe failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// ─── NOTE ROUTES ───────────────────────────────────────────────

app.get('/api/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (err) {
    console.error('GET /api/notes failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/notes', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.create({
      userId: req.user.id,
      title: title || 'Untitled Note',
      content: content || ''
    });
    res.status(201).json({ success: true, note });
  } catch (err) {
    console.error('POST /api/notes failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.patch('/api/notes/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, content },
      { new: true }
    );
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.json({ success: true, note });
  } catch (err) {
    console.error('PATCH /api/notes/:id failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.delete('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/notes/:id failed:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Page Routes ─────────────────────────────────────────────────
app.post('/api/feedback', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const type = String(req.body?.type || '').trim();
    const message = String(req.body?.message || '').trim();
    const rating = Number(req.body?.rating);

    if (!message) {
      return res.status(400).json({ success: false, message: 'Feedback message is required.' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const feedback = await Feedback.create({
      name,
      email,
      type,
      message,
      rating: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback received successfully!',
      feedbackId: feedback._id,
    });
  } catch (err) {
    console.error('Feedback submission error:', err.message);
    res.status(500).json({ success: false, message: 'Unable to save feedback right now.' });
  }
});

app.get('/auth',    (_req, res) => res.sendFile(path.join(frontendPath, 'auth.html')));
app.get('/learn',   (_req, res) => res.sendFile(path.join(frontendPath, 'learn.html')));
app.get('/gallery', (_req, res) => res.sendFile(path.join(frontendPath, 'gallery.html')));
app.get('/about',   (_req, res) => res.sendFile(path.join(frontendPath, 'about.html')));
app.get('*',        (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Root Server Running at Port ${PORT}`));
