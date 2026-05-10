// middleware/auth.js

export function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  // Gắn user vào res.locals để dùng trong tất cả view
  res.locals.user = req.session.user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('error', {
        title: 'Không có quyền truy cập',
        message: 'Bạn không có quyền truy cập trang này.',
      });
    }
    res.locals.user = req.session.user;
    next();
  };
}
