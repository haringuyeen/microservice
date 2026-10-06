package hn.warehouseservice.service;

import hn.warehouseservice.client.ProductClient;
import hn.warehouseservice.dto.ExportReceiptDTO;
import hn.warehouseservice.dto.ExportReceiptDetailDTO;
import hn.warehouseservice.dto.ProductDTO;
import hn.warehouseservice.entity.Customer;
import hn.warehouseservice.entity.ExportReceipt;
import hn.warehouseservice.entity.ExportReceiptDetail;
import hn.warehouseservice.repository.CustomerRepository;
import hn.warehouseservice.repository.ExportReceiptDetailRepository;
import hn.warehouseservice.repository.ExportReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import hn.warehouseservice.client.CustomerClient;
import hn.warehouseservice.dto.OrderDTO;
import hn.warehouseservice.dto.OrderDetailDTO;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportReceiptService {

    private final ExportReceiptRepository exportReceiptRepository;
    private final ExportReceiptDetailRepository exportReceiptDetailRepository;
    private final CustomerRepository customerRepository;
    private final ProductClient productClient;
    private final CustomerClient customerClient;

    public Page<ExportReceiptDTO> search(String keyword, Long customerId, String status,
                                         LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        return exportReceiptRepository.searchReceipts(keyword, customerId, status, fromDate, toDate, pageable)
                .map(this::toDTO);
    }

    public ExportReceiptDTO getById(Long id) {
        ExportReceipt r = exportReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu xuat id = " + id));
        return toDTO(r);
    }

    public List<ExportReceiptDTO> getByCustomer(Long customerId) {
        return exportReceiptRepository.findByCustomerIdOrderByExportDateDesc(customerId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public ExportReceiptDTO create(ExportReceiptDTO dto, Long currentUserId, String currentUserName, String currentUserRole) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay khach hang id = " + dto.getCustomerId()));

        String code = dto.getCode();
        if (code == null || code.isBlank()) {
            String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            long count = exportReceiptRepository.count() + 1;
            code = String.format("PXK-%s-%04d", datePrefix, count);
            while (exportReceiptRepository.existsByCodeIgnoreCase(code)) {
                count++;
                code = String.format("PXK-%s-%04d", datePrefix, count);
            }
        } else if (exportReceiptRepository.existsByCodeIgnoreCase(code.trim())) {
            throw new IllegalArgumentException("Ma phieu xuat '" + code + "' da ton tai");
        }

        boolean isImmediateApprove = ("APPROVED".equalsIgnoreCase(dto.getStatus()) || "COMPLETED".equalsIgnoreCase(dto.getStatus()))
                && ("ADMIN".equalsIgnoreCase(currentUserRole) || "MANAGER".equalsIgnoreCase(currentUserRole));

        ExportReceipt receipt = new ExportReceipt();
        receipt.setCode(code.toUpperCase().trim());
        receipt.setExportDate(dto.getExportDate() != null ? dto.getExportDate() : LocalDateTime.now());
        receipt.setCustomer(customer);
        receipt.setUserId(currentUserId != null ? currentUserId : (dto.getUserId() != null ? dto.getUserId() : 1L));
        receipt.setCreatorName(currentUserName != null && !currentUserName.isBlank() ? currentUserName :
                (dto.getCreatorName() != null ? dto.getCreatorName() : "Nhan vien kho"));
        receipt.setNotes(dto.getNotes());
        receipt.setOrderId(dto.getOrderId());

        if (isImmediateApprove) {
            receipt.setStatus("APPROVED");
            receipt.setApprovedById(currentUserId);
            receipt.setApproverName(currentUserName != null && !currentUserName.isBlank() ? currentUserName : "Quản lý");
            receipt.setApprovedAt(LocalDateTime.now());
        } else {
            receipt.setStatus("PENDING");
        }

        BigDecimal total = BigDecimal.ZERO;
        List<ExportReceiptDetail> details = new ArrayList<>();

        for (ExportReceiptDetailDTO item : dto.getDetails()) {
            // Giao tiếp liên dịch vụ: Lấy thông tin sản phẩm từ product-service
            ProductDTO product = productClient.getById(item.getProductId());
            if (product == null) {
                throw new NoSuchElementException("Khong tim thay san pham id = " + item.getProductId());
            }

            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("So luong san pham '" + product.getName() + "' phai lon hon 0");
            }
            if (item.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Don gia san pham '" + product.getName() + "' khong the am");
            }

            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            total = total.add(lineTotal);

            ExportReceiptDetail detail = new ExportReceiptDetail();
            detail.setReceipt(receipt);
            detail.setProductId(product.getId());
            detail.setProductCode(product.getCode());
            detail.setProductName(product.getName());
            detail.setUnit(product.getUnit());
            detail.setQuantity(item.getQuantity());
            detail.setUnitPrice(item.getUnitPrice());
            detail.setTotalPrice(lineTotal);
            details.add(detail);
        }

        receipt.setTotalAmount(total);
        receipt.setDetails(details);

        receipt = exportReceiptRepository.save(receipt);

        // Liên kết phiếu xuất với đơn hàng trong customer-service (chuyển trạng thái Order sang EXPORT_REQUESTED)
        if (receipt.getOrderId() != null) {
            try {
                customerClient.linkExportReceipt(receipt.getOrderId(), receipt.getId());
            } catch (Exception ex) {
                System.err.println("Không thể liên kết đơn hàng với phiếu xuất: " + ex.getMessage());
            }
        }

        // Nếu được duyệt ngay: Cập nhật tồn kho SAU KHI phiếu đã lưu an toàn vào DB
        if (isImmediateApprove) {
            try {
                for (ExportReceiptDetail detail : receipt.getDetails()) {
                    productClient.adjustStock(detail.getProductId(), -detail.getQuantity());
                }
                if (receipt.getOrderId() != null) {
                    customerClient.updateOrderStatus(receipt.getOrderId(), "EXPORTED");
                }
            } catch (Exception ex) {
                receipt.setStatus("PENDING");
                receipt.setApprovedById(null);
                receipt.setApproverName(null);
                receipt.setApprovedAt(null);
                exportReceiptRepository.save(receipt);
                throw new IllegalStateException("Phiếu đã được lưu ở trạng thái Chờ duyệt do cập nhật tồn kho thất bại: " + ex.getMessage());
            }
        }

        return toDTO(receipt);
    }

    @Transactional
    public ExportReceiptDTO update(Long id, ExportReceiptDTO dto, Long currentUserId, String currentUserName, String currentUserRole) {
        ExportReceipt receipt = exportReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu xuat id = " + id));

        if ("CANCELLED".equalsIgnoreCase(receipt.getStatus()) || "REJECTED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Khong the chinh sua phieu da huy hoac bi tu choi");
        }

        boolean isApproved = "APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus());

        if (isApproved) {
            if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
                throw new IllegalArgumentException("Phieu da duyet chi co Quan ly hoac Admin moi duoc phep chinh sua");
            }
            // Hoàn trả lại kho cũ trước khi cập nhật chi tiết mới
            for (ExportReceiptDetail d : receipt.getDetails()) {
                if (d.getProductId() != null) {
                    productClient.adjustStock(d.getProductId(), d.getQuantity());
                }
            }
        }

        if (dto.getCustomerId() != null && (receipt.getCustomer() == null || !dto.getCustomerId().equals(receipt.getCustomer().getId()))) {
            Customer customer = customerRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new NoSuchElementException("Khong tim thay khach hang id = " + dto.getCustomerId()));
            receipt.setCustomer(customer);
        }

        if (dto.getExportDate() != null) {
            receipt.setExportDate(dto.getExportDate());
        }
        if (dto.getNotes() != null) {
            receipt.setNotes(dto.getNotes());
        }

        // Cập nhật danh sách chi tiết
        receipt.getDetails().clear();
        BigDecimal total = BigDecimal.ZERO;

        for (ExportReceiptDetailDTO item : dto.getDetails()) {
            ProductDTO product = productClient.getById(item.getProductId());
            if (product == null) {
                throw new NoSuchElementException("Khong tim thay san pham id = " + item.getProductId());
            }

            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("So luong san pham '" + product.getName() + "' phai lon hon 0");
            }
            if (item.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Don gia san pham '" + product.getName() + "' khong the am");
            }

            if (isApproved) {
                productClient.adjustStock(product.getId(), -item.getQuantity());
            }

            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            total = total.add(lineTotal);

            ExportReceiptDetail detail = new ExportReceiptDetail();
            detail.setReceipt(receipt);
            detail.setProductId(product.getId());
            detail.setProductCode(product.getCode());
            detail.setProductName(product.getName());
            detail.setUnit(product.getUnit());
            detail.setQuantity(item.getQuantity());
            detail.setUnitPrice(item.getUnitPrice());
            detail.setTotalPrice(lineTotal);
            receipt.getDetails().add(detail);
        }

        receipt.setTotalAmount(total);
        return toDTO(exportReceiptRepository.save(receipt));
    }

    @Transactional
    public void delete(Long id, String currentUserRole) {
        if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
            throw new IllegalArgumentException("Chi Quan ly hoac Admin moi co quyen xoa phieu xuat");
        }

        ExportReceipt receipt = exportReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu xuat id = " + id));

        boolean isApproved = "APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus());
        if (isApproved) {
            // Hoàn lại kho trước khi xóa
            for (ExportReceiptDetail detail : receipt.getDetails()) {
                if (detail.getProductId() != null) {
                    try {
                        productClient.adjustStock(detail.getProductId(), detail.getQuantity());
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        exportReceiptRepository.delete(receipt);
    }

    @Transactional
    public ExportReceiptDTO approveReceipt(Long id, Long currentUserId, String currentUserName, String currentUserRole) {
        if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
            throw new IllegalArgumentException("Chi Quan ly hoac Admin moi co quyen duyet phieu xuat");
        }

        ExportReceipt receipt = exportReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu xuat id = " + id));

        if ("APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Phieu xuat da duoc duyet truoc do");
        }

        if ("CANCELLED".equalsIgnoreCase(receipt.getStatus()) || "REJECTED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Khong the duyet phieu xuat da bi huy hoac tu choi");
        }

        // Trừ tồn kho khi duyệt (kiểm tra đủ tồn)
        for (ExportReceiptDetail detail : receipt.getDetails()) {
            if (detail.getProductId() != null) {
                productClient.adjustStock(detail.getProductId(), -detail.getQuantity());
            }
        }

        receipt.setStatus("APPROVED");
        receipt.setApprovedById(currentUserId);
        receipt.setApproverName(currentUserName != null && !currentUserName.isBlank() ? currentUserName : "Quan ly");
        receipt.setApprovedAt(LocalDateTime.now());

        ExportReceipt saved = exportReceiptRepository.save(receipt);

        if (saved.getOrderId() != null) {
            try {
                customerClient.updateOrderStatus(saved.getOrderId(), "EXPORTED");
            } catch (Exception ex) {
                System.err.println("Không thể cập nhật trạng thái đơn hàng sang EXPORTED: " + ex.getMessage());
            }
        }

        return toDTO(saved);
    }

    @Transactional
    public ExportReceiptDTO rejectReceipt(Long id, Long currentUserId, String currentUserName, String currentUserRole) {
        if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
            throw new IllegalArgumentException("Chi Quan ly hoac Admin moi co quyen tu choi duyet phieu xuat");
        }

        ExportReceipt receipt = exportReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu xuat id = " + id));

        if (!"PENDING".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Chi co the tu choi phieu dang o trang thai Cho duyet (PENDING)");
        }

        receipt.setStatus("REJECTED");
        receipt.setApprovedById(currentUserId);
        receipt.setApproverName(currentUserName != null && !currentUserName.isBlank() ? currentUserName : "Quan ly");
        receipt.setApprovedAt(LocalDateTime.now());

        return toDTO(exportReceiptRepository.save(receipt));
    }

    @Transactional
    public ExportReceiptDTO cancelReceipt(Long id) {
        ExportReceipt receipt = exportReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu xuat id = " + id));

        if ("CANCELLED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Phieu xuat da bi huy truoc do");
        }

        boolean isApproved = "APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus());
        if (isApproved) {
            // Hoan tra ton kho bang cach goi productClient tang lai so luong
            for (ExportReceiptDetail detail : receipt.getDetails()) {
                if (detail.getProductId() != null) {
                    try {
                        productClient.adjustStock(detail.getProductId(), detail.getQuantity());
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        receipt.setStatus("CANCELLED");
        ExportReceipt saved = exportReceiptRepository.save(receipt);

        if (saved.getOrderId() != null) {
            try {
                customerClient.updateOrderStatus(saved.getOrderId(), "CANCELLED");
            } catch (Exception ex) {
                System.err.println("Không thể cập nhật trạng thái đơn hàng sang CANCELLED: " + ex.getMessage());
            }
        }

        return toDTO(saved);
    }

    @Transactional
    public ExportReceiptDTO createFromOrder(Long orderId, Long currentUserId, String currentUserName, String currentUserRole) {
        OrderDTO order = customerClient.getOrderById(orderId);
        if (order == null) {
            throw new NoSuchElementException("Không tìm thấy đơn hàng id = " + orderId);
        }

        String phone = order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank() ? order.getCustomerPhone().trim() : "0000000000";
        Customer customer = customerRepository.findByPhone(phone).orElse(null);
        if (customer == null) {
            String cusCode = "KH-ONLINE-" + (order.getCustomerId() != null ? order.getCustomerId() : order.getId());
            if (customerRepository.findByCode(cusCode).isPresent()) {
                cusCode = "KH-" + (System.currentTimeMillis() % 100000);
            }
            customer = new Customer();
            customer.setCode(cusCode);
            customer.setName(order.getCustomerName() != null ? order.getCustomerName() : "Khách mua Online");
            customer.setPhone(phone);
            customer.setAddress(order.getShippingAddress() != null ? order.getShippingAddress() : "Toàn quốc");
            customer.setCustomerType("CA_NHAN");
            customer = customerRepository.save(customer);
        }

        List<ExportReceiptDetailDTO> detailDTOs = new ArrayList<>();
        if (order.getDetails() != null) {
            for (OrderDetailDTO d : order.getDetails()) {
                detailDTOs.add(ExportReceiptDetailDTO.builder()
                        .productId(d.getProductId())
                        .productCode(d.getProductCode())
                        .productName(d.getProductName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .build());
            }
        }

        ExportReceiptDTO dto = ExportReceiptDTO.builder()
                .customerId(customer.getId())
                .orderId(order.getId())
                .exportDate(LocalDateTime.now())
                .notes("Xuất kho từ Đơn hàng: " + order.getOrderCode() + (order.getNotes() != null ? " (" + order.getNotes() + ")" : ""))
                .status("PENDING")
                .details(detailDTOs)
                .build();

        return create(dto, currentUserId, currentUserName, currentUserRole);
    }

    public ExportReceiptDTO toDTO(ExportReceipt r) {
        List<ExportReceiptDetailDTO> detailDTOs = r.getDetails() != null
                ? r.getDetails().stream().map(d -> ExportReceiptDetailDTO.builder()
                        .id(d.getId())
                        .productId(d.getProductId())
                        .productCode(d.getProductCode() != null ? d.getProductCode() : "")
                        .productName(d.getProductName() != null ? d.getProductName() : "")
                        .unit(d.getUnit() != null ? d.getUnit() : "")
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .totalPrice(d.getTotalPrice())
                        .build()).collect(Collectors.toList())
                : new ArrayList<>();

        return ExportReceiptDTO.builder()
                .id(r.getId())
                .code(r.getCode())
                .exportDate(r.getExportDate())
                .customerId(r.getCustomer() != null ? r.getCustomer().getId() : null)
                .customerCode(r.getCustomer() != null ? r.getCustomer().getCode() : null)
                .customerName(r.getCustomer() != null ? r.getCustomer().getName() : null)
                .customerPhone(r.getCustomer() != null ? r.getCustomer().getPhone() : null)
                .customerAddress(r.getCustomer() != null ? r.getCustomer().getAddress() : null)
                .userId(r.getUserId())
                .creatorName(r.getCreatorName())
                .totalAmount(r.getTotalAmount())
                .notes(r.getNotes())
                .status(r.getStatus())
                .orderId(r.getOrderId())
                .approvedById(r.getApprovedById())
                .approverName(r.getApproverName())
                .approvedAt(r.getApprovedAt())
                .details(detailDTOs)
                .build();
    }
}