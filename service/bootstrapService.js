import { kiemTra as kiemTraHopDong, taoHD } from './contractService.js';
import { kiemTra as kiemTraPhieu, taoPhieu } from './depositReceiptService.js';
import sequelize from '../config/database.js';
import { isDatabaseAvailable } from '../config/database.js';

const waitForDatabase = async (timeoutMs = 10000) => {
  const start = Date.now();
  while (!isDatabaseAvailable() && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

export const seedCheckoutScheduleReferences = async () => {
  await waitForDatabase();

  if (!isDatabaseAvailable()) {
    return;
  }

  const [[contractCountRow], [depositCountRow]] = await Promise.all([
    sequelize.query('SELECT COUNT(*)::int AS count FROM hop_dong_thue'),
    sequelize.query('SELECT COUNT(*)::int AS count FROM phieu_dat_coc'),
  ]);

  const contractCount = Number(contractCountRow?.[0]?.count || 0);
  const depositCount = Number(depositCountRow?.[0]?.count || 0);

  if (contractCount > 0 || depositCount > 0) {
    return;
  }

  try {
    await sequelize.query(`
      INSERT INTO phong (id_phong, loai_phong, tang, trang_thai, so_luong_giuong, gia_thue)
      VALUES (1, 'Studio', 1, 'trong', 1, 4500000)
      ON CONFLICT (id_phong) DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO khach_hang (id_khach_hang, ho_va_ten, gioi_tinh, cccd, ngay_sinh, dia_chi, sdt)
      VALUES (1, 'Nguyen Van A', 'Nam', '012345678901', '1998-01-12', 'TP. HCM', '0900000001')
      ON CONFLICT (id_khach_hang) DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO nhan_su (id_nhan_vien, ho_ten, sdt, luong, dia_chi, chuc_vu)
      VALUES (1, 'Le Thi Thu', '0900000002', 12000000, 'TP. HCM', 'sale')
      ON CONFLICT (id_nhan_vien) DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO phieu_dang_ky (id_phieu, so_luong_nguoi_o, tang, loai_phong, thoi_gian_o_du_kien, thoi_han_thue, mo_ta_tieu_chi, loai_thue, id_khach_hang)
      VALUES (1, 1, 1, 'Studio', '2026-05-12', '6 tháng', 'Demo lookup data', 'thang', 1)
      ON CONFLICT (id_phieu) DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO phieu_dang_ky_nguyen_can (id_phieu, id_phong, duoc_chon)
      VALUES (1, 1, TRUE)
      ON CONFLICT (id_phieu, id_phong) DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO phieu_dat_coc (id_phieu, thoi_gian, so_tien_coc, trang_thai, id_phieu_dk, id_khach_hang, id_nhan_su)
      VALUES (1, '2026-05-10 09:00:00', 4500000, 'da_coc', 1, 1, 1)
      ON CONFLICT (id_phieu) DO NOTHING
    `);

    await sequelize.query(`
      INSERT INTO hop_dong_thue (id_hop_dong, ten_hop_dong, gia_thue, loai_thue, ngay_bat_dau, ngay_ket_thuc, tinh_trang, id_phieu_dk, id_nhan_su, id_phieu_dat_coc)
      VALUES (1, 'Hop dong thue phong Studio 1', 4500000, 'thang', '2026-05-12', '2026-11-12', 'dang_hieu_luc', 1, 1, 1)
      ON CONFLICT (id_hop_dong) DO NOTHING
    `);
  } catch (error) {
    console.warn('Skip contract seed:', error.message);
  }

  try {
    await sequelize.query(`
      UPDATE phieu_dat_coc
      SET id_phieu_dk = 1,
          id_khach_hang = 1,
          id_nhan_su = 1,
          trang_thai = COALESCE(trang_thai, 'da_coc')
      WHERE id_phieu = 1
    `);
  } catch (error) {
    console.warn('Skip deposit seed:', error.message);
  }
};

