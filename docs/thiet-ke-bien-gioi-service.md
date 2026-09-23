# Thiết kế biên giới Service - Hệ Thống Quản Lý Kho Hàng (WMS Microservices)

## 1. Danh sách Service
| Service | Cổng | Database | Trách nhiệm chính |
| :--- | :--- | :--- | :--- |
| **api-gateway** | 8080 | (không có DB) | API Gateway duy nhất, định tuyến request, xác thực header JWT, kiểm tra API Key đối tác, cấu hình CORS tập trung |
| **auth-service** | 8081 | `auth_db` | Quản lý Người dùng (User), Phân quyền 3 vai trò (ADMIN, MANAGER, STAFF), Đăng nhập, Sinh & xác thực JWT token |
| **product-service** | 8082 | `product_db` | Quản lý Danh mục (Categories), Nhà cung cấp (Suppliers), Sản phẩm (Products), Điều chỉnh số lượng tồn kho theo yêu cầu nghiệp vụ |
| **warehouse-service** | 8083 | `warehouse_db` | Quản lý Khách hàng (Customers), Phiếu nhập kho (ImportReceipts), Phiếu xuất kho (ExportReceipts - chặn âm kho), Thống kê Dashboard, Báo cáo tồn kho & xuất nhập tồn |

---

## 2. Nguyên tắc sở hữu dữ liệu (Data Ownership) & Database-per-Service
* Mỗi service có **DATABASE RIÊNG BIỆT**, tuyệt đối KHÔNG service nào truy cập trực tiếp database của service khác.
* `auth-service` sở hữu database `auth_db` chứa thông tin tài khoản người dùng (`users`).
* `product-service` sở hữu database `product_db` chứa danh mục (`category`), nhà cung cấp (`supplier`), sản phẩm (`product`).
* `warehouse-service` sở hữu database `warehouse_db` chứa khách hàng (`customer`), phiếu nhập (`import_receipt`, `import_receipt_detail`), phiếu xuất (`export_receipt`, `export_receipt_detail`).
* Bảng chi tiết phiếu xuất/nhập trong `warehouse_db` lưu snapshot thông tin sản phẩm (`product_id`, `product_code`, `product_name`, `unit`) nhằm đảm bảo tính toàn vẹn lịch sử giao dịch và phân tách hoàn toàn cơ sở dữ liệu.

---

## 3. Giao tiếp liên dịch vụ (Inter-Service Communication)
* Hệ thống triển khai giao tiếp liên dịch vụ đồng bộ thông qua **Spring Cloud OpenFeign**:
  * Khi tạo **Phiếu nhập kho** tại `warehouse-service`: Service gọi `SupplierClient` (`GET /suppliers/{id}`) để lấy thông tin nhà cung cấp, và `ProductClient` (`POST /products/{id}/adjust-stock?delta=+qty`) để tăng số lượng tồn kho trong `product-service`.
  * Khi tạo **Phiếu xuất kho** tại `warehouse-service`: Service gọi `ProductClient` (`POST /products/{id}/adjust-stock?delta=-qty`) để kiểm tra số lượng tồn và trừ tồn kho. Nếu không đủ hàng, `product-service` sẽ ném ngoại lệ chặn xuất âm kho.
  * Khi xem **Báo cáo tồn kho / Dashboard** tại `warehouse-service`: Service gọi `ProductClient` (`GET /products/all`, `GET /products/stats`, `GET /products/low-stock`) để tổng hợp chỉ số với dữ liệu phiếu xuất nhập.
* **Bảo mật liên dịch vụ**: Sử dụng `FeignRequestInterceptor` tự động chuyển tiếp (forward) header `Authorization: Bearer <token>` từ request gốc để xác thực xuyên suốt giữa các microservices.

---

## 4. Bảng định tuyến API Gateway
| Route Gateway | Forward tới Service | Phân quyền / Yêu cầu |
| :--- | :--- | :--- |
| `/api/auth/**` | http://localhost:8081/auth/** | Public cho `/login`, các endpoint khác cần JWT |
| `/api/users/**` | http://localhost:8081/users/** | Cần JWT (Role ADMIN) |
| `/api/categories/**` | http://localhost:8082/categories/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| `/api/suppliers/*/receipts` | http://localhost:8083/suppliers/*/receipts | Cần JWT (Xem lịch sử phiếu nhập của NCC) |
| `/api/suppliers/**` | http://localhost:8082/suppliers/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| `/api/products/**` | http://localhost:8082/products/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| `/api/customers/**` | http://localhost:8083/customers/** | Cần JWT (Xem: ALL; Thêm/Sửa/Xoá: ADMIN, MANAGER) |
| `/api/import-receipts/**` | http://localhost:8083/import-receipts/** | Cần JWT (Xem & Tạo: ALL; Huỷ: ADMIN, MANAGER) |
| `/api/export-receipts/**` | http://localhost:8083/export-receipts/** | Cần JWT (Xem & Tạo: ALL; Huỷ: ADMIN, MANAGER) |
| `/api/dashboard/**` | http://localhost:8083/dashboard/** | Cần JWT (ADMIN, MANAGER, STAFF) |
| `/api/reports/**` | http://localhost:8083/reports/** | Cần JWT (ADMIN, MANAGER) |