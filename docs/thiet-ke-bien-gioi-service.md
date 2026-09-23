# Thiết kế biên giới Service - Hệ Thống Quản Lý Kho Hàng (WMS)

## 1. Danh sách Service
| Service | Cổng | Database | Trách nhiệm chính |
| :--- | :--- | :--- | :--- |
| api-gateway | 8080 | (không có DB) | API Gateway duy nhất, định tuyến request, xác thực header JWT, kiểm tra API Key đối tác, cấu hình CORS |
| auth-service | 8081 | auth_db | Quản lý Người dùng (User), Phân quyền 3 vai trò (ADMIN, MANAGER, STAFF), Đăng nhập, Sinh & xác thực JWT token |
| warehouse-service | 8082 | warehouse_db | Quản lý Danh mục, Nhà cung cấp, Khách hàng, Hàng hoá/Sản phẩm, Phiếu nhập kho (tự cộng tồn kho), Phiếu xuất kho (tự trừ & chặn âm kho), Dashboard thống kê, Báo cáo tồn & biến động kho |

## 2. Nguyên tắc sở hữu dữ liệu (Data Ownership)
* Mỗi service có **DATABASE RIÊNG BIỆT**, tuyệt đối KHÔNG service nào truy cập trực tiếp database của service khác.
* uth-service sở hữu database uth_db chứa thông tin tài khoản người dùng (users).
* warehouse-service sở hữu database warehouse_db chứa các bảng nghiệp vụ kho (categories, suppliers, customers, products, import_receipts, import_receipt_details, export_receipts, export_receipt_details).
* Giao tiếp giữa Frontend và Backend luôn đi qua API Gateway cổng 8080.
* Xác thực người dùng thực hiện bằng JWT Token được ký chung một Secret Key giữa các microservices.

## 3. Bảng định tuyến API Gateway
| Route Gateway | Forward tới Service | Phân quyền / Yêu cầu |
| :--- | :--- | :--- |
| /api/auth/** | http://localhost:8081/auth/** | Public cho /login, các endpoint khác cần JWT |
| /api/users/** | http://localhost:8081/users/** | Cần JWT (Role ADMIN) |
| /api/categories/** | http://localhost:8082/categories/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| /api/suppliers/** | http://localhost:8082/suppliers/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| /api/customers/** | http://localhost:8082/customers/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| /api/products/** | http://localhost:8082/products/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| /api/import-receipts/** | http://localhost:8082/import-receipts/** | Cần JWT (Xem & Tạo: ALL; Huỷ: ADMIN, MANAGER) |
| /api/export-receipts/** | http://localhost:8082/export-receipts/** | Cần JWT (Xem & Tạo: ALL; Huỷ: ADMIN, MANAGER) |
| /api/dashboard/** | http://localhost:8082/dashboard/** | Cần JWT (ADMIN, MANAGER) |
| /api/reports/** | http://localhost:8082/reports/** | Cần JWT (ADMIN, MANAGER) |
| /api/public/products | http://localhost:8082/products | Cần Header X-API-KEY: wms-partner-key-2026 |