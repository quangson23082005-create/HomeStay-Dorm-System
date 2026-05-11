import * as khachHangModel        from '../model/khachHangModel.js';
import * as phieuDangKyModel      from '../model/phieuDangKyModel.js';
import * as phieuGhepModel        from '../model/phieuDangKyGhepModel.js';
import * as phieuNguyenCanModel   from '../model/phieuDangKyNguyenCanModel.js';
import sequelize from '../config/database.js';

const LOAI_THUE = {
  GHEP:       'ghep',
  NGUYEN_CAN: 'nguyen_can',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const validateKhachHang = (khachHang, id) => {
  if (!khachHang) {
    throw new Error(`Không tìm thấy khách hàng với id = ${id}.`);
  }
};

const validatePhieuThuocKhach = (phieu, id_khach_hang) => {
  if (!phieu || phieu.id_khach_hang !== id_khach_hang) {
    throw new Error('Phiếu đăng ký không thuộc về khách hàng này.');
  }
};

const validateLoaiThue = (loai_thue, phieu_loai_thue) => {
  if (loai_thue !== phieu_loai_thue) {
    throw new Error(
      `Loại thuê không khớp: phiếu là "${phieu_loai_thue}", yêu cầu "${loai_thue}".`
    );
  }
};

const validateDanhSachChon = (danhSach) => {
  if (!Array.isArray(danhSach) || danhSach.length === 0) {
    throw new Error('Vui lòng chọn ít nhất 1 giường hoặc phòng.');
  }
};

const validateMotLuaChon = (danhSach) => {
  if (!Array.isArray(danhSach) || danhSach.length !== 1) {
    throw new Error('Vui lòng chọn duy nhất 1 giường hoặc phòng.');
  }
};

// ── Exported service functions ────────────────────────────────────────────────

// <<static>> LayThongTinKhachHang()
// Trả về thông tin khách hàng + tất cả phiếu đăng ký
export const layThongTinKhachHang = async (id_khach_hang) => {
  const khachHang = await khachHangModel.layTheoId(id_khach_hang);
  validateKhachHang(khachHang, id_khach_hang);

  const danhSachPhieu = await phieuDangKyModel.layTheoKhachHang(id_khach_hang);

  return { khachHang, danhSachPhieu };
};

// <<static>> LayDanhSachPhongDaDangKy()
// Lấy chi tiết các giường/phòng đã đăng ký trong một phiếu
// Với thuê ghép: trả thêm danh sách toàn bộ giường trong mỗi phòng (để render grid)
export const layDanhSachPhongDaDangKy = async (id_phieu, id_khach_hang, loai_thue) => {
  const phieu = await phieuDangKyModel.layTheoKhachHang(id_khach_hang)
    .then((list) => list.find((p) => p.id_phieu === Number(id_phieu)));

  validatePhieuThuocKhach(phieu ? { ...phieu, id_khach_hang } : null, id_khach_hang);
  validateLoaiThue(loai_thue, phieu.loai_thue);

  if (loai_thue === LOAI_THUE.GHEP) {
    const daDangKy = await phieuGhepModel.layTheoPhieu(id_phieu);

    // Lấy danh sách id_phong không trùng → query grid giường cho mỗi phòng
    const idPhongSet = [...new Set(daDangKy.map((r) => r.id_phong))];
    const giuongTheoPhong = {};
    await Promise.all(
      idPhongSet.map(async (id_phong) => {
        giuongTheoPhong[id_phong] = await phieuGhepModel.layGiuongTrongPhong(id_phong);
      })
    );

    return { loai_thue, daDangKy, giuongTheoPhong };
  }

  // nguyen_can
  const daDangKy = await phieuNguyenCanModel.layTheoPhieu(id_phieu);
  return { loai_thue, daDangKy };
};

// <<static>> XacNhanChonPhong()
// Cập nhật duoc_chon = TRUE trong bảng phiếu tương ứng
// CHỈ CHO PHÉP CHỌN DUNG 1 PHONG/GIUONG
export const xacNhanChonPhong = async (id_phieu, id_khach_hang, loai_thue, danhSachChon) => {
  // danhSachChon với ghep:       [{ id_phong, id_giuong }]    <- DUNG 1 ITEM
  // danhSachChon với nguyen_can: [{ id_phong }]                <- DUNG 1 ITEM

  const phieu = await phieuDangKyModel.layTheoKhachHang(id_khach_hang)
    .then((list) => list.find((p) => p.id_phieu === Number(id_phieu)));

  validatePhieuThuocKhach(phieu ? { ...phieu, id_khach_hang } : null, id_khach_hang);
  validateLoaiThue(loai_thue, phieu.loai_thue);
  validateMotLuaChon(danhSachChon); // Kiểm tra chỉ có 1 lựa chọn

  if (loai_thue === LOAI_THUE.GHEP) {
    // Kiểm tra cặp (id_phong, id_giuong) có trong phiếu không
    const { id_phong, id_giuong } = danhSachChon[0];
    const daDangKy = await phieuGhepModel.layTheoPhieu(id_phieu);
    const hopLe = daDangKy.some(
      (r) => r.id_phong === Number(id_phong) && r.id_giuong === Number(id_giuong)
    );
    if (!hopLe) {
      throw new Error('Giường được chọn không thuộc phiếu đăng ký này.');
    }
    await phieuGhepModel.capNhatDuocChon(id_phieu, id_phong, id_giuong);
    return { cap_nhat: 1, loai_thue };
  }

  // nguyen_can
  const { id_phong } = danhSachChon[0];
  const daDangKy = await phieuNguyenCanModel.layTheoPhieu(id_phieu);
  const hopLe = daDangKy.some((r) => r.id_phong === Number(id_phong));
  if (!hopLe) {
    throw new Error('Phòng được chọn không thuộc phiếu đăng ký này.');
  }
  await phieuNguyenCanModel.capNhatDuocChon(id_phieu, id_phong);
  return { cap_nhat: 1, loai_thue };
};

// <<static>> KiemTraPhieuDaXacNhan()
// Kiểm tra xem phiếu đã được xác nhận chưa (duoc_chon = TRUE)
export const kiemTraPhieuDaXacNhan = async (id_phieu, loai_thue) => {
  if (loai_thue === LOAI_THUE.GHEP) {
    // Kiểm tra xem có bất kỳ giường nào trong phiếu có duoc_chon = TRUE không
    const [rows] = await sequelize.query(
      `SELECT COUNT(*) as count FROM phieu_dang_ky_ghep WHERE id_phieu = :id_phieu AND duoc_chon = TRUE`,
      { replacements: { id_phieu } }
    );
    return rows[0].count > 0;
  }

  // nguyen_can
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) as count FROM phieu_dang_ky_nguyen_can WHERE id_phieu = :id_phieu AND duoc_chon = TRUE`,
    { replacements: { id_phieu } }
  );
  return rows[0].count > 0;
};

// <<static>> LayDanhSachChuaXacNhan()
// Lấy danh sách phòng/giường chưa được xác nhận (duoc_chon = FALSE)
// Nếu tất cả đã được xác nhận, trả về mảng rỗng
export const layDanhSachChuaXacNhan = async (id_phieu, id_khach_hang, loai_thue) => {
  const phieu = await phieuDangKyModel.layTheoKhachHang(id_khach_hang)
    .then((list) => list.find((p) => p.id_phieu === Number(id_phieu)));

  validatePhieuThuocKhach(phieu ? { ...phieu, id_khach_hang } : null, id_khach_hang);
  validateLoaiThue(loai_thue, phieu.loai_thue);

  if (loai_thue === LOAI_THUE.GHEP) {
    // Lấy danh sách giường chưa xác nhận
    const [rows] = await sequelize.query(
      `SELECT
         pdkg.id_phieu,
         pdkg.id_phong,
         pdkg.id_giuong,
         pdkg.duoc_chon,
         p.tang,
         p.loai_phong,
         p.so_luong_giuong,
         g.tinh_trang,
         g.gia
       FROM phieu_dang_ky_ghep pdkg
       JOIN phong p ON pdkg.id_phong = p.id_phong
       JOIN giuong g ON pdkg.id_giuong = g.id_giuong
                     AND pdkg.id_phong = g.id_phong
       WHERE pdkg.id_phieu = :id_phieu AND pdkg.duoc_chon = FALSE
       ORDER BY pdkg.id_phong, pdkg.id_giuong`,
      { replacements: { id_phieu } }
    );

    // Lấy danh sách toàn bộ giường theo phòng
    const daDangKy = rows;
    const idPhongSet = [...new Set(daDangKy.map((r) => r.id_phong))];
    const giuongTheoPhong = {};
    await Promise.all(
      idPhongSet.map(async (id_phong) => {
        giuongTheoPhong[id_phong] = await phieuGhepModel.layGiuongTrongPhong(id_phong);
      })
    );

    return { loai_thue, daDangKy, giuongTheoPhong };
  }

  // nguyen_can
  const [rows] = await sequelize.query(
    `SELECT
       pdknc.id_phieu,
       pdknc.id_phong,
       pdknc.duoc_chon,
       p.tang,
       p.loai_phong,
       p.so_luong_giuong,
       p.gia_thue,
       p.trang_thai
     FROM phieu_dang_ky_nguyen_can pdknc
     JOIN phong p ON pdknc.id_phong = p.id_phong
     WHERE pdknc.id_phieu = :id_phieu AND pdknc.duoc_chon = FALSE
     ORDER BY pdknc.id_phong`,
    { replacements: { id_phieu } }
  );

  return { loai_thue, daDangKy: rows };
};