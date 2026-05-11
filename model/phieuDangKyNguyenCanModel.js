import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PhieuDangKyNguyenCan = sequelize.define('phieu_dang_ky_nguyen_can', {
  id_phieu:  { type: DataTypes.INTEGER, primaryKey: true },
  id_phong:  { type: DataTypes.INTEGER, primaryKey: true },
  duoc_chon: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: false,
  tableName: 'phieu_dang_ky_nguyen_can',
});

// Lấy danh sách phòng đã đăng ký theo id_phieu, JOIN thêm thông tin phòng
export const layTheoPhieu = async (id_phieu) => {
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
     WHERE pdknc.id_phieu = :id_phieu
     ORDER BY pdknc.id_phong`,
    { replacements: { id_phieu } }
  );
  return rows;
};

// Cập nhật duoc_chon = TRUE cho một phòng cụ thể trong phiếu
export const capNhatDuocChon = async (id_phieu, id_phong) => {
  const [affectedRows] = await sequelize.query(
    `UPDATE phieu_dang_ky_nguyen_can
     SET duoc_chon = TRUE
     WHERE id_phieu = :id_phieu
       AND id_phong = :id_phong`,
    { replacements: { id_phieu, id_phong } }
  );
  return affectedRows;
};

// Cập nhật nhiều phòng cùng lúc (batch update)
export const capNhatDuocChonNhieu = async (id_phieu, danhSachIdPhong) => {
  // danhSachIdPhong: [id_phong, ...]
  const results = await Promise.all(
    danhSachIdPhong.map((id_phong) =>
      capNhatDuocChon(id_phieu, id_phong)
    )
  );
  return results;
};