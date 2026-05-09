import supabase from '../config/supabase.js';

const lichHenService = {
  // Lấy danh sách phiếu chờ (chưa có lịch hẹn)
  async getDanhSachPhieuCho({ search = '', ngayTu = null, ngayDen = null, page = 1, limit = 4 }) {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase.rpc('get_phieu_cho', {
      p_search: search || null,
      p_ngay_tu: ngayTu || null,
      p_ngay_den: ngayDen || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw error;

    const total = data && data.length > 0 ? parseInt(data[0].tong_phieu) : 0;
    return {
      items: data || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Lấy chi tiết phiếu đăng ký
  async getChiTietPhieu(idPhieu) {
    const { data, error } = await supabase.rpc('get_chi_tiet_phieu', {
      p_id_phieu: parseInt(idPhieu),
    });
    if (error) throw error;
    return data;
  },

  // Lấy các ca đã đặt trong ngày
  async getCaDaDat(ngay) {
    const { data, error } = await supabase.rpc('get_ca_da_dat', {
      p_ngay: ngay,
    });
    if (error) throw error;
    return data || [];
  },

  // Tạo lịch hẹn mới
  async taoLichHen({ ngayGio, idPhieuDk, idNhanSu, ghiChu }) {
    const { data, error } = await supabase.rpc('tao_lich_hen', {
      p_ngay_gio: ngayGio,
      p_id_phieu_dk: parseInt(idPhieuDk),
      p_id_nhan_su: parseInt(idNhanSu),
      p_ghi_chu: ghiChu || null,
    });
    if (error) throw error;
    return data;
  },
};

export default lichHenService;