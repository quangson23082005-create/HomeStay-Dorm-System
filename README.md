# HomeStay-Dorm-System

Hướng dẫn nhanh để chạy dự án local.

## 1) Yêu cầu môi trường

- Node.js 18+ (khuyến nghị bản LTS)
- npm 9+
- PostgreSQL (mặc định cổng `5432`)

## 2) Cài đặt

```bash
npm install
```

## 3) Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc dự án:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=homestay_db
DB_USER=postgres
DB_PASSWORD=
DB_OPTIONS=
SUPABASE_URL=
SUPABASE_KEY=
```

> Nếu không có `.env`, ứng dụng sẽ dùng giá trị mặc định trong `config/env.js`.

## 4) Chuẩn bị cơ sở dữ liệu

- Tạo database PostgreSQL tên `homestay_db` (hoặc tên bạn đặt trong `.env`).
- Có thể import schema mẫu từ file `homestay_schema.sql` nếu cần dữ liệu cấu trúc ban đầu.

## 5) Chạy ứng dụng

```bash
npm start
```

Ứng dụng chạy tại: `http://localhost:3000` (hoặc theo `PORT` trong `.env`).

## 6) Tài khoản đăng nhập mẫu

- `sale / sale123`
- `ketoan / ketoan123`
- `quanly / quanly123`
- `khachhang / kh123`

## Ghi chú

- Dự án hiện chưa có test tự động; lệnh `npm test` sẽ báo `Error: no test specified`.
