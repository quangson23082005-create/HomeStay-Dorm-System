import * as khachHangModel from "../model/khachHangModel.js";
import * as phieuDangKyModel from "../model/phieuDangKyModel.js";
import * as phieuGhepModel from "../model/phieuDangKyGhepModel.js";
import * as phieuNguyenCanModel from "../model/phieuDangKyNguyenCanModel.js";

// Supported type aliases: DB may use 'full_house'/'single_bed' or 'nguyen_can'/'ghep'
const LOAI_ALIASES = {
  FULL_HOUSE: ["full_house", "nguyen_can"],
  SINGLE_BED: ["single_bed", "ghep"],
};

const isFullHouse = (val) =>
  LOAI_ALIASES.FULL_HOUSE.includes(String(val || "").toLowerCase());
const isSingleBed = (val) =>
  LOAI_ALIASES.SINGLE_BED.includes(String(val || "").toLowerCase());

// ── Helpers ──────────────────────────────────────────────────────────────────

const validateKhachHang = (khachHang, id) => {
  if (!khachHang) {
    throw new Error(`Không tìm thấy khách hàng với id = ${id}.`);
  }
};

const validatePhieuThuocKhach = (phieu, id_khach_hang) => {
  if (!phieu || phieu.id_khach_hang !== id_khach_hang) {
    throw new Error("Phiếu đăng ký không thuộc về khách hàng này.");
  }
};

const validateLoaiThue = (loai_thue, phieu_loai_thue) => {
  if (
    !(isFullHouse(loai_thue) && isFullHouse(phieu_loai_thue)) &&
    !(isSingleBed(loai_thue) && isSingleBed(phieu_loai_thue))
  ) {
    throw new Error(
      `Loại thuê không khớp: phiếu là "${phieu_loai_thue}", yêu cầu "${loai_thue}".`,
    );
  }
};

const validateDanhSachChon = (danhSach) => {
  if (!Array.isArray(danhSach) || danhSach.length === 0) {
    throw new Error("Vui lòng chọn 1 giường hoặc 1 phòng để xác nhận.");
  }
  if (danhSach.length !== 1) {
    throw new Error("Chỉ được chọn duy nhất 1 phòng hoặc 1 giường.");
  }
};

// ── Exported service functions ────────────────────────────────────────────────

// <<static>> LayThongTinKhachHang()
// Trả về thông tin khách hàng + tất cả phiếu đăng ký
export const layThongTinKhachHang = async (id_khach_hang) => {
  const khachHang = await khachHangModel.layTheoId(id_khach_hang);
  validateKhachHang(khachHang, id_khach_hang);

  const danhSachPhieu = await phieuDangKyModel.layTheoKhachHang(id_khach_hang);

  return { khachHang, danhSachPhieu };
};

// <<static>> LayDanhSachPhongDaDangKy()
// Lấy chi tiết các giường/phòng đã đăng ký trong một phiếu
// Với thuê ghép: trả thêm danh sách toàn bộ giường trong mỗi phòng (để render grid)
export const layDanhSachPhongDaDangKy = async (
  id_phieu,
  id_khach_hang,
  loai_thue,
) => {
  const phieu = await phieuDangKyModel
    .layTheoKhachHang(id_khach_hang)
    .then((list) => list.find((p) => p.id_phieu === Number(id_phieu)));

  validatePhieuThuocKhach(
    phieu ? { ...phieu, id_khach_hang } : null,
    id_khach_hang,
  );
  validateLoaiThue(loai_thue, phieu.loai_thue);

  // Nếu là thuê theo giường / single_bed
  if (isSingleBed(phieu.loai_thue) || isSingleBed(loai_thue)) {
    const already = await phieuGhepModel.hasAnySelected(id_phieu);
    const daDangKy = await phieuGhepModel.layTheoPhieu(id_phieu);

    // Lấy danh sách id_phong không trùng → query grid giường cho mỗi phòng
    const idPhongSet = [...new Set(daDangKy.map((r) => r.id_phong))];
    const giuongTheoPhong = {};
    await Promise.all(
      idPhongSet.map(async (id_phong) => {
        giuongTheoPhong[id_phong] =
          await phieuGhepModel.layGiuongTrongPhong(id_phong);
      }),
    );

    return { loai_thue, daDangKy, giuongTheoPhong, daXacNhan: !!already };
  }

  // full_house / nguyen_can
  const already = await phieuNguyenCanModel.hasAnySelected(id_phieu);
  const daDangKy = await phieuNguyenCanModel.layTheoPhieu(id_phieu);
  return { loai_thue, daDangKy, daXacNhan: !!already };
};

// <<static>> XacNhanChonPhong()
// Cập nhật duoc_chon = TRUE trong bảng phiếu tương ứng
export const xacNhanChonPhong = async (
  id_phieu,
  id_khach_hang,
  loai_thue,
  danhSachChon,
) => {
  // danhSachChon với ghep:       [{ id_phong, id_giuong }, ...]
  // danhSachChon với nguyen_can: [{ id_phong }, ...]

  const phieu = await phieuDangKyModel
    .layTheoKhachHang(id_khach_hang)
    .then((list) => list.find((p) => p.id_phieu === Number(id_phieu)));

  validatePhieuThuocKhach(
    phieu ? { ...phieu, id_khach_hang } : null,
    id_khach_hang,
  );
  validateLoaiThue(loai_thue, phieu.loai_thue);
  validateDanhSachChon(danhSachChon);

  // Xử lý thuê theo giường (single_bed / ghep)
  if (isSingleBed(phieu.loai_thue) || isSingleBed(loai_thue)) {
    const already = await phieuGhepModel.hasAnySelected(id_phieu);
    if (already) throw new Error("Phiếu này đã được xác nhận trước đó.");

    // Kiểm tra từng cặp (id_phong, id_giuong) có trong phiếu không
    const daDangKy = await phieuGhepModel.layTheoPhieu(id_phieu);
    const hopLe = danhSachChon.every(({ id_phong, id_giuong }) =>
      daDangKy.some(
        (r) =>
          r.id_phong === Number(id_phong) && r.id_giuong === Number(id_giuong),
      ),
    );
    if (!hopLe) {
      throw new Error(
        "Một hoặc nhiều giường được chọn không thuộc phiếu đăng ký này.",
      );
    }
    await phieuGhepModel.capNhatDuocChonNhieu(id_phieu, danhSachChon);
    return { cap_nhat: danhSachChon.length, loai_thue };
  }

  // full_house / nguyen_can
  const alreadyNg = await phieuNguyenCanModel.hasAnySelected(id_phieu);
  if (alreadyNg) throw new Error("Phiếu này đã được xác nhận trước đó.");
  const daDangKyNg = await phieuNguyenCanModel.layTheoPhieu(id_phieu);
  const danhSachIdPhong = danhSachChon.map((c) => c.id_phong);
  const hopLeNg = danhSachIdPhong.every((id_phong) =>
    daDangKyNg.some((r) => r.id_phong === Number(id_phong)),
  );
  if (!hopLeNg) {
    throw new Error(
      "Một hoặc nhiều phòng được chọn không thuộc phiếu đăng ký này.",
    );
  }
  await phieuNguyenCanModel.capNhatDuocChonNhieu(id_phieu, danhSachIdPhong);
  return { cap_nhat: danhSachIdPhong.length, loai_thue };
};
