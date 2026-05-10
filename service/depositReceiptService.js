import * as depositReceiptModel from '../model/depositReceiptModel.js';

export const phatSinh = async () => {
  return depositReceiptModel.phatSinh();
};

export const taoPhieu = async (phieuDatCoc) => {
  const payload = {
    ma_phieu: phieuDatCoc.ma_phieu?.trim(),
    ngay_lap: phieuDatCoc.ngay_lap,
    trang_thai: phieuDatCoc.trang_thai || 'moi_tao',
    ten_khach_hang: phieuDatCoc.ten_khach_hang?.trim(),
    so_phong: phieuDatCoc.so_phong?.trim(),
    ngay_nhan_phong: phieuDatCoc.ngay_nhan_phong,
  };

  if (!payload.ma_phieu || !payload.ngay_lap || !payload.ten_khach_hang || !payload.so_phong || !payload.ngay_nhan_phong) {
    throw new Error('Thiếu thông tin phiếu đặt cọc bắt buộc.');
  }

  return depositReceiptModel.taoPhieu(payload);
};

export const capNhatTrangThai = async (id, trangThai) => {
  if (!id?.trim()) {
    throw new Error('Mã phiếu đặt cọc là bắt buộc.');
  }
  if (!trangThai?.trim()) {
    throw new Error('Trạng thái là bắt buộc.');
  }
  return depositReceiptModel.capNhatTrangThai(id.trim(), trangThai.trim());
};

export const kiemTra = async (maPhieu) => {
  if (!maPhieu?.trim()) {
    throw new Error('Mã phiếu đặt cọc là bắt buộc.');
  }
  return depositReceiptModel.kiemTra(maPhieu.trim());
};

export const layTT = async (maPhieu) => {
  if (!maPhieu?.trim()) {
    throw new Error('Mã phiếu đặt cọc là bắt buộc.');
  }
  return depositReceiptModel.layTT(maPhieu.trim());
};

