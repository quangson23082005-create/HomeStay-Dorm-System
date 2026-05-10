import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { isDatabaseAvailable } from '../config/database.js';

const CheckoutSchedule = sequelize.define('xep_lich_tra_phong', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  loai_giay_to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ma_tra_cuu: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ten_khach_hang: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  so_phong: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ngay_nhan_phong: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  ngay_tra_phong_du_kien: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  khung_gio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  trang_thai: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'confirmed',
  },
}, {
  timestamps: false,
  tableName: 'xep_lich_tra_phong',
  indexes: [
    {
      unique: true,
      fields: ['ma_tra_cuu'],
      // name: 'xep_lich_tra_phong_unique_hop_dong',
    },
  ],
});

const scheduleMemoryStore = new Map();
let scheduleMemoryId = 1;

const buildKey = (maTraCuu) => String(maTraCuu);

export const timTheoMaTraCuu = async (maTraCuu) => {
  if (!isDatabaseAvailable()) {
    return scheduleMemoryStore.get(buildKey(maTraCuu)) || null;
  }
  const schedule = await CheckoutSchedule.findOne({
    where: {
      ma_tra_cuu: maTraCuu,
    },
  });
  return schedule ? schedule.toJSON() : null;
};

export const taoHoacCapNhatLich = async (payload) => {
  if (!isDatabaseAvailable()) {
    const key = buildKey(payload.ma_tra_cuu);
    const existing = scheduleMemoryStore.get(key);
    const nextRecord = existing
      ? { ...existing, ...payload }
      : { id: scheduleMemoryId++, ...payload };
    scheduleMemoryStore.set(key, nextRecord);
    return nextRecord;
  }

  const existing = await CheckoutSchedule.findOne({
    where: {
      ma_tra_cuu: payload.ma_tra_cuu,
    },
  });

  if (existing) {
    await existing.update(payload);
    return existing.toJSON();
  }

  const created = await CheckoutSchedule.create(payload);
  return created.toJSON();
};

export const thayDoiNgay = async (maTraCuu, updates) => {
  if (!isDatabaseAvailable()) {
    const key = buildKey(maTraCuu);
    const schedule = scheduleMemoryStore.get(key);
    if (!schedule) {
      throw new Error('Chưa có lịch trả phòng để thay đổi.');
    }
    const updated = {
      ...schedule,
      ...updates,
      trang_thai: 'changed',
    };
    scheduleMemoryStore.set(key, updated);
    return updated;
  }

  const schedule = await CheckoutSchedule.findOne({
    where: {
      ma_tra_cuu: maTraCuu,
    },
  });
  if (!schedule) {
    throw new Error('Chưa có lịch trả phòng để thay đổi.');
  }

  await schedule.update({
    ...updates,
    trang_thai: 'changed',
  });
  return schedule.toJSON();
};

