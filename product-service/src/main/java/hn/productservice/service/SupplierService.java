package hn.productservice.service;

import hn.productservice.dto.SupplierDTO;
import hn.productservice.entity.Supplier;
import hn.productservice.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public List<SupplierDTO> getAll() {
        return supplierRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Page<SupplierDTO> search(String keyword, Pageable pageable) {
        return supplierRepository.search(keyword, pageable).map(this::toDTO);
    }

    public SupplierDTO getById(Long id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nha cung cap id = " + id));
        return toDTO(s);
    }

    @Transactional
    public SupplierDTO create(SupplierDTO dto) {
        if (supplierRepository.existsByCodeIgnoreCase(dto.getCode())) {
            throw new IllegalArgumentException("Ma nha cung cap '" + dto.getCode() + "' da ton tai");
        }
        Supplier s = new Supplier();
        s.setCode(dto.getCode().toUpperCase().trim());
        s.setName(dto.getName().trim());
        s.setAddress(dto.getAddress());
        s.setPhone(dto.getPhone());
        s.setEmail(dto.getEmail());
        s.setContactPerson(dto.getContactPerson());
        return toDTO(supplierRepository.save(s));
    }

    @Transactional
    public SupplierDTO update(Long id, SupplierDTO dto) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nha cung cap id = " + id));

        if (!s.getCode().equalsIgnoreCase(dto.getCode().trim()) && supplierRepository.existsByCodeIgnoreCase(dto.getCode().trim())) {
            throw new IllegalArgumentException("Ma nha cung cap '" + dto.getCode() + "' da ton tai");
        }

        s.setCode(dto.getCode().toUpperCase().trim());
        s.setName(dto.getName().trim());
        s.setAddress(dto.getAddress());
        s.setPhone(dto.getPhone());
        s.setEmail(dto.getEmail());
        s.setContactPerson(dto.getContactPerson());
        return toDTO(supplierRepository.save(s));
    }

    @Transactional
    public void delete(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new NoSuchElementException("Khong tim thay nha cung cap id = " + id);
        }
        supplierRepository.deleteById(id);
    }

    public SupplierDTO toDTO(Supplier s) {
        return SupplierDTO.builder()
                .id(s.getId())
                .code(s.getCode())
                .name(s.getName())
                .address(s.getAddress())
                .phone(s.getPhone())
                .email(s.getEmail())
                .contactPerson(s.getContactPerson())
                .build();
    }
}
