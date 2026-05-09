import express from 'express';
import {
  khungGioOptions,
  loaiGiayToOptions,
  traCuu,
  xacNhan,
  thayDoiNgay,
} from '../service/checkoutScheduleService.js';

const router = express.Router();

const toLocalDateOnlyString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultCheckoutDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return toLocalDateOnlyString(date);
};

const getTodayDate = () => {
  const date = new Date();
  return toLocalDateOnlyString(date);
};

const getMaxCheckoutDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3 * 30);
  return toLocalDateOnlyString(date);
};

const createDefaultForm = () => ({
  loai_giay_to: 'hop_dong',
  ma_tra_cuu: '',
  ngay_tra_phong_du_kien: getDefaultCheckoutDate(),
  khung_gio: '',
});

const buildViewModel = (data = {}) => {
  const form = {
    ...createDefaultForm(),
    ...(data.form || {}),
  };
  return {
    title: 'Xếp lịch trả phòng',
    loaiGiayToOptions,
    khungGioOptions,
    form,
    ngayTraPhongMin: getTodayDate(),
    ngayTraPhongMax: getMaxCheckoutDate(),
    lookup: data.lookup || null,
    success: data.success || '',
    error: data.error || '',
  };
};

router.get('/checkout-schedules', (req, res) => {
  res.render('checkout-schedule', buildViewModel());
});

router.post('/checkout-schedules/lookup', async (req, res) => {
  const form = {
    ...createDefaultForm(),
    loai_giay_to: req.body.loai_giay_to || 'hop_dong',
    ma_tra_cuu: req.body.ma_tra_cuu || '',
    ngay_tra_phong_du_kien: req.body.ngay_tra_phong_du_kien || getDefaultCheckoutDate(),
    khung_gio: req.body.khung_gio || '',
  };

  try {
    const lookup = await traCuu(form.loai_giay_to, form.ma_tra_cuu);
    if (lookup.schedule) {
      form.ngay_tra_phong_du_kien = lookup.schedule.ngay_tra_phong_du_kien;
      form.khung_gio = lookup.schedule.khung_gio;
    }
    res.render('checkout-schedule', buildViewModel({ form, lookup }));
  } catch (error) {
    // Render UI alert instead of returning HTTP 400
    res.render('checkout-schedule', buildViewModel({ form, error: error.message }));
  }
});

router.post('/checkout-schedules/confirm', async (req, res) => {
  const form = {
    ...createDefaultForm(),
    loai_giay_to: req.body.loai_giay_to || 'hop_dong',
    ma_tra_cuu: req.body.ma_tra_cuu || '',
    ngay_tra_phong_du_kien: req.body.ngay_tra_phong_du_kien || getDefaultCheckoutDate(),
    khung_gio: req.body.khung_gio || '',
  };

  try {
    await xacNhan(form);
    res.render('checkout-schedule', buildViewModel({
      success: 'Đã xác nhận lịch trả phòng thành công.',
    }));
  } catch (error) {
    const lookup = await traCuu(form.loai_giay_to, form.ma_tra_cuu).catch(() => null);
    // Show error in UI
    res.render('checkout-schedule', buildViewModel({
      form,
      lookup,
      error: error.message,
    }));
  }
});

router.post('/checkout-schedules/change-date', async (req, res) => {
  const form = {
    ...createDefaultForm(),
    loai_giay_to: req.body.loai_giay_to || 'hop_dong',
    ma_tra_cuu: req.body.ma_tra_cuu || '',
    ngay_tra_phong_du_kien: req.body.ngay_tra_phong_du_kien || getDefaultCheckoutDate(),
    khung_gio: req.body.khung_gio || '',
  };

  try {
    await thayDoiNgay(form);
    res.render('checkout-schedule', buildViewModel({
      success: 'Đã thay đổi ngày trả phòng dự kiến.',
    }));
  } catch (error) {
    const lookup = await traCuu(form.loai_giay_to, form.ma_tra_cuu).catch(() => null);
    // Show error in UI
    res.render('checkout-schedule', buildViewModel({
      form,
      lookup,
      error: error.message,
    }));
  }
});

router.post('/checkout-schedules/cancel', (req, res) => {
  res.redirect('/checkout-schedules');
});

export default router;

