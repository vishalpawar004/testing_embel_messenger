package com.embel.chatmessenger.security;

import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

// Runs on every plain HTTP request (REST endpoints). The WebSocket handshake
// has its own separate auth path - see websocket/WebSocketAuthInterceptor.
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                Long userId = jwtTokenProvider.getUserIdFromToken(token);

                // Re-check the user on every request (not just at login) so a
                // SUPER_ADMIN blocking someone takes effect immediately, even if
                // that user's existing token hasn't expired yet.
                User user = userRepository.findById(userId).orElse(null);
                boolean blockedOrMissing = user == null
                        || Boolean.TRUE.equals(user.getIsBlocked())
                        || Boolean.TRUE.equals(user.getIsDeleted());

                if (!blockedOrMissing) {
                    var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of(authority));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
                // if blocked/missing: leave SecurityContext empty -> request falls
                // through as unauthenticated -> 401 on any protected endpoint.
            }
        }
        filterChain.doFilter(request, response);
    }
}