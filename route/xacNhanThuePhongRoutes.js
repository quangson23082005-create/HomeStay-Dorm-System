import express from 'express';
import {
  layThongTinKhachHang,
  layDanhSachPhongDaDangKy,
  xacNhanChonPhong,
} from '../service/xacNhanThuePhongService.js';

const router = express.Router();

// ID khách hàng mặc định (sau này lấy từ session/auth)
const DEFAULT_KHACH_HANG_ID = 1000;

// ── Helper dựng view model ────────────────────────────────────────────────────
const buildViewModel = (data = {}) => ({
  title: 'Xác nhận thuê phòng',
  khachHang:        data.khachHang        || null,
  danhSachPhieu:    data.danhSachPhieu    || [],
  loai_thue:        data.loai_thue        || 'ghep',
  id_phieu:         data.id_phieu         || null,
  daDangKy:         data.daDangKy         || [],
  giuongTheoPhong:  data.giuongTheoPhong  || {},
  success:          data.success          || '',
  error:            data.error            || '',
});

// ── GET / ─────────────────────────────────────────────────────────────────────
// Trang chính: load thông tin khách hàng + phiếu đăng ký
router.get('/xac-nhan-thue-phong', async (req, res) => {
  try {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID);

    // Mặc định chọn phiếu đầu tiên nếu có
    const phieuDauTien = danhSachPhieu[0] || null;
    const id_phieu = phieuDauTien?.id_phieu || null;
    const loai_thue = phieuDauTien?.loai_thue || 'ghep';

    // Load danh sách phòng/giường cho phiếu mặc định
    let daDangKy = [];
    if (id_phieu) {
      const result = await layDanhSachPhongDaDangKy(id_phieu, DEFAULT_KHACH_HANG_ID, loai_thue);
      daDangKy = result.daDangKy || [];
    }

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang,
      danhSachPhieu,
      loai_thue,
      id_phieu,
      daDangKy,
    }));
  } catch (error) {
    res.render('xac-nhan-thue-phong', buildViewModel({ error: error.message }));
  }
});

// ── POST /load-phong ───────────────────────────────────────────────────────────
// Khi người dùng chuyển tab (ghep ↔ nguyen_can) hoặc chọn phiếu khác
// → load lại danh sách phòng/giường tương ứng
router.post('/xac-nhan-thue-phong/load-phong', async (req, res) => {
  const id_phieu   = req.body.id_phieu   || null;
  const loai_thue  = req.body.loai_thue  || 'ghep';

  try {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID);

    const { daDangKy, giuongTheoPhong } =
      await layDanhSachPhongDaDangKy(id_phieu, DEFAULT_KHACH_HANG_ID, loai_thue);

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang,
      danhSachPhieu,
      loai_thue,
      id_phieu,
      daDangKy,
      giuongTheoPhong: giuongTheoPhong || {},
    }));
  } catch (error) {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID).catch(() => ({
        khachHang: null, danhSachPhieu: [],
      }));
    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang, danhSachPhieu, loai_thue, id_phieu,
      error: error.message,
    }));
  }
});

// ── POST /xac-nhan-chon-phong ──────────────────────────────────────────────────
// Nhấn "Xác nhận chọn phòng" → cập nhật duoc_chon = TRUE
// Body: { id_phieu, loai_thue, danh_sach_chon: JSON string }
router.post('/xac-nhan-thue-phong/xac-nhan-chon-phong', async (req, res) => {
  const id_phieu     = req.body.id_phieu    || null;
  const loai_thue    = req.body.loai_thue   || 'ghep';
  // danh_sach_chon được gửi dưới dạng JSON string từ form hidden input
  let danhSachChon = [];
  try {
    danhSachChon = JSON.parse(req.body.danh_sach_chon || '[]');
  } catch {
    danhSachChon = [];
  }

  try {
    await xacNhanChonPhong(
      id_phieu,
      DEFAULT_KHACH_HANG_ID,
      loai_thue,
      danhSachChon
    );

    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID);
    const { daDangKy, giuongTheoPhong } =
      await layDanhSachPhongDaDangKy(id_phieu, DEFAULT_KHACH_HANG_ID, loai_thue);

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang,
      danhSachPhieu,
      loai_thue,
      id_phieu,
      daDangKy,
      giuongTheoPhong: giuongTheoPhong || {},
      success: `Đã xác nhận ${danhSachChon.length} ${loai_thue === 'ghep' ? 'giường' : 'phòng'} thành công.`,
    }));
  } catch (error) {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID).catch(() => ({
        khachHang: null, danhSachPhieu: [],
      }));
    const { daDangKy, giuongTheoPhong } =
      await layDanhSachPhongDaDangKy(id_phieu, DEFAULT_KHACH_HANG_ID, loai_thue)
        .catch(() => ({ daDangKy: [], giuongTheoPhong: {} }));

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang, danhSachPhieu, loai_thue, id_phieu,
      daDangKy, giuongTheoPhong: giuongTheoPhong || {},
      error: error.message,
    }));
  }
});

// ── POST /huy ─────────────────────────────────────────────────────────────────
router.post('/xac-nhan-thue-phong/huy', (_req, res) => {
  res.redirect('/xac-nhan-thue-phong');
});

export default router;