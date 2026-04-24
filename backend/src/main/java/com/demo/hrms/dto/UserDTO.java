package com.demo.hrms.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String loginName;
    private String employeeName;
    private String employeeNo;
    private String email;
    private String phone;
    private Boolean active;
    private LocalDateTime createdAt;
}
