# Báo Cáo & Kịch Bản Trình Bày Hệ Thống WMS Microservices & Storefront Velvety

## 1. Tổng Quan Kiến Trúc Hệ Thống (Điểm nhấn báo cáo với Giảng viên)

Hệ thống được xây dựng theo kiến trúc **Microservices kết hợp Database-per-Service** (mỗi dịch vụ sở hữu một cơ sở dữ liệu MySQL độc lập, giao tiếp đồng bộ qua **Spring Cloud OpenFeign** và định tuyến tập trung qua **Spring Cloud Gateway**):

| Thành phần | Cổng | Công nghệ | Database | Vai trò chính |
| :--- | :--- | :--- | :--- | :--- |
| **WMS Admin Frontend** | `5173` | React + TypeScript + Vite | - | Giao diện Quản trị Kho hàng (B2B/Internal) phân quyền theo 3 vai trò `ADMIN`, `MANAGER`, `STAFF` |
| **Storefront Frontend** | `5174` | React + TypeScript + Tailwind | - | Giao diện Cửa hàng trực tuyến (B2C) dành cho Khách hàng mua lẻ |
| **API Gateway** | `8085` | Spring Cloud Gateway (WebFlux) | *(Không DB)* | Cổng giao tiếp duy nhất cho 2 Frontend, kiểm tra JWT Token, phân tuyến request và cấu hình CORS |
| **Auth Service** | `8081` | Spring Boot + Spring Security | `auth_db` | Quản lý tài khoản nhân sự nội bộ (`app_user`), xác thực BCrypt và cấp phát JWT |
| **Product Service** | `8082` | Spring Boot + Spring Data JPA | `product_db` | Quản lý Danh mục (`category`), Nhà cung cấp (`supplier`), Sản phẩm (`product`) và điều chỉnh tồn kho |
| **Warehouse Service** | `8083` | Spring Boot + OpenFeign | `warehouse_db` | Quản lý Khách hàng đối tác (`customer`), Phiếu nhập kho (`import_receipt`), Phiếu xuất kho (`export_receipt`), Dashboard & Báo cáo |
| **Customer Service** | `8084` | Spring Boot + OpenFeign | `customer_db` | Quản lý Tài khoản khách mua lẻ (`customer_user`), Giỏ hàng (`cart`), Đơn đặt hàng online (`orders`) |

---

## 2. Phần 1: Giao Diện Khách Hàng - Storefront B2C (`http://localhost:5174`)

Giao diện dành cho khách hàng mua sắm trực tuyến thương hiệu **VELVETY**, kết nối qua `api-gateway` tới `customer-service` và đồng bộ danh mục/tồn kho trực tiếp từ `product-service`.

### Các chức năng và màn hình chính:
1. **Trang chủ & Khu vực trưng bày sản phẩm (`App.tsx`, `Hero.tsx`, `ChipTabs.tsx`)**:
   * **Đồng bộ dữ liệu thời gian thực**: Danh mục hàng hóa và số lượng tồn kho hiển thị trên Storefront được `customer-service` lấy trực tiếp từ `product-service` qua OpenFeign.
   * **Bộ lọc & Tìm kiếm đa tiêu chí**: Lọc theo thẻ Danh mục (Thiết bị điện tử, Đồ gia dụng, Mỹ phẩm & Chăm sóc da VELVETY...), lọc theo khoảng giá (`minPrice` - `maxPrice`), sắp xếp theo giá tăng/giảm dần và tìm kiếm nhanh theo tên hoặc mã SKU.
2. **Chi tiết Sản phẩm (`ProductDetailModal.tsx`)**:
   * Hiển thị hình ảnh, mã SKU, đơn vị tính, giá bán lẻ, mô tả chi tiết và **trạng thái tồn kho thực tế** (chặn chọn số lượng vượt quá số lượng tồn trong kho).
3. **Giỏ hàng thông minh (`CartDrawer.tsx`)**:
   * Cho phép thêm sản phẩm, tăng/giảm số lượng, xóa mặt hàng, tự động tính tổng tiền tạm tính. Hỗ trợ cả khách vãng lai (`sessionId`) và khách đã đăng nhập (`customerId`).
4. **Đăng ký / Đăng nhập Khách hàng (`AuthModal.tsx`)**:
   * Sử dụng hệ thống JWT riêng biệt của `customer-service` (`customer_db.customer_user`).
   * Tài khoản mẫu: `khachhang@gmail.com` / `123456`.
5. **Đặt hàng (Checkout) & Theo dõi Lịch sử Đơn hàng (`CheckoutModal.tsx`, `OrdersModal.tsx`)**:
   * Khi khách bấm **Đặt hàng**, `customer-service` gọi sang `product-service` kiểm tra tồn kho real-time; nếu đủ hàng sẽ sinh mã đơn chuẩn `ORD-yyyyMMdd-XXXX` ở trạng thái `PENDING` (Chờ lập phiếu xuất).
   * Khách hàng xem lại danh sách đơn đã đặt và trạng thái xử lý (`PENDING` -> `EXPORT_REQUESTED` -> `EXPORTED` / `CANCELLED`).

---

## 3. Phần 2: Giao Diện Quản Trị Kho - WMS Admin (`http://localhost:5173`)

Giao diện dành cho nhân sự vận hành kho hàng, áp dụng cơ chế **RBAC (Role-Based Access Control)** bảo vệ ở cả tầng Giao diện (`ProtectedRoute.tsx`, `Navbar.tsx`) và tầng Backend (`JwtAuthFilter`).

### 3.1. Phân quyền 3 cấp độ nhân sự
* **`ADMIN` (`admin` / `admin123`)**: Toàn quyền hệ thống, bao gồm cả **Quản lý Người dùng** (`/admin/users`), duyệt/hủy phiếu kho, xem toàn bộ báo cáo doanh thu - lợi nhuận.
* **`MANAGER` (`manager` / `manager123`)**: Quản lý danh mục, nhà cung cấp, khách hàng, sản phẩm, duyệt phiếu nhập/xuất kho, xem Dashboard tài chính và Báo cáo kho.
* **`STAFF` (`staff` / `staff123`)**: Nhân viên kho — được phép tra cứu tồn kho sản phẩm, lập phiếu nhập/xuất kho (trạng thái chờ duyệt `PENDING`) và xử lý đơn hàng online; **ẩn** các chỉ số tài chính nhạy cảm (doanh thu/lợi nhuận) và các menu cấu hình.

### 3.2. Các phân hệ chức năng trên giao diện Admin
1. **Tổng quan Kho hàng (`DashboardPage.tsx` - `/dashboard`)**:
   * **Hệ thống 6 thẻ KPI (Grid 3x2)**: Doanh thu tháng này (kèm doanh số hôm nay), Lợi nhuận ước tính & Tỷ suất lợi nhuận (%), Giá trị nhập kho trong tháng, Tổng giá trị vốn tồn kho, Tổng số mã hàng SKU, và Số mặt hàng cảnh báo tồn kho thấp.
   * **Biểu đồ trực quan 6 tháng gần nhất**: Chuyển đổi linh hoạt giữa chế độ **Doanh thu & Lợi nhuận** và **Giá trị Nhập - Xuất kho**.
   * **Bảng Cảnh báo sắp hết hàng**: Tự động liệt kê các sản phẩm có `stockQuantity <= minStockLevel` (ví dụ `SP004`, `SP006`) để kịp thời nhập bổ sung.
2. **Quản lý Danh mục, Nhà cung cấp & Sản phẩm (`/categories`, `/suppliers`, `/products`)**:
   * CRUD đầy đủ danh mục, hồ sơ nhà cung cấp (kèm trang chi tiết lịch sử các phiếu nhập từ nhà cung cấp đó `/suppliers/:id`).
   * Quản lý Sản phẩm (`/products`, `/products/:id`): Theo dõi mã SKU, giá nhập (giá vốn), giá xuất (giá bán), định mức tồn tối thiểu (`minStockLevel`), trạng thái kinh doanh và thẻ cảnh báo tồn kho.
3. **Quản lý Nhập kho (`ImportReceiptsPage.tsx` - `/import-receipts`)**:
   * Quy trình **2 bước chặt chẽ**: Lập phiếu nhập (`PENDING`) -> Quản lý/Admin **Duyệt phiếu (`COMPLETED`)** hoặc **Từ chối (`REJECTED`)**.
   * Khi phiếu nhập được duyệt, `warehouse-service` gọi OpenFeign sang `product-service` (`POST /products/{id}/adjust-stock`) để **tự động cộng số lượng tồn kho** và lưu snapshot thông tin sản phẩm/nhà cung cấp vào `warehouse_db`. Hỗ trợ **In phiếu nhập kho** (`PrintReceiptModal.tsx`).
4. **Quản lý Xuất kho (`ExportReceiptsPage.tsx` - `/export-receipts`)**:
   * Khi duyệt phiếu xuất kho, hệ thống kiểm tra tồn kho thực tế bên `product-service`: **chặn xuất âm kho** nếu số lượng tồn không đủ, tự động trừ tồn kho khi hoàn tất và cho phép hoàn tác cộng lại tồn kho nếu hủy phiếu.
5. **Xử lý Đơn hàng Online từ Storefront (`OrdersPage.tsx` - `/orders`)**:
   * **Điểm kết nối liên thông B2C -> WMS**: Đơn hàng khách đặt bên Storefront (`http://localhost:5174`) xuất hiện ngay tại mục **Đơn hàng online** (`/orders`).
   * Nhân viên/Quản lý bấm **"Lập phiếu xuất"** ngay trên đơn hàng -> `warehouse-service` tự động tạo Phiếu xuất kho gắn với `orderId` và chuyển trạng thái đơn sang `EXPORT_REQUESTED`. Khi phiếu xuất được duyệt hoàn tất, đơn hàng tự động chuyển sang `EXPORTED` (Đã xuất kho).
6. **Quản lý Khách hàng & Quản lý Người dùng (`/customers`, `/admin/users`)**:
   * Lưu trữ thông tin khách hàng Cá nhân / Đại lý / Doanh nghiệp và lịch sử giao dịch xuất kho (`/customers/:id`).
   * Phân hệ `/admin/users` (chỉ `ADMIN`) cho phép tạo mới tài khoản nhân sự, đổi vai trò (`ADMIN`, `MANAGER`, `STAFF`) và khóa/mở khóa tài khoản.

---

## 4. Phần 3: Phân Hệ Báo Cáo & Thống Kê (`ReportsPage.tsx` - `/reports`)

Phân hệ Báo cáo dành cho `ADMIN` và `MANAGER` được chia làm **3 báo cáo chuyên sâu**, hỗ trợ bộ lọc nhanh theo kỳ (*Hôm nay, 7 ngày qua, Tháng này, Quý này, Năm nay*), **In báo cáo chuẩn A4** và **Xuất file CSV (Excel)**:

1. **Tab 1 - Báo cáo Tồn kho hiện tại (`INVENTORY`)**:
   * Thống kê toàn bộ danh mục SKU, số lượng đang tồn trong kho, đơn giá vốn, **tổng giá trị vốn tồn kho** (`stockQuantity * importPrice`) và trạng thái an toàn kho (*Còn hàng / Sắp hết hàng / Hết hàng*).
2. **Tab 2 - Báo cáo Xuất - Nhập - Tồn trong kỳ (`IMPORT_EXPORT`)**:
   * Phản ánh biến động kho hàng theo công thức kế toán kho chuẩn:
     $$\text{Tồn đầu kỳ} + \text{Nhập trong kỳ} - \text{Xuất trong kỳ} = \text{Tồn cuối kỳ}$$
   * Thống kê chi tiết cả về số lượng và giá trị tiền nhập/xuất của từng mặt hàng trong khoảng thời gian tùy chọn.
3. **Tab 3 - Báo cáo Doanh thu & Lợi nhuận (`REVENUE`)**:
   * Tổng hợp **Tổng doanh thu xuất bán**, **Tổng giá vốn hàng bán (COGS)**, **Lợi nhuận gộp** ($\text{Doanh thu} - \text{Giá vốn}$) và **Tỷ suất lợi nhuận gộp (%)**.
   * Cho phép đi sâu (drill-down) theo 3 góc nhìn:
     * *Theo Sản phẩm*: Mặt hàng nào mang lại doanh thu và biên lợi nhuận cao nhất.
     * *Theo Phiếu xuất*: Chi tiết doanh thu, giá vốn và lãi gộp trên từng phiếu xuất kho.
     * *Theo Khách hàng*: Top khách hàng/đại lý đóng góp doanh thu lớn nhất.

---

## 5. Kịch Bản Demo Trực Tiếp 5 Phút Cho Giảng Viên

1. **Bước 1 - Trình bày Kiến trúc & Database (1 phút)**:
   * Mở MySQL Workbench/CLI cho giảng viên thấy 4 database tách biệt (`auth_db`, `product_db`, `warehouse_db`, `customer_db`) đúng chuẩn **Database-per-Service**.
2. **Bước 2 - Demo Khách hàng đặt hàng trên Storefront B2C (1.5 phút)**:
   * Mở `http://localhost:5174`, đăng nhập tài khoản khách (`khachhang@gmail.com` / `123456`).
   * Lọc danh mục **Mỹ phẩm & Chăm sóc da VELVETY**, thêm sản phẩm `VEL-001` vào giỏ hàng và bấm **Đặt hàng**.
   * Mở mục **Đơn hàng của tôi** để thấy đơn hàng mới tạo ở trạng thái **Chờ xử lý (`PENDING`)**.
3. **Bước 3 - Demo Luồng Xử lý Đơn hàng & Xuất kho bên WMS Admin (1.5 phút)**:
   * Mở `http://localhost:5173`, đăng nhập bằng `admin` / `admin123`.
   * Vào mục **Đơn hàng online (`/orders`)**, thấy ngay đơn hàng vừa đặt từ Storefront -> bấm **"Lập phiếu xuất"**.
   * Chuyển sang mục **Xuất kho (`/export-receipts`)**, bấm **Duyệt phiếu xuất** -> hệ thống gọi OpenFeign sang `product-service` trừ tồn kho thực tế và cập nhật trạng thái đơn hàng sang **Đã xuất kho (`EXPORTED`)**.
4. **Bước 4 - Demo Phân quyền & Báo cáo Xuất-Nhập-Tồn / Doanh thu (1 phút)**:
   * Mở trang **Tổng quan (`/dashboard`)** và **Báo cáo (`/reports`)**, chuyển qua lại giữa 3 tab *Tồn kho*, *Xuất - Nhập - Tồn*, *Doanh thu & Lợi nhuận*, bấm thử **Xuất Excel (CSV)** hoặc **In báo cáo**.
   * Đăng xuất và đăng nhập thử tài khoản `staff` / `staff123` để chứng minh hệ thống tự động ẩn các menu quản trị và chỉ số doanh thu/lợi nhuận.
