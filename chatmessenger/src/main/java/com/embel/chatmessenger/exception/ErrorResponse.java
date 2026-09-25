package com.embel.chatmessenger.exception;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class ErrorResponse {
    private boolean success = false;
    private String message;
    private int status;
    private LocalDateTime timestamp = LocalDateTime.now();

    public ErrorResponse(String message, int status) {
        this.message = message;
        this.status = status;
    }
}