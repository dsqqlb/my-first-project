package com.demo.hrms.controller;

import com.demo.hrms.dto.ApiResponse;
import com.demo.hrms.dto.UserDTO;
import com.demo.hrms.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Tag(name = "用户管理", description = "用户CRUD操作接口")
public class UserController {
    
    private final UserService userService;
    
    @GetMapping
    @Operation(summary = "获取所有用户", description = "返回系统中所有用户列表")
    public ApiResponse<List<UserDTO>> getAllUsers() {
        return ApiResponse.success(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "获取用户详情", description = "根据ID获取用户详细信息")
    public ApiResponse<UserDTO> getUserById(@PathVariable Long id) {
        try {
            return ApiResponse.success(userService.getUserById(id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PostMapping
    @Operation(summary = "创建用户", description = "新增一个用户")
    public ApiResponse<UserDTO> createUser(@RequestBody UserDTO dto) {
        try {
            return ApiResponse.success(userService.createUser(dto));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "更新用户", description = "更新用户信息")
    public ApiResponse<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO dto) {
        try {
            return ApiResponse.success(userService.updateUser(id, dto));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "删除用户", description = "根据ID删除用户")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
