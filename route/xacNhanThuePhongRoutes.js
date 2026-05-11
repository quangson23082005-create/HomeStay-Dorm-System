import express from 'express';
import {
  layThongTinKhachHang,
  layDanhSachPhongDaDangKy,
  layDanhSachChuaXacNhan,
  kiemTraPhieuDaXacNhan,
  xacNhanChonPhong,
  normalizeLoaiThue,
} from '../service/xacNhanThuePhongService.js';

const router = express.Router();

// ID khách hàng mặc định (sau này lấy từ session/auth)
const DEFAULT_KHACH_HANG_ID = 1000;

// ── Helper dựng view model ────────────────────────────────────────────────────
const buildViewModel = (data = {}) => ({
  title: 'Xác nhận thuê phòng',
  khachHang:            data.khachHang            || null,
  danhSachPhieu:        data.danhSachPhieu        || [],
  loai_thue:            data.loai_thue            || 'ghep',
  id_phieu:             data.id_phieu             || null,
  daDangKy:             data.daDangKy             || [],
  giuongTheoPhong:      data.giuongTheoPhong      || {},
  isPhieuDaXacNhan:     data.isPhieuDaXacNhan     || false,
  success:              data.success              || '',
  error:                data.error                || '',
});

// ── GET / ─────────────────────────────────────────────────────────────────────
// Trang chính: load thông tin khách hàng + phiếu đăng ký
router.get('/xac-nhan-thue-phong', async (req, res) => {
  try {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID);

    // Normalize loai_thue cho tất cả phiếu
    danhSachPhieu.forEach(phieu => {
      phieu.loai_thue = normalizeLoaiThue(phieu.loai_thue);
    });

    // Mặc định chọn phiếu đầu tiên nếu có
    const phieuDauTien = danhSachPhieu[0] || null;
    const id_phieu = phieuDauTien?.id_phieu || null;
    const loai_thue = phieuDauTien?.loai_thue || 'ghep';

    // Kiểm tra xem phiếu đã xác nhận chưa
    let isPhieuDaXacNhan = false;
    let daDangKy = [];
    let giuongTheoPhong = {};
    
    if (id_phieu) {
      isPhieuDaXacNhan = await kiemTraPhieuDaXacNhan(id_phieu, loai_thue);
      
      // Nếu chưa xác nhận, lấy danh sách chưa xác nhận
      if (!isPhieuDaXacNhan) {
        const result = await layDanhSachChuaXacNhan(id_phieu, DEFAULT_KHACH_HANG_ID, loai_thue);
        daDangKy = result.daDangKy || [];
        giuongTheoPhong = result.giuongTheoPhong || {};
      }
    }

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang,
      danhSachPhieu,
      loai_thue,
      id_phieu,
      daDangKy,
      giuongTheoPhong,
      isPhieuDaXacNhan,
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
  let loai_thue    = req.body.loai_thue  || 'ghep';

  try {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID);

    // Normalize loai_thue cho tất cả phiếu
    danhSachPhieu.forEach(phieu => {
      phieu.loai_thue = normalizeLoaiThue(phieu.loai_thue);
    });

    // Nếu có id_phieu, lấy loai_thue chính xác từ phiếu đó (đã normalized)
    if (id_phieu) {
      const phieuHienTai = danhSachPhieu.find(p => p.id_phieu === Number(id_phieu));
      if (phieuHienTai) {
        loai_thue = phieuHienTai.loai_thue;
      }
    }

    // Normalize loai_thue từ body nếu không tìm thấy phiếu
    loai_thue = normalizeLoaiThue(loai_thue);

    // Kiểm tra xem phiếu đã xác nhận chưa
    let isPhieuDaXacNhan = false;
    let daDangKy = [];
    let giuongTheoPhong = {};
    
    if (id_phieu) {
      isPhieuDaXacNhan = await kiemTraPhieuDaXacNhan(id_phieu, loai_thue);
      
      // Nếu chưa xác nhận, lấy danh sách chưa xác nhận
      if (!isPhieuDaXacNhan) {
        const result = await layDanhSachChuaXacNhan(id_phieu, DEFAULT_KHACH_HANG_ID, loai_thue);
        daDangKy = result.daDangKy || [];
        giuongTheoPhong = result.giuongTheoPhong || {};
      }
    }

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang,
      danhSachPhieu,
      loai_thue,
      id_phieu,
      daDangKy,
      giuongTheoPhong,
      isPhieuDaXacNhan,
    }));
  } catch (error) {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID).catch(() => ({
        khachHang: null, danhSachPhieu: [],
      }));
    
    // Normalize loai_thue cho danhSachPhieu
    danhSachPhieu.forEach(phieu => {
      phieu.loai_thue = normalizeLoaiThue(phieu.loai_thue);
    });

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang, danhSachPhieu, loai_thue: normalizeLoaiThue(loai_thue), id_phieu,
      error: error.message,
    }));
  }
});

// ── POST /xac-nhan-chon-phong ──────────────────────────────────────────────────
// Nhấn "Xác nhận chọn phòng" → cập nhật duoc_chon = TRUE
// Body: { id_phieu, loai_thue, danh_sach_chon: JSON string }
// CHỈ CHO PHÉP CHỌN DUNG 1 PHONG/GIUONG
router.post('/xac-nhan-thue-phong/xac-nhan-chon-phong', async (req, res) => {
  const id_phieu     = req.body.id_phieu    || null;
  let loai_thue      = req.body.loai_thue   || 'ghep';
  // danh_sach_chon được gửi dưới dạng JSON string từ form hidden input
  let danhSachChon = [];
  try {
    danhSachChon = JSON.parse(req.body.danh_sach_chon || '[]');
  } catch {
    danhSachChon = [];
  }

  try {
    // Normalize loai_thue
    loai_thue = normalizeLoaiThue(loai_thue);

    // Xác nhận lựa chọn (service sẽ kiểm tra chỉ có 1 lựa chọn)
    await xacNhanChonPhong(
      id_phieu,
      DEFAULT_KHACH_HANG_ID,
      loai_thue,
      danhSachChon
    );

    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID);

    // Normalize loai_thue cho tất cả phiếu
    danhSachPhieu.forEach(phieu => {
      phieu.loai_thue = normalizeLoaiThue(phieu.loai_thue);
    });

    // Phiếu vừa được xác nhận, nên không cần load daDangKy
    const isPhieuDaXacNhan = true;

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang,
      danhSachPhieu,
      loai_thue,
      id_phieu,
      daDangKy: [],
      giuongTheoPhong: {},
      isPhieuDaXacNhan,
      success: `Đã xác nhận 1 ${loai_thue === 'ghep' ? 'giường' : 'phòng'} thành công.`,
    }));
  } catch (error) {
    const { khachHang, danhSachPhieu } =
      await layThongTinKhachHang(DEFAULT_KHACH_HANG_ID).catch(() => ({
        khachHang: null, danhSachPhieu: [],
      }));
    
    // Normalize loai_thue cho tất cả phiếu
    danhSachPhieu.forEach(phieu => {
      phieu.loai_thue = normalizeLoaiThue(phieu.loai_thue);
    });

    // Normalize loai_thue từ body
    loai_thue = normalizeLoaiThue(loai_thue);
    
    // Tải lại danh sách chưa xác nhận để hiển thị form lại
    let daDangKy = [];
    let giuongTheoPhong = {};
    try {
      if (id_phieu) {
        const result = await layDanhSachChuaXacNhan(id_phieu, DEFAULT_KHACH_HANG_ID, loai_thue);
        daDangKy = result.daDangKy || [];
        giuongTheoPhong = result.giuongTheoPhong || {};
      }
    } catch (e) {
      // Nếu lỗi khi lấy danh sách, để rỗng
    }

    res.render('xac-nhan-thue-phong', buildViewModel({
      khachHang, danhSachPhieu, loai_thue, id_phieu,
      daDangKy, giuongTheoPhong,
      isPhieuDaXacNhan: false,
      error: error.message,
    }));
  }
});

// ── POST /huy ─────────────────────────────────────────────────────────────────
router.post('/xac-nhan-thue-phong/huy', (_req, res) => {
  res.redirect('/xac-nhan-thue-phong');
});

export default router;