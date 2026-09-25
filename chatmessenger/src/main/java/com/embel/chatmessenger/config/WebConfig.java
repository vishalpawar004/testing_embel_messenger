package com.embel.chatmessenger.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Uploaded files become reachable at http://localhost:8080/files/<storedName>
        String location = "file:" + uploadDir.replaceAll("/$", "") + "/";
        registry.addResourceHandler("/files/**").addResourceLocations(location);
    }
}