import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import sequelize from './config/database.js';
import roomRoutes from './route/roomRoutes.js';
import './model/roomModel.js'; // Import to register Room model

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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