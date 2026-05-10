import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

// Bảng phieu_dang_ky_ghep có composite PK (id_phieu, id_phong, id_giuong)
const PhieuDangKyGhep = sequelize.define('phieu_dang_ky_ghep', {
  id_phieu:  { type: DataTypes.INTEGER, primaryKey: true },
  id_phong:  { type: DataTypes.INTEGER, primaryKey: true },
  id_giuong: { type: DataTypes.INTEGER, primaryKey: true },
  duoc_chon: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: false,
  tableName: 'phieu_dang_ky_ghep',
});

// Lấy danh sách giường đã đăng ký theo id_phieu,
// JOIN thêm thông tin phòng và giường
export const layTheoPhieu = async (id_phieu) => {
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
     JOIN phong  p ON pdkg.id_phong  = p.id_phong
     JOIN giuong g ON pdkg.id_giuong = g.id_giuong
                   AND pdkg.id_phong = g.id_phong
     WHERE pdkg.id_phieu = :id_phieu
     ORDER BY pdkg.id_phong, pdkg.id_giuong`,
    { replacements: { id_phieu } }
  );
  return rows;
};

// Lấy toàn bộ giường trong một phòng (để render grid)
export const layGiuongTrongPhong = async (id_phong) => {
  const [rows] = await sequelize.query(
    `SELECT id_giuong, id_phong, gia, tinh_trang
     FROM giuong
     WHERE id_phong = :id_phong
     ORDER BY id_giuong`,
    { replacements: { id_phong } }
  );
  return rows;
};

// Cập nhật duoc_chon = TRUE cho một giường cụ thể trong phiếu
export const capNhatDuocChon = async (id_phieu, id_phong, id_giuong) => {
  const [affectedRows] = await sequelize.query(
    `UPDATE phieu_dang_ky_ghep
     SET duoc_chon = TRUE
     WHERE id_phieu  = :id_phieu
       AND id_phong  = :id_phong
       AND id_giuong = :id_giuong`,
    { replacements: { id_phieu, id_phong, id_giuong } }
  );
  return affectedRows;
};

// Cập nhật nhiều giường cùng lúc (batch update)
export const capNhatDuocChonNhieu = async (id_phieu, danhSachChon) => {
  // danhSachChon: [{ id_phong, id_giuong }, ...]
  const results = await Promise.all(
    danhSachChon.map(({ id_phong, id_giuong }) =>
      capNhatDuocChon(id_phieu, id_phong, id_giuong)
    )
  );
  return results;
};