// AapkaDINACHARYA — Root Entry Point for Render v4
require('dotenv').config({ path: './backend/.env' }); // Look for .env in its current location

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
    // Removed process.exit(1) to keep the server alive for debugging
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
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ─── Protected Routes (Full crud for todos, notes etc) ─────────────
// (Reduced for brevity in root file — keep logic from original backend)
app.get('/api/todos', auth, async (req, res) => {
  const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, todos });
});
app.post('/api/todos', auth, async (req, res) => {
  const todo = await Todo.create({ ...req.body, userId: req.user.id });
  res.status(201).json({ success: true, todo });
});
app.patch('/api/todos/:id', auth, async (req, res) => {
  const todo = await Todo.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: req.body }, { new: true });
  res.json({ success: true, todo });
});
app.delete('/api/todos/:id', auth, async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.json({ success: true });
});

// ─── Page Routes ─────────────────────────────────────────────────
app.get('/auth',    (_req, res) => res.sendFile(path.join(frontendPath, 'auth.html')));
app.get('/learn',   (_req, res) => res.sendFile(path.join(frontendPath, 'learn.html')));
app.get('/gallery', (_req, res) => res.sendFile(path.join(frontendPath, 'gallery.html')));
app.get('/about',   (_req, res) => res.sendFile(path.join(frontendPath, 'about.html')));
app.get('*',        (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Root Server Running at Port ${PORT}`));
