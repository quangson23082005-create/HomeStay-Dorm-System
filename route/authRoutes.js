// route/authRoutes.js
import express from 'express';
import authService from '../service/authService.js';
import { requireLogin, requireRole } from '../middleware/auth.js';

const router = express.Router();

// =====================================================
// ĐĂNG NHẬP
// =====================================================
router.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Đăng nhập', layout: 'auth' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authService.dangNhap({ email, password });
    req.session.user = {
      id:        user.id,
      username:  user.email,
      ho_ten:    user.hoTen,
      role:      user.role,
      roleLabel: user.roleLabel,
      avatar:    user.avatar,
    };
    return res.redirect('/dashboard');
  } catch (err) {
    return res.render('login', {
      title: 'Đăng nhập',
      layout: 'auth',
      error: err.message,
      email,
    });
  }
});

// =====================================================
// ĐĂNG KÝ
// =====================================================
router.get('/register', (req, res) => {
  if (req.session?.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Tạo tài khoản', layout: 'auth' });
});

router.post('/register', async (req, res) => {
  const { ho_ten, email, password, confirm_password, role } = req.body;

  // Validate
  const errors = {};
  if (!ho_ten || ho_ten.trim().length < 2)   errors.ho_ten = 'Vui lòng nhập họ tên (ít nhất 2 ký tự).';
  if (!email || !email.includes('@'))         errors.email  = 'Email không hợp lệ.';
  if (!password || password.length < 6)       errors.password = 'Mật khẩu ít nhất 6 ký tự.';
  if (password !== confirm_password)          errors.confirm_password = 'Mật khẩu xác nhận không khớp.';
  if (!['sale','ketoan','quanly','khachhang'].includes(role)) errors.role = 'Vui lòng chọn vai trò.';

  if (Object.keys(errors).length > 0) {
    return res.render('register', {
      title: 'Tạo tài khoản',
      layout: 'auth',
      errors,
      old: { ho_ten, email, role },
    });
  }

  try {
    await authService.dangKy({ hoTen: ho_ten, email, password, role });
    return res.render('login', {
      title: 'Đăng nhập',
      layout: 'auth',
      success: 'Tạo tài khoản thành công! Đăng nhập để tiếp tục.',
      email,
    });
  } catch (err) {
    return res.render('register', {
      title: 'Tạo tài khoản',
      layout: 'auth',
      errors: { email: err.message },
      old: { ho_ten, email, role },
    });
  }
});

// =====================================================
// ĐĂNG XUẤT
// =====================================================
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// =====================================================
// DASHBOARD - redirect theo role
// =====================================================
router.get('/dashboard', requireLogin, (req, res) => {
  const map = {
    sale:      '/dashboard/sale',
    ketoan:    '/dashboard/ketoan',
    quanly:    '/dashboard/quanly',
    khachhang: '/dashboard/khachhang',
  };
  res.redirect(map[req.session.user.role] || '/login');
});

router.get('/dashboard/sale',      requireRole('sale'),      (req, res) => res.render('dashboard/sale',      { title: 'Dashboard', layout: 'main' }));
router.get('/dashboard/ketoan',    requireRole('ketoan'),    (req, res) => res.render('dashboard/ketoan',    { title: 'Dashboard', layout: 'main' }));
router.get('/dashboard/quanly',    requireRole('quanly'),    (req, res) => res.render('dashboard/quanly',    { title: 'Dashboard', layout: 'main' }));
router.get('/dashboard/khachhang', requireRole('khachhang'), (req, res) => res.render('dashboard/khachhang', { title: 'Dashboard', layout: 'main' }));

export default router;