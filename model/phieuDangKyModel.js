import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PhieuDangKy = sequelize.define('phieu_dang_ky', {
  id_phieu: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  so_luong_nguoi_o:    { type: DataTypes.INTEGER },
  tang:                { type: DataTypes.INTEGER },
  loai_phong:          { type: DataTypes.STRING(50) },
  thoi_gian_o_du_kien: { type: DataTypes.DATEONLY },
  thoi_han_thue:       { type: DataTypes.STRING(20) },
  mo_ta_tieu_chi:      { type: DataTypes.TEXT },
  loai_thue:           { type: DataTypes.STRING(50) }, // 'ghep' | 'nguyen_can'
  id_khach_hang:       { type: DataTypes.INTEGER },
}, {
  timestamps: false,
  tableName: 'phieu_dang_ky',
});

// Lấy tất cả phiếu đăng ký của một khách hàng
export const layTheoKhachHang = async (id_khach_hang) => {
  const records = await PhieuDangKy.findAll({
    where: { id_khach_hang },
  });
  return records.map((r) => r.toJSON());
};