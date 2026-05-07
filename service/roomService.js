import * as roomModel from '../model/roomModel.js';

const parseRoomPayload = (body) => {
  return {
    id_phong: body.id_phong ? Number(body.id_phong) : undefined,
    loai_phong: body.loai_phong?.trim(),
    tang: Number(body.tang),
    trang_thai: body.trang_thai || 'trong',
    so_luong_giuong: Number(body.so_luong_giuong || 1),
    gia_thue: Number(body.gia_thue),
  };
};

const validateRoomPayload = (payload, shouldValidateId = false) => {
  if (shouldValidateId && payload.id_phong !== undefined && Number.isNaN(payload.id_phong)) {
    throw new Error('Mã phòng phải là số nguyên.');
  }

  if (!payload.loai_phong) {
    throw new Error('Loại phòng là bắt buộc.');
  }

  if (Number.isNaN(payload.tang) || payload.tang <= 0) {
    throw new Error('Tầng phải là một số nguyên lớn hơn 0.');
  }

  if (Number.isNaN(payload.gia_thue) || payload.gia_thue <= 0) {
    throw new Error('Giá thuê phải là một số hợp lệ lớn hơn 0.');
  }

  if (Number.isNaN(payload.so_luong_giuong) || payload.so_luong_giuong <= 0) {
    throw new Error('Số lượng giường phải là một số nguyên lớn hơn 0.');
  }
};

export const listRooms = async (filters = {}) => {
  return await roomModel.getAllRooms(filters);
};

export const getRoom = async (id) => {
  const roomId = Number(id);
  if (Number.isNaN(roomId)) {
    throw new Error('Mã phòng không hợp lệ.');
  }

  const room = await roomModel.getRoomById(roomId);
  if (!room) {
    throw new Error('Phòng không tồn tại trong hệ thống.');
  }

  return room;
};

export const addRoom = async (body) => {
  const payload = parseRoomPayload(body);

  validateRoomPayload(payload, Boolean(body.id_phong));

  if (payload.id_phong !== undefined) {
    const existing = await roomModel.getRoomById(payload.id_phong);
    if (existing) {
      throw new Error('Mã phòng đã tồn tại. Vui lòng chọn mã khác.');
    }
  }

  if (payload.id_phong === undefined) {
    delete payload.id_phong;
  }

  return await roomModel.createRoom(payload);
};

export const editRoom = async (id, body) => {
  const roomId = Number(id);
  if (Number.isNaN(roomId)) {
    throw new Error('Mã phòng không hợp lệ.');
  }

  const existing = await roomModel.getRoomById(roomId);
  if (!existing) {
    throw new Error('Phòng không tồn tại trong hệ thống.');
  }

  if (body.id_phong && Number(body.id_phong) !== roomId) {
    throw new Error('Không thể sửa mã phòng.');
  }

  const payload = parseRoomPayload(body);
  delete payload.id_phong;

  validateRoomPayload(payload);

  return await roomModel.updateRoom(roomId, payload);
};

export const removeRoom = async (id) => {
  const roomId = Number(id);
  if (Number.isNaN(roomId)) {
    throw new Error('Mã phòng không hợp lệ.');
  }

  const existing = await roomModel.getRoomById(roomId);
  if (!existing) {
    throw new Error('Phòng không tồn tại trong hệ thống.');
  }

  await roomModel.deleteRoomById(roomId);
  return true;
};
