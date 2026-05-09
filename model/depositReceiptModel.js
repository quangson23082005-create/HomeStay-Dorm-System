import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { isDatabaseAvailable } from '../config/database.js';

const buildMaPhieu = (idPhieu) => `PDC-${String(idPhieu).padStart(4, '0')}`;

const parseMaPhieu = (maPhieu) => {
  const value = String(maPhieu || '').trim();
  const match = value.match(/^PDC-(\d+)$/i) || value.match(/^(\d+)$/);
  return match ? Number(match[1]) : null;
};

const toAppReceipt = (receipt) => {
  if (!receipt) {
    return null;
  }

  return {
    ...receipt,
    ma_phieu: buildMaPhieu(receipt.id_phieu),
  };
};

const DepositReceipt = sequelize.define('phieu_dat_coc', {
  id_phieu: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  thoi_gian: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  so_tien_coc: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
  trang_thai: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  id_phieu_dk: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_khach_hang: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_nhan_su: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'phieu_dat_coc',
});

const depositMemoryStore = new Map();

export const phatSinh = async () => {
  if (!isDatabaseAvailable()) {
    const ids = Array.from(depositMemoryStore.keys());
    const latestId = ids.sort().at(-1);
    const current = latestId?.match(/PDC-(\d+)/)?.[1];
    const nextNumber = (current ? Number(current) : 0) + 1;
    return `PDC-${String(nextNumber).padStart(4, '0')}`;
  }
  const latest = await DepositReceipt.findOne({
    order: [['id_phieu', 'DESC']],
  });
  const nextNumber = (latest?.id_phieu || 0) + 1;
  return `PDC-${String(nextNumber).padStart(4, '0')}`;
};

export const taoPhieu = async (phieuDatCoc) => {
  if (!isDatabaseAvailable()) {
    depositMemoryStore.set(phieuDatCoc.ma_phieu, { ...phieuDatCoc });
    return { ...phieuDatCoc };
  }
  const { ma_phieu, ...dbPayload } = phieuDatCoc;
  const created = await DepositReceipt.create(dbPayload);
  return toAppReceipt(created.toJSON());
};

export const capNhatTrangThai = async (id, trangThai) => {
  if (!isDatabaseAvailable()) {
    const existing = depositMemoryStore.get(id);
    if (!existing) {
      throw new Error('Phiếu đặt cọc không tồn tại.');
    }
    const updated = { ...existing, trang_thai: trangThai };
    depositMemoryStore.set(id, updated);
    return updated;
  }
  const receipt = await DepositReceipt.findByPk(parseMaPhieu(id) || id);
  if (!receipt) {
    throw new Error('Phiếu đặt cọc không tồn tại.');
  }
  await receipt.update({ trang_thai: trangThai });
  return toAppReceipt(receipt.toJSON());
};

export const kiemTra = async (maPhieu) => {
  if (!isDatabaseAvailable()) {
    return depositMemoryStore.has(maPhieu);
  }
  const parsedId = parseMaPhieu(maPhieu);
  if (!parsedId) {
    return false;
  }
  const receipt = await DepositReceipt.findByPk(parsedId, { attributes: ['id_phieu'] });
  return Boolean(receipt);
};

export const layTT = async (maPhieu) => {
  if (!isDatabaseAvailable()) {
    return depositMemoryStore.get(maPhieu) || null;
  }
  const parsedId = parseMaPhieu(maPhieu);
  if (!parsedId) {
    return null;
  }

  const [rows] = await sequelize.query(
    `
      SELECT
        p.id_phieu,
        p.thoi_gian,
        p.so_tien_coc,
        p.trang_thai,
        COALESCE(kh_pdc.ho_va_ten, kh_pdk.ho_va_ten) AS ten_khach_hang,
        room.id_phong AS so_phong,
        COALESCE(pdk.thoi_gian_o_du_kien, p.thoi_gian::date) AS ngay_nhan_phong,
        p.thoi_gian::date AS ngay_dat_coc
      FROM phieu_dat_coc p
      LEFT JOIN phieu_dang_ky pdk ON pdk.id_phieu = p.id_phieu_dk
      LEFT JOIN khach_hang kh_pdc ON kh_pdc.id_khach_hang = p.id_khach_hang
      LEFT JOIN khach_hang kh_pdk ON kh_pdk.id_khach_hang = pdk.id_khach_hang
      LEFT JOIN LATERAL (
        SELECT selected.id_phong
        FROM (
          SELECT id_phong, duoc_chon FROM phieu_dang_ky_nguyen_can WHERE id_phieu = p.id_phieu_dk
          UNION ALL
          SELECT id_phong, duoc_chon FROM phieu_dang_ky_ghep WHERE id_phieu = p.id_phieu_dk
        ) selected
        ORDER BY selected.duoc_chon DESC, selected.id_phong ASC
        LIMIT 1
      ) room ON true
      WHERE p.id_phieu = :idPhieu
      LIMIT 1
    `,
    { replacements: { idPhieu: parsedId } }
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    ma_phieu: buildMaPhieu(row.id_phieu),
    so_phong: row.so_phong ? `P${row.so_phong}` : '',
    ngay_nhan_phong: row.ngay_nhan_phong || row.ngay_dat_coc || '',
  };
};

