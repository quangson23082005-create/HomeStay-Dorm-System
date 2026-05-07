import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Define Room model
const Room = sequelize.define('phong', {
  id_phong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  loai_phong: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tang: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  trang_thai: {
    type: DataTypes.STRING,
    defaultValue: 'trong',
  },
  so_luong_giuong: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  gia_thue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'phong',
});

export const getAllRooms = async (filters = {}) => {
  let where = {};

  if (filters.search) {
    const search = filters.search.trim();
    if (search) {
      const { Op } = await import('sequelize');
      where = {
        [Op.or]: [
          { id_phong: isNaN(search) ? null : Number(search) },
          { loai_phong: { [Op.iLike]: `%${search}%` } },
          { trang_thai: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }
  }

  if (filters.loai_phong && filters.loai_phong !== 'all') {
    where.loai_phong = filters.loai_phong;
  }

  if (filters.trang_thai && filters.trang_thai !== 'all') {
    where.trang_thai = filters.trang_thai;
  }

  if (filters.tang && filters.tang !== 'all') {
    const floor = Number(filters.tang);
    if (!isNaN(floor)) {
      where.tang = floor;
    }
  }

  const rooms = await Room.findAll({
    where,
    order: [['id_phong', 'ASC']],
  });

  return rooms.map((room) => room.toJSON());
};

export const getRoomById = async (id) => {
  const room = await Room.findByPk(id);
  return room ? room.toJSON() : null;
};

export const createRoom = async (room) => {
  const newRoom = await Room.create(room);
  return newRoom.toJSON();
};

export const updateRoom = async (id, updates) => {
  const room = await Room.findByPk(id);
  if (!room) {
    throw new Error('Phòng không tồn tại.');
  }
  await room.update(updates);
  return room.toJSON();
};

export const deleteRoomById = async (id) => {
  const room = await Room.findByPk(id);
  if (!room) {
    throw new Error('Phòng không tồn tại.');
  }
  await room.destroy();
  return true;
};
