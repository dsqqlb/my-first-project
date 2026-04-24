package com.demo.hrms.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 50)
    private String loginName;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false, length = 100)
    private String employeeName;
    
    @Column(length = 20)
    private String employeeNo;
    
    @Column(length = 50)
    private String email;
    
    @Column(length = 20)
    private String phone;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime updatedAt = LocalDateTime.now();
}
