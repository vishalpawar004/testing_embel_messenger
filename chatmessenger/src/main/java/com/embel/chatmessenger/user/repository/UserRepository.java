package com.embel.chatmessenger.user.repository;

import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmailOrPhone(String email, String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    // Used to auto-add every SUPER_ADMIN to a newly created group.
    List<User> findByRole(UserRole role);
}