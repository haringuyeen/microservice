package hn.warehouseservice.service;

import hn.warehouseservice.dto.CustomerDTO;
import hn.warehouseservice.entity.Customer;
import hn.warehouseservice.repository.CustomerRepository;
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
public class CustomerService {
    private final CustomerRepository customerRepository;

    public List<CustomerDTO> getAll() {
        return customerRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Page<CustomerDTO> search(String keyword, String customerType, Pageable pageable) {
        return customerRepository.search(keyword, customerType, pageable).map(this::toDTO);
    }

    public CustomerDTO getById(Long id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay khach hang id = " + id));
        return toDTO(c);
    }

    @Transactional
    public CustomerDTO create(CustomerDTO dto) {
        if (customerRepository.existsByCodeIgnoreCase(dto.getCode())) {
            throw new IllegalArgumentException("Ma khach hang '" + dto.getCode() + "' da ton tai");
        }
        Customer c = new Customer();
        c.setCode(dto.getCode().toUpperCase().trim());
        c.setName(dto.getName().trim());
        c.setAddress(dto.getAddress());
        c.setPhone(dto.getPhone());
        c.setEmail(dto.getEmail());
        c.setCustomerType(dto.getCustomerType() == null ? "CA_NHAN" : dto.getCustomerType());
        return toDTO(customerRepository.save(c));
    }

    @Transactional
    public CustomerDTO update(Long id, CustomerDTO dto) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay khach hang id = " + id));

        if (!c.getCode().equalsIgnoreCase(dto.getCode().trim()) && customerRepository.existsByCodeIgnoreCase(dto.getCode().trim())) {
            throw new IllegalArgumentException("Ma khach hang '" + dto.getCode() + "' da ton tai");
        }

        c.setCode(dto.getCode().toUpperCase().trim());
        c.setName(dto.getName().trim());
        c.setAddress(dto.getAddress());
        c.setPhone(dto.getPhone());
        c.setEmail(dto.getEmail());
        if (dto.getCustomerType() != null) {
            c.setCustomerType(dto.getCustomerType());
        }
        return toDTO(customerRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new NoSuchElementException("Khong tim thay khach hang id = " + id);
        }
        customerRepository.deleteById(id);
    }

    public CustomerDTO toDTO(Customer c) {
        return CustomerDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .name(c.getName())
                .address(c.getAddress())
                .phone(c.getPhone())
                .email(c.getEmail())
                .customerType(c.getCustomerType())
                .build();
    }
}