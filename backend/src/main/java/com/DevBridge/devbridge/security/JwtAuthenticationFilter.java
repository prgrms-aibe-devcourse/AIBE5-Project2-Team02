package com.DevBridge.devbridge.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Authorization: Bearer <token> 헤더에서 JWT 파싱.
 * 검증 통과 시 request attribute에 다음 값 설정:
 *   - "auth.userId" (Long)
 *   - "auth.userType" (String)
 * 실패해도 요청은 그대로 통과 (인증이 필요한 컨트롤러에서 attribute 체크).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String ATTR_USER_ID = "auth.userId";
    public static final String ATTR_USER_TYPE = "auth.userType";

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            try {
                var claims = jwtUtil.parse(token);
                Object uid = claims.get("uid");
                Object type = claims.get("type");
                if (uid instanceof Number n) {
                    request.setAttribute(ATTR_USER_ID, n.longValue());
                }
                if (type != null) {
                    request.setAttribute(ATTR_USER_TYPE, type.toString());
                }
            } catch (Exception e) {
                // 토큰 파싱 실패: 익명 요청으로 통과
                log.debug("JWT parse failed: {}", e.getMessage());
            }
        }
        chain.doFilter(request, response);
    }
}

