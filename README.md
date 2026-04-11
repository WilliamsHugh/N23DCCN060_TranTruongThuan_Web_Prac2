# LAB 2 — BACKEND VỚI NODE.JS MICROSERVICES

## Thông tin sinh viên

| Thông tin     | Chi tiết                                                             |
|---------------|----------------------------------------------------------------------|
| **Họ và tên** | Trần Trường Thuận                                                    |
| **MSSV**      | N23DCCN060                                                           |
| **Môn học**   | Thực hành Web                                                        |
| **GitHub**    | https://github.com/WilliamsHugh/N23DCCN060_TranTruongThuan_Web_Prac2 |

---

## 🚀 Demo Production (Railway)

> **Khuyến nghị: Test qua các URL public bên dưới — không cần cài đặt gì.**

| Service             | URL                                                    | Swagger UI                                                      |
|---------------------|--------------------------------------------------------|-----------------------------------------------------------------|
| **API Gateway**     | https://api-gateway-production-32ce.up.railway.app     | —                                                               |
| **Product Service** | https://product-service-production-7e23.up.railway.app | https://product-service-production-7e23.up.railway.app/api-docs |
| **Auth Service**    | https://auth-service-production-64a1.up.railway.app    | https://auth-service-production-64a1.up.railway.app/api-docs    |
| **Order Service**   | https://order-service-production-21a0.up.railway.app   | https://order-service-production-21a0.up.railway.app/api-docs   |

---

## 🧪 Test API nhanh qua curl

### 1. Health check
```bash
curl https://api-gateway-production-32ce.up.railway.app/health
```

### 2. Đăng ký tài khoản
```bash
curl -X POST https://api-gateway-production-32ce.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'
```

### 3. Đăng nhập — lấy token
```bash
curl -X POST https://api-gateway-production-32ce.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```
> Copy `accessToken` từ response để dùng cho các bước tiếp theo

### 4. Lấy danh sách sản phẩm (có pagination, filter, sort)
```bash
curl "https://api-gateway-production-32ce.up.railway.app/api/products?page=1&limit=5&sortBy=price&order=asc"
```

### 5. Tạo sản phẩm mới
```bash
curl -X POST https://api-gateway-production-32ce.up.railway.app/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"iPhone 15 Pro","price":27990000,"stock":50,"description":"Điện thoại cao cấp"}'
```

### 6. Test validation lỗi (422)
```bash
curl -X POST https://api-gateway-production-32ce.up.railway.app/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"","price":-1}'
```

### 7. Tìm kiếm + filter sản phẩm
```bash
curl "https://api-gateway-production-32ce.up.railway.app/api/products?search=iphone&minPrice=20000000"
```

### 8. Tạo đơn hàng (cần token từ bước 3)
```bash
curl -X POST https://api-gateway-production-32ce.up.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "customerId": 1,
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "items": [{"productId":1,"productName":"iPhone 15 Pro","price":27990000,"quantity":1,"subtotal":27990000}],
    "totalAmount": 27990000,
    "shippingAddress": {"street":"123 Nguyen Hue","city":"Ho Chi Minh","district":"Quan 1"}
  }'
```

### 9. Upload ảnh sản phẩm
```bash
curl -X POST https://product-service-production-7e23.up.railway.app/api/products/1/image \
  -F "image=@/path/to/photo.jpg"
```

---

## 🏗️ Kiến trúc hệ thống

```
Client
  │
  ▼
API Gateway (3000)  ──── JWT Auth Middleware ─────────────────┐
  │                                                           │
  ├──► Product Service (3001) ──► PostgreSQL (Supabase)       │
  │         └── Redis Cache                                   │
  │         └── Cloudinary (Image Upload)                     │
  │                                                           │
  ├──► Order Service (3002) ──► MongoDB Atlas                 │
  │                                                           │
  └──► Auth Service (3003) ──► PostgreSQL (Supabase) ◄────────┘
```

---

## 🐳 Chạy Local bằng Docker Compose

### Yêu cầu
- Docker Desktop >= 24.x
- Git

### Các bước

```bash
# 1. Clone repo
git clone https://github.com/WilliamsHugh/N23DCCN060_TranTruongThuan_Web_Prac2
cd N23DCCN060_TranTruongThuan_Web_Prac2

# 2. Tạo file .env cho từng service (xem .env.example trong mỗi thư mục)
cp product-service/.env.example product-service/.env
cp order-service/.env.example order-service/.env
cp auth-service/.env.example auth-service/.env
cp api-gateway/.env.example api-gateway/.env

# 3. Chạy toàn bộ hệ thống
docker-compose up -d

# 4. Kiểm tra các service đang chạy
docker-compose ps

# 5. Xem logs
docker-compose logs -f product_service
```

### Chạy môi trường Development (hot reload)
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Các URL local sau khi chạy
| Service         | URL                            |
|-----------------|--------------------------------|
| API Gateway     | http://localhost:3000          |
| Product Service | http://localhost:3001          |
| Product Swagger | http://localhost:3001/api-docs |
| Order Service   | http://localhost:3002          |
| Order Swagger   | http://localhost:3002/api-docs |
| Auth Service    | http://localhost:3003          |
| Auth Swagger    | http://localhost:3003/api-docs |

### Seed dữ liệu mẫu
```bash
docker-compose exec product_service npx prisma db seed
```

### Dừng hệ thống
```bash
docker-compose down        # giữ dữ liệu
docker-compose down -v     # xoá cả dữ liệu
```

---

## ✅ Checklist hoàn thành

| STT | Tiêu chí                                          | Trạng thái |
|-----|---------------------------------------------------|------------|
|  1  | Product Service khởi động, kết nối PostgreSQL     |     ✅     |
|  2  | Prisma schema định nghĩa đúng, migration chạy được|     ✅     |
|  3  | CRUD API hoạt động đầy đủ (GET/POST/PUT/DELETE)   |     ✅     |
|  4  | Pagination, filtering, sorting hoạt động đúng     |     ✅     |
|  5  | Validation trả về lỗi chi tiết khi dữ liệu sai    |     ✅     |
|  6  | Swagger UI hiển thị và test được tất cả endpoints |     ✅     |
|  7  | Order Service kết nối MongoDB, CRUD đơn hàng      |     ✅     |
|  8  | Docker Compose khởi động toàn bộ hệ thống         |     ✅     |
|  9  | Deploy thành công lên Railway                     |     ✅     |

### Yêu cầu nâng cao đã hoàn thành
| Yêu cầu   | Mô tả                                            | Trạng thái |
|-----------|--------------------------------------------------|------------|
| Yêu cầu 1 | Auth Service với JWT (register/login/refresh/me) |     ✅     |
| Yêu cầu 2 | Tích hợp xác thực JWT vào API Gateway            |     ✅     |
| Yêu cầu 3 | Image Upload với Cloudinary                      |     ✅     |
| Yêu cầu 4 | Caching với Redis (5 phút, invalidate on write)  |     ✅     |
| Yêu cầu 5 | Swagger đầy đủ cho Order Service                 |     ✅     |

---

## 🛠️ Công nghệ sử dụng

- **Runtime:** Node.js 20, Express.js
- **ORM/ODM:** Prisma 7 (PostgreSQL), Mongoose (MongoDB)
- **Database:** PostgreSQL (Supabase), MongoDB (Atlas), Redis
- **Auth:** JWT (access token 15 phút + refresh token 7 ngày)
- **Storage:** Cloudinary
- **Docs:** Swagger UI (OpenAPI 3.0)
- **Container:** Docker, Docker Compose
- **Deploy:** Railway
