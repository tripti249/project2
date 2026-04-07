// [RESTART TRIGGER] Application with Gemini AI
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');
const path       = require('path');

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
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);

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
