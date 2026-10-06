package hn.apigateway.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebExceptionHandler;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.TimeoutException;

@Component
@Order(-2)
public class GlobalGatewayExceptionHandler implements WebExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalGatewayExceptionHandler.class);

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = "Đã có lỗi xảy ra tại API Gateway, vui lòng thử lại sau.";

        if (ex instanceof ResponseStatusException rse) {
            HttpStatus resolved = HttpStatus.resolve(rse.getStatusCode().value());
            if (resolved != null) {
                status = resolved;
            }
            if (status == HttpStatus.NOT_FOUND) {
                message = "Đường dẫn yêu cầu không tồn tại trên hệ thống.";
            } else if (rse.getReason() != null && !rse.getReason().isBlank()) {
                message = rse.getReason();
            } else {
                message = status.getReasonPhrase();
            }
        } else if (isCausedBy(ex, ConnectException.class)) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = "Dịch vụ hệ thống tạm thời không khả dụng (Kết nối bị từ chối). Vui lòng thử lại sau.";
        } else if (isCausedBy(ex, TimeoutException.class)) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            message = "Yêu cầu đến dịch vụ hệ thống bị quá thời gian chờ (Timeout).";
        }

        log.error("API Gateway error at [{}]: status={} - {}", path, status, ex.getMessage());

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String json = String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\",\"path\":\"%s\"}",
                Instant.now(), status.value(), status.getReasonPhrase(), message, path
        );

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private boolean isCausedBy(Throwable ex, Class<? extends Throwable> targetClass) {
        Throwable current = ex;
        while (current != null) {
            if (targetClass.isInstance(current)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
