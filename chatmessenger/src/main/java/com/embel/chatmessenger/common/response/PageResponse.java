package com.embel.chatmessenger.common.response;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Setter
public class PageResponse<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PageResponse<T> from(Page<T> page) {
        PageResponse<T> res = new PageResponse<>();
        res.content = page.getContent();
        res.pageNumber = page.getNumber();
        res.pageSize = page.getSize();
        res.totalElements = page.getTotalElements();
        res.totalPages = page.getTotalPages();
        res.last = page.isLast();
        return res;
    }
}