// service/authService.js
import bcrypt from 'bcrypt';
import supabase from '../config/supabase.js';

const SALT_ROUNDS = 10;

const authService = {
  // Đăng ký tài khoản mới
  async dangKy({ hoTen, email, password, role }) {
    // Kiểm tra email đã tồn tại chưa
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new Error('Email này đã được sử dụng.');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Lưu vào Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ ho_ten: hoTen, email, password: hashedPassword, role }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Đăng nhập
  async dangNhap({ email, password }) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Email hoặc mật khẩu không đúng.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không đúng.');
    }

    return {
      id:        user.id,
      hoTen:     user.ho_ten,
      email:     user.email,
      role:      user.role,
      roleLabel: getRoleLabel(user.role),
      avatar:    getAvatar(user.ho_ten),
    };
  },
};

function getRoleLabel(role) {
  const map = {
    sale:      'Nhân viên Sales',
    ketoan:    'Nhân viên Kế toán',
    quanly:    'Quản lý',
    khachhang: 'Khách hàng',
  };
  return map[role] || role;
}

function getAvatar(hoTen = '') {
  return hoTen.split(' ').filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join('');
}

export default authService;