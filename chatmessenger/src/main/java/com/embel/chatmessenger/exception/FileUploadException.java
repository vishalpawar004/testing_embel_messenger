package com.embel.chatmessenger.exception;

import org.springframework.http.HttpStatus;

public class FileUploadException extends ApiException {
    public FileUploadException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}