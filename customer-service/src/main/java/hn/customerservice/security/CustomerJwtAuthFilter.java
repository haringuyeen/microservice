package hn.customerservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CustomerJwtAuthFilter extends OncePerRequestFilter {

    private final CustomerJwtUtil customerJwtUtil;

    @Value("${jwt.secret:WMS-Microservices-Secret-Key-Nam-3-Hoc-Ky-2026-Doi-Trong-Thuc-Te}")
    private String wmsStaffSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            // 1. Try parsing as B2C Customer Token
            boolean authenticated = false;
            try {
                Claims claims = customerJwtUtil.parseToken(token);
                String email = claims.getSubject();
                Object userIdObj = claims.get("userId");
                Long userId = userIdObj instanceof Number ? ((Number) userIdObj).longValue() : null;

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email,
                        userId,
                        List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                authenticated = true;
            } catch (Exception ignored) {
                // Not a customer token, try parsing as WMS staff token
            }

            // 2. If not customer token, try parsing as internal WMS staff token
            if (!authenticated) {
                try {
                    SecretKey staffKey = Keys.hmacShaKeyFor(wmsStaffSecret.getBytes(StandardCharsets.UTF_8));
                    Claims claims = Jwts.parser()
                            .verifyWith(staffKey)
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();

                    String username = claims.getSubject();
                    String role = claims.get("role", String.class);
                    Object userIdClaim = claims.get("userId");
                    Long userId = userIdClaim instanceof Number ? ((Number) userIdClaim).longValue() : null;

                    var authToken = new UsernamePasswordAuthenticationToken(
                            username,
                            userId,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } catch (Exception ignored) {
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
