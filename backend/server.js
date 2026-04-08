// [RESTART TRIGGER] Application with Gemini AI
require('dotenv').config();

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

// ─── MongoDB Connection ─────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅  MongoDB Connected'))
  .catch(err => {
    console.error('❌  MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ─── Configure Web Push ─────────────────────────────────────────
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:example@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
  completed: { type: Boolean, default: false },
  overdueNotifiedAt: { type: Date, default: null }, // Track when user was notified
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: {
    endpoint: { type: String, required: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);
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
  content: { type: String, default: '', trim: true }, // Store HTML content for Rich Text
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

const habitSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:          { type: String, required: true, trim: true },
  icon:           { type: String, default: '✨' },
  completedDates: [{ type: String }], // Array of "YYYY-MM-DD"
  streak:         { type: Number, default: 0 },
}, { timestamps: true });

const Habit = mongoose.model('Habit', habitSchema);

// ─── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// Resolve frontend path using process.cwd() for better reliability on Render
const frontendPath = path.join(process.cwd(), 'frontend');
console.log('📂  Looking for frontend folder in:', frontendPath);
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

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (!email.includes('@'))
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });

    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser   = await User.create({ name: name.trim(), email, password: hashedPwd });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt },
      JWT_SECRET, { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true, message: 'Account created successfully!',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt }
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, createdAt: user.createdAt },
      JWT_SECRET, { expiresIn: '7d' }
    );

    res.json({
      success: true, message: 'Welcome back!',
      token,
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/auth/profile — update name
app.patch('/api/auth/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true, select: '-password' }
    );
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    const newToken = jwt.sign(
      { id: user._id, email: user.email, name: user.name, createdAt: user.createdAt },
      JWT_SECRET, { expiresIn: '7d' }
    );

    res.json({
      success: true, message: 'Profile updated!',
      token: newToken,
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── TODO ROUTES (protected) ────────────────────────────────────

app.get('/api/todos', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, todos });
  } catch (err) {
    console.error('GET /api/todos Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/todos', auth, async (req, res) => {
  try {
    const { title, category, priority, startDate, endDate, startTime, endTime } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: 'Title is required.' });

    const todo = await Todo.create({
      userId:    req.user.id,
      title:     title.trim(),
      category:  category  || 'General',
      priority:  priority  || 'medium',
      startDate: startDate || null,
      endDate:   endDate   || null,
      startTime: startTime || null,
      endTime:   endTime   || null,
    });

    res.status(201).json({ success: true, todo });
  } catch (err) {
    console.error('POST /api/todos Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/todos/:id
app.patch('/api/todos/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!todo)
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    res.json({ success: true, todo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/todos/:id — delete single todo
app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!todo)
      return res.status(404).json({ success: false, message: 'Todo not found.' });
    res.json({ success: true, todo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/todos — clear all completed todos for user
app.delete('/api/todos', auth, async (req, res) => {
  try {
    await Todo.deleteMany({ userId: req.user.id, completed: true });
    res.json({ success: true, message: 'Cleared completed todos.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── NOTE ROUTES (protected) ────────────────────────────────────

app.get('/api/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (err) {
    console.error('GET /api/notes Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/notes', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.create({
      userId:  req.user.id,
      title:   title   || 'Untitled Note',
      content: content || '',
    });
    res.status(201).json({ success: true, note });
  } catch (err) {
    console.error('POST /api/notes Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.patch('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!note)
      return res.status(404).json({ success: false, message: 'Note not found.' });
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.delete('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note)
      return res.status(404).json({ success: false, message: 'Note not found.' });
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── CHAT ENDPOINT ──────────────────────────────────────────────
app.post('/api/chat', auth, (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ success: false, message: 'Message is required.' });
  res.json({ success: true, echo: message.trim() });
});

// ─── FEEDBACK ENDPOINT ─────────────────────────────────────────-
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, type, rating, message } = req.body;
    if (!message)
      return res.status(400).json({ success: false, message: 'Message is required.' });

    const fb = await Feedback.create({ name, email, type, rating, message });
    res.status(201).json({ success: true, message: 'Feedback received! Thank you.', id: fb._id });
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── NOTIFICATION ROUTES ────────────────────────────────────────

app.get('/api/notifications/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/notifications/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription.' });
    }

    // Upsert the subscription for the user
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, 'subscription.endpoint': subscription.endpoint },
      { userId: req.user.id, subscription },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Subscribed successfully.' });
  } catch (err) {
    console.error('Subscribe error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── BACKGROUND OVERDUE CHECKER ─────────────────────────────────

async function checkOverdueTasks() {
  try {
    const now = new Date();
    // Find todos that are not completed and haven't been notified
    const activeTodos = await Todo.find({ completed: false, overdueNotifiedAt: null });
    
    for (const todo of activeTodos) {
      if (!todo.endDate) continue;
      
      const [year, month, day] = todo.endDate.split('-').map(Number);
      let hour = 23, minute = 59;
      if (todo.endTime) {
        const [h, m] = todo.endTime.split(':').map(Number);
        hour = h;
        minute = m;
      }
      
      const deadline = new Date(year, month - 1, day, hour, minute, 59, 999);
      
      if (now > deadline) {
        const subscriptions = await PushSubscription.find({ userId: todo.userId });
        
        for (const sub of subscriptions) {
          const payload = JSON.stringify({
            title: 'Task Overdue! ⚠',
            body: `"${todo.title}" was due at ${todo.endTime || '23:59'} today.`,
            data: { url: '/' }
          });
          
          try {
            await webpush.sendNotification(sub.subscription, payload);
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await PushSubscription.findByIdAndDelete(sub._id);
            }
          }
        }
        
        todo.overdueNotifiedAt = now;
        await todo.save();
        console.log(`📢 Notification sent for overdue task: ${todo.title}`);
      }
    }
  } catch (err) {
    console.error('Background checker error:', err);
  }
}

setInterval(checkOverdueTasks, 60000);
setTimeout(checkOverdueTasks, 5000);

// ─── HABIT ROUTES (protected) ───────────────────────────────────

app.get('/api/habits', auth, async (req, res) => {
  try {
    let habits = await Habit.find({ userId: req.user.id });
    // If no habits exist, create some defaults
    if (habits.length === 0) {
      const defaults = [
        { title: 'Drink Water', icon: '💧' },
        { title: 'Exercise', icon: '🏃' },
        { title: 'Study', icon: '📚' },
        { title: 'Meditation', icon: '🧘' }
      ];
      habits = await Habit.insertMany(defaults.map(h => ({ ...h, userId: req.user.id })));
    }
    res.json({ success: true, habits });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.patch('/api/habits/:id/toggle', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found.' });

    const index = habit.completedDates.indexOf(today);
    if (index > -1) {
      habit.completedDates.splice(index, 1);
    } else {
      habit.completedDates.push(today);
    }
    await habit.save();
    res.json({ success: true, habit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Health ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'AapkaDINACHARYA API running 🚀',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Disconnected',
    time: new Date().toISOString()
  });
});

// ─── Page Routes ─────────────────────────────────────────────────
app.get('/auth',    (_req, res) => res.sendFile(path.join(frontendPath, 'auth.html')));
app.get('/learn',   (_req, res) => res.sendFile(path.join(frontendPath, 'learn.html')));
app.get('/gallery', (_req, res) => res.sendFile(path.join(frontendPath, 'gallery.html')));
app.get('/about',   (_req, res) => res.sendFile(path.join(frontendPath, 'about.html')));
app.get('*',        (_req, res) => {
  const index = path.join(frontendPath, 'index.html');
  console.log('🌍 Sending file:', index);
  res.sendFile(index);
});

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`\n✅  AapkaDINACHARYA Server → http://localhost:${PORT}\n`));
