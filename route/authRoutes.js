// route/authRoutes.js
import express from 'express';
import ACCOUNTS from '../config/accounts.js';
import { requireLogin, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /login
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'Đăng nhập', layout: 'auth' });
});

// POST /login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const account = ACCOUNTS.find(
    a => a.username === username && a.password === password
  );

  if (!account) {
    return res.render('login', {
      title: 'Đăng nhập',
      layout: 'auth',
      error: 'Tên đăng nhập hoặc mật khẩu không đúng.',
      username,
    });
  }

  req.session.user = {
    id: account.id,
    username: account.username,
    role: account.role,
    roleLabel: account.roleLabel,
    ho_ten: account.ho_ten,
    avatar: account.avatar,
  };

  return res.redirect('/dashboard');
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// GET /dashboard - redirect theo role
router.get('/dashboard', requireLogin, (req, res) => {
  const role = req.session.user.role;
  const redirectMap = {
    sale:      '/dashboard/sale',
    ketoan:    '/dashboard/ketoan',
    quanly:    '/dashboard/quanly',
    khachhang: '/dashboard/khachhang',
  };
  res.redirect(redirectMap[role] || '/login');
});

// ---- Dashboard Sale ----
router.get('/dashboard/sale', requireRole('sale'), (req, res) => {
  res.render('dashboard/sale', {
    title: 'Dashboard - Nhân viên Sales',
    layout: 'main',
  });
});

// ---- Dashboard Kế toán ----
router.get('/dashboard/ketoan', requireRole('ketoan'), (req, res) => {
  res.render('dashboard/ketoan', {
    title: 'Dashboard - Kế toán',
    layout: 'main',
  });
});

// ---- Dashboard Quản lý ----
router.get('/dashboard/quanly', requireRole('quanly'), (req, res) => {
  res.render('dashboard/quanly', {
    title: 'Dashboard - Quản lý',
    layout: 'main',
  });
});

// ---- Dashboard Khách hàng ----
router.get('/dashboard/khachhang', requireRole('khachhang'), (req, res) => {
  res.render('dashboard/khachhang', {
    title: 'Dashboard - Khách hàng',
    layout: 'main',
  });
});

export default router;
