# Order Management API

RESTful API quản lý đơn hàng (Orders) — Lab 2, Nhóm 2  
Xây dựng bằng **Node.js + Express + MongoDB Atlas + Mongoose**

---

## Giới thiệu

Project này xây dựng một backend API hoàn chỉnh cho hệ thống quản lý đơn hàng, bao gồm:
- Tạo, đọc, cập nhật, xóa đơn hàng (CRUD)
- Lọc theo trạng thái, tìm kiếm theo tên, sắp xếp theo tổng tiền
- Validate dữ liệu nghiêm ngặt (bao gồm kiểm tra totalAmount)
- Response JSON chuẩn hóa
- Logging request bằng morgan

---

## Cài đặt

```bash
# 1. Clone hoặc tải project về
git clone <repo-url>
cd order-management-api

# 2. Cài đặt dependencies
npm install
```

---

## Cấu hình môi trường

```bash
# Tạo file .env từ file mẫu
cp .env.example .env

# Windows (cmd)
copy .env.example .env
```

Mở file `.env` và điền thông tin thực tế:

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/OrderDB?retryWrites=true&w=majority
MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
```

> **Lấy MONGO_URI ở đâu?**  
> Vào [MongoDB Atlas](https://cloud.mongodb.com) → Cluster của bạn → **Connect** → **Connect your application** → Chọn Driver **Node.js** → Copy connection string → Thay `<password>` bằng mật khẩu thật.

> Nếu gặp lỗi `querySrv ECONNREFUSED`, đặt thêm `MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1` trong `.env` để Node.js dùng DNS public khi resolve `mongodb+srv`.

---

## Chạy server

```bash
# Chế độ dev (auto restart khi sửa code)
npm run dev

# Chế độ production
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

---

## Danh sách Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Kiểm tra server |
| GET | `/api/orders` | Lấy tất cả đơn hàng |
| GET | `/api/orders?status=pending` | Lọc theo trạng thái |
| GET | `/api/orders?sort=asc` | Sắp xếp theo tổng tiền tăng dần |
| GET | `/api/orders?sort=desc` | Sắp xếp theo tổng tiền giảm dần |
| GET | `/api/orders/search?name=abc` | Tìm theo tên khách hàng |
| GET | `/api/orders/:id` | Lấy 1 đơn hàng theo ID |
| POST | `/api/orders` | Tạo đơn hàng mới |
| PUT | `/api/orders/:id` | Cập nhật đơn hàng |
| DELETE | `/api/orders/:id` | Xóa đơn hàng |

**Các giá trị `status` hợp lệ:** `pending` | `confirmed` | `shipped` | `delivered` | `cancelled`

---

## Ví dụ JSON

### POST `/api/orders` — Tạo đơn hàng mới

```json
{
  "customerName": "Nguyen Van A",
  "customerEmail": "vana@email.com",
  "items": [
    { "productName": "Laptop Dell XPS", "quantity": 1, "unitPrice": 25000000 },
    { "productName": "Chuot Logitech", "quantity": 2, "unitPrice": 500000 }
  ],
  "totalAmount": 26000000
}
```

> ⚠️ `totalAmount` **phải bằng đúng** tổng `quantity × unitPrice` của tất cả items.  
> Trường hợp trên: `1×25000000 + 2×500000 = 26000000` ✅

### PUT `/api/orders/:id` — Cập nhật trạng thái

```json
{
  "status": "confirmed"
}
```

---

## Cấu trúc Response

### Thành công

```json
{
  "success": true,
  "message": "Tao don hang thanh cong",
  "data": { ... }
}
```

### Thất bại

```json
{
  "success": false,
  "message": "totalAmount khong chinh xac...",
  "error": "..."
}
```

---

## Hướng dẫn test với Postman

**Bước 1:** Mở Postman → New Request

**Bước 2:** Test lần lượt theo thứ tự:

1. **Tạo đơn hàng** — `POST http://localhost:5000/api/orders`
   - Chọn tab **Body** → **raw** → **JSON**
   - Dán JSON mẫu ở trên vào
   - Ghi lại `_id` trong response để dùng cho các bước sau

2. **Lấy tất cả** — `GET http://localhost:5000/api/orders`

3. **Lọc theo trạng thái** — `GET http://localhost:5000/api/orders?status=pending`

4. **Tìm kiếm** — `GET http://localhost:5000/api/orders/search?name=nguyen`

5. **Lấy theo ID** — `GET http://localhost:5000/api/orders/<_id>`

6. **Cập nhật** — `PUT http://localhost:5000/api/orders/<_id>`
   - Body: `{"status": "confirmed"}`

7. **Xóa** — `DELETE http://localhost:5000/api/orders/<_id>`

**Tip:** Tạo 1 Collection trong Postman để lưu lại tất cả request, dễ test lại.

---

## Deploy lên Render / Railway

### Render.com (Free)

1. Push code lên GitHub (nhớ **đừng push file `.env`**)
2. Vào [render.com](https://render.com) → New Web Service → Kết nối GitHub repo
3. Cấu hình:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Vào tab **Environment** → Add các biến:
   - `MONGO_URI` = connection string của bạn
   - `NODE_ENV` = `production`

### Railway.app

1. Vào [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Add biến môi trường tương tự trong tab **Variables**

---

## Giải thích từng file

### `server.js`
File khởi động chính. Cấu hình middleware (cors, morgan, json), kết nối MongoDB, gắn routes vào `/api/orders`, lắng nghe cổng.

### `models/Order.js`
Định nghĩa "khuôn mẫu" dữ liệu với Mongoose Schema. Khai báo các trường, kiểu dữ liệu, ràng buộc (required, min, enum). Mongoose dùng schema này để validate tự động trước khi lưu vào DB.

### `routes/orderRoutes.js`
Xử lý toàn bộ logic CRUD. Mỗi `router.get/post/put/delete` xử lý 1 endpoint. Bao gồm validate ObjectId, validate totalAmount, xây dựng filter/sort linh hoạt, và trả response chuẩn.

### `.env`
Lưu thông tin nhạy cảm (mật khẩu DB, cổng). **Không bao giờ commit file này lên Git.**

### `.env.example`
File mẫu chứa các tên biến (không có giá trị thật), để người khác biết cần cấu hình những gì.

### `.gitignore`
Liệt kê các file/thư mục không push lên Git: `node_modules/`, `.env`.
