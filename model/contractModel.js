import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { isDatabaseAvailable } from '../config/database.js';

const buildMaHopDong = (idHopDong) => `HD-${String(idHopDong).padStart(4, '0')}`;

const parseMaHopDong = (maHopDong) => {
  const value = String(maHopDong || '').trim();
  const match = value.match(/^HD-(\d+)$/i) || value.match(/^(\d+)$/);
  return match ? Number(match[1]) : null;
};

const Contract = sequelize.define('hop_dong_thue', {
  id_hop_dong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  ten_hop_dong: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gia_thue: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
  loai_thue: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ngay_bat_dau: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  ngay_ket_thuc: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  tinh_trang: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  id_phieu_dk: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_nhan_su: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_phieu_dat_coc: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'hop_dong_thue',
});

const contractMemoryStore = new Map();

export const layTT = async (maHD) => {
  if (!isDatabaseAvailable()) {
    return contractMemoryStore.get(maHD) || null;
  }
  const parsedId = parseMaHopDong(maHD);
  if (!parsedId) {
    return null;
  }

  const [rows] = await sequelize.query(
    `
      SELECT
        h.id_hop_dong,
        h.ten_hop_dong,
        h.ngay_bat_dau,
        h.ngay_ket_thuc,
        h.tinh_trang,
        kh.ho_va_ten AS ten_khach_hang,
        room.id_phong AS so_phong,
        COALESCE(h.ngay_bat_dau, pdk.thoi_gian_o_du_kien) AS ngay_nhan_phong
      FROM hop_dong_thue h
      LEFT JOIN phieu_dang_ky pdk ON pdk.id_phieu = h.id_phieu_dk
      LEFT JOIN khach_hang kh ON kh.id_khach_hang = pdk.id_khach_hang
      LEFT JOIN LATERAL (
        SELECT selected.id_phong
        FROM (
          SELECT id_phong, duoc_chon FROM phieu_dang_ky_nguyen_can WHERE id_phieu = pdk.id_phieu
          UNION ALL
          SELECT id_phong, duoc_chon FROM phieu_dang_ky_ghep WHERE id_phieu = pdk.id_phieu
        ) selected
        ORDER BY selected.duoc_chon DESC, selected.id_phong ASC
        LIMIT 1
      ) room ON true
      WHERE h.id_hop_dong = :idHopDong
      LIMIT 1
    `,
    { replacements: { idHopDong: parsedId } }
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    ma_hd: buildMaHopDong(row.id_hop_dong),
    so_phong: row.so_phong ? `P${row.so_phong}` : '',
    ngay_nhan_phong: row.ngay_nhan_phong || row.ngay_bat_dau || '',
  };
};

export const kiemTra = async (maHD) => {
  if (!isDatabaseAvailable()) {
    return contractMemoryStore.has(maHD);
  }
  const parsedId = parseMaHopDong(maHD);
  if (!parsedId) {
    return false;
  }
  const contract = await Contract.findByPk(parsedId, { attributes: ['id_hop_dong'] });
  return Boolean(contract);
};

export const taoHD = async (hopDong) => {
  if (!isDatabaseAvailable()) {
    contractMemoryStore.set(hopDong.ma_hd, { ...hopDong });
    return { ...hopDong };
  }
  const created = await Contract.create(hopDong);
  return created.toJSON();
};

export const layTTTheoPhieuDatCoc = async (idPhieuDatCoc) => {
  if (!isDatabaseAvailable()) {
    // in-memory fallback: try to find contract by stored value
    for (const v of contractMemoryStore.values()) {
      if (v.id_phieu_dat_coc === idPhieuDatCoc) return v;
    }
    return null;
  }

  const [rows] = await sequelize.query(
    `
      SELECT
        h.id_hop_dong,
        h.ten_hop_dong,
        h.ngay_bat_dau,
        h.ngay_ket_thuc,
        h.tinh_trang,
        kh.ho_va_ten AS ten_khach_hang,
        room.id_phong AS so_phong,
        COALESCE(h.ngay_bat_dau, pdk.thoi_gian_o_du_kien) AS ngay_nhan_phong
      FROM hop_dong_thue h
      LEFT JOIN phieu_dang_ky pdk ON pdk.id_phieu = h.id_phieu_dk
      LEFT JOIN khach_hang kh ON kh.id_khach_hang = pdk.id_khach_hang
      LEFT JOIN LATERAL (
        SELECT selected.id_phong
        FROM (
          SELECT id_phong, duoc_chon FROM phieu_dang_ky_nguyen_can WHERE id_phieu = pdk.id_phieu
          UNION ALL
          SELECT id_phong, duoc_chon FROM phieu_dang_ky_ghep WHERE id_phieu = pdk.id_phieu
        ) selected
        ORDER BY selected.duoc_chon DESC, selected.id_phong ASC
        LIMIT 1
      ) room ON true
      WHERE h.id_phieu_dat_coc = :idPhieuDatCoc
      LIMIT 1
    `,
    { replacements: { idPhieuDatCoc } }
  );

  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    ma_hd: buildMaHopDong(row.id_hop_dong),
    so_phong: row.so_phong ? `P${row.so_phong}` : '',
    ngay_nhan_phong: row.ngay_nhan_phong || row.ngay_bat_dau || '',
  };
};

