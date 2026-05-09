import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import sequelize from './config/database.js';
import roomRoutes from './route/roomRoutes.js';
import lichHenRoutes from './route/lichHenRoutes.js';
import './model/roomModel.js'; // Import to register Room model

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const AVATAR_COLORS = ['#1a56db','#7c3aed','#0891b2','#059669','#dc2626','#d97706','#db2777','#16a34a'];

// Set up Handlebars view engine
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
    eq: (a, b) => a === b,
    today: () => new Date().toISOString().split('T')[0],
    add2940: val => parseInt(val) + 2940,
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'view'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sync database
const initializeDatabase = async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

// Routes
app.get('/', (req, res) => {
  res.render('home', { title: 'Home', message: 'Welcome to Homestay App' });
});

app.use('/', roomRoutes);
app.use('/lich-hen', lichHenRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error', error: err });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Start server
initializeDatabase().then(() => {
  app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
  });
});