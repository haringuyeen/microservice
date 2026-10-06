package hn.apigateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Component
public class AuthHeaderFilter implements GlobalFilter, Ordered {

    // Cac duong dan KHONG can Header Authorization
    private static final List<String> OPEN_PATHS = List.of(
            "/api/auth/login",
            "/api/public/products",
            "/api/customer-auth",
            "/api/storefront",
            "/api/orders"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        boolean isOpen = OPEN_PATHS.stream().anyMatch(path::startsWith);
        if (isOpen) {
            return chain.filter(exchange);
        }

        if (!request.getHeaders().containsHeader("Authorization")) {
            return onError(exchange, HttpStatus.UNAUTHORIZED, "Thiếu mã xác thực (Authorization Header). Vui lòng đăng nhập lại.");
        }

        return chain.filter(exchange);
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String path = exchange.getRequest().getURI().getPath();
        String json = String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\",\"path\":\"%s\"}",
                Instant.now(), status.value(), status.getReasonPhrase(), message, path
        );

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -1; // chay som, truoc khi request duoc dinh tuyen di
    }
}
