package com.demo.hrms.controller;

import com.demo.hrms.dto.ApiResponse;
import com.demo.hrms.dto.LoginRequest;
import com.demo.hrms.dto.LoginResponse;
import com.demo.hrms.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "认证管理", description = "用户登录认证相关接口")
public class AuthController {
    
    private final UserService userService;
    
    @PostMapping("/login")
    @Operation(summary = "用户登录", description = "验证用户名密码并返回JWT Token")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.login(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
