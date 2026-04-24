package com.demo.hrms.service;

import com.demo.hrms.dto.LoginRequest;
import com.demo.hrms.dto.LoginResponse;
import com.demo.hrms.dto.UserDTO;
import com.demo.hrms.entity.User;
import com.demo.hrms.repository.UserRepository;
import com.demo.hrms.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByLoginName(request.getLoginName())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));
        
        if (!user.getActive()) {
            throw new RuntimeException("用户已被禁用");
        }
        
        // 简化演示，实际应使用BCrypt
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        String token = jwtUtil.generateToken(user.getLoginName());
        return new LoginResponse(token, user.getLoginName(), 
                user.getEmployeeName(), user.getEmployeeNo());
    }
    
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        return convertToDTO(user);
    }
    
    @Transactional
    public UserDTO createUser(UserDTO dto) {
        if (userRepository.existsByLoginName(dto.getLoginName())) {
            throw new RuntimeException("用户名已存在");
        }
        
        User user = new User();
        user.setLoginName(dto.getLoginName());
        user.setPassword("123456"); // 默认密码
        user.setEmployeeName(dto.getEmployeeName());
        user.setEmployeeNo(dto.getEmployeeNo());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setActive(true);
        
        User saved = userRepository.save(user);
        return convertToDTO(saved);
    }
    
    @Transactional
    public UserDTO updateUser(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        user.setEmployeeName(dto.getEmployeeName());
        user.setEmployeeNo(dto.getEmployeeNo());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setActive(dto.getActive());
        user.setUpdatedAt(LocalDateTime.now());
        
        User updated = userRepository.save(user);
        return convertToDTO(updated);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("用户不存在");
        }
        userRepository.deleteById(id);
    }
    
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setLoginName(user.getLoginName());
        dto.setEmployeeName(user.getEmployeeName());
        dto.setEmployeeNo(user.getEmployeeNo());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setActive(user.getActive());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
