import express from "express";
import * as depositService from "../service/depositReceiptService.js";
import * as contractService from "../service/contractService.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/phieu-dat-coc/new", requireRole("khachhang"), async (req, res) => {
  try {
    const ma_phieu = await depositService.phatSinh();
    res.render("deposit-form", {
      title: "Lập phiếu đặt cọc",
      phieu: {
        ma_phieu,
        ngay_lap: new Date().toISOString().split("T")[0],
        trang_thai: "moi_tao",
        ten_khach_hang: req.session?.user?.hoTen || "",
        so_phong: req.query.so_phong || "",
        ngay_nhan_phong: req.query.ngay_nhan_phong || "",
        so_tien_coc: "",
      },
      formAction: "/phieu-dat-coc/new",
      submitLabel: "Lập phiếu",
    });
  } catch (error) {
    res.status(500).render("error", { title: "Lỗi", error });
  }
});

router.post(
  "/phieu-dat-coc/new",
  requireRole("khachhang"),
  async (req, res) => {
    try {
      const payload = {
        ma_phieu: req.body.ma_phieu,
        thoi_gian: req.body.ngay_lap,
        so_tien_coc: req.body.so_tien_coc,
        trang_thai: req.body.trang_thai || "moi_tao",
        ten_khach_hang: req.session?.user?.hoTen || req.body.ten_khach_hang,
        so_phong: req.body.so_phong,
        ngay_nhan_phong: req.body.ngay_nhan_phong,
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
    res.render("deposit-detail", {
      title: "Phiếu đặt cọc",
      phieu,
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
