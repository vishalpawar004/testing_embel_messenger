package com.embel.chatmessenger.auth.service;

import com.embel.chatmessenger.auth.dto.*;
import com.embel.chatmessenger.exception.*;
import com.embel.chatmessenger.security.JwtTokenProvider;
import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public void register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }
        if (userRepository.existsByPhone(req.getPhone())) {
            throw new UserAlreadyExistsException("Phone number already registered");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        // role defaults to USER on the entity - never settable from this request
        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmailOrPhone(req.getIdentifier(), req.getIdentifier())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email/phone or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email/phone or password");
        }
        if (Boolean.TRUE.equals(user.getIsBlocked())) {
            throw new UnauthorizedActionException("This account has been blocked");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setName(user.getName());
        response.setRole(user.getRole().name());
        return response;
    }
}