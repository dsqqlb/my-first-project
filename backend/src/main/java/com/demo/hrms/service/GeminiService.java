package com.demo.hrms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.api-url}")
    private String apiUrl;

    @Value("${gemini.proxy-host:}")
    private String proxyHost;

    @Value("${gemini.proxy-port:0}")
    private int proxyPort;

    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.objectMapper = new ObjectMapper();
    }

    public String chat(String userMessage) {
        try {
            // 构建 HttpClient，支持代理
            HttpClient.Builder clientBuilder = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(30));
            
            // 如果配置了代理
            if (proxyHost != null && !proxyHost.isEmpty() && proxyPort > 0) {
                clientBuilder.proxy(ProxySelector.of(new InetSocketAddress(proxyHost, proxyPort)));
            }
            
            HttpClient httpClient = clientBuilder.build();

            // 构建请求体
            String requestBody = objectMapper.writeValueAsString(new Object() {
                public Object[] contents = new Object[]{
                    new Object() {
                        public Object[] parts = new Object[]{
                            new Object() {
                                public String text = userMessage;
                            }
                        };
                    }
                };
            });

            // 创建 HTTP 请求
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            // 发送请求
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                // 解析响应
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode content = candidates.get(0).path("content");
                    JsonNode parts = content.path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).path("text").asText();
                    }
                }
                return "Gemini 返回了空响应";
            } else {
                return "Gemini API 调用失败: " + response.statusCode() + " - " + response.body();
            }

        } catch (Exception e) {
            return "调用 Gemini 时发生错误: " + e.getMessage();
        }
    }
}
