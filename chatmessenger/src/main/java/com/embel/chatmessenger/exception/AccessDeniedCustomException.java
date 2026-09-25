package com.embel.chatmessenger.exception;

import org.springframework.http.HttpStatus;

// Thrown for authorization failures that are business-rule based
// (e.g. "not a member of this chat", "not a group admin") - distinct from
// Spring Security's own 403 handling for endpoint-level access rules.
public class AccessDeniedCustomException extends ApiException {
    public AccessDeniedCustomException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}