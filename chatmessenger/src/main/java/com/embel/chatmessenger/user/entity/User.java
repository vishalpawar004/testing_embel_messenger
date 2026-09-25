package com.embel.chatmessenger.user.entity;

import com.embel.chatmessenger.user.enums.UserRole;
import com.embel.chatmessenger.user.enums.UserStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    private String password;

    private String avatar;

    // Application-wide role. Every user registers as USER; SUPER_ADMIN is never
    // settable from the register endpoint - promote manually in the DB, or via
    // a future "promote" endpoint restricted to an existing SUPER_ADMIN.
    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE;

    private Boolean isBlocked = false;
    private Boolean isDeleted = false;

    private LocalDateTime lastSeenAt;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}