package hn.warehouseservice.exception;

import hn.warehouseservice.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoSuchElementException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fieldError ->
                errors.put(fieldError.getField(), fieldError.getDefaultMessage())
        );

        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        if (message.isBlank()) {
            message = "Dữ liệu gửi lên không hợp lệ";
        }

        return buildResponse(HttpStatus.BAD_REQUEST, message, request, errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleConflict(IllegalStateException ex, WebRequest request) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex, WebRequest request) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        return buildResponse(HttpStatus.CONFLICT,
                "Không thể thực hiện thao tác do dữ liệu đang được liên kết trong hệ thống (phiếu nhập, phiếu xuất) hoặc vi phạm ràng buộc dữ liệu.",
                request, null);
    }

    @ExceptionHandler(feign.RetryableException.class)
    public ResponseEntity<ErrorResponse> handleFeignRetryable(feign.RetryableException ex, WebRequest request) {
        log.error("Feign connection failure: {}", ex.getMessage());
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE,
                "Dịch vụ liên kết (Sản phẩm/Đối tác) hiện không phản hồi. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.",
                request, null);
    }

    @ExceptionHandler(feign.FeignException.class)
    public ResponseEntity<ErrorResponse> handleFeignException(feign.FeignException ex, WebRequest request) {
        log.error("Feign exception [status {}]: {}", ex.status(), ex.getMessage());
        HttpStatus status = HttpStatus.resolve(ex.status());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }

        String message = "Lỗi giao tiếp giữa các dịch vụ hệ thống.";
        String content = ex.contentUTF8();
        if (content != null && !content.isBlank()) {
            if (content.contains("\"message\":\"")) {
                int start = content.indexOf("\"message\":\"") + 11;
                int end = content.indexOf("\"", start);
                if (end > start) {
                    message = content.substring(start, end);
                }
            } else if (content.contains("\"error\":\"")) {
                int start = content.indexOf("\"error\":\"") + 9;
                int end = content.indexOf("\"", start);
                if (end > start) {
                    message = content.substring(start, end);
                }
            }
        } else if (status == HttpStatus.NOT_FOUND) {
            message = "Không tìm thấy dữ liệu liên kết từ dịch vụ liên quan.";
        }

        return buildResponse(status, message, request, null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST,
                "Định dạng dữ liệu gửi lên không hợp lệ hoặc thiếu nội dung body.",
                request, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, WebRequest request) {
        String msg = String.format("Tham số '%s' có giá trị không đúng định dạng.", ex.getName());
        return buildResponse(HttpStatus.BAD_REQUEST, msg, request, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, WebRequest request) {
        String msg = String.format("Phương thức HTTP %s không được hỗ trợ cho đường dẫn này.", ex.getMethod());
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, msg, request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex, WebRequest request) {
        log.error("Unhandled exception at {}: ", request.getDescription(false), ex);
        String message = ex.getMessage() != null && !ex.getMessage().isBlank()
                ? ex.getMessage()
                : "Đã có lỗi xảy ra trên hệ thống, vui lòng thử lại sau.";
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, request, null);
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, WebRequest request, Map<String, String> errors) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(Instant.now().toString())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .errors(errors)
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }
}