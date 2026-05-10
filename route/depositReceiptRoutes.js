import express from "express";
import * as depositService from "../service/depositReceiptService.js";
import * as contractService from "../service/contractService.js";
import { requireLogin, requireRole } from "../middleware/auth.js";
import sequelize from "../config/database.js";

const router = express.Router();

router.get("/phieu-dat-coc/new", requireLogin, async (req, res) => {
  console.log("=== GET /phieu-dat-coc/new HANDLER CALLED ===");
  try {
    const ma_phieu = await depositService.phatSinh();
    console.log("Generated ma_phieu:", ma_phieu);

    // Hardcode khách hàng id=1 dữ liệu từ database
    const khach = {
      ho_va_ten: "Nguyen Chi",
      cccd: "C100000001",
      dia_chi: "Customer address 1",
      sdt: "0950622842",
    };

    const defaultRoom = "P201";
    const defaultPrice = "10000000";

    const contextData = {
      title: "Lập phiếu đặt cọc",
      testString: "HANDLER_WAS_CALLED_SUCCESS",
      phieu: {
        ma_phieu,
        ngay_lap: new Date().toISOString().split("T")[0],
        trang_thai: "Chưa thanh toán",
        ten_khach_hang: khach.ho_va_ten,
        cccd: khach.cccd,
        dia_chi: khach.dia_chi,
        sdt: khach.sdt,
        so_phong: defaultRoom,
        loai_phong: "LUXURY",
        so_luong_giuong: 2,
        don_gia: defaultPrice,
        so_tien_coc: defaultPrice,
      },
      formAction: "/phieu-dat-coc/new",
      submitLabel: "Lập phiếu",
    };

    console.log(
      "Rendering deposit-form with context:",
      JSON.stringify(contextData, null, 2),
    );
    res.render("deposit-form", contextData);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).render("error", { title: "Lỗi", error });
  }
});

router.post(
  "/phieu-dat-coc/new",
  requireLogin,
  async (req, res) => {
    try {
      // Lấy khách hàng id=1 từ database
      let [khachRows] = await sequelize.query(
        `SELECT id_khach_hang, ho_va_ten FROM khach_hang WHERE id_khach_hang = 1 LIMIT 1`,
      );

      if (!khachRows || khachRows.length === 0) {
        [khachRows] = await sequelize.query(
          `SELECT id_khach_hang, ho_va_ten FROM khach_hang ORDER BY id_khach_hang LIMIT 1`,
        );
      }

      const khach = khachRows && khachRows.length > 0 ? khachRows[0] : {};
      const tenKhachHang = khach.ho_va_ten || "Nguyen Chi";

      const payload = {
        ma_phieu: req.body.ma_phieu,
        thoi_gian: req.body.ngay_lap,
        so_tien_coc: req.body.so_tien_coc,
        trang_thai: req.body.trang_thai || "Chưa thanh toán",
        id_khach_hang: khach.id_khach_hang || null,
        ten_khach_hang: tenKhachHang,
        so_phong: req.body.so_phong,
      };
    
    await depositService.taoPhieu(payload);
      res.redirect(`/phieu-dat-coc/${encodeURIComponent(payload.ma_phieu)}`);
    } catch (error) {
      res.status(400).render("deposit-form", {
        title: "Lập phiếu đặt cọc",
        phieu: { ...req.body },
        formAction: "/phieu-dat-coc/new",
        submitLabel: "Lập phiếu",
        error: error.message,
      });
    }
  },
);

router.get("/phieu-dat-coc/:ma", async (req, res) => {
  try {
    const ma = req.params.ma;
    const phieu = await depositService.layTT(ma);
    if (!phieu)
      return res.status(404).render("404", { title: "Không tìm thấy" });

    const customerName =
      String(phieu.ten_khach_hang || "").trim() || "Nguyen Chi";

    const phieuView = {
      ...phieu,
      ten_khach_hang: customerName,
    };

    res.render("deposit-detail", {
      title: "Phiếu đặt cọc",
      phieu: phieuView,
      customerName,
    });
  } catch (error) {
    res.status(500).render("error", { title: "Lỗi", error });
  }
});

router.get("/phieu-dat-coc/:ma/thanh-toan", async (req, res) => {
  try {
    const ma = req.params.ma;
    const phieu = await depositService.layTT(ma);
    if (!phieu) {
      return res.status(404).render("404", { title: "Không tìm thấy" });
    }

    const customerName =
      String(phieu.ten_khach_hang || "").trim() || "Nguyen Chi";

    res.render("deposit-payment-qr", {
      title: "Thanh toán đặt cọc",
      phieu: {
        ...phieu,
        ten_khach_hang: customerName,
      },
      customerName,
      qrData: `PAY|${phieu.ma_phieu}|${phieu.so_tien_coc}|${customerName}`,
    });
  } catch (error) {
    res.status(500).render("error", { title: "Lỗi", error });
  }
});

router.post("/phieu-dat-coc/:ma/thanh-toan", async (req, res) => {
  try {
    const ma = req.params.ma;
    const phieu = await depositService.layTT(ma);
    if (!phieu) {
      return res.status(404).render("404", { title: "Không tìm thấy" });
    }

    const customerName =
      String(phieu.ten_khach_hang || "").trim() || "Nguyen Chi";

    await depositService.capNhatTrangThai(ma, "Đã thanh toán");

    res.render("deposit-payment-success", {
      title: "Thanh toán thành công",
      phieu: {
        ...phieu,
        trang_thai: "Đã thanh toán",
        ten_khach_hang: customerName,
      },
      customerName,
      paymentDate: new Date().toLocaleDateString("vi-VN"),
    });
  } catch (error) {
    res.status(500).render("error", { title: "Lỗi", error });
  }
});

// API: lookup reference (contract or existing deposit) -> return customer & room info
router.get("/api/lookup", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "Mã tra cứu là bắt buộc." });

    // Try contract first
    try {
      const hopDong = await contractService.layTT(q).catch(() => null);
      if (hopDong) {
        return res.json({
          source: "hop_dong",
          ten_khach_hang: hopDong.ten_khach_hang,
          so_phong: hopDong.so_phong,
          ngay_nhan_phong:
            hopDong.ngay_nhan_phong || hopDong.ngay_bat_dau || null,
        });
      }
    } catch (err) {
      // ignore and continue
    }

    // Try deposit / registration lookup
    try {
      const phieu = await depositService.layTT(q).catch(() => null);
      if (phieu) {
        return res.json({
          source: "phieu_dat_coc",
          ten_khach_hang: phieu.ten_khach_hang,
          so_phong: phieu.so_phong || phieu.room || null,
          ngay_nhan_phong:
            phieu.ngay_nhan_phong || phieu.ngay_nhan_phong || null,
        });
      }
    } catch (err) {
      // ignore
    }

    return res.status(404).json({ error: "Không tìm thấy tham chiếu." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
