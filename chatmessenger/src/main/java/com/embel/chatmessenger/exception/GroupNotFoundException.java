package com.embel.chatmessenger.exception;

import org.springframework.http.HttpStatus;

public class GroupNotFoundException extends ApiException {
    public GroupNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}