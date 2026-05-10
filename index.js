import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import sequelize from './config/database.js';
import roomRoutes from './route/roomRoutes.js';
import checkoutScheduleRoutes from './route/checkoutScheduleRoutes.js';
import { seedCheckoutScheduleReferences } from './service/bootstrapService.js';
import lichHenRoutes from './route/lichHenRoutes.js';
import authRoutes from './route/authRoutes.js';
import authService from './service/authService.js';
import { requireLogin } from './middleware/auth.js';
import './model/roomModel.js';
import './model/contractModel.js';
import './model/depositReceiptModel.js';
import './model/checkoutScheduleModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const AVATAR_COLORS = ['#1a56db','#7c3aed','#0891b2','#059669','#dc2626','#d97706','#db2777','#16a34a'];

// ---- Handlebars engine ----
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'view', 'layouts'),
  partialsDir: path.join(__dirname, 'view', 'partials'),
  helpers: {
    ifEquals: function (left, right, options) {
      return String(left) === String(right) ? options.fn(this) : options.inverse(this);
    },
    unlessEquals: function (left, right, options) {
      return String(left) !== String(right) ? options.fn(this) : options.inverse(this);
    },
    eq: (a, b) => a === b,
    initials: (name = '') =>
      name.split(' ').filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join(''),
    avatarColor: (name = '') => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
      return AVATAR_COLORS[hash % AVATAR_COLORS.length];
    },
    formatDate: (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    },
    formatCurrency: (val) =>
      val ? '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '$0',
    today: () => new Date().toISOString().split('T')[0],
    add2940: val => parseInt(val) + 2940,
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'view'));

// ---- Middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Session ----
app.use(session({
  secret: config.sessionSecret || 'homestay-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8, // 8 tiếng
    httpOnly: true,
  },
}));

// Gắn user vào res.locals cho tất cả view
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ---- Database ----
const initializeDatabase = async () => {
  try {
    console.log('Starting database synchronization...');
    await sequelize.sync({ alter: false });
    await seedCheckoutScheduleReferences();
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error syncing database:', error && error.stack ? error.stack : error);
  }
};

// ---- Routes ----

// Auth routes (không cần login)
app.use('/', authRoutes);

// Redirect root về dashboard hoặc login
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

// Các route cần đăng nhập
app.use('/', requireLogin, roomRoutes);
app.use('/lich-hen', requireLogin, lichHenRoutes);
app.use('/', roomRoutes);
app.use('/', checkoutScheduleRoutes);
app.use('/lich-hen', lichHenRoutes);

// ---- Error handlers ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error', error: err });
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ---- Start ----
initializeDatabase().then(() => {
  app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
  });
});
