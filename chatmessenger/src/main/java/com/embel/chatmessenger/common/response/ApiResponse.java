package com.embel.chatmessenger.common.response;

import lombok.Getter;

@Getter
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.data = data;
        return res;
    }

    public static <T> ApiResponse<T> success(String message) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.message = message;
        return res;
    }
}