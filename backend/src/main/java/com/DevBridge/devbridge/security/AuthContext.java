package com.DevBridge.devbridge.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 컨트롤러에서 현재 인증된 사용자 ID를 꺼내는 헬퍼.
 * (Spring Security 미사용 경량 구현)
 */
public final class AuthContext {

    private AuthContext() {}

    public static Long currentUserId() {
        HttpServletRequest req = currentRequest();
        if (req == null) return null;
        Object v = req.getAttribute(JwtAuthenticationFilter.ATTR_USER_ID);
        return v instanceof Long ? (Long) v : null;
    }

    public static String currentUserType() {
        HttpServletRequest req = currentRequest();
        if (req == null) return null;
        Object v = req.getAttribute(JwtAuthenticationFilter.ATTR_USER_TYPE);
        return v != null ? v.toString() : null;
    }

    public static Long requireUserId() {
        Long id = currentUserId();
        if (id == null) throw new RuntimeException("인증이 필요합니다.");
        return id;
    }

    private static HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }
}

