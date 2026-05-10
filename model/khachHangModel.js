import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const KhachHang = sequelize.define('khach_hang', {
  id_khach_hang: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ho_va_ten:  { type: DataTypes.STRING(100) },
  gioi_tinh:  { type: DataTypes.STRING(10)  },
  cccd:       { type: DataTypes.STRING(20), unique: true },
  ngay_sinh:  { type: DataTypes.DATEONLY },
  dia_chi:    { type: DataTypes.TEXT },
  sdt:        { type: DataTypes.STRING(20) },
}, {
  timestamps: false,
  tableName: 'khach_hang',
});

// Lấy thông tin khách hàng theo id
export const layTheoId = async (id_khach_hang) => {
  const record = await KhachHang.findByPk(id_khach_hang);
  return record ? record.toJSON() : null;
};