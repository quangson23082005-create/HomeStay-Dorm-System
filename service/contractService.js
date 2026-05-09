import * as contractModel from '../model/contractModel.js';

export const kiemTra = async (maHD) => {
  if (!maHD?.trim()) {
    throw new Error('Mã hợp đồng là bắt buộc.');
  }
  return contractModel.kiemTra(maHD.trim());
};

export const layTT = async (maHD) => {
  if (!maHD?.trim()) {
    throw new Error('Mã hợp đồng là bắt buộc.');
  }
  return contractModel.layTT(maHD.trim());
};

export const layTTTheoPhieuDatCoc = async (idPhieuDatCoc) => {
  if (!idPhieuDatCoc) {
    throw new Error('ID phiếu đặt cọc là bắt buộc.');
  }
  return contractModel.layTTTheoPhieuDatCoc(Number(idPhieuDatCoc));
};

export const taoHD = async (hopDong) => {
  const payload = {
    ma_hd: hopDong.ma_hd?.trim(),
    ngay: hopDong.ngay,
    ma_kh: hopDong.ma_kh?.trim(),
    ten_khach_hang: hopDong.ten_khach_hang?.trim(),
    so_phong: hopDong.so_phong?.trim(),
    ngay_nhan_phong: hopDong.ngay_nhan_phong,
  };

  if (!payload.ma_hd || !payload.ngay || !payload.ma_kh || !payload.ten_khach_hang || !payload.so_phong || !payload.ngay_nhan_phong) {
    throw new Error('Thiếu thông tin hợp đồng bắt buộc.');
  }

  return contractModel.taoHD(payload);
};

