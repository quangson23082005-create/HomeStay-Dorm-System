// config/accounts.js
// 4 tài khoản cứng cho 4 vai trò

const ACCOUNTS = [
  {
    id: 1,
    username: 'sale',
    password: 'sale123',
    role: 'sale',
    roleLabel: 'Nhân viên Sales',
    ho_ten: 'Nguyen Van Sale',
    avatar: 'NS',
  },
  {
    id: 2,
    username: 'ketoan',
    password: 'ketoan123',
    role: 'ketoan',
    roleLabel: 'Nhân viên Kế toán',
    ho_ten: 'Tran Thi Ke Toan',
    avatar: 'KT',
  },
  {
    id: 3,
    username: 'quanly',
    password: 'quanly123',
    role: 'quanly',
    roleLabel: 'Quản lý',
    ho_ten: 'Le Van Quan Ly',
    avatar: 'QL',
  },
  {
    id: 4,
    username: 'khachhang',
    password: 'kh123',
    role: 'khachhang',
    roleLabel: 'Khách hàng',
    ho_ten: 'Pham Thi Khach',
    avatar: 'KH',
  },
];

export default ACCOUNTS;
