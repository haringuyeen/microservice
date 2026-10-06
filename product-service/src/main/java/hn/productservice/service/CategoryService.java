package hn.productservice.service;

import hn.productservice.dto.CategoryDTO;
import hn.productservice.entity.Category;
import hn.productservice.repository.CategoryRepository;
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
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public List<CategoryDTO> getAll() {
        return categoryRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Page<CategoryDTO> search(String keyword, Pageable pageable) {
        return categoryRepository.search(keyword, pageable).map(this::toDTO);
    }

    public CategoryDTO getById(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay danh muc id = " + id));
        return toDTO(cat);
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        if (categoryRepository.existsByCodeIgnoreCase(dto.getCode())) {
            throw new IllegalArgumentException("Ma danh muc '" + dto.getCode() + "' da ton tai");
        }
        if (categoryRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("Ten danh muc '" + dto.getName() + "' da ton tai");
        }
        Category cat = new Category();
        cat.setCode(dto.getCode().toUpperCase().trim());
        cat.setName(dto.getName().trim());
        cat.setDescription(dto.getDescription());
        return toDTO(categoryRepository.save(cat));
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay danh muc id = " + id));

        if (!cat.getCode().equalsIgnoreCase(dto.getCode().trim()) && categoryRepository.existsByCodeIgnoreCase(dto.getCode().trim())) {
            throw new IllegalArgumentException("Ma danh muc '" + dto.getCode() + "' da ton tai");
        }

        cat.setCode(dto.getCode().toUpperCase().trim());
        cat.setName(dto.getName().trim());
        cat.setDescription(dto.getDescription());
        return toDTO(categoryRepository.save(cat));
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NoSuchElementException("Khong tim thay danh muc id = " + id);
        }
        categoryRepository.deleteById(id);
    }

    public CategoryDTO toDTO(Category cat) {
        return CategoryDTO.builder()
                .id(cat.getId())
                .code(cat.getCode())
                .name(cat.getName())
                .description(cat.getDescription())
                .build();
    }
}
