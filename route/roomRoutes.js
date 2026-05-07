import express from 'express';
import {
  listRooms,
  getRoom,
  addRoom,
  editRoom,
  removeRoom,
} from '../service/roomService.js';

const router = express.Router();

const roomOptions = ['Studio', '1BR', '2BR', '3BR'];
const statusOptions = [
  { value: 'trong', label: 'Trống' },
  { value: 'dang_thue', label: 'Đang thuê' },
  { value: 'dang_sua_chua', label: 'Đang sửa chữa' },
];

const formatRoom = (room) => {
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(Number(room.gia_thue));
  const statusLabel = room.trang_thai === 'trong'
    ? 'Trống'
    : room.trang_thai === 'dang_thue'
      ? 'Đang thuê'
      : 'Đang sửa chữa';
  const badgeClass = room.trang_thai === 'trong'
    ? 'success'
    : room.trang_thai === 'dang_thue'
      ? 'primary'
      : 'danger';

  return {
    ...room,
    formatted_gia_thue: `${formattedPrice} đ`,
    status_label: statusLabel,
    badge_class: badgeClass,
  };
};

router.get('/rooms', async (req, res) => {
  try {
    const rooms = await listRooms(req.query);
    const formattedRooms = rooms.map(formatRoom);
    const total = formattedRooms.length;
    const available = formattedRooms.filter((room) => room.trang_thai === 'trong').length;
    const occupied = total - available;
    const occupancyRate = total ? ((occupied / total) * 100).toFixed(1) : '0.0';

    res.render('rooms', {
      title: 'Quản lý danh mục phòng',
      rooms: formattedRooms,
      filters: req.query,
      stats: {
        total,
        available,
        occupancyRate,
      },
      roomOptions,
      statusOptions,
      floors: [1,2,3,4,5,6,7,8,9,10],
    });
  } catch (error) {
    res.status(500).render('rooms', {
      title: 'Quản lý danh mục phòng',
      rooms: [],
      filters: req.query,
      error: error.message,
      roomOptions,
      statusOptions,
      floors: [1,2,3,4,5,6,7,8,9,10],
    });
  }
});

router.get('/rooms/new', (req, res) => {
  res.render('room-form', {
    title: 'Thêm phòng mới',
    mode: 'create',
    room: {
      id_phong: '',
      loai_phong: '',
      tang: '',
      trang_thai: 'trong',
      so_luong_giuong: 1,
      gia_thue: '',
    },
    roomOptions,
    statusOptions,
    formAction: '/rooms/new',
    submitLabel: 'Lưu thông tin',
  });
});

router.post('/rooms/new', async (req, res) => {
  try {
    await addRoom(req.body);
    res.redirect('/rooms');
  } catch (error) {
    res.status(400).render('room-form', {
      title: 'Thêm phòng mới',
      mode: 'create',
      room: {
        ...req.body,
        so_luong_giuong: req.body.so_luong_giuong || 1,
      },
      roomOptions,
      statusOptions,
      formAction: '/rooms/new',
      submitLabel: 'Lưu thông tin',
      error: error.message,
    });
  }
});

router.get('/rooms/:id/edit', async (req, res) => {
  try {
    const room = await getRoom(req.params.id);
    res.render('room-form', {
      title: 'Cập nhật thông tin phòng',
      mode: 'edit',
      room,
      roomOptions,
      statusOptions,
      formAction: `/rooms/${room.id_phong}/edit`,
      submitLabel: 'Cập nhật',
    });
  } catch (error) {
    res.status(404).render('room-form', {
      title: 'Cập nhật thông tin phòng',
      mode: 'edit',
      room: {
        id_phong: req.params.id,
        loai_phong: '',
        tang: '',
        trang_thai: 'trong',
        so_luong_giuong: 1,
        gia_thue: '',
      },
      roomOptions,
      statusOptions,
      formAction: `/rooms/${req.params.id}/edit`,
      submitLabel: 'Cập nhật',
      error: error.message,
    });
  }
});

router.post('/rooms/:id/edit', async (req, res) => {
  try {
    await editRoom(req.params.id, req.body);
    res.redirect('/rooms');
  } catch (error) {
    res.status(400).render('room-form', {
      title: 'Cập nhật thông tin phòng',
      mode: 'edit',
      room: {
        ...req.body,
        id_phong: req.params.id,
      },
      roomOptions,
      statusOptions,
      formAction: `/rooms/${req.params.id}/edit`,
      submitLabel: 'Cập nhật',
      error: error.message,
    });
  }
});

router.post('/rooms/:id/delete', async (req, res) => {
  try {
    await removeRoom(req.params.id);
    res.redirect('/rooms');
  } catch (error) {
    const rooms = await listRooms({});
    const formattedRooms = rooms.map(formatRoom);
    res.status(400).render('rooms', {
      title: 'Quản lý danh mục phòng',
      rooms: formattedRooms,
      filters: {},
      error: error.message,
      roomOptions,
      statusOptions,
    });
  }
});

export default router;
