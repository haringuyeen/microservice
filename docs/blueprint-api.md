# Blueprint API - Hệ Thống Quản Lý Kho Hàng (WMS)

## 1. auth-service (Cổng 8081, Tiền tố Gateway: /api/auth & /api/users)

### Xác thực & Tài khoản
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| POST | /api/auth/login | Đăng nhập hệ thống, trả về JWT token + thông tin user | Public |
| GET | /api/auth/me | Lấy thông tin user hiện tại đang đăng nhập | Yêu cầu JWT |

### Quản lý Người dùng (Chỉ ADMIN)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/users | Lấy danh sách tài khoản (hỗ trợ phân trang, tìm kiếm) | ADMIN |
| GET | /api/users/{id} | Lấy chi tiết tài khoản theo ID | ADMIN |
| POST | /api/users | Tạo mới tài khoản (ADMIN, MANAGER, STAFF) | ADMIN |
| PUT | /api/users/{id} | Cập nhật thông tin, vai trò, trạng thái tài khoản | ADMIN |
| DELETE | /api/users/{id} | Khoá/Xoá tài khoản | ADMIN |

---

## 2. warehouse-service (Cổng 8082)

### Danh mục hàng hoá (Categories)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/categories | Lấy danh sách danh mục (hỗ trợ tìm kiếm, phân trang) | ALL (ADMIN, MANAGER, STAFF) |
| GET | /api/categories/{id} | Chi tiết danh mục | ALL |
| POST | /api/categories | Tạo mới danh mục | ADMIN, MANAGER |
| PUT | /api/categories/{id} | Cập nhật danh mục | ADMIN, MANAGER |
| DELETE | /api/categories/{id} | Xoá danh mục (nếu chưa có sản phẩm liên kết) | ADMIN, MANAGER |

### Nhà cung cấp (Suppliers)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/suppliers | Lấy danh sách nhà cung cấp (search, phân trang) | ALL |
| GET | /api/suppliers/{id} | Chi tiết nhà cung cấp | ALL |
| POST | /api/suppliers | Tạo mới nhà cung cấp | ADMIN, MANAGER |
| PUT | /api/suppliers/{id} | Cập nhật nhà cung cấp | ADMIN, MANAGER |
| DELETE | /api/suppliers/{id} | Xoá nhà cung cấp | ADMIN, MANAGER |

### Khách hàng (Customers)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/customers | Lấy danh sách khách hàng (search, phân trang) | ALL |
| GET | /api/customers/{id} | Chi tiết khách hàng | ALL |
| POST | /api/customers | Tạo mới khách hàng | ADMIN, MANAGER |
| PUT | /api/customers/{id} | Cập nhật khách hàng | ADMIN, MANAGER |
| DELETE | /api/customers/{id} | Xoá khách hàng | ADMIN, MANAGER |

### Hàng hoá / Sản phẩm (Products)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/products | Danh sách hàng hoá (tìm theo tên, mã SKU, lọc danh mục, phân trang) | ALL |
| GET | /api/products/{id} | Chi tiết thông tin hàng hoá & số lượng tồn kho | ALL |
| POST | /api/products | Thêm mới hàng hoá (mã SKU duy nhất, ngưỡng tồn tối thiểu) | ADMIN, MANAGER |
| PUT | /api/products/{id} | Sửa thông tin hàng hoá, giá vốn, giá bán, vị trí kệ kho | ADMIN, MANAGER |
| DELETE | /api/products/{id} | Xoá hàng hoá (ngừng kinh doanh) | ADMIN, MANAGER |

### Quản lý Nhập kho (Import Receipts)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/import-receipts | Danh sách phiếu nhập kho (lọc theo NCC, khoảng ngày, phân trang) | ALL |
| GET | /api/import-receipts/{id}| Chi tiết phiếu nhập & danh sách các mặt hàng nhập | ALL |
| POST | /api/import-receipts | Tạo phiếu nhập kho: **Tự động cộng tồn kho** các sản phẩm tương ứng | ALL |
| PUT | /api/import-receipts/{id}/cancel | Huỷ phiếu nhập kho: **Hoàn tác trừ lại tồn kho** | ADMIN, MANAGER |

### Quản lý Xuất kho (Export Receipts)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/export-receipts | Danh sách phiếu xuất kho (lọc theo Khách hàng, khoảng ngày, phân trang) | ALL |
| GET | /api/export-receipts/{id}| Chi tiết phiếu xuất & danh sách các mặt hàng xuất | ALL |
| POST | /api/export-receipts | Tạo phiếu xuất kho: **Kiểm tra đủ hàng tồn, tự động trừ tồn kho (chặn âm kho)** | ALL |
| PUT | /api/export-receipts/{id}/cancel | Huỷ phiếu xuất kho: **Hoàn tác cộng lại tồn kho** | ADMIN, MANAGER |

### Dashboard Thống kê & Cảnh báo (Dashboard)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/dashboard/summary | KPI tổng hợp: Tổng sản phẩm, Tổng giá trị tồn kho, Cảnh báo sắp hết hàng, Tổng doanh thu xuất | ADMIN, MANAGER |

### Báo cáo Kho hàng (Reports)
| Method | Endpoint Gateway | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- |
| GET | /api/reports/inventory | Báo cáo tồn kho toàn diện (số lượng, giá trị vốn, ngưỡng cảnh báo) | ADMIN, MANAGER |
| GET | /api/reports/turnover | Báo cáo xuất nhập tồn & biến động kho hàng trong kỳ | ADMIN, MANAGER |