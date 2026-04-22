package com.DevBridge.devbridge.config;

import io.getstream.chat.java.models.App;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Initializes the Stream Chat server-side client once at startup.
 * Set these in application.properties or as environment variables:
 *   stream.chat.api-key=your_key
 *   stream.chat.api-secret=your_secret
 */
@Configuration
public class StreamChatConfig {

    @Value("${stream.chat.api-key}")
    private String apiKey;

    @Value("${stream.chat.api-secret}")
    private String apiSecret;

    @PostConstruct
    public void init() {
        System.setProperty("STREAM_KEY", apiKey);
        System.setProperty("STREAM_SECRET", apiSecret);
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getApiSecret() {
        return apiSecret;
    }
}
