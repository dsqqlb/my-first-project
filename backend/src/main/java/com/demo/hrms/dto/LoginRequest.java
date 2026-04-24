package com.demo.hrms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    private String loginName;
    
    @NotBlank(message = "密码不能为空")
    private String password;
}
