package hn.warehouseservice.service;

import hn.warehouseservice.client.ProductClient;
import hn.warehouseservice.client.SupplierClient;
import hn.warehouseservice.dto.ImportReceiptDTO;
import hn.warehouseservice.dto.ImportReceiptDetailDTO;
import hn.warehouseservice.dto.ProductDTO;
import hn.warehouseservice.dto.SupplierDTO;
import hn.warehouseservice.entity.ImportReceipt;
import hn.warehouseservice.entity.ImportReceiptDetail;
import hn.warehouseservice.repository.ImportReceiptDetailRepository;
import hn.warehouseservice.repository.ImportReceiptRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportReceiptService {

    private final ImportReceiptRepository importReceiptRepository;
    private final ImportReceiptDetailRepository importReceiptDetailRepository;
    private final SupplierClient supplierClient;
    private final ProductClient productClient;

    public Page<ImportReceiptDTO> search(String keyword, Long supplierId, String status,
                                         LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        return importReceiptRepository.searchReceipts(keyword, supplierId, status, fromDate, toDate, pageable)
                .map(this::toDTO);
    }

    public ImportReceiptDTO getById(Long id) {
        ImportReceipt r = importReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu nhap id = " + id));
        return toDTO(r);
    }

    public List<ImportReceiptDTO> getBySupplier(Long supplierId) {
        return importReceiptRepository.findBySupplierIdOrderByImportDateDesc(supplierId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public ImportReceiptDTO create(ImportReceiptDTO dto, Long currentUserId, String currentUserName, String currentUserRole) {
        // Giao tiếp liên dịch vụ: Lấy thông tin nhà cung cấp từ product-service
        SupplierDTO supplier = supplierClient.getById(dto.getSupplierId());
        if (supplier == null) {
            throw new NoSuchElementException("Khong tim thay nha cung cap id = " + dto.getSupplierId());
        }

        String code = dto.getCode();
        if (code == null || code.isBlank()) {
            String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            long count = importReceiptRepository.count() + 1;
            code = String.format("PNK-%s-%04d", datePrefix, count);
            while (importReceiptRepository.existsByCodeIgnoreCase(code)) {
                count++;
                code = String.format("PNK-%s-%04d", datePrefix, count);
            }
        } else if (importReceiptRepository.existsByCodeIgnoreCase(code.trim())) {
            throw new IllegalArgumentException("Mã phiếu nhập '" + code + "' đã tồn tại");
        }

        boolean isImmediateApprove = ("APPROVED".equalsIgnoreCase(dto.getStatus()) || "COMPLETED".equalsIgnoreCase(dto.getStatus()))
                && ("ADMIN".equalsIgnoreCase(currentUserRole) || "MANAGER".equalsIgnoreCase(currentUserRole));

        ImportReceipt receipt = new ImportReceipt();
        receipt.setCode(code.toUpperCase().trim());
        receipt.setImportDate(dto.getImportDate() != null ? dto.getImportDate() : LocalDateTime.now());
        receipt.setSupplierId(supplier.getId());
        receipt.setSupplierCode(supplier.getCode());
        receipt.setSupplierName(supplier.getName());
        receipt.setSupplierPhone(supplier.getPhone());
        receipt.setSupplierAddress(supplier.getAddress());
        receipt.setUserId(currentUserId != null ? currentUserId : (dto.getUserId() != null ? dto.getUserId() : 1L));
        receipt.setCreatorName(currentUserName != null && !currentUserName.isBlank() ? currentUserName :
                (dto.getCreatorName() != null ? dto.getCreatorName() : "Nhan vien kho"));
        receipt.setNotes(dto.getNotes());

        if (isImmediateApprove) {
            receipt.setStatus("APPROVED");
            receipt.setApprovedById(currentUserId);
            receipt.setApproverName(currentUserName != null && !currentUserName.isBlank() ? currentUserName : "Quản lý");
            receipt.setApprovedAt(LocalDateTime.now());
        } else {
            receipt.setStatus("PENDING");
        }

        BigDecimal total = BigDecimal.ZERO;
        List<ImportReceiptDetail> details = new ArrayList<>();

        for (ImportReceiptDetailDTO item : dto.getDetails()) {
            // Giao tiếp liên dịch vụ: Xác thực sản phẩm từ product-service
            ProductDTO product = productClient.getById(item.getProductId());
            if (product == null) {
                throw new NoSuchElementException("Không tìm thấy sản phẩm id = " + item.getProductId());
            }

            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng sản phẩm '" + product.getName() + "' phải lớn hơn 0");
            }
            if (item.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Đơn giá sản phẩm '" + product.getName() + "' không thể âm");
            }

            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            total = total.add(lineTotal);

            ImportReceiptDetail detail = new ImportReceiptDetail();
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

        receipt = importReceiptRepository.save(receipt);

        // Nếu được duyệt ngay: Cập nhật tồn kho SAU KHI phiếu đã lưu an toàn vào DB
        if (isImmediateApprove) {
            try {
                for (ImportReceiptDetail detail : receipt.getDetails()) {
                    productClient.adjustStock(detail.getProductId(), detail.getQuantity());
                }
            } catch (Exception ex) {
                // Nếu cập nhật tồn kho thất bại: chuyển trạng thái phiếu về PENDING
                receipt.setStatus("PENDING");
                receipt.setApprovedById(null);
                receipt.setApproverName(null);
                receipt.setApprovedAt(null);
                importReceiptRepository.save(receipt);
                throw new IllegalStateException("Phiếu đã được lưu ở trạng thái Chờ duyệt do cập nhật tồn kho thất bại: " + ex.getMessage());
            }
        }

        return toDTO(receipt);
    }

    @Transactional
    public ImportReceiptDTO update(Long id, ImportReceiptDTO dto, Long currentUserId, String currentUserName, String currentUserRole) {
        ImportReceipt receipt = importReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu nhap id = " + id));

        if ("CANCELLED".equalsIgnoreCase(receipt.getStatus()) || "REJECTED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Khong the chinh sua phieu da huy hoac bi tu choi");
        }

        boolean isApproved = "APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus());

        if (isApproved) {
            if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
                throw new IllegalArgumentException("Phieu da duyet chi co Quan ly hoac Admin moi duoc phep chinh sua");
            }
            // Hoan tac kho cu
            for (ImportReceiptDetail d : receipt.getDetails()) {
                if (d.getProductId() != null) {
                    productClient.adjustStock(d.getProductId(), -d.getQuantity());
                }
            }
        }

        // Cập nhật thông tin nhà cung cấp nếu thay đổi
        if (dto.getSupplierId() != null && !dto.getSupplierId().equals(receipt.getSupplierId())) {
            SupplierDTO supplier = supplierClient.getById(dto.getSupplierId());
            if (supplier == null) {
                throw new NoSuchElementException("Khong tim thay nha cung cap id = " + dto.getSupplierId());
            }
            receipt.setSupplierId(supplier.getId());
            receipt.setSupplierCode(supplier.getCode());
            receipt.setSupplierName(supplier.getName());
            receipt.setSupplierPhone(supplier.getPhone());
            receipt.setSupplierAddress(supplier.getAddress());
        }

        if (dto.getImportDate() != null) {
            receipt.setImportDate(dto.getImportDate());
        }
        if (dto.getNotes() != null) {
            receipt.setNotes(dto.getNotes());
        }

        // Cập nhật danh sách chi tiết
        receipt.getDetails().clear();
        BigDecimal total = BigDecimal.ZERO;

        for (ImportReceiptDetailDTO item : dto.getDetails()) {
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

            if (isApproved) {
                productClient.adjustStock(product.getId(), item.getQuantity());
            }

            ImportReceiptDetail detail = new ImportReceiptDetail();
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
        return toDTO(importReceiptRepository.save(receipt));
    }

    @Transactional
    public void delete(Long id, String currentUserRole) {
        if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
            throw new IllegalArgumentException("Chi Quan ly hoac Admin moi co quyen xoa phieu nhap");
        }

        ImportReceipt receipt = importReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu nhap id = " + id));

        boolean isApproved = "APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus());
        if (isApproved) {
            // Hoan lai ton kho truoc khi xoa
            for (ImportReceiptDetail detail : receipt.getDetails()) {
                if (detail.getProductId() != null) {
                    try {
                        productClient.adjustStock(detail.getProductId(), -detail.getQuantity());
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        importReceiptRepository.delete(receipt);
    }

    @Transactional
    public ImportReceiptDTO approveReceipt(Long id, Long currentUserId, String currentUserName, String currentUserRole) {
        if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
            throw new IllegalArgumentException("Chi Quan ly hoac Admin moi co quyen duyet phieu nhap");
        }

        ImportReceipt receipt = importReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu nhap id = " + id));

        if ("APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Phieu nhap da duoc duyet truoc do");
        }

        if ("CANCELLED".equalsIgnoreCase(receipt.getStatus()) || "REJECTED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Khong the duyet phieu nhap da bi huy hoac tu choi");
        }

        // Tăng tồn kho khi duyệt
        for (ImportReceiptDetail detail : receipt.getDetails()) {
            if (detail.getProductId() != null) {
                productClient.adjustStock(detail.getProductId(), detail.getQuantity());
            }
        }

        receipt.setStatus("APPROVED");
        receipt.setApprovedById(currentUserId);
        receipt.setApproverName(currentUserName != null && !currentUserName.isBlank() ? currentUserName : "Quan ly");
        receipt.setApprovedAt(LocalDateTime.now());

        return toDTO(importReceiptRepository.save(receipt));
    }

    @Transactional
    public ImportReceiptDTO rejectReceipt(Long id, Long currentUserId, String currentUserName, String currentUserRole) {
        if (!"ADMIN".equalsIgnoreCase(currentUserRole) && !"MANAGER".equalsIgnoreCase(currentUserRole)) {
            throw new IllegalArgumentException("Chi Quan ly hoac Admin moi co quyen tu choi duyet phieu nhap");
        }

        ImportReceipt receipt = importReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu nhap id = " + id));

        if (!"PENDING".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Chi co the tu choi phieu dang o trang thai Cho duyet (PENDING)");
        }

        receipt.setStatus("REJECTED");
        receipt.setApprovedById(currentUserId);
        receipt.setApproverName(currentUserName != null && !currentUserName.isBlank() ? currentUserName : "Quan ly");
        receipt.setApprovedAt(LocalDateTime.now());

        return toDTO(importReceiptRepository.save(receipt));
    }

    @Transactional
    public ImportReceiptDTO cancelReceipt(Long id) {
        ImportReceipt receipt = importReceiptRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay phieu nhap id = " + id));

        if ("CANCELLED".equalsIgnoreCase(receipt.getStatus())) {
            throw new IllegalArgumentException("Phieu nhap da bi huy truoc do");
        }

        boolean isApproved = "APPROVED".equalsIgnoreCase(receipt.getStatus()) || "COMPLETED".equalsIgnoreCase(receipt.getStatus());
        if (isApproved) {
            // Hoan tra ton kho bang cach goi productClient giam so luong
            for (ImportReceiptDetail detail : receipt.getDetails()) {
                if (detail.getProductId() != null) {
                    try {
                        productClient.adjustStock(detail.getProductId(), -detail.getQuantity());
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        receipt.setStatus("CANCELLED");
        return toDTO(importReceiptRepository.save(receipt));
    }

    public ImportReceiptDTO toDTO(ImportReceipt r) {
        List<ImportReceiptDetailDTO> detailDTOs = r.getDetails() != null
                ? r.getDetails().stream().map(d -> ImportReceiptDetailDTO.builder()
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

        return ImportReceiptDTO.builder()
                .id(r.getId())
                .code(r.getCode())
                .importDate(r.getImportDate())
                .supplierId(r.getSupplierId())
                .supplierCode(r.getSupplierCode())
                .supplierName(r.getSupplierName())
                .supplierPhone(r.getSupplierPhone())
                .supplierAddress(r.getSupplierAddress())
                .userId(r.getUserId())
                .creatorName(r.getCreatorName())
                .totalAmount(r.getTotalAmount())
                .notes(r.getNotes())
                .status(r.getStatus())
                .approvedById(r.getApprovedById())
                .approverName(r.getApproverName())
                .approvedAt(r.getApprovedAt())
                .details(detailDTOs)
                .build();
    }
}