import * as checkoutScheduleModel from '../model/checkoutScheduleModel.js';
import * as contractService from './contractService.js';
import * as depositReceiptService from './depositReceiptService.js';

const LOAI_GIAY_TO = {
  HOP_DONG: 'hop_dong',
  PHIEU_DAT_COC: 'phieu_dat_coc',
};

const toScheduleLookupKey = (idHopDong) => {
  if (!idHopDong) {
    throw new Error('Không xác định được hợp đồng để xếp lịch trả phòng.');
  }
  return String(idHopDong);
};

const KHUNG_GIO_CHO_PHEP = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00', 
  '15:00',
  '16:00',
  '17:00'
];

const isDateOnly = (value) => Boolean(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);

const toLocalDateOnly = (value) => {
  if (!isDateOnly(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDateOnlyString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const validateCheckoutDateRange = (dateValue) => {
  const checkoutDate = toLocalDateOnly(dateValue);
  if (!checkoutDate) {
    throw new Error('Ngày trả phòng dự kiến không hợp lệ (yyyy-mm-dd).');
  }

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const maxDate = new Date(todayOnly);
  maxDate.setMonth(maxDate.getMonth() + 3);

  if (checkoutDate < todayOnly) {
    throw new Error('Ngày trả phòng dự kiến không được nhỏ hơn ngày hiện tại.');
  }

  if (checkoutDate > maxDate) {
    throw new Error(`Ngày trả phòng dự kiến không được quá ${getDateOnlyString(maxDate)}.`);
  }
};

const normalizeLookupInput = (loaiGiayTo, maTraCuu) => {
  if (!Object.values(LOAI_GIAY_TO).includes(loaiGiayTo)) {
    throw new Error('Loại giấy tờ không hợp lệ.');
  }

  const normalizedCode = maTraCuu?.trim();
  if (!normalizedCode) {
    throw new Error('Mã tra cứu là bắt buộc.');
  }

  return {
    loaiGiayTo,
    maTraCuu: normalizedCode,
  };
};

const getReferenceInfo = async (loaiGiayTo, maTraCuu) => {
  if (loaiGiayTo === LOAI_GIAY_TO.HOP_DONG) {
    const hopDong = await contractService.layTT(maTraCuu);
    if (!hopDong) {
      throw new Error('Không tìm thấy hợp đồng tương ứng.');
    }
    return {
      id_hop_dong: hopDong.id_hop_dong,
      ten_khach_hang: hopDong.ten_khach_hang,
      so_phong: hopDong.so_phong,
      ngay_nhan_phong: hopDong.ngay_nhan_phong,
      ngay_hien_thi_label: 'Ngày nhận phòng',
    };
  }

  const phieuDatCoc = await depositReceiptService.layTT(maTraCuu);
  if (!phieuDatCoc) {
    throw new Error('Không tìm thấy phiếu đặt cọc tương ứng.');
  }

  // If deposit links to a contract, show contract info (contract's start date = nhận phòng)
  if (phieuDatCoc.id_phieu) {
    const linkedContract = await contractService.layTTTheoPhieuDatCoc(phieuDatCoc.id_phieu).catch(() => null);
    if (linkedContract) {
      return {
        id_hop_dong: linkedContract.id_hop_dong,
        ten_khach_hang: linkedContract.ten_khach_hang || phieuDatCoc.ten_khach_hang,
        so_phong: linkedContract.so_phong || phieuDatCoc.so_phong,
        ngay_nhan_phong: linkedContract.ngay_nhan_phong || linkedContract.ngay_bat_dau || '',
        ngay_hien_thi_label: 'Ngày nhận phòng',
      };
    }
  }

  // Otherwise, deposit without linked contract => signal not-found contract per requirement
  throw new Error('Phiếu đặt cọc không có hợp đồng thuê tương ứng.');
};

export const khungGioOptions = KHUNG_GIO_CHO_PHEP;
export const loaiGiayToOptions = [
  { value: LOAI_GIAY_TO.HOP_DONG, label: 'Hợp đồng' },
  { value: LOAI_GIAY_TO.PHIEU_DAT_COC, label: 'Phiếu đặt cọc' },
];

// <<static>> TraCuu()
export const traCuu = async (loaiGiayTo, maTraCuu) => {
  const lookupInput = normalizeLookupInput(loaiGiayTo, maTraCuu);
  const referenceInfo = await getReferenceInfo(lookupInput.loaiGiayTo, lookupInput.maTraCuu);
  const scheduleKey = toScheduleLookupKey(referenceInfo.id_hop_dong);
  const schedule = await checkoutScheduleModel.timTheoMaTraCuu(scheduleKey);
  return {
    ...referenceInfo,
    schedule,
    loai_giay_to: lookupInput.loaiGiayTo,
    ma_tra_cuu: lookupInput.maTraCuu,
  };
};

// <<static>> LayTTKhach()
export const layTTKhach = async (loaiGiayTo, maTraCuu) => {
  return traCuu(loaiGiayTo, maTraCuu);
};

// <<static>> XacNhan()
export const xacNhan = async (payload) => {
  const lookupInput = normalizeLookupInput(payload.loai_giay_to, payload.ma_tra_cuu);

  validateCheckoutDateRange(payload.ngay_tra_phong_du_kien);
  if (!KHUNG_GIO_CHO_PHEP.includes(payload.khung_gio)) {
    throw new Error('Khung giờ trả phòng không hợp lệ.');
  }

  const referenceInfo = await getReferenceInfo(lookupInput.loaiGiayTo, lookupInput.maTraCuu);
  const scheduleKey = toScheduleLookupKey(referenceInfo.id_hop_dong);
  return checkoutScheduleModel.taoHoacCapNhatLich({
    loai_giay_to: lookupInput.loaiGiayTo,
    ma_tra_cuu: scheduleKey,
    ten_khach_hang: referenceInfo.ten_khach_hang,
    so_phong: referenceInfo.so_phong,
    ngay_nhan_phong: referenceInfo.ngay_nhan_phong,
    ngay_tra_phong_du_kien: payload.ngay_tra_phong_du_kien,
    khung_gio: payload.khung_gio,
    trang_thai: 'confirmed',
  });
};

// <<static>> ThayDoiNgay()
export const thayDoiNgay = async (payload) => {
  const lookupInput = normalizeLookupInput(payload.loai_giay_to, payload.ma_tra_cuu);
  const referenceInfo = await getReferenceInfo(lookupInput.loaiGiayTo, lookupInput.maTraCuu);
  const scheduleKey = toScheduleLookupKey(referenceInfo.id_hop_dong);

  validateCheckoutDateRange(payload.ngay_tra_phong_du_kien);

  const updates = {
    ngay_tra_phong_du_kien: payload.ngay_tra_phong_du_kien,
  };
  if (payload.khung_gio) {
    if (!KHUNG_GIO_CHO_PHEP.includes(payload.khung_gio)) {
      throw new Error('Khung giờ trả phòng không hợp lệ.');
    }
    updates.khung_gio = payload.khung_gio;
  }

  return checkoutScheduleModel.thayDoiNgay(scheduleKey, updates);
};

