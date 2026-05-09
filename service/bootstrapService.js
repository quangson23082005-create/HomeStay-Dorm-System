import { kiemTra as kiemTraHopDong, taoHD } from './contractService.js';
import { kiemTra as kiemTraPhieu, taoPhieu } from './depositReceiptService.js';
import { isDatabaseAvailable } from '../config/database.js';

export const seedCheckoutScheduleReferences = async () => {
  if (isDatabaseAvailable()) {
    return;
  }

  try {
    const hasContract = await kiemTraHopDong('HD-2024-001').catch(() => false);
    if (!hasContract) {
      await taoHD({
        ma_hd: 'HD-2024-001',
        ngay: '2024-01-12',
        ma_kh: 'KH-001',
        ten_khach_hang: 'Nguyen Van A',
        so_phong: 'P101',
        ngay_nhan_phong: '2024-02-01',
      });
    }
  } catch (error) {
    console.warn('Skip contract seed:', error.message);
  }

  try {
    const hasDeposit = await kiemTraPhieu('PDC-0001').catch(() => false);
    if (!hasDeposit) {
      await taoPhieu({
        ma_phieu: 'PDC-0001',
        ngay_lap: '2024-03-20',
        trang_thai: 'da_coc',
        ten_khach_hang: 'Tran Thi B',
        so_phong: 'P204',
        ngay_nhan_phong: '2024-04-01',
      });
    }
  } catch (error) {
    console.warn('Skip deposit seed:', error.message);
  }
};

