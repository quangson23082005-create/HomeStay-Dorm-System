-- ============================================================
-- HOMESTAY DATABASE SCHEMA - PostgreSQL
-- ============================================================

-- 1. phòng (Room)
CREATE TABLE phong (
    id_phong    SERIAL PRIMARY KEY,
    loai_phong  VARCHAR(50),
    tang        INT,
    trang_thai  VARCHAR(50),
    so_luong_giuong INT,
    gia_thue    DECIMAL(15, 2)
);

-- 2. giường (Bed)
CREATE TABLE giuong (
    id_giuong   SERIAL,
    id_phong    INT,
    gia         DECIMAL(15, 2),
    tinh_trang  VARCHAR(50),
    PRIMARY key (id_giuong, id_phong),
    CONSTRAINT fk_giuong_phong
        FOREIGN KEY (id_phong) REFERENCES phong (id_phong)
        ON DELETE CASCADE
);

-- 3. dịch vụ (Service)
CREATE TABLE dich_vu (
    id_dich_vu  SERIAL PRIMARY KEY,
    ten_dich_vu VARCHAR(100),
    gia         DECIMAL(15, 2),
    mo_ta       TEXT
);

-- 4. nhân sự (Staff)
CREATE TABLE nhan_su (
    id_nhan_vien SERIAL PRIMARY KEY,
    ho_ten       VARCHAR(100),
    sdt          VARCHAR(20),
    luong        DECIMAL(15, 2),
    dia_chi      TEXT,
    chuc_vu      VARCHAR(50)
);

-- 5. tài sản (Asset) — composite PK: mỗi tài sản gắn với một phòng
CREATE TABLE tai_san (
    id_tai_san  INT          NOT NULL,
    id_phong    INT          NOT NULL,
    ten_tai_san VARCHAR(100),
    tinh_trang  VARCHAR(50),
    gia         DECIMAL(15, 2),
    PRIMARY KEY (id_tai_san, id_phong),
    CONSTRAINT fk_tai_san_phong
        FOREIGN KEY (id_phong) REFERENCES phong (id_phong)
        ON DELETE CASCADE
);

-- 6. khách hàng (Customer)
CREATE TABLE khach_hang (
    id_khach_hang SERIAL PRIMARY KEY,
    ho_va_ten     VARCHAR(100),
    gioi_tinh     VARCHAR(10),
    cccd          VARCHAR(20) UNIQUE,
    ngay_sinh     DATE,
    dia_chi       TEXT,
    sdt           VARCHAR(20)
);

-- 7. phiếu đăng ký (Registration Form)
CREATE TABLE phieu_dang_ky (
    id_phieu            SERIAL PRIMARY KEY,
    so_luong_nguoi_o    INT,
    tang                INT,
    loai_phong          VARCHAR(50),
    thoi_gian_o_du_kien DATE,          -- số ngày/tháng dự kiến
    thoi_han_thue       VARCHAR(20),
    mo_ta_tieu_chi      TEXT,
    loai_thue           VARCHAR(50),
    id_khach_hang       INT,
    CONSTRAINT fk_pdk_khach_hang
        FOREIGN KEY (id_khach_hang) REFERENCES khach_hang (id_khach_hang)
);

-- 8. phiếu đặt cọc (Deposit Slip)
CREATE TABLE phieu_dat_coc (
    id_phieu      SERIAL PRIMARY KEY,
    thoi_gian     TIMESTAMP,
    so_tien_coc   DECIMAL(15, 2),
    trang_thai    VARCHAR(50),
    id_phieu_dk   INT,
    id_khach_hang INT,
    id_nhan_su    INT,
    CONSTRAINT fk_pdc_phieu_dk
        FOREIGN KEY (id_phieu_dk)   REFERENCES phieu_dang_ky (id_phieu),
    CONSTRAINT fk_pdc_khach_hang
        FOREIGN KEY (id_khach_hang) REFERENCES khach_hang (id_khach_hang),
    CONSTRAINT fk_pdc_nhan_su
        FOREIGN KEY (id_nhan_su)    REFERENCES nhan_su (id_nhan_vien)
);

-- 9. phiếu thanh toán (Payment Slip)
--    Tạo trước hop_dong_thue vì bien_ban_hoan_coc và phieu_boi_thuong_hu_hai cần nó
CREATE TABLE phieu_thanh_toan (
    id_phieu        SERIAL PRIMARY KEY,
    khoan_cuoi      DECIMAL(15, 2),
    loai_thanh_toan VARCHAR(50),
    id_nhan_su      INT,
    co_hoan_coc     BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_ptt_nhan_su
        FOREIGN KEY (id_nhan_su) REFERENCES nhan_su (id_nhan_vien)
);

-- 10. hợp đồng thuê (Rental Contract)
CREATE TABLE hop_dong_thue (
    id_hop_dong    SERIAL PRIMARY KEY,
    ten_hop_dong   VARCHAR(100),
    gia_thue       DECIMAL(15, 2),
    loai_thue      VARCHAR(50),
    ngay_bat_dau   DATE,
    ngay_ket_thuc  DATE,
    tinh_trang     VARCHAR(50),
    id_phieu_dk    INT,
    id_nhan_su     INT,
    id_phieu_dat_coc INT,
    CONSTRAINT fk_hdt_phieu_dk
        FOREIGN KEY (id_phieu_dk)      REFERENCES phieu_dang_ky (id_phieu),
    CONSTRAINT fk_hdt_nhan_su
        FOREIGN KEY (id_nhan_su)       REFERENCES nhan_su (id_nhan_vien),
    CONSTRAINT fk_hdt_phieu_dat_coc
        FOREIGN KEY (id_phieu_dat_coc) REFERENCES phieu_dat_coc (id_phieu)
);

-- 11. biên bản bàn trả phòng (Room Handover Record)
CREATE TABLE bien_ban_ban_tra_phong (
    id_bien_ban      SERIAL PRIMARY KEY,
    mo_ta            TEXT,
    thoi_gian        TIMESTAMP,
    id_hop_dong      INT,
    tien_boi_thuong  DECIMAL(15, 2),
    id_nhan_su       INT,
    loai_bien_ban    VARCHAR(50),
    CONSTRAINT fk_bbbtp_hop_dong
        FOREIGN KEY (id_hop_dong) REFERENCES hop_dong_thue (id_hop_dong),
    CONSTRAINT fk_bbbtp_nhan_su
        FOREIGN KEY (id_nhan_su)  REFERENCES nhan_su (id_nhan_vien)
);

-- 12. phiếu bồi thường hư hại (Damage Compensation Slip)
CREATE TABLE phieu_boi_thuong_hu_hai (
    id_phieu            SERIAL PRIMARY KEY,
    thoi_gian           TIMESTAMP,
    id_phieu_thanh_toan INT,
    id_bien_ban         INT,
    CONSTRAINT fk_pbthh_phieu_tt
        FOREIGN KEY (id_phieu_thanh_toan) REFERENCES phieu_thanh_toan (id_phieu),
    CONSTRAINT fk_pbthh_bien_ban
        FOREIGN KEY (id_bien_ban)         REFERENCES bien_ban_ban_tra_phong (id_bien_ban)
);

-- 13. phiếu bồi thường – tài sản (Compensation ↔ Asset junction)
CREATE TABLE phieu_boi_thuong_tai_san (
    id_phieu   INT NOT NULL,
    id_phong   INT NOT NULL,
    id_tai_san INT NOT NULL,
    mo_ta      TEXT,
    PRIMARY KEY (id_phieu, id_phong, id_tai_san),
    CONSTRAINT fk_pbts_phieu
        FOREIGN KEY (id_phieu)              REFERENCES phieu_boi_thuong_hu_hai (id_phieu),
    CONSTRAINT fk_pbts_tai_san
        FOREIGN KEY (id_tai_san, id_phong)  REFERENCES tai_san (id_tai_san, id_phong)
);

-- 14. phiếu đăng ký nguyên căn (Full-house Registration)
CREATE TABLE phieu_dang_ky_nguyen_can (
    id_phieu  INT NOT NULL,
    id_phong  INT NOT NULL,
    duoc_chon BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_phieu, id_phong),
    CONSTRAINT fk_pdknc_phieu
        FOREIGN KEY (id_phieu) REFERENCES phieu_dang_ky (id_phieu),
    CONSTRAINT fk_pdknc_phong
        FOREIGN KEY (id_phong) REFERENCES phong (id_phong)
);

-- 15. phiếu đăng ký ghép (Shared-room Registration)
CREATE TABLE phieu_dang_ky_ghep (
    id_phieu  INT NOT NULL,
    id_phong  INT NOT NULL,
    id_giuong INT NOT NULL,
    duoc_chon BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_phieu, id_phong, id_giuong),
    CONSTRAINT fk_pdkg_phieu
        FOREIGN KEY (id_phieu)  REFERENCES phieu_dang_ky (id_phieu),
    CONSTRAINT fk_pdkg_phong
        FOREIGN KEY (id_phong)  REFERENCES phong (id_phong),
    CONSTRAINT fk_pdkg_giuong
        FOREIGN KEY (id_giuong) REFERENCES giuong (id_giuong)
);

-- 16. lịch hẹn xem phòng (Room-viewing Appointment)
CREATE TABLE lich_hen_xem_phong (
    id          SERIAL PRIMARY KEY,
    ngay_gio    TIMESTAMP,
    id_phieu_dk INT,
    id_nhan_su  INT,
    ghi_chu     TEXT,
    CONSTRAINT fk_lhxp_phieu_dk
        FOREIGN KEY (id_phieu_dk) REFERENCES phieu_dang_ky (id_phieu),
    CONSTRAINT fk_lhxp_nhan_su
        FOREIGN KEY (id_nhan_su)  REFERENCES nhan_su (id_nhan_vien)
);

-- 17. lịch hẹn trả phòng (Room-return Appointment)
CREATE TABLE lich_hen_tra_phong (
    id          SERIAL PRIMARY KEY,
    ngay_gio    TIMESTAMP,
    id_hop_dong INT,
    id_nhan_su  INT,
    CONSTRAINT fk_lhtp_hop_dong
        FOREIGN KEY (id_hop_dong) REFERENCES hop_dong_thue (id_hop_dong),
    CONSTRAINT fk_lhtp_nhan_su
        FOREIGN KEY (id_nhan_su)  REFERENCES nhan_su (id_nhan_vien)
);

-- 18. biên bản hoàn cọc (Deposit-return Record)
CREATE TABLE bien_ban_hoan_coc (
    id                  SERIAL PRIMARY KEY,
    ten_bien_ban        VARCHAR(100),
    thoi_gian           TIMESTAMP,
    ti_le_hoan          DECIMAL(5, 2),   -- % hoàn trả
    so_tien             DECIMAL(15, 2),
    id_hop_dong_thue    INT,
    id_phieu_dat_coc    INT,
    id_phieu_thanh_toan INT,
    CONSTRAINT fk_bbhc_hop_dong
        FOREIGN KEY (id_hop_dong_thue)    REFERENCES hop_dong_thue (id_hop_dong),
    CONSTRAINT fk_bbhc_phieu_dat_coc
        FOREIGN KEY (id_phieu_dat_coc)    REFERENCES phieu_dat_coc (id_phieu),
    CONSTRAINT fk_bbhc_phieu_tt
        FOREIGN KEY (id_phieu_thanh_toan) REFERENCES phieu_thanh_toan (id_phieu)
);

-- 19. đăng ký dịch vụ (Service Registration — junction)
CREATE TABLE dang_ky_dich_vu (
    id_phieu   INT NOT NULL,
    id_dich_vu INT NOT NULL,
    PRIMARY KEY (id_phieu, id_dich_vu),
    CONSTRAINT fk_dkdv_phieu
        FOREIGN KEY (id_phieu)   REFERENCES phieu_dang_ky (id_phieu),
    CONSTRAINT fk_dkdv_dich_vu
        FOREIGN KEY (id_dich_vu) REFERENCES dich_vu (id_dich_vu)
);

-- 20. hợp đồng dịch vụ (Service Contract — junction)
CREATE TABLE hop_dong_dich_vu (
    id_hop_dong INT NOT NULL,
    id_dich_vu  INT NOT NULL,
    PRIMARY KEY (id_hop_dong, id_dich_vu),
    CONSTRAINT fk_hddv_hop_dong
        FOREIGN KEY (id_hop_dong) REFERENCES hop_dong_thue (id_hop_dong),
    CONSTRAINT fk_hddv_dich_vu
        FOREIGN KEY (id_dich_vu)  REFERENCES dich_vu (id_dich_vu)
);

-- 21. biên lai đóng tiền thuê (Rent Payment Receipt)
CREATE TABLE bien_lai_dong_tien_thue (
    id_phieu    SERIAL PRIMARY KEY,
    thoi_gian   TIMESTAMP,
    khoan_cuoi  DECIMAL(15, 2),
    id_hop_dong INT,
    CONSTRAINT fk_bldtt_hop_dong
        FOREIGN KEY (id_hop_dong) REFERENCES hop_dong_thue (id_hop_dong)
);

-- 22. hồ sơ khách hàng (Customer Profile)
CREATE TABLE ho_so_khach_hang (
    id_ho_so        SERIAL PRIMARY KEY,
    thoi_gian       TIMESTAMP,
    trang_thai      VARCHAR(50),
    id_phieu_dat_coc INT,
    id_hop_dong     INT,
    CONSTRAINT fk_hskh_phieu_dat_coc
        FOREIGN KEY (id_phieu_dat_coc) REFERENCES phieu_dat_coc (id_phieu),
    CONSTRAINT fk_hskh_hop_dong
        FOREIGN KEY (id_hop_dong)      REFERENCES hop_dong_thue (id_hop_dong)
);

-- 23. hồ sơ khách hàng – khách (Profile ↔ Customer junction)
CREATE TABLE ho_so_khach_hang_kh (
    id_ho_so INT NOT NULL,
    id_khach INT NOT NULL,
    PRIMARY KEY (id_ho_so, id_khach),
    CONSTRAINT fk_hskhkh_ho_so
        FOREIGN KEY (id_ho_so) REFERENCES ho_so_khach_hang (id_ho_so),
    CONSTRAINT fk_hskhkh_khach
        FOREIGN KEY (id_khach) REFERENCES khach_hang (id_khach_hang)
);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
