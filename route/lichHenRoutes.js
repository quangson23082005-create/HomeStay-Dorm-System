import express from 'express';
import lichHenService from '../service/lichHenService.js';

const router = express.Router();

// GET /lich-hen - Danh sách phiếu chờ
router.get('/', async (req, res) => {
  try {
    const { search = '', ngayTu = '', ngayDen = '', page = 1 } = req.query;
    const result = await lichHenService.getDanhSachPhieuCho({
      search,
      ngayTu: ngayTu || null,
      ngayDen: ngayDen || null,
      page: parseInt(page),
      limit: 4,
    });

    res.render('lich-hen-list', {
      title: 'Danh sách phiếu chờ',
      layout: 'main',
      items: result.items,
      itemCount: result.items.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      search,
      ngayTu,
      ngayDen,
      prevPage: result.page > 1 ? result.page - 1 : null,
      nextPage: result.page < result.totalPages ? result.page + 1 : null,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Không thể tải danh sách phiếu chờ.' });
  }
});

// GET /lich-hen/:idPhieu - Chi tiết lịch hẹn
router.get('/:idPhieu', async (req, res) => {
  try {
    const { idPhieu } = req.params;
    const chiTiet = await lichHenService.getChiTietPhieu(idPhieu);
    if (!chiTiet) return res.render('error', { message: 'Không tìm thấy phiếu đăng ký.' });

    res.render('lich-hen-detail', {
      title: 'Chi tiết lịch hẹn',
      layout: 'main',
      idPhieu,
      phieu: chiTiet.phieu,
      khachHang: chiTiet.khach_hang,
      phongGhep: chiTiet.phong_ghep || [],
      phongNguyenCan: chiTiet.phong_nguyen_can || [],
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Không thể tải chi tiết phiếu.' });
  }
});

// GET /lich-hen/api/ca-da-dat?ngay=YYYY-MM-DD - API lấy giờ đã đặt
router.get('/api/ca-da-dat', async (req, res) => {
  try {
    const { ngay } = req.query;
    if (!ngay) return res.json({ error: 'Thiếu tham số ngày' });
    const caDaDat = await lichHenService.getCaDaDat(ngay);
    res.json({ data: caDaDat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /lich-hen/xac-nhan - Xác nhận tạo lịch hẹn
router.post('/xac-nhan', async (req, res) => {
  try {
    const { idPhieuDk, ngay, gio, ghiChu, idNhanSu = 1 } = req.body;
    if (!idPhieuDk || !ngay || !gio) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    const ngayGio = `${ngay} ${gio}:00`;
    const newId = await lichHenService.taoLichHen({ ngayGio, idPhieuDk, idNhanSu, ghiChu });
    res.json({ success: true, id: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Không thể tạo lịch hẹn' });
  }
});

export default router;