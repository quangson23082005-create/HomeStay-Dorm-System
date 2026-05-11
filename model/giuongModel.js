import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Giuong = sequelize.define('giuong', {
  id_giuong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  id_phong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  gia: {
    type: DataTypes.DECIMAL(15, 2),
  },
  tinh_trang: {
    type: DataTypes.STRING(50),
  },
}, {
  timestamps: false,
  tableName: 'giuong',
});

// Lấy tất cả giường của một phòng
export const layGiuongTheoPhong = async (id_phong) => {
  const records = await Giuong.findAll({
    where: { id_phong },
    order: [['id_giuong', 'ASC']],
  });
  return records.map((r) => r.toJSON());
};

// Lấy giường theo id_giuong và id_phong
export const layTheoId = async (id_giuong, id_phong) => {
  const record = await Giuong.findOne({
    where: { id_giuong, id_phong },
  });
  return record ? record.toJSON() : null;
};
