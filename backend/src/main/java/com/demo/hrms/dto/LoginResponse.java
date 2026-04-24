package com.demo.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String loginName;
    private String employeeName;
    private String employeeNo;
}
